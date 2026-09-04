import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { upsertPlayer, playerByEmail, bandFor, uniquePublicNames } from "./players";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const base = {
  email: "p@example.com",
  displayName: "Jagdeep",
  ageBand: "16+" as const,
  dateOfBirth: "2000-01-01",
};

describe("bandFor", () => {
  it("splits at 16, matching the board's two pools", () => {
    expect(bandFor(15)).toBe("U16");
    expect(bandFor(16)).toBe("16+");
    expect(bandFor(8)).toBe("U16");
  });
});

describe("upsertPlayer", () => {
  it("normalises the email, so one person is not two accounts", async () => {
    const a = await upsertPlayer({ ...base, email: "  P@Example.COM " });
    expect(a.email).toBe("p@example.com");
    expect((await playerByEmail("p@example.com"))?.id).toBe(a.id);
  });

  it("entering a second event reuses the account", async () => {
    const first = await upsertPlayer(base);
    const second = await upsertPlayer({ ...base, displayName: "Jag" });
    expect(second.id).toBe(first.id);
    expect(second.displayName).toBe("Jag");
  });

  it("NEVER changes the age band on a later registration", async () => {
    // Age band is a safeguarding boundary. It must not move as a side effect of filling
    // in a sign-up form — that would put a child into the adult pool.
    const child = await upsertPlayer({ ...base, ageBand: "U16", dateOfBirth: "2013-01-01" });
    const again = await upsertPlayer({ ...base, ageBand: "16+" });
    expect(again.id).toBe(child.id);
    expect(again.ageBand).toBe("U16");
  });

  it("NEVER grants moderator through registration", async () => {
    const p = await upsertPlayer(base);
    expect(p.isModerator).toBe(false);
    expect((await upsertPlayer(base)).isModerator).toBe(false);
  });

  it("does not start anyone off as event-verified", async () => {
    // That badge means a volunteer checked them in at an event, in person.
    expect((await upsertPlayer(base)).eventVerified).toBe(false);
  });

  it("keeps a guardian email once set, and lets a later one correct it", async () => {
    await upsertPlayer({ ...base, ageBand: "U16", guardianEmail: "old@example.com" });
    // A registration without one must not wipe it.
    const kept = await upsertPlayer(base);
    expect(kept.guardianEmail).toBe("old@example.com");
    // A registration with one may correct it.
    const updated = await upsertPlayer({ ...base, guardianEmail: "new@example.com" });
    expect(updated.guardianEmail).toBe("new@example.com");
  });
});

/**
 * Two entrants called Aman Singh.
 *
 * A public name is a first name plus a last initial, and Sikh surnames are overwhelmingly
 * Singh and Kaur — so the initial does almost no work and common first names collide as a
 * matter of course. Untreated, the hall is told "Aman S. to station three" and two people
 * stand up.
 */
describe("telling identical public names apart", () => {
  const rows = (...pairs: [string, string][]) =>
    pairs.map(([name, stable]) => ({ name, stable }));
  const run = (...pairs: [string, string][]) =>
    uniquePublicNames(rows(...pairs), (r) => r);

  it("leaves a unique name completely alone", () => {
    expect(run(["Aman S.", "R-1"], ["Baljit K.", "R-2"])).toEqual(["Aman S.", "Baljit K."]);
  });

  it("numbers EVERY member of a clash, not just the later ones", () => {
    // Asymmetric numbering would leave one slip reading plain "Aman S." — giving its
    // holder no reason to suspect there is another, and making the numbered one look like
    // an afterthought beside the real entrant.
    expect(run(["Aman S.", "R-2"], ["Aman S.", "R-1"])).toEqual(["Aman S. (2)", "Aman S. (1)"]);
  });

  it("handles three of them", () => {
    expect(run(["Aman S.", "R-1"], ["Aman S.", "R-2"], ["Aman S.", "R-3"])).toEqual([
      "Aman S. (1)",
      "Aman S. (2)",
      "Aman S. (3)",
    ]);
  });

  it("gives a person the SAME number whatever order the query returns", () => {
    /**
     * The property the slips depend on. A number assigned by position in a result set
     * changes when somebody withdraws, and then the slip in a child's hand stops matching
     * the projector — which is worse than no number, because it is wrong rather than
     * ambiguous.
     */
    const a = run(["Aman S.", "R-9"], ["Aman S.", "R-3"], ["Zorawar S.", "R-5"]);
    const b = run(["Zorawar S.", "R-5"], ["Aman S.", "R-3"], ["Aman S.", "R-9"]);
    expect(a[0]).toBe("Aman S. (2)"); // R-9 sorts after R-3
    expect(a[1]).toBe("Aman S. (1)");
    expect(b[1]).toBe("Aman S. (1)"); // R-3 again, from the other direction
    expect(b[2]).toBe("Aman S. (2)");
  });

  it("keeps a number stable when an UNRELATED person withdraws", () => {
    // The everyday case: the field changes all week and nobody's slip should be reprinted.
    const before = run(["Aman S.", "R-1"], ["Aman S.", "R-4"], ["Baljit K.", "R-2"]);
    const after = run(["Aman S.", "R-1"], ["Aman S.", "R-4"]);
    expect(before.slice(0, 2)).toEqual(after);
  });

  it("does not confuse two different names that share a stable key", () => {
    // Defensive: the key is only ever unique WITHIN a name, so the lookup is keyed on both.
    expect(run(["Aman S.", "R-1"], ["Aman S.", "R-2"], ["Baljit K.", "R-1"])).toEqual([
      "Aman S. (1)",
      "Aman S. (2)",
      "Baljit K.",
    ]);
  });

  it("copes with an empty list", () => {
    expect(uniquePublicNames([], (r: { name: string; stable: string }) => r)).toEqual([]);
  });
});
