/**
 * The dormant-profile rule.
 *
 * Round 42 started creating a profile for everyone who registers interest, not only for
 * the 64 drawn. That left the project holding accounts for children with no event to
 * measure a retention period from — DPIA risk 13. The answer, signed off in round 44, is
 * 24 months of no activity.
 *
 * A deletion rule is the one kind of code where a bug in EITHER direction is serious:
 * deleting too little is a UK GDPR storage-limitation failure, and deleting too much
 * destroys a safeguarding record or somebody's access to the moderation queue. Both
 * directions are tested.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { upsertPlayer, playerByEmail, setModerator, markEventVerified } from "./players";
import { apply } from "./store";

vi.mock("@/data/events", () => ({ get EVENTS() { return []; } }));

const { purgeDormantProfiles, dormancySnapshot, DORMANT_PROFILE_RETENTION_MONTHS } =
  await import("./retention");

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const NOW = new Date("2026-08-31T12:00:00.000Z");
/** Comfortably past the line: 30 months back against a 24-month policy. */
const LONG_AGO = "2024-01-01T00:00:00.000Z";
const RECENTLY = "2026-08-01T00:00:00.000Z";

/** A profile with its clocks set directly, since upsertPlayer always stamps "now". */
async function profile(
  email: string,
  opts: { createdAt?: string; lastSeenAt?: string | null } = {},
) {
  const p = await upsertPlayer({
    email,
    displayName: "Child",
    ageBand: "U16",
    dateOfBirth: "2013-05-02",
  });
  const db = await getDb();
  await db
    .prepare("UPDATE players SET created_at = ?, last_seen_at = ? WHERE id = ?")
    .bind(opts.createdAt ?? LONG_AGO, opts.lastSeenAt ?? null, p.id)
    .run();
  return p;
}

describe("what gets deleted", () => {
  it("deletes a profile untouched for longer than the policy", async () => {
    await profile("dormant@example.com");

    expect(await purgeDormantProfiles(NOW)).toBe(1);
    expect(await playerByEmail("dormant@example.com")).toBeNull();
  });

  it("KEEPS a profile inside the policy period", async () => {
    await profile("new@example.com", { createdAt: RECENTLY });

    expect(await purgeDormantProfiles(NOW)).toBe(0);
    expect(await playerByEmail("new@example.com")).not.toBeNull();
  });

  it("measures from the last sign-in, not from account creation", async () => {
    // The failure this prevents: deleting the account of somebody who signs in monthly
    // but happened to register two years ago.
    await profile("active@example.com", { createdAt: LONG_AGO, lastSeenAt: RECENTLY });

    expect(await purgeDormantProfiles(NOW)).toBe(0);
    expect(await playerByEmail("active@example.com")).not.toBeNull();
  });

  it("measures from the latest registration too", async () => {
    const p = await profile("applicant@example.com");
    const r = await apply({
      eventSlug: "e1",
      divisionId: "open",
      answers: { fullName: "A Child", dob: "2013-05-02", email: "applicant@example.com", mobile: "07700900123" },
      playerId: p.id,
    });
    expect(r.status).toBe("applied");

    // Registered last week; the account was made two years ago. Registering is activity.
    expect(await purgeDormantProfiles(NOW)).toBe(0);
    expect(await playerByEmail("applicant@example.com")).not.toBeNull();
  });
});

