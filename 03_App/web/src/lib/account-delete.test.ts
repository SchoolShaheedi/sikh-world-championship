/**
 * Deleting an account outright.
 *
 * The retention job and the admin delete button share one cascade, and they differ in
 * exactly one respect: whether the registration row goes with the profile. That single
 * difference is the reason this file exists — get it the wrong way round and either a
 * deletion leaves a child's name, date of birth and email behind, or the nightly job
 * silently starts destroying the record of who applied to an event.
 *
 * Both refusals are tested too. A deletion that goes ahead when it should have been
 * refused takes a safeguarding record with it, and there is no undo.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { upsertPlayer, playerByEmail, setModerator } from "./players";
import { apply } from "./store";
import {
  deleteAccount,
  deletionBlockers,
  deleteRegistrationByReference,
} from "./account-delete";

vi.mock("@/data/events", () => ({ get EVENTS() { return []; } }));

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

async function entrant(email: string) {
  const p = await upsertPlayer({
    email,
    displayName: "Child",
    ageBand: "U16",
    dateOfBirth: "2013-05-02",
  });
  const r = await apply({
    eventSlug: "e1",
    divisionId: "open",
    answers: {
      fullName: "A Child",
      dob: "2013-05-02",
      email,
      mobile: "07700900123",
      medical: "asthma",
    },
    playerId: p.id,
  });
  return { player: p, reference: r.reference };
}

describe("deleting an account and its entry", () => {
  it("removes the profile AND the registration when asked to", async () => {
    const { player } = await entrant("test@example.com");

    const r = await deleteAccount(player.id, {
      deleteRegistrations: true,
      reason: "Test entry after a rehearsal",
    });

    expect(r.playerDeleted).toBe(true);
    expect(r.registrationsDeleted).toBe(1);
    expect(await playerByEmail("test@example.com")).toBeNull();

    const db = await getDb();
    const left = await db
      .prepare("SELECT COUNT(*) AS n FROM registrations")
      .first<{ n: number }>();
    expect(left?.n).toBe(0);
  });

  it("KEEPS the registration and unlinks it when not asked to", async () => {
    const { player } = await entrant("keep@example.com");

    const r = await deleteAccount(player.id, {
      deleteRegistrations: false,
      reason: "Dormant profile",
    });

    expect(r.registrationsDeleted).toBe(0);
    expect(r.registrationsUnlinked).toBe(1);

    const db = await getDb();
    const row = await db
      .prepare("SELECT player_id FROM registrations")
      .first<{ player_id: string | null }>();
    expect(row).not.toBeNull();
    expect(row?.player_id).toBeNull();
  });

  it("clears the credentials attached to the account", async () => {
    const { player } = await entrant("creds@example.com");
    const db = await getDb();
    await db
      .prepare(
        "INSERT INTO sessions (token, player_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
      )
      .bind("s1", player.id, "2026-08-01T00:00:00.000Z", "2026-09-01T00:00:00.000Z")
      .run();

    await deleteAccount(player.id, { deleteRegistrations: true, reason: "cleanup" });

    const s = await db
      .prepare("SELECT COUNT(*) AS n FROM sessions WHERE player_id = ?")
      .bind(player.id)
      .first<{ n: number }>();
    expect(s?.n).toBe(0);
  });

  it("records the deletion, because 'did you delete it?' has to be answerable", async () => {
    const { player } = await entrant("audit@example.com");
    await deleteAccount(player.id, {
      deleteRegistrations: true,
      reason: "Deleted from the admin panel by mod@example.com: A Child",
    });

    const db = await getDb();
    const run = await db
      .prepare("SELECT action, note, rows_affected FROM retention_runs")
      .first<{ action: string; note: string; rows_affected: number }>();
    expect(run?.action).toBe("delete-account");
    expect(run?.rows_affected).toBe(1);
    expect(run?.note).toContain("mod@example.com");
  });

  it("writes no audit row for an account that was not there", async () => {
    const r = await deleteAccount("no-such-player", {
      deleteRegistrations: true,
      reason: "nothing",
    });
    expect(r.playerDeleted).toBe(false);

    const db = await getDb();
    const n = await db
      .prepare("SELECT COUNT(*) AS n FROM retention_runs")
      .first<{ n: number }>();
    expect(n?.n).toBe(0);
  });
});

describe("what must not be deleted", () => {
  it("refuses a moderator", async () => {
    await entrant("mod@example.com");
    expect(await setModerator("mod@example.com", true)).toBe(true);
    const p = await playerByEmail("mod@example.com");

    const blockers = await deletionBlockers(p!.id);
    expect(blockers.join(" ")).toContain("moderator");
  });

  it("refuses anyone named on a report, as the reporter or as the subject", async () => {
    const a = await entrant("reporter@example.com");
    const b = await entrant("subject@example.com");
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO reports
           (id, reporter_id, target_player_id, target_display_name, context, reason,
            detail, status, created_at)
         VALUES (?, ?, ?, 'Child', 'board', ?, ?, 'open', ?)`,
      )
      .bind("r1", a.player.id, b.player.id, "abuse", "said something", "2026-08-01T00:00:00.000Z")
      .run();

    expect((await deletionBlockers(a.player.id)).length).toBe(1);
    expect((await deletionBlockers(b.player.id)).length).toBe(1);
  });

  it("allows an ordinary entrant", async () => {
    const { player } = await entrant("ordinary@example.com");
    expect(await deletionBlockers(player.id)).toEqual([]);
  });
});

describe("an entry with no account behind it", () => {
  it("can still be deleted by reference", async () => {
    const { player, reference } = await entrant("unlinked@example.com");
    await deleteAccount(player.id, { deleteRegistrations: false, reason: "dormant" });

    expect(await deleteRegistrationByReference(reference, "erasure request")).toBe(true);

    const db = await getDb();
    const n = await db
      .prepare("SELECT COUNT(*) AS n FROM registrations")
      .first<{ n: number }>();
    expect(n?.n).toBe(0);
  });

  it("reports honestly when the reference does not exist", async () => {
    expect(await deleteRegistrationByReference("SFC-NOPE", "typo")).toBe(false);
  });
});
