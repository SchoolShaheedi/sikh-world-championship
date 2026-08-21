import { describe, expect, it } from "vitest";
import {
  seedOrder,
  bracketSize,
  generateKnockout,
  advanceWinners,
  winnerOf,
  roundName,
  type Entrant,
} from "./bracket";

const entrants = (n: number): Entrant[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
  }));

describe("seeding", () => {
  it("pairs the top seed against the bottom seed", () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("keeps seeds 1 and 2 apart until the final", () => {
    for (const size of [8, 16, 32, 64]) {
      const order = seedOrder(size);
      // Seed 1 in the top half, seed 2 in the bottom half.
      expect(order.indexOf(1)).toBeLessThan(size / 2);
      expect(order.indexOf(2)).toBeGreaterThanOrEqual(size / 2);
    }
  });

  it("rounds up to the next power of two", () => {
    expect(bracketSize(1)).toBe(2);
    expect(bracketSize(5)).toBe(8);
    expect(bracketSize(32)).toBe(32);
    expect(bracketSize(33)).toBe(64);
  });
});

describe("bracket generation", () => {
  it("creates the right number of matches", () => {
    // A knockout of n needs n-1 matches.
    for (const n of [8, 16, 32]) {
      expect(generateKnockout("d", "D", entrants(n)).matches).toHaveLength(n - 1);
    }
  });

  it("places every entrant exactly once in round one", () => {
    const b = generateKnockout("d", "D", entrants(16));
    const placed = b.matches
      .filter((m) => m.round === 0)
      .flatMap((m) => [m.homeId, m.awayId])
      .filter(Boolean);
    expect(new Set(placed).size).toBe(16);
  });

  it("gives byes when the field isn't a power of two", () => {
    const b = generateKnockout("d", "D", entrants(5));
    const firstRound = b.matches.filter((m) => m.round === 0);
    const byes = firstRound.filter((m) => !m.homeId || !m.awayId);
    expect(byes).toHaveLength(3); // 8-slot bracket, 5 players
  });

  it("names rounds from the final backwards", () => {
    expect(roundName(3, 4)).toBe("Final");
    expect(roundName(2, 4)).toBe("Semi-finals");
    expect(roundName(1, 4)).toBe("Quarter-finals");
    expect(roundName(0, 4)).toBe("Round of 16");
  });
});

describe("advancing winners", () => {
  it("moves the winner into the next round", () => {
    const b = generateKnockout("d", "D", entrants(4));
    const first = b.matches.filter((m) => m.round === 0);
    first[0].homeScore = 3;
    first[0].awayScore = 1;
    first[0].status = "complete";

    const next = advanceWinners(b).matches.find((m) => m.round === 1)!;
    expect(next.homeId).toBe(first[0].homeId);
  });

  it("advances a bye automatically", () => {
    const b = generateKnockout("d", "D", entrants(3));
    const advanced = advanceWinners(b);
    const round2 = advanced.matches.filter((m) => m.round === 1);
    // The bye should already be sitting in the next round.
    expect(round2.some((m) => m.homeId || m.awayId)).toBe(true);
  });

  it("treats a draw as unresolved rather than picking a winner", () => {
    const b = generateKnockout("d", "D", entrants(2));
    const m = b.matches[0];
    m.homeScore = 2;
    m.awayScore = 2;
    m.status = "complete";
    expect(winnerOf(m)).toBeNull();
  });

  it("does not advance anyone from an unplayed match", () => {
    const b = generateKnockout("d", "D", entrants(4));
    const next = advanceWinners(b).matches.find((m) => m.round === 1)!;
    expect(next.homeId).toBeNull();
    expect(next.awayId).toBeNull();
  });

  it("produces a single champion when a full bracket is played out", () => {
    let b = generateKnockout("d", "D", entrants(8));
    for (let round = 0; round < b.rounds; round++) {
      for (const m of b.matches.filter((x) => x.round === round)) {
        if (!m.homeId || !m.awayId) continue;
        m.homeScore = 1;
        m.awayScore = 0;
        m.status = "complete";
      }
      b = advanceWinners(b);
    }
    const final = b.matches.find((m) => m.round === b.rounds - 1)!;
    expect(winnerOf(final)).toBe("p1"); // top seed wins every match
  });
});
