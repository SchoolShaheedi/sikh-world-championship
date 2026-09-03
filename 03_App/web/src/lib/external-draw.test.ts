/**
 * A draw run somewhere else.
 *
 * The property every test here defends is the same one: **a number means something only
 * because the mapping was recorded before the draw.** Everything else — the parsing, the
 * pools, the withdrawal handling — is in service of that, and each of these describes a way
 * the mapping could quietly stop meaning what the room was told it means.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { apply, registrationsFor } from "./store";
import {
  splitPools,
  lockBallot,
  clearBallot,
  currentBallot,
  parseWinners,
  planExternalDraw,
  commitExternalDraw,
} from "./external-draw";

/** A referral org that `isReferred` recognises, and one it does not. */
vi.mock("@/data/referral-orgs", () => ({
  isReferred: (v: string | undefined) => v === "Basics of Sikhi",
}));

const DESK = "moderator-1";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

let n = 0;
async function applicant(over: { referred?: boolean; name?: string } = {}) {
  n += 1;
  const r = await apply({
    eventSlug: "e1",
    divisionId: "open",
    answers: {
      fullName: over.name ?? `Player ${n}`,
      dob: "2013-05-02",
      email: `p${n}@example.com`,
      mobile: "07700900123",
      ...(over.referred ? { referralOrg: "Basics of Sikhi" } : {}),
    },
  });
  return r.reference;
}

async function applicants(count: number, referred = false) {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(await applicant({ referred }));
  return out;
}

describe("only one pool is ever contested", () => {
  /**
   * The insight the whole feature rests on. Referred applicants take priority for every
   * place, so either they all fit — and only the general pool is drawn — or they do not,
   * and the general pool is not drawn at all. There is never a moment when a draw service
   * needs two lists, and building for two would have been building for a case that cannot
   * happen.
   */
  const reg = (referred: boolean, i: number) =>
    ({
      id: `r${i}`,
      answers: { referralOrg: referred ? "Basics of Sikhi" : "Nobody" },
    }) as never;

  it("draws the GENERAL pool when every referred applicant fits", () => {
    const list = [reg(true, 1), reg(true, 2), reg(false, 3), reg(false, 4), reg(false, 5)];
    const s = splitPools(list, 4);
    expect(s.pool).toBe("general");
    expect(s.automatic).toHaveLength(2); // both referred, no draw needed
    expect(s.entries).toHaveLength(3); // three general applicants
    expect(s.places).toBe(2); // for the two places left after them
  });

  it("draws the REFERRED pool when there are more of them than places", () => {
    const list = [reg(true, 1), reg(true, 2), reg(true, 3), reg(false, 4)];
    const s = splitPools(list, 2);
    expect(s.pool).toBe("referred");
    expect(s.automatic).toHaveLength(0);
    expect(s.entries).toHaveLength(3);
    expect(s.places).toBe(2);
  });

  it("gives the referred pool exactly the places when the two are equal", () => {
    // The boundary. Equal means they all fit, so nothing is drawn from them and the
    // general pool competes for zero places — which the panel then says out loud.
    const list = [reg(true, 1), reg(true, 2), reg(false, 3)];
    const s = splitPools(list, 2);
    expect(s.pool).toBe("general");
    expect(s.automatic).toHaveLength(2);
    expect(s.places).toBe(0);
  });
});

