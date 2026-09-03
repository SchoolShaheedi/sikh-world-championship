/**
 * Who is allowed to do what, and a record of who decided.
 *
 * TWO ROLES, AND THE REASON THERE ARE NOW TWO.
 *
 *   moderator  Everything. Safeguarding disclosures, every applicant's name, date of
 *              birth, mobile and guardian contact, the draw, account deletion.
 *   desk       The arrival desk and nothing else. /admin/checkin and the slips.
 *
 * Until 2026-09-03 there was one flag and no way to set it from the app — deliberately,
 * since round 24, because granting all of the above is a decision somebody should make
 * once and on purpose rather than click. Then the check-in desk needed two or three
 * volunteers on a door, and under one flag staffing a door meant handing out the
 * safeguarding queue.
 *
 * The answer was not to weaken the moderator grant. It was to stop the desk needing it.
 * `desk` is small enough to hand out from a page; `moderator` is not, and this module
 * treats them differently:
 *
 *   * Only a moderator can grant anything.
 *   * A moderator cannot revoke their own moderator role — that is how one careless click
 *     locks everybody out of a live event with no route back but wrangler.
 *   * The last moderator cannot be revoked, for the same reason and by a different route.
 *   * Every grant and every revocation is written to `staff_grants` with the actor's email
 *     as well as their id, because "somebody made them a moderator" is not an answer.
 *
 * A moderator is implicitly desk staff. `is_desk` is only ever set on somebody who is not
 * a moderator, so the two flags never disagree about the same person.
 *
 * WHAT THIS DOES NOT DO: it does not create a player profile in the ordinary sense. A staff
 * account has an obviously-fake date of birth (1900-01-01), the same convention
 * scripts/grant-moderator.mjs has always used — a plausible one nobody can distinguish
 * from real is worse than an obvious one.
 */
import crypto from "node:crypto";
import { getDb, bool } from "./db";
import { playerByEmail } from "./players";

export type StaffRole = "moderator" | "desk";

export interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
  /** True when this account has never signed in, so an invitation may have gone astray. */
  neverSignedIn: boolean;
  createdAt: string;
}

export interface StaffGrant {
  at: string;
  actorEmail: string;
  targetEmail: string;
  role: StaffRole;
  granted: boolean;
  note: string | null;
}

