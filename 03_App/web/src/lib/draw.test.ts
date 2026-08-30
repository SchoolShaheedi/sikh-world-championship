/**
 * Tests for the draw.
 *
 * This decides who gets to come. If it is quietly biased, or cannot be recomputed, the
 * event cannot answer "how were places decided?" — which for a community event is the
 * question that matters most.
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { apply, registrationsFor, selectedCount } from "./store";
import { runDraw, closeDraw, seededShuffle } from "./draw";
import { getDb } from "./db";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

async function applicant(email: string, referralOrg: string) {
  return apply({
    eventSlug: "e1",
    divisionId: "open",
    answers: {
      fullName: `Player ${email}`,
      dob: "2010-05-02",
      email,
      mobile: "07700900123",
      referralOrg,
    },
  });
}

const REFERRED = "Basics of Sikhi";
const NOT_REFERRED = "Nobody — I found it myself";

async function pool(referred: number, general: number) {
  for (let i = 0; i < referred; i++) await applicant(`r${i}@example.com`, REFERRED);
  for (let i = 0; i < general; i++) await applicant(`g${i}@example.com`, NOT_REFERRED);
}

describe("seededShuffle", () => {
  it("is reproducible from its seed — the basis of an auditable draw", () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect(seededShuffle(items, "abc")).toEqual(seededShuffle(items, "abc"));
  });

  it("gives a different order for a different seed", () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect(seededShuffle(items, "abc")).not.toEqual(seededShuffle(items, "xyz"));
  });

  it("does not lose or duplicate anyone", () => {
    const items = Array.from({ length: 64 }, (_, i) => i);
    const out = seededShuffle(items, "s");
    expect(out).toHaveLength(64);
    expect(new Set(out).size).toBe(64);
  });

  it("is not biased towards the front of the list", () => {
    // A plain modulo instead of rejection sampling would skew low indexes. Over many
    // draws every position should land near the middle on average.
    const N = 20;
    const totals = new Array(N).fill(0);
    for (let run = 0; run < 600; run++) {
      seededShuffle(Array.from({ length: N }, (_, i) => i), `seed-${run}`)
        .forEach((v, pos) => { totals[v] += pos; });
    }
    const averages = totals.map((t) => t / 600);
    const mid = (N - 1) / 2;
    for (const avg of averages) expect(Math.abs(avg - mid)).toBeLessThan(1.6);
  });
});

describe("running the draw", () => {
  it("fills places from the referred pool first", async () => {
    await pool(10, 10);
    const r = await runDraw("e1", 6);
    expect(r.referredTaken).toBe(6);
    expect(r.generalTaken).toBe(0);
  });

  it("falls through to the general pool once referrals run out", async () => {
    await pool(4, 10);
    const r = await runDraw("e1", 10);
    expect(r.referredTaken).toBe(4);
    expect(r.generalTaken).toBe(6);
  });

  it("takes everyone when there are fewer applicants than places", async () => {
    await pool(3, 2);
    const r = await runDraw("e1", 64);
    expect(r.selected).toHaveLength(5);
    expect(r.notSelected).toHaveLength(0);
  });

  it("is reproducible from the recorded seed", async () => {
    await pool(8, 8);
    const first = await runDraw("e1", 5, { dryRun: true, seed: "fixed-seed" });
    const second = await runDraw("e1", 5, { dryRun: true, seed: "fixed-seed" });
    expect(second.selected.map((r) => r.reference)).toEqual(
      first.selected.map((r) => r.reference),
    );
  });

  it("records the seed and the counts, so a draw can be shown to be honest", async () => {
    await pool(5, 5);
    const r = await runDraw("e1", 4, { note: "first draw" });

    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM draws WHERE id = ?")
      .bind(r.drawId)
      .first<Record<string, unknown>>();
    expect(row!.seed).toBe(r.seed);
    expect(row!.applicants).toBe(10);
    expect(row!.places).toBe(4);
    expect(row!.note).toBe("first draw");
  });

  it("changes nothing on a dry run", async () => {
    await pool(5, 5);
    await runDraw("e1", 4, { dryRun: true });
    expect(await selectedCount("e1")).toBe(0);
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM draws").all();
    expect(results).toHaveLength(0);
  });

  it("leaves undrawn applicants as 'applied', not 'not-selected'", async () => {
    // Marking someone rejected before you have told them is a state nobody can explain
    // if they ring up.
    await pool(2, 8);
    await runDraw("e1", 3);
    const rows = await registrationsFor("e1");
    expect(rows.filter((r) => r.status === "selected")).toHaveLength(3);
    expect(rows.filter((r) => r.status === "applied")).toHaveLength(7);
    expect(rows.filter((r) => r.status === "not-selected")).toHaveLength(0);
  });

  it("backfills drop-outs without displacing anyone already selected", async () => {
    await pool(0, 10);
    const first = await runDraw("e1", 3);
    const firstRefs = first.selected.map((r) => r.reference).sort();

    const second = await runDraw("e1", 5);
    expect(second.places).toBe(2);

    const stillSelected = (await registrationsFor("e1"))
      .filter((r) => r.status === "selected")
      .map((r) => r.reference);
    for (const ref of firstRefs) expect(stillSelected).toContain(ref);
    expect(stillSelected).toHaveLength(5);
  });
});

describe("closing the draw", () => {
  it("marks everyone still waiting as not selected", async () => {
    await pool(2, 8);
    const r = await runDraw("e1", 3);
    const closed = await closeDraw("e1", r.drawId);

    expect(closed).toBe(7);
    const rows = await registrationsFor("e1");
    expect(rows.filter((x) => x.status === "not-selected")).toHaveLength(7);
    expect(rows.filter((x) => x.status === "selected")).toHaveLength(3);
  });
});