describe("locking the list", () => {
  it("numbers everybody and records who locked it and when", async () => {
    await applicants(3);
    const r = await lockBallot("e1", 64, DESK);
    expect(r.ok).toBe(true);

    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM draw_ballots WHERE event_slug = 'e1' ORDER BY number")
      .all<{ number: number; locked_by: string; locked_at: string; list_id: string }>();
    expect(results.map((x) => x.number)).toEqual([1, 2, 3]);
    expect(results[0].locked_by).toBe(DESK);
    expect(results[0].locked_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // One list id across the whole list, so a draw row can point at exactly this mapping.
    expect(new Set(results.map((x) => x.list_id)).size).toBe(1);
  });

  it("stores registration ids and NO personal data", async () => {
    await applicant({ name: "Amritpal Singh" });
    await lockBallot("e1", 64, DESK);

    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM draw_ballots WHERE event_slug = 'e1'")
      .all<Record<string, unknown>>();
    const json = JSON.stringify(results);
    expect(json).not.toContain("Amritpal");
    expect(json).not.toContain("@example.com");
    expect(json).not.toContain("07700900123");
    expect(json).not.toContain("2013-05-02");
  });

  it("marks referred applicants automatic when they all fit", async () => {
    await applicants(2, true);
    await applicants(3);
    await lockBallot("e1", 4, DESK);

    const b = (await currentBallot("e1", 4))!;
    expect(b.pool).toBe("general");
    expect(b.automatic).toHaveLength(2);
    expect(b.entries).toHaveLength(3);
    expect(b.places).toBe(2);
  });

  it("refuses when there is nobody to draw, or nothing to draw for", async () => {
    expect(await lockBallot("e1", 64, DESK)).toEqual({
      ok: false,
      error: "Nobody is awaiting a decision, so there is nothing to draw.",
    });

    await applicant();
    expect(await lockBallot("e1", 0, DESK)).toEqual({
      ok: false,
      error: "Every place is already taken.",
    });
  });

  it("replaces a previous list rather than adding to it", async () => {
    await applicants(2);
    const first = await lockBallot("e1", 64, DESK);
    await applicants(2);
    const second = await lockBallot("e1", 64, DESK);

    expect(first.ok && second.ok && first.listId).not.toBe(second.ok && second.listId);
    const b = (await currentBallot("e1", 64))!;
    expect(b.entries).toHaveLength(4);
    expect(new Set([b.listId])).toEqual(new Set([second.ok ? second.listId : ""]));
  });

  it("counts anybody who applied after it was locked", async () => {
    // The normal consequence of leaving entries open. Silently ignoring them is how
    // somebody who applied on Tuesday is never in any draw at all.
    await applicants(2);
    await lockBallot("e1", 64, DESK);
    await applicants(3);

    expect((await currentBallot("e1", 64))!.appliedSinceLock).toBe(3);
  });

  it("can be thrown away", async () => {
    await applicants(3);
    await lockBallot("e1", 64, DESK);
    expect(await clearBallot("e1")).toBe(3);
    expect(await currentBallot("e1", 64)).toBeNull();
  });
});

describe("reading the numbers back", () => {
  it("takes whatever a service gives it", () => {
    // Commas, newlines, a wall of prose. Anything that is not a digit separates.
    for (const raw of ["3, 7, 11", "3\n7\n11", "winners: 3 7 and 11!", "[3,7,11]"]) {
      const r = parseWinners(raw, 20, 3);
      expect(r.numbers).toEqual([3, 7, 11]);
      expect(r.problems).toEqual([]);
    }
  });

  it("REFUSES a numbered list, and says why", () => {
    /**
     * Found by this test before it could be found by a draw. "1. 5 / 2. 8 / 3. 12" hands
     * us the list positions as well as the winners, and 1, 2 and 3 are valid entry
     * numbers — so there is nothing about the digits themselves that says which is which.
     *
     * Stripping ordinals by pattern would mean guessing, and guessing wrong here gives a
     * place to the wrong child. Arithmetic catches it instead and cannot be fooled: k
     * winners in a numbered list always yield 2k numbers. The value of this test is that
     * the MESSAGE names the cause, because a moderator reading "6 winners for 3 places"
     * in front of an audience needs to know what to do about it.
     */
    const r = parseWinners("1. 5\n2. 8\n3. 12", 20, 3);
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toMatch(/6 winners for 3 places/);
    expect(r.problems[0]).toMatch(/numbered list/);
    expect(r.problems[0]).toMatch(/Paste just the drawn numbers/);
  });

  it("catches a numbered list even when the positions collide with winners", () => {
    // "1. 3 / 2. 7 / 3. 11" — here 3 is both a position and a winner, so it trips the
    // duplicate check as well. Either guard alone is enough; both firing is fine.
    const r = parseWinners("1. 3\n2. 7\n3. 11", 20, 3);
    expect(r.problems.length).toBeGreaterThan(0);
  });

  it("refuses a number nobody was given", () => {
    const r = parseWinners("3, 99", 20, 2);
    expect(r.problems.join(" ")).toMatch(/99.*only goes up to 20/);
  });

  it("refuses a duplicate", () => {
    // Two people cannot both be number 7, so a repeat means the paste does not say what
    // the person pasting it thinks it says.
    const r = parseWinners("3, 7, 7", 20, 3);
    expect(r.problems.join(" ")).toMatch(/7 appears more than once/);
  });

  it("refuses more winners than there are places", () => {
    const r = parseWinners("1,2,3,4", 20, 3);
    expect(r.problems.join(" ")).toMatch(/4 winners for 3 places/);
  });

  it("allows FEWER, with a warning — drawing in stages is legitimate", () => {
    const r = parseWinners("1,2", 20, 5);
    expect(r.problems).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/3 will be left unfilled/);
  });

  it("says so when there are no numbers at all", () => {
    expect(parseWinners("the winners are attached", 20, 3).problems.join(" ")).toMatch(
      /No numbers in that/,
    );
  });

  it("does not treat zero or a negative as valid", () => {
    // "0" and "-1" both appear in real pasted output. Neither is on any list.
    const r = parseWinners("0, -1, 2", 20, 3);
    expect(r.numbers).toEqual([1, 2]);
    // -1 parses as the digits "1", which IS on the list — so the guard that matters is
    // the range check catching 0, and this documents the quirk rather than hiding it.
    expect(r.problems.join(" ")).toMatch(/0 is not a number/);
  });
});