describe("the exemptions", () => {
  it("never deletes a moderator", async () => {
    await profile("mod@example.com");
    expect(await setModerator("mod@example.com", true)).toBe(true);

    expect(await purgeDormantProfiles(NOW)).toBe(0);
    expect(await playerByEmail("mod@example.com")).not.toBeNull();
  });

  it("never deletes somebody who attended an event", async () => {
    const p = await profile("attended@example.com");
    await markEventVerified(p.id);

    expect(await purgeDormantProfiles(NOW)).toBe(0);
    expect(await playerByEmail("attended@example.com")).not.toBeNull();
  });

  it("never deletes somebody named on a report — safeguarding records outlive this rule", async () => {
    const p = await profile("subject@example.com");
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO reports (id, reporter_id, target_player_id, target_display_name,
                              context, reason, status, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .bind("r1", "someone-else", p.id, "Child", "post", "bullying", "open", LONG_AGO)
      .run();

    expect(await purgeDormantProfiles(NOW)).toBe(0);
    expect(await playerByEmail("subject@example.com")).not.toBeNull();
  });

  it("never deletes the REPORTER either", async () => {
    const p = await profile("reporter@example.com");
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO reports (id, reporter_id, target_player_id, target_display_name,
                              context, reason, status, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .bind("r2", p.id, "someone-else", "Other", "post", "bullying", "open", LONG_AGO)
      .run();

    expect(await purgeDormantProfiles(NOW)).toBe(0);
  });

  it("never deletes somebody named on a support ticket", async () => {
    const p = await profile("ticket@example.com");
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO support_tickets (id, reference, category, subject, message, player_id,
                                      status, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .bind("t1", "SWC-T-1", "safety", "s", "m", p.id, "open", LONG_AGO)
      .run();

    expect(await purgeDormantProfiles(NOW)).toBe(0);
  });
});

describe("what deletion actually removes", () => {
  it("takes the session and sign-in tokens with it", async () => {
    const p = await profile("gone@example.com");
    const db = await getDb();
    await db
      .prepare("INSERT INTO sessions (token, player_id, created_at, expires_at, last_used_at) VALUES (?,?,?,?,?)")
      .bind("tok", p.id, LONG_AGO, "2099-01-01T00:00:00.000Z", LONG_AGO)
      .run();
    await db
      .prepare("INSERT INTO auth_tokens (token, player_id, created_at, expires_at) VALUES (?,?,?,?)")
      .bind("magic", p.id, LONG_AGO, "2099-01-01T00:00:00.000Z")
      .run();

    await purgeDormantProfiles(NOW);

    // A live bearer token pointing at a deleted account is exactly the kind of orphan
    // that no deletion request would ever find again.
    const s = await db.prepare("SELECT COUNT(*) AS n FROM sessions").first<{ n: number }>();
    const a = await db.prepare("SELECT COUNT(*) AS n FROM auth_tokens").first<{ n: number }>();
    expect(s?.n).toBe(0);
    expect(a?.n).toBe(0);
  });

  it("unlinks the registration but does NOT delete it", async () => {
    // The registration has its own retention period, measured from the event, and it is
    // the record of who applied. What must go is the pointer to a deleted account.
    const p = await profile("unlink@example.com");
    await apply({
      eventSlug: "e1",
      divisionId: "open",
      answers: { fullName: "A Child", dob: "2013-05-02", email: "unlink@example.com", mobile: "07700900123" },
      playerId: p.id,
    });
    const db = await getDb();
    // Age the registration so it is not itself counted as recent activity.
    await db.prepare("UPDATE registrations SET created_at = ?").bind(LONG_AGO).run();

    expect(await purgeDormantProfiles(NOW)).toBe(1);

    const row = await db
      .prepare("SELECT player_id FROM registrations WHERE event_slug = 'e1'")
      .first<{ player_id: string | null }>();
    expect(row).not.toBeNull();
    expect(row?.player_id).toBeNull();
  });
});

describe("the admin snapshot", () => {
  it("counts what is due soon separately from what is due now", async () => {
    await profile("due-now@example.com");
    // 23 months of dormancy against a 24-month policy: not due, due within 90 days.
    await profile("due-soon@example.com", { createdAt: "2024-10-01T00:00:00.000Z" });
    await profile("fresh@example.com", { createdAt: RECENTLY });

    const snap = await dormancySnapshot(NOW);

    expect(snap.profiles).toBe(3);
    expect(snap.inScope).toBe(3);
    expect(snap.dueNow).toBe(1);
    expect(snap.dueWithin90Days).toBe(1);
    expect(snap.deletedAllTime).toBe(0);
    expect(snap.lastRunAt).toBeNull();
  });

  it("excludes exempt profiles from the in-scope count", async () => {
    await profile("mod2@example.com");
    await setModerator("mod2@example.com", true);

    const snap = await dormancySnapshot(NOW);
    expect(snap.profiles).toBe(1);
    expect(snap.inScope).toBe(0);
  });

  it("reads the total deleted from the audit trail, not from memory", async () => {
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
         VALUES (?,?,?,?,?,?)`,
      )
      .bind("run1", "2026-08-30T03:15:00.000Z", "(platform)", "purge-dormant-profiles", 7, "n")
      .run();

    const snap = await dormancySnapshot(NOW);
    expect(snap.deletedAllTime).toBe(7);
    expect(snap.lastRunAt).toBe("2026-08-30T03:15:00.000Z");
  });
});

describe("the policy figure", () => {
  it("is 24 months, matching 04_Legal/RETENTION-POLICY.md", () => {
    // A constant with a test looks redundant until somebody changes it in one place.
    expect(DORMANT_PROFILE_RETENTION_MONTHS).toBe(24);
  });
});
