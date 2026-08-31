/**
 * The 12-month registration rule.
 *
 * This is the rule that actually deletes a child's name, date of birth, email and mobile.
 * Every other retention rule either clears a few fields (`purgeMedical`) or removes an
 * account while leaving those details behind (`purgeDormantProfiles`). So both directions
 * are tested, because both are serious: deleting too little is a storage-limitation
 * failure under UK GDPR, and deleting too much destroys a safeguarding record — or the
 * evidence of who applied while a dispute is still live.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { apply, registrationsFor } from "./store";
import { upsertPlayer } from "./players";

/** Control the event list, so these tests do not depend on real event data. */
let events: { slug: string; date: string | null }[] = [];
vi.mock("@/data/events", () => ({
  get EVENTS() {
    return events;
  },
}));

const { applyRetention, purgeRegistrations, REGISTRATION_RETENTION_MONTHS } =
  await import("./retention");

const EVENT_DATE = "2026-10-03";
/** A day past twelve months. */
const AFTER = new Date("2027-10-04T03:15:00.000Z");
/** Eleven months after the event: inside the period. */
const BEFORE = new Date("2027-09-04T03:15:00.000Z");

beforeAll(useTempDataDir);
beforeEach(async () => {
  await clearDataDir();
  events = [{ slug: "e1", date: EVENT_DATE }];
});

async function entrant(slug = "e1", playerId: string | null = null) {
  return apply({
    eventSlug: slug,
    divisionId: "open",
    answers: {
      fullName: "A Child",
      dob: "2013-05-02",
      email: "c@example.com",
      mobile: "07700900123",
      guardianEmail: "parent@example.com",
    },
    playerId,
  });
}

async function player(email: string) {
  return upsertPlayer({
    email,
    displayName: "Child",
    ageBand: "U16",
    dateOfBirth: "2013-05-02",
  });
}

describe("the clock", () => {
  it("deletes the registration twelve months after the event", async () => {
    await entrant();

    const report = await applyRetention(AFTER);

    expect(await registrationsFor("e1")).toHaveLength(0);
    const a = report.actions.find((x) => x.action === "purge-registrations");
    expect(a?.rowsAffected).toBe(1);
    expect(a?.eventSlug).toBe("e1");
  });

  it("KEEPS it inside the period", async () => {
    await entrant();

    const report = await applyRetention(BEFORE);

    expect(await registrationsFor("e1")).toHaveLength(1);
    expect(report.actions.find((x) => x.action === "purge-registrations")).toBeUndefined();
  });

  it("deletes nothing for an event with no date", async () => {
    // The same guard the rest of the job has. An undated event cannot be measured from,
    // and guessing would delete an entry for an event that has not happened yet.
    events = [{ slug: "e1", date: null }];
    await entrant();

    await applyRetention(AFTER);

    expect(await registrationsFor("e1")).toHaveLength(1);
  });

  it("only touches the event whose period has passed", async () => {
    events = [
      { slug: "e1", date: EVENT_DATE },
      { slug: "e2", date: "2027-10-02" },
    ];
    await entrant("e1");
    await entrant("e2");

    await applyRetention(AFTER);

    expect(await registrationsFor("e1")).toHaveLength(0);
    expect(await registrationsFor("e2")).toHaveLength(1);
  });
});

describe("the safeguarding exemption", () => {
  async function report(playerId: string, as: "subject" | "reporter") {
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO reports (id, reporter_id, target_player_id, target_display_name,
                              context, reason, status, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .bind(
        "r1",
        as === "reporter" ? playerId : "someone-else",
        as === "subject" ? playerId : "someone-else",
        "Child",
        "post",
        "bullying",
        "open",
        "2026-10-04T00:00:00.000Z",
      )
      .run();
  }

  it("keeps a registration whose applicant is the SUBJECT of a report", async () => {
    const p = await player("subject@example.com");
    await entrant("e1", p.id);
    await report(p.id, "subject");

    await applyRetention(AFTER);

    // Six years, not twelve months. A concern about a child whose name, date of birth and
    // guardian's contact details have been deleted cannot be investigated.
    expect(await registrationsFor("e1")).toHaveLength(1);
  });

  it("keeps one whose applicant is the REPORTER", async () => {
    const p = await player("reporter@example.com");
    await entrant("e1", p.id);
    await report(p.id, "reporter");

    await applyRetention(AFTER);

    expect(await registrationsFor("e1")).toHaveLength(1);
  });

  it("keeps one whose applicant raised a SAFETY support ticket", async () => {
    const p = await player("safety@example.com");
    await entrant("e1", p.id);
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO support_tickets (id, reference, category, subject, message, player_id,
                                      status, created_at)
         VALUES (?,?,'safety',?,?,?,'open',?)`,
      )
      .bind("t1", "SWC-T-1", "s", "m", p.id, "2026-10-04T00:00:00.000Z")
      .run();

    await applyRetention(AFTER);

    expect(await registrationsFor("e1")).toHaveLength(1);
  });

  it("does NOT exempt an ordinary support ticket", async () => {
    // "I couldn't sign in" is correspondence, not a safeguarding record, and it has a
    // twelve-month life of its own. Treating every ticket as an exemption would quietly
    // turn the rule off for anyone who ever emailed us.
    const p = await player("technical@example.com");
    await entrant("e1", p.id);
    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO support_tickets (id, reference, category, subject, message, player_id,
                                      status, created_at)
         VALUES (?,?,'technical',?,?,?,'open',?)`,
      )
      .bind("t2", "SWC-T-2", "s", "m", p.id, "2026-10-04T00:00:00.000Z")
      .run();

    await applyRetention(AFTER);

    expect(await registrationsFor("e1")).toHaveLength(0);
  });

  it("deletes a registration whose account is already gone", async () => {
    // The dormancy rule nulls the link rather than deleting the row, so an unlinked
    // registration is the normal end state of that job — and it is exactly the row that
    // held a child's details with nothing pointing at it. It must still be reachable.
    await entrant("e1", null);

    expect(await purgeRegistrations("e1")).toBe(1);
    expect(await registrationsFor("e1")).toHaveLength(0);
  });
});

describe("the audit trail", () => {
  it("records the deletion, with the exemption stated", async () => {
    await entrant();

    await applyRetention(AFTER);

    const db = await getDb();
    const row = await db
      .prepare(
        `SELECT event_slug, rows_affected, note FROM retention_runs
          WHERE action = 'purge-registrations'`,
      )
      .first<{ event_slug: string; rows_affected: number; note: string }>();
    expect(row?.event_slug).toBe("e1");
    expect(row?.rows_affected).toBe(1);
    expect(row?.note).toMatch(/12 months/);
    expect(row?.note).toMatch(/report/i);
  });

  it("writes nothing when there was nothing to delete", async () => {
    // A row per event per night, forever, would bury the entries that matter. The nightly
    // token clear already proves the job ran.
    await applyRetention(AFTER);

    const db = await getDb();
    const n = await db
      .prepare(
        "SELECT COUNT(*) AS n FROM retention_runs WHERE action = 'purge-registrations'",
      )
      .first<{ n: number }>();
    expect(n?.n).toBe(0);
  });
});

describe("the policy figure", () => {
  it("is 12 months, matching 04_Legal/RETENTION-POLICY.md", () => {
    expect(REGISTRATION_RETENTION_MONTHS).toBe(12);
  });
});