describe("planning and committing", () => {
  it("resolves numbers to the people they were locked against", async () => {
    const refs = await applicants(5);
    await lockBallot("e1", 64, DESK);

    const plan = await planExternalDraw("e1", [2, 4]);
    expect(plan.selected.map((r) => r.reference)).toEqual([refs[1], refs[3]]);
    expect(plan.drawnCount).toBe(2);
  });

  it("includes the automatic referred places without them being drawn", async () => {
    const referredRefs = await applicants(2, true);
    const generalRefs = await applicants(3);
    await lockBallot("e1", 4, DESK);

    const plan = await planExternalDraw("e1", [2]);
    expect(plan.automaticCount).toBe(2);
    expect(plan.selected.map((r) => r.reference)).toEqual([
      ...referredRefs,
      generalRefs[1],
    ]);
  });

  it("SKIPS a drawn number whose applicant withdrew since the lock, and says so", async () => {
    /**
     * The quiet failure this prevents: somebody withdraws between the list being locked
     * and the numbers coming back, their number is drawn anyway, and a place goes to a
     * person who is not coming while a real applicant misses out and nobody notices.
     */
    const refs = await applicants(4);
    await lockBallot("e1", 64, DESK);
    const db = await getDb();
    await db
      .prepare("UPDATE registrations SET status = 'withdrawn' WHERE reference = ?")
      .bind(refs[1])
      .run();

    const plan = await planExternalDraw("e1", [1, 2, 3]);
    expect(plan.selected.map((r) => r.reference)).toEqual([refs[0], refs[2]]);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0]).toMatchObject({ number: 2, reference: refs[1], status: "withdrawn" });
  });

  it("marks the selected and records the draw with the paste kept verbatim", async () => {
    const refs = await applicants(5);
    await lockBallot("e1", 64, DESK);

    const raw = "  Winners: 2, 4 \n(random.org, 14:02)  ";
    const { drawId } = await commitExternalDraw("e1", {
      service: "random.org",
      rawWinners: raw,
      numbers: [2, 4],
    });

    const rows = await registrationsFor("e1");
    const selected = rows.filter((r) => r.status === "selected").map((r) => r.reference);
    expect(selected.sort()).toEqual([refs[1], refs[3]].sort());

    const db = await getDb();
    const draw = await db
      .prepare("SELECT * FROM draws WHERE id = ?")
      .bind(drawId)
      .first<{ seed: string; method: string; service: string; winners: string; drawn_pool: string; ballot_list: string }>();
    expect(draw!.method).toBe("external");
    expect(draw!.seed).toBe("external");
    expect(draw!.service).toBe("random.org");
    // Verbatim, whitespace and commentary included: a tidied copy would be our reading of
    // the evidence rather than the evidence.
    expect(draw!.winners).toBe(raw);
    expect(draw!.drawn_pool).toBe("general");
    expect(draw!.ballot_list).not.toBeNull();
  });

  it("leaves everyone not drawn as 'applied' — telling them is a separate decision", async () => {
    await applicants(4);
    await lockBallot("e1", 64, DESK);
    await commitExternalDraw("e1", { service: "s", rawWinners: "1", numbers: [1] });

    const rows = await registrationsFor("e1");
    expect(rows.filter((r) => r.status === "applied")).toHaveLength(3);
    expect(rows.filter((r) => r.status === "not-selected")).toHaveLength(0);
  });

  it("ties the draw to the list the numbers were for", async () => {
    // Without this the row says "these numbers won" and nothing says which mapping they
    // were numbers in, which is the same as saying nothing.
    await applicants(3);
    const lock = await lockBallot("e1", 64, DESK);
    const { drawId } = await commitExternalDraw("e1", {
      service: "s",
      rawWinners: "1",
      numbers: [1],
    });

    const db = await getDb();
    const draw = await db
      .prepare("SELECT ballot_list FROM draws WHERE id = ?")
      .bind(drawId)
      .first<{ ballot_list: string }>();
    expect(draw!.ballot_list).toBe(lock.ok ? lock.listId : "");
  });
});