/** Normalise the way every lookup and every write does, so they cannot disagree. */
function normalise(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * A deliberately loose check.
 *
 * Not validating email addresses properly on purpose: the real test is whether a sign-in
 * link arrives, and `neverSignedIn` above surfaces that. Rejecting an unusual but valid
 * address would be a worse failure than accepting a typo somebody can see and fix.
 */
function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Everyone with any access, moderators first, then alphabetically. */
export async function staffList(): Promise<StaffMember[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT p.id, p.email, p.display_name, p.is_moderator, p.is_desk, p.created_at,
              (SELECT COUNT(*) FROM sessions s WHERE s.player_id = p.id) AS sessions,
              p.last_seen_at
         FROM players p
        WHERE p.is_moderator = 1 OR p.is_desk = 1
        ORDER BY p.is_moderator DESC, p.email COLLATE NOCASE`,
    )
    .all<{
      id: string;
      email: string;
      display_name: string;
      is_moderator: number;
      is_desk: number;
      created_at: string;
      last_seen_at: string | null;
    }>();

  return results.map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    role: r.is_moderator ? "moderator" : "desk",
    // Created and never seen since. A staff account is created by a grant, so a
    // last_seen_at equal to created_at means the sign-in link was never used.
    neverSignedIn: !r.last_seen_at || r.last_seen_at === r.created_at,
    createdAt: r.created_at,
  }));
}

/**
 * The audit trail, newest first.
 *
 * `rowid DESC` as the tiebreaker, not decoration. A grant and its revocation can land in
 * the same millisecond — a test caught exactly that — and with only `at DESC` the order
 * between them is undefined. For this table the two orders mean OPPOSITE THINGS: "granted,
 * then revoked" and "revoked, then granted" describe different states of somebody's access.
 * The implicit rowid is insertion order, which is the truth.
 */
export async function staffGrants(limit = 20): Promise<StaffGrant[]> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM staff_grants ORDER BY at DESC, rowid DESC LIMIT ?")
    .bind(limit)
    .all<{
      at: string;
      actor_email: string;
      target_email: string;
      role: string;
      granted: number;
      note: string | null;
    }>();
  return results.map((r) => ({
    at: r.at,
    actorEmail: r.actor_email,
    targetEmail: r.target_email,
    role: r.role as StaffRole,
    granted: r.granted === 1,
    note: r.note,
  }));
}

async function record(
  actor: { id: string; email: string },
  targetEmail: string,
  role: StaffRole,
  granted: boolean,
  note: string | null,
): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO staff_grants (id, at, actor_id, actor_email, target_email, role, granted, note)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .bind(
      crypto.randomUUID(),
      new Date().toISOString(),
      actor.id,
      actor.email,
      targetEmail,
      role,
      bool(granted),
      note,
    )
    .run();
}

async function moderatorCount(): Promise<number> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM players WHERE is_moderator = 1")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export type GrantResult =
  | { ok: true; created: boolean; message: string }
  | { ok: false; error: string };

/**
 * Give somebody access, creating a staff account if that address has never been here.
 *
 * Creating the account is the point: the useful action is "add this volunteer", and asking
 * a moderator to first make the person register as a player, then find them, then grant, is
 * three steps of which two are irrelevant. The account is a staff account — fake date of
 * birth, 16+ band — and it can sign in immediately with a magic link like anybody else.
 */
export async function grantStaff(
  actor: { id: string; email: string; isModerator: boolean },
  emailRaw: string,
  role: StaffRole,
  note?: string,
): Promise<GrantResult> {
  if (!actor.isModerator) return { ok: false, error: "Only a moderator can grant access." };

  const email = normalise(emailRaw);
  if (!looksLikeEmail(email)) return { ok: false, error: "That does not look like an email address." };

  const db = await getDb();
  const existing = await playerByEmail(email);

  /**
   * Granting desk access to somebody who is already a moderator is refused rather than
   * silently applied. It would be a DOWNGRADE dressed as a grant — the flag would be set
   * on an account that already has more, and the person clicking it almost certainly meant
   * to remove the moderator role instead. Say so.
   */
  if (existing?.isModerator && role === "desk") {
    return {
      ok: false,
      error:
        `${email} is already a moderator, which includes the desk. ` +
        `To reduce them to desk only, revoke moderator first.`,
    };
  }

  if (existing) {
    await db
      .prepare(
        role === "moderator"
          ? "UPDATE players SET is_moderator = 1, is_desk = 0 WHERE id = ?"
          : "UPDATE players SET is_desk = 1 WHERE id = ?",
      )
      .bind(existing.id)
      .run();
    await record(actor, email, role, true, note ?? null);
    return {
      ok: true,
      created: false,
      message: `${email} now has ${role === "moderator" ? "full moderator" : "desk"} access.`,
    };
  }

  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO players
         (id, email, display_name, age_band, date_of_birth, is_moderator, is_desk, created_at)
       VALUES (?,?,?,'16+','1900-01-01',?,?,?)`,
    )
    .bind(
      crypto.randomUUID(),
      email,
      email.split("@")[0],
      bool(role === "moderator"),
      bool(role === "desk"),
      now,
    )
    .run();
  await record(actor, email, role, true, note ?? null);

  return {
    ok: true,
    created: true,
    message:
      `Created a staff account for ${email} with ` +
      `${role === "moderator" ? "full moderator" : "desk"} access. ` +
      `They sign in at /signin with that address — no password, they get a link.`,
  };
}

/**
 * Take access away.
 *
 * Two refusals, both preventing the same disaster from different directions: a moderator
 * removing their own role, and the last moderator being removed at all. Either one leaves
 * an event with nobody who can run the draw or read a safeguarding report, recoverable
 * only with database access somebody may not have on the day.
 *
 * Revoking `moderator` clears BOTH flags. It does not quietly demote somebody to desk
 * staff: "remove their access" must not leave them holding some.
 */
export async function revokeStaff(
  actor: { id: string; email: string; isModerator: boolean },
  emailRaw: string,
  note?: string,
): Promise<GrantResult> {
  if (!actor.isModerator) return { ok: false, error: "Only a moderator can change access." };

  const email = normalise(emailRaw);
  const target = await playerByEmail(email);
  if (!target) return { ok: false, error: "No account with that address." };
  if (!target.isModerator && !target.isDesk) {
    return { ok: false, error: `${email} does not have staff access.` };
  }

  if (target.isModerator) {
    if (target.id === actor.id) {
      return {
        ok: false,
        error:
          "You cannot remove your own moderator access — that is how everybody ends up " +
          "locked out mid-event. Ask another moderator to do it.",
      };
    }
    if ((await moderatorCount()) <= 1) {
      return {
        ok: false,
        error: "That is the only moderator. Add another one first.",
      };
    }
  }

  const role: StaffRole = target.isModerator ? "moderator" : "desk";
  const db = await getDb();
  await db
    .prepare("UPDATE players SET is_moderator = 0, is_desk = 0 WHERE id = ?")
    .bind(target.id)
    .run();
  await record(actor, email, role, false, note ?? null);

  return { ok: true, created: false, message: `${email} no longer has any access.` };
}
