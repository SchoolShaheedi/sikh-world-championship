/**
 * Tests for passwordless sign-in.
 *
 * This is hand-rolled auth (see migrations/0004_accounts.sql for why), so its security
 * properties are asserted rather than assumed. Each test below maps to one of the claims
 * in the auth.ts header.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { upsertPlayer } from "./players";
import {
  requestSignInLink,
  redeemSignInToken,
  playerForSession,
  destroySession,
  SIGN_IN_TOKEN_MINUTES,
} from "./auth";
import { getDb } from "./db";

beforeAll(useTempDataDir);
beforeEach(async () => {
  await clearDataDir();
  process.env.RESEND_API_KEY = "test-key";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ id: "e1" }), { status: 200 })),
  );
});

async function aPlayer(email = "player@example.com") {
  return upsertPlayer({
    email,
    displayName: "Jagdeep",
    ageBand: "16+",
    dateOfBirth: "2000-01-01",
  });
}

/**
 * The one thing an unknown address must NOT do is tell the caller — and the one thing it
 * must do on a laptop is tell the developer. Both are asserted here, because they pull in
 * opposite directions and it would be easy to satisfy one by breaking the other.
 *
 * The cost of the silence was real: a sign-in attempt against an address with no local
 * account printed nothing at all, and looked exactly like a mailer that had stopped
 * working.
 */
describe("an address with no account", () => {
  it("says nothing to the caller and something to the console, in development", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");

    const r = await requestSignInLink("nobody@example.com", "http://localhost:3000");
    expect(r).toEqual({ ok: true });

    const said = warn.mock.calls.flat().join(" ");
    expect(said).toContain("no account for nobody@example.com");
    expect(said).toContain("grant-moderator");

    vi.stubEnv("NODE_ENV", before ?? "test");
    warn.mockRestore();
  });

  it("prints NOTHING in production — that line names an address somebody typed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const before = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");

    await requestSignInLink("nobody@example.com", "https://sikhchampionships.com");
    expect(warn.mock.calls.flat().join(" ")).not.toContain("nobody@example.com");

    vi.stubEnv("NODE_ENV", before ?? "test");
    warn.mockRestore();
  });
});

/** The token that was just emailed. */
async function tokenFor(playerId: string): Promise<string> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT token FROM auth_tokens WHERE player_id = ?")
    .bind(playerId)
    .first<{ token: string }>();
  return row!.token;
}

describe("requesting a link", () => {
  it("gives the same answer for an unknown address as a known one", async () => {
    // Otherwise this form becomes a way to find out which children have accounts.
    await aPlayer();
    const known = await requestSignInLink("player@example.com", "https://x.test");
    const unknown = await requestSignInLink("nobody@example.com", "https://x.test");
    expect(known).toEqual(unknown);
  });

  it("creates no token at all for an unknown address", async () => {
    await requestSignInLink("nobody@example.com", "https://x.test");
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM auth_tokens").all();
    expect(results).toHaveLength(0);
  });

  it("invalidates the previous link when a new one is asked for", async () => {
    // An older email must not keep working for whoever else has seen it.
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    const first = await tokenFor(p.id);
    await requestSignInLink(p.email, "https://x.test");
    const second = await tokenFor(p.id);

    expect(second).not.toBe(first);
    expect(await redeemSignInToken(first)).toMatchObject({ ok: false, reason: "invalid" });
    expect(await redeemSignInToken(second)).toMatchObject({ ok: true });
  });

  it("emails the link, and the address is the player's own", async () => {
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM email_sends WHERE kind = 'sign-in-link'")
      .first<{ to_email: string; status: string }>();
    expect(row!.to_email).toBe("player@example.com");
    expect(row!.status).toBe("sent");
  });
});

describe("redeeming", () => {
  it("exchanges a valid token for a working session", async () => {
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    const r = await redeemSignInToken(await tokenFor(p.id));

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const viewer = await playerForSession(r.sessionToken);
    expect(viewer?.id).toBe(p.id);
  });

  it("is SINGLE USE — a forwarded or scanned link cannot be replayed", async () => {
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    const token = await tokenFor(p.id);

    expect(await redeemSignInToken(token)).toMatchObject({ ok: true });
    expect(await redeemSignInToken(token)).toMatchObject({ ok: false, reason: "used" });
  });

  it("refuses an expired token", async () => {
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    const token = await tokenFor(p.id);

    const db = await getDb();
    await db
      .prepare("UPDATE auth_tokens SET expires_at = ? WHERE token = ?")
      .bind(new Date(Date.now() - 1000).toISOString(), token)
      .run();

    expect(await redeemSignInToken(token)).toMatchObject({ ok: false, reason: "expired" });
  });

  it("refuses a guessed or empty token without touching the database", async () => {
    expect(await redeemSignInToken("")).toMatchObject({ ok: false, reason: "invalid" });
    expect(await redeemSignInToken("short")).toMatchObject({ ok: false, reason: "invalid" });
    expect(await redeemSignInToken("x".repeat(43))).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("issues tokens long enough not to be guessable", async () => {
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    // 32 random bytes, base64url — 43 characters.
    expect((await tokenFor(p.id)).length).toBeGreaterThanOrEqual(43);
  });

  it("keeps the sign-in window short", () => {
    expect(SIGN_IN_TOKEN_MINUTES).toBeLessThanOrEqual(30);
  });
});

describe("sessions", () => {
  it("returns null for an unknown or absent cookie", async () => {
    expect(await playerForSession(undefined)).toBeNull();
    expect(await playerForSession("nope")).toBeNull();
  });

  it("returns null once the session has expired, and clears it away", async () => {
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    const r = await redeemSignInToken(await tokenFor(p.id));
    if (!r.ok) throw new Error("setup");

    const db = await getDb();
    await db
      .prepare("UPDATE sessions SET expires_at = ? WHERE token = ?")
      .bind(new Date(Date.now() - 1000).toISOString(), r.sessionToken)
      .run();

    expect(await playerForSession(r.sessionToken)).toBeNull();
    const left = await db.prepare("SELECT * FROM sessions").all();
    expect(left.results).toHaveLength(0);
  });

  it("signing out kills the session server-side, not just the cookie", async () => {
    // Otherwise a copied bearer token keeps working — the whole point on a shared computer.
    const p = await aPlayer();
    await requestSignInLink(p.email, "https://x.test");
    const r = await redeemSignInToken(await tokenFor(p.id));
    if (!r.ok) throw new Error("setup");

    await destroySession(r.sessionToken);
    expect(await playerForSession(r.sessionToken)).toBeNull();
  });

  it("two players never share a session", async () => {
    const a = await aPlayer("a@example.com");
    const b = await aPlayer("b@example.com");
    await requestSignInLink(a.email, "https://x.test");
    const ra = await redeemSignInToken(await tokenFor(a.id));
    await requestSignInLink(b.email, "https://x.test");
    const rb = await redeemSignInToken(await tokenFor(b.id));
    if (!ra.ok || !rb.ok) throw new Error("setup");

    expect(ra.sessionToken).not.toBe(rb.sessionToken);
    expect((await playerForSession(ra.sessionToken))?.email).toBe("a@example.com");
    expect((await playerForSession(rb.sessionToken))?.email).toBe("b@example.com");
  });
});
