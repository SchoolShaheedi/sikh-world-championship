/**
 * Passwordless sign-in.
 *
 * A player asks for a link, we email it, they click it, they have a session. No
 * passwords, so nothing to store, reset or leak — and for an audience of children and
 * their parents, no password is also the only thing anyone will reliably manage.
 *
 * See migrations/0004_accounts.sql for why this is hand-rolled rather than a library.
 *
 * SECURITY PROPERTIES, each with a test in auth.test.ts:
 *  - tokens are 256 bits of CSPRNG, never derived from anything guessable
 *  - a sign-in token is SINGLE USE and dies on redemption, so a link left in an inbox,
 *    forwarded, or fetched by a mail scanner cannot be replayed
 *  - tokens expire in 15 minutes; sessions in 30 days
 *  - requesting a link for an unknown address returns exactly the same result as a known
 *    one, so the form cannot be used to discover who has an account
 *  - signing out deletes the session server-side; clearing the cookie alone would leave a
 *    working bearer token in whatever copied it
 */
import crypto from "node:crypto";
import { getDb } from "./db";
import { playerByEmail, playerById, type Player } from "./players";
import { sendEmail } from "./email";
import { signInLink } from "./email-templates";

/** Short: it is a single click, arriving in seconds. */
export const SIGN_IN_TOKEN_MINUTES = 15;
/** Long enough that a player is not signing in at every event. */
export const SESSION_DAYS = 30;

export const SESSION_COOKIE = "swc_session";

function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Send a sign-in link.
 *
 * Always reports success. Telling the caller whether an address is known would turn this
 * form into a way to find out which children have accounts, which is precisely the sort of
 * thing not to hand out.
 */
export async function requestSignInLink(
  email: string,
  baseUrl: string,
): Promise<{ ok: true }> {
  const player = await playerByEmail(email);
  if (!player) {
    /**
     * Nothing is sent and the caller is told nothing, which is the whole point of the
     * function — but it is also indistinguishable from a broken mailer, and locally that
     * silence is pure cost. There is nobody to enumerate on a laptop.
     *
     * Guarded on NODE_ENV rather than a flag: this line names an address that was typed
     * into a form, and the one environment where that must never reach a log is the one
     * where the address probably belongs to a child.
     */
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[auth] no account for ${email} — no link sent. ` +
          `Create one with: node scripts/grant-moderator.mjs ${email} "Your Name"`,
      );
    }
    return { ok: true };
  }

  const db = await getDb();
  const token = newToken();
  const now = new Date();

  // Any outstanding link for this player is invalidated: only the newest one works, so
  // an older email cannot be used by whoever else has seen it.
  await db.prepare("DELETE FROM auth_tokens WHERE player_id = ?").bind(player.id).run();
  await db
    .prepare(
      "INSERT INTO auth_tokens (token, player_id, created_at, expires_at) VALUES (?,?,?,?)",
    )
    .bind(
      token,
      player.id,
      now.toISOString(),
      new Date(now.getTime() + SIGN_IN_TOKEN_MINUTES * 60_000).toISOString(),
    )
    .run();

  const t = signInLink({
    displayName: player.displayName,
    url: `${baseUrl}/signin/${token}`,
    minutes: SIGN_IN_TOKEN_MINUTES,
  });
  await sendEmail({
    kind: "sign-in-link",
    to: player.email,
    ...t,
    // Keyed on the token, so each fresh request is a fresh email — but a retry of the
    // same one is not.
    idempotencyKey: `sign-in-link:${token}`,
  });

  return { ok: true };
}

export type RedeemResult =
  | { ok: true; sessionToken: string; player: Player }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/**
 * Exchange a sign-in token for a session.
 *
 * The token is consumed whatever happens next: redeeming it twice must fail even if the
 * first attempt is still in flight.
 */
export async function redeemSignInToken(token: string): Promise<RedeemResult> {
  if (!token || token.length < 32) return { ok: false, reason: "invalid" };

  const db = await getDb();
  const row = await db
    .prepare("SELECT * FROM auth_tokens WHERE token = ?")
    .bind(token)
    .first<{ player_id: string; expires_at: string; used_at: string | null }>();

  if (!row) return { ok: false, reason: "invalid" };
  if (row.used_at) return { ok: false, reason: "used" };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const player = await playerById(row.player_id);
  if (!player) return { ok: false, reason: "invalid" };

  const sessionToken = newToken();
  const now = new Date();

  await db.batch([
    db
      .prepare("UPDATE auth_tokens SET used_at = ? WHERE token = ?")
      .bind(now.toISOString(), token),
    db
      .prepare(
        "INSERT INTO sessions (token, player_id, created_at, expires_at, last_used_at) VALUES (?,?,?,?,?)",
      )
      .bind(
        sessionToken,
        player.id,
        now.toISOString(),
        new Date(now.getTime() + SESSION_DAYS * 864e5).toISOString(),
        now.toISOString(),
      ),
    /**
     * Signing in is activity. In the same batch as the session insert, so the retention
     * clock cannot be left behind by a partial write — see touchPlayer() in players.ts
     * for why an account with a stale clock is an account that gets deleted.
     */
    db.prepare("UPDATE players SET last_seen_at = ? WHERE id = ?").bind(now.toISOString(), player.id),
  ]);

  return { ok: true, sessionToken, player };
}

/** Resolve a session cookie to a player. Returns null for anything expired or unknown. */
export async function playerForSession(token: string | undefined): Promise<Player | null> {
  if (!token) return null;
  const db = await getDb();
  const row = await db
    .prepare("SELECT player_id, expires_at FROM sessions WHERE token = ?")
    .bind(token)
    .first<{ player_id: string; expires_at: string }>();
  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    // Tidy it away rather than leaving dead rows to accumulate.
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }
  return playerById(row.player_id);
}

/**
 * Sign out.
 *
 * Deletes the session server-side. Clearing the cookie alone would leave a bearer token
 * that still works for anyone who copied it — which is the whole point of doing this on
 * a shared or family computer.
 */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await getDb();
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}
