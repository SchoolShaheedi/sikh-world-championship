/**
 * Tests for the retention job.
 *
 * The one that matters most is "an undated event deletes nothing". Getting that wrong
 * means either destroying a child's medical details before the first aider has read them,
 * or keeping them long past the policy — and `sikh-fc-27` has no date set today, so this
 * is the live case, not a hypothetical.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import crypto from "node:crypto";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { register, registrationsFor } from "./store";
import { MEDICAL_RETENTION_DAYS } from "./retention";

/** Control the event list, so the tests do not depend on real event data. */
let events: { slug: string; date: string | null }[] = [];
vi.mock("@/data/events", () => ({
  get EVENTS() {
    return events;
  },
}));

const { applyRetention } = await import("./retention");

beforeAll(useTempDataDir);
beforeEach(async () => {
  await clearDataDir();
  events = [];
});

async function entrantWithMedical(slug: string) {
  return register({
    eventSlug: slug,
    divisionId: "open",
    divisionCapacity: 10,
    playerId: crypto.randomUUID(),
    answers: {
      fullName: "A Child",
      dob: "2013-05-02",
      email: "c@example.com",
      mobile: "07700900123",
      medical: "Blue inhaler",
      medicalConditions: ["Asthma"],
      guardianEmail: "parent@example.com",
    },
  });
}

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

describe("undated events", () => {
  it("DELETES NOTHING when the event has no date, and says why", async () => {
    events = [{ slug: "e1", date: null }];
    await entrantWithMedical("e1");

    const report = await applyRetention();

    expect(report.actions).toHaveLength(0);
    expect(report.skipped[0].eventSlug).toBe("e1");
    expect(report.skipped[0].reason).toMatch(/no event date/i);

    const [row] = await registrationsFor("e1");
    expect(row.answers.medical).toBe("Blue inhaler");
  });
});

describe("medical purge", () => {
  it("does not fire before the retention window", async () => {
    events = [{ slug: "e1", date: daysAgo(MEDICAL_RETENTION_DAYS - 5) }];
    await entrantWithMedical("e1");

    await applyRetention();
    const [row] = await registrationsFor("e1");
    expect(row.answers.medical).toBe("Blue inhaler");
  });

  it("fires once the window has passed, keeping the registration", async () => {
    events = [{ slug: "e1", date: daysAgo(MEDICAL_RETENTION_DAYS + 1) }];
    await entrantWithMedical("e1");

    const report = await applyRetention();
    expect(report.actions.some((a) => a.action === "purge-medical")).toBe(true);

    const [row] = await registrationsFor("e1");
    expect(row.answers.medical).toBeUndefined();
    expect(row.answers.medicalConditions).toBeUndefined();
    // The registration itself outlives the medical data.
    expect(row.answers.fullName).toBe("A Child");
    expect(row.reference).toBeTruthy();
  });

  it("measures from the EVENT date, not from when the row was written", async () => {
    // Both registrations were created just now. Only the past event's data goes.
    events = [
      { slug: "past", date: daysAgo(MEDICAL_RETENTION_DAYS + 1) },
      { slug: "future", date: daysAgo(1) },
    ];
    await entrantWithMedical("past");
    await entrantWithMedical("future");

    await applyRetention();

    expect((await registrationsFor("past"))[0].answers.medical).toBeUndefined();
    expect((await registrationsFor("future"))[0].answers.medical).toBe("Blue inhaler");
  });
});

describe("check-in tokens", () => {
  it("is cleared the day after the event", async () => {
    events = [{ slug: "e1", date: daysAgo(2) }];
    await entrantWithMedical("e1");

    await applyRetention();
    const [row] = await registrationsFor("e1");
    expect(row.checkInToken).toBe("");
  });

  it("survives the event day itself", async () => {
    events = [{ slug: "e1", date: new Date().toISOString() }];
    await entrantWithMedical("e1");

    await applyRetention();
    const [row] = await registrationsFor("e1");
    expect(row.checkInToken).not.toBe("");
  });
});

describe("audit trail", () => {
  it("records every deletion, so compliance can be shown after the data is gone", async () => {
    events = [{ slug: "e1", date: daysAgo(MEDICAL_RETENTION_DAYS + 1) }];
    await entrantWithMedical("e1");
    await applyRetention();

    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM retention_runs WHERE event_slug = ? ORDER BY action")
      .bind("e1")
      .all<{ action: string; rows_affected: number; note: string; ran_at: string }>();

    const purge = results.find((r) => r.action === "purge-medical");
    expect(purge).toBeDefined();
    expect(purge!.rows_affected).toBe(1);
    expect(purge!.note).toMatch(/days after the event/);
    expect(purge!.ran_at).toBeTruthy();
  });

  it("holds no personal data, so the audit table never needs purging itself", async () => {
    events = [{ slug: "e1", date: daysAgo(MEDICAL_RETENTION_DAYS + 1) }];
    await entrantWithMedical("e1");
    await applyRetention();

    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM retention_runs").all<Record<string, unknown>>();
    const blob = JSON.stringify(results);
    for (const leak of ["A Child", "Blue inhaler", "parent@example.com", "07700900123"]) {
      expect(blob).not.toContain(leak);
    }
  });
});

describe("repeatability", () => {
  it("is safe to run every day — the second pass purges nothing again", async () => {
    events = [{ slug: "e1", date: daysAgo(MEDICAL_RETENTION_DAYS + 1) }];
    await entrantWithMedical("e1");

    const first = await applyRetention();
    const second = await applyRetention();

    expect(first.actions.some((a) => a.action === "purge-medical")).toBe(true);
    expect(second.actions.some((a) => a.action === "purge-medical")).toBe(false);
  });
});
