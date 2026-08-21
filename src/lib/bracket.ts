/**
 * Bracket model + generation.
 *
 * Used by the public live bracket page (/events/[slug]/bracket) and, later, by the
 * admin score-entry view. Sport-agnostic: a "match" is two entrants and two scores.
 */

export interface Entrant {
  id: string;
  /** Display name shown in the bracket. */
  name: string;
  seed: number;
}

export interface Match {
  id: string;
  /** 0 = first round of the knockout. */
  round: number;
  /** Position within the round, top to bottom. */
  position: number;
  homeId: string | null;
  awayId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "pending" | "live" | "complete";
  /** Which station/console this match is being played on. */
  station: number | null;
  /** Match id this winner feeds into. */
  feedsInto: string | null;
}

export interface KnockoutBracket {
  divisionId: string;
  divisionName: string;
  rounds: number;
  matches: Match[];
}

/** Human label for a knockout round, counting back from the final. */
export function roundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semi-finals";
  if (fromEnd === 3) return "Quarter-finals";
  return `Round of ${Math.pow(2, fromEnd)}`;
}

/**
 * Standard seeding order so the top seeds only meet late.
 * seedOrder(8) -> [1,8,4,5,2,7,3,6]
 */
export function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2;
    const next: number[] = [];
    for (const s of order) {
      next.push(s, n + 1 - s);
    }
    order = next;
  }
  return order;
}

/** Round the entrant count up to the next power of two, so byes can be inserted. */
export function bracketSize(entrantCount: number): number {
  let size = 1;
  while (size < entrantCount) size *= 2;
  return Math.max(size, 2);
}

/**
 * Build an empty single-elimination bracket for the given entrants.
 * Entrants shorter than the bracket size receive byes (null opponent).
 */
export function generateKnockout(
  divisionId: string,
  divisionName: string,
  entrants: Entrant[],
): KnockoutBracket {
  const size = bracketSize(entrants.length);
  const rounds = Math.log2(size);
  const order = seedOrder(size);
  const bySeed = new Map(entrants.map((e) => [e.seed, e]));

  const matches: Match[] = [];

  // First round, paired by seed order.
  for (let i = 0; i < size / 2; i++) {
    const homeSeed = order[i * 2];
    const awaySeed = order[i * 2 + 1];
    matches.push({
      id: `${divisionId}-r0-m${i}`,
      round: 0,
      position: i,
      homeId: bySeed.get(homeSeed)?.id ?? null,
      awayId: bySeed.get(awaySeed)?.id ?? null,
      homeScore: null,
      awayScore: null,
      status: "pending",
      station: null,
      feedsInto: rounds > 1 ? `${divisionId}-r1-m${Math.floor(i / 2)}` : null,
    });
  }

  // Remaining rounds, empty until winners arrive.
  for (let r = 1; r < rounds; r++) {
    const count = size / Math.pow(2, r + 1);
    for (let i = 0; i < count; i++) {
      matches.push({
        id: `${divisionId}-r${r}-m${i}`,
        round: r,
        position: i,
        homeId: null,
        awayId: null,
        homeScore: null,
        awayScore: null,
        status: "pending",
        station: null,
        feedsInto:
          r + 1 < rounds ? `${divisionId}-r${r + 1}-m${Math.floor(i / 2)}` : null,
      });
    }
  }

  return { divisionId, divisionName, rounds, matches };
}

/** Winner of a completed match, or null. */
export function winnerOf(m: Match): string | null {
  if (m.status !== "complete" || m.homeScore === null || m.awayScore === null) {
    // A bye advances automatically.
    if (m.homeId && !m.awayId) return m.homeId;
    if (m.awayId && !m.homeId) return m.awayId;
    return null;
  }
  if (m.homeScore === m.awayScore) return null;
  return m.homeScore > m.awayScore ? m.homeId : m.awayId;
}

/** Push completed winners forward into the next round. Pure — returns new matches. */
export function advanceWinners(bracket: KnockoutBracket): KnockoutBracket {
  const byId = new Map(bracket.matches.map((m) => [m.id, { ...m }]));

  for (const m of bracket.matches) {
    const w = winnerOf(m);
    if (!w || !m.feedsInto) continue;
    const target = byId.get(m.feedsInto);
    if (!target) continue;
    // Even positions feed the home slot, odd feed away.
    if (m.position % 2 === 0) target.homeId = w;
    else target.awayId = w;
  }

  return { ...bracket, matches: [...byId.values()] };
}
