/**
 * The live bracket, stored.
 *
 * WHAT THIS IS FOR: on 3 October a television in the hall shows the bracket and a laptop
 * at the desk enters scores. Those are two different devices with no connection to each
 * other, so the bracket has to live in the database and the television has to ask for it.
 *
 * WHY POLLING AND NOT WEBSOCKETS (decided 2026-09-01): a `setInterval` fetch is a few
 * lines, survives the venue wifi dropping out, and recovers by doing nothing. Websockets
 * on Cloudflare Workers means Durable Objects, a connection to keep alive and a
 * reconnection path to get right — a lot of machinery for a screen that changes 63 times
 * in one day. If the venue ever has 500 people watching on their phones, revisit it.
 *
 * NO NAMES ARE STORED HERE. A match holds player ids; the handles are read live from
 * `players` when the bracket is rendered. That means a moderator correcting a name on
 * /admin changes the projector immediately, and a deleted account cannot leave its name
 * behind on a screen.
 */
import { getDb } from "./db";
import {
  generateKnockout,
  advanceWinners,
  type KnockoutBracket,
  type Match,
  type Entrant,
} from "./bracket";
import { bracketNames } from "./players";

interface MatchRow {
  id: string;
  event_slug: string;
  division_id: string;
  round: number;
  position: number;
  home_id: string | null;
  away_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  station: number | null;
  feeds_into: string | null;
  updated_at: string;
}

function toMatch(r: MatchRow): Match {
  return {
    id: r.id,
    round: r.round,
    position: r.position,
    homeId: r.home_id,
    awayId: r.away_id,
    homeScore: r.home_score,
    awayScore: r.away_score,
    status: r.status as Match["status"],
    station: r.station,
    feedsInto: r.feeds_into,
  };
}

/**
 * A version derived from the CONTENT, not from a timestamp.
 *
 * The first attempt was `max(updated_at)#rowCount`, and it was wrong in two ways that a
 * test found before the event did:
 *
 *   1. Two changes inside the same millisecond produced the same version, so the second
 *      one never reached the screen. Rare by hand, certain in a test, and exactly the
 *      class of bug that only shows up when the room is watching.
 *   2. It ignored the NAMES, which are not stored on a match. A moderator correcting a
 *      handle on /admin — the whole reason names are read live — changed nothing the
 *      television could notice, so the projector would have kept showing the name that
 *      needed correcting.
 *
 * Hashing what is actually rendered fixes both by construction. FNV-1a, 32-bit: not a
 * security hash and not trying to be — a collision costs one skipped redraw a few seconds
 * before the next poll.
 */
function versionOf(matches: Match[], names: Record<string, string>): string {
  const parts = matches
    .map(
      (m) =>
        `${m.id}:${m.homeId ?? ""}:${m.awayId ?? ""}:${m.homeScore ?? ""}:${m.awayScore ?? ""}:${m.status}:${m.station ?? ""}`,
    )
    .concat(Object.entries(names).map(([id, n]) => `${id}=${n}`))
    .join("|");

  let hash = 0x811c9dc5;
  for (let i = 0; i < parts.length; i++) {
    hash ^= parts.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${matches.length}-${(hash >>> 0).toString(36)}`;
}

export interface StoredBracket {
  bracket: KnockoutBracket;
  /** Player id → the name to show. Read live, never stored on the match. */
  names: Record<string, string>;
  /**
   * Changes when anything on the screen would change. The TV compares this to what it
   * last drew and only re-renders when it differs, so a quiet afternoon costs one query
   * per poll and no layout work.
   */
  version: string;
}

/**
 * Read the stored bracket for an event, or null if none has been generated.
 *
 * `divisionId` is not a parameter: every event so far runs one open division, and a
 * multi-division event needs a bracket per division on the screen, which is a layout
 * decision rather than a query one. When that happens, group by `division_id` here.
 */
export async function storedBracket(
  eventSlug: string,
  divisionName = "Open",
): Promise<StoredBracket | null> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT * FROM matches WHERE event_slug = ? ORDER BY round, position`,
    )
    .bind(eventSlug)
    .all<MatchRow>();

  if (results.length === 0) return null;

  const matches = results.map(toMatch);
  const rounds = Math.max(...matches.map((m) => m.round)) + 1;

  /**
   * Names for everyone still on the board — read from the same function the moderator's
   * name-review list uses, so the projector and the review can never disagree.
   */
  const entrants = await bracketNames(eventSlug);
  const names: Record<string, string> = {};
  for (const e of entrants) names[e.playerId] = e.handle;

  return {
    bracket: {
      divisionId: results[0].division_id,
      divisionName,
      rounds,
      matches,
    },
    names,
    version: versionOf(matches, names),
  };
}

/**
 * Build the bracket from the players who actually have places.
 *
 * Seeded by the order `bracketNames` returns, which is alphabetical by handle. That is
 * deliberate and it is not a ranking: the self-rating on the form is used for nothing
 * here, because seeding 64 strangers by how good they say they are produces a first round
 * of walkovers and a hall full of people who lost to somebody twice their level. A draw
 * that is arbitrary is fairer than one that pretends to know.
 *
 * Refuses to overwrite a bracket that has scores in it — regenerating mid-event would
 * erase results in front of the room. Clearing it first is a separate, deliberate act.
 */
export async function generateBracket(
  eventSlug: string,
  divisionId: string,
  divisionName: string,
): Promise<{ ok: true; matches: number } | { ok: false; error: string }> {
  const db = await getDb();

  const { results: played } = await db
    .prepare(
      `SELECT id FROM matches
        WHERE event_slug = ? AND (home_score IS NOT NULL OR away_score IS NOT NULL)`,
    )
    .bind(eventSlug)
    .all<{ id: string }>();
  if (played.length > 0) {
    return {
      ok: false,
      error: `${played.length} match${played.length === 1 ? " has" : "es have"} a score already. Clear the bracket first if you really mean to start again.`,
    };
  }

  const entrants: Entrant[] = (await bracketNames(eventSlug)).map((e, i) => ({
    id: e.playerId,
    name: e.handle,
    seed: i + 1,
  }));
  if (entrants.length < 2) {
    return {
      ok: false,
      error: "Fewer than two players have places. Run the draw first.",
    };
  }

  // Byes are resolved before anything is stored, so the first round on the screen is
  // already correct for a field that is not a power of two.
  const bracket = advanceWinners(generateKnockout(divisionId, divisionName, entrants));
  const now = new Date().toISOString();

  await db.prepare("DELETE FROM matches WHERE event_slug = ?").bind(eventSlug).run();
  for (const m of bracket.matches) {
    await db
      .prepare(
        `INSERT INTO matches
           (id, event_slug, division_id, round, position, home_id, away_id,
            home_score, away_score, status, station, feeds_into, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'pending', NULL, ?, ?)`,
      )
      .bind(
        `${eventSlug}-${m.id}`,
        eventSlug,
        divisionId,
        m.round,
        m.position,
        m.homeId,
        m.awayId,
        m.feedsInto ? `${eventSlug}-${m.feedsInto}` : null,
        now,
      )
      .run();
  }

  return { ok: true, matches: bracket.matches.length };
}

/** Remove the bracket entirely. Separate from generating one, so it is never a side effect. */
export async function clearBracket(eventSlug: string): Promise<number> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT id FROM matches WHERE event_slug = ?")
    .bind(eventSlug)
    .all<{ id: string }>();
  await db.prepare("DELETE FROM matches WHERE event_slug = ?").bind(eventSlug).run();
  return results.length;
}

/**
 * Record a score and push the winner forward.
 *
 * Advancement is recomputed from the whole stored bracket with `advanceWinners`, the same
 * pure function the preview uses, rather than by writing the winner into the next match
 * directly. That matters for the case that actually happens on the day: a score entered
 * wrongly and corrected two minutes later. Recomputing puts the right player in the next
 * round; writing forward would leave the wrong one there.
 */
export async function recordScore(
  eventSlug: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return { ok: false, error: "Scores must be whole numbers." };
  }
  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    return { ok: false, error: "That is not a football score." };
  }
  if (homeScore === awayScore) {
    return {
      ok: false,
      error:
        "A knockout match cannot end level — enter the score after extra time or penalties.",
    };
  }

  const db = await getDb();
  const stored = await storedBracket(eventSlug);
  if (!stored) return { ok: false, error: "No bracket has been generated yet." };

  const match = stored.bracket.matches.find((m) => m.id === matchId);
  if (!match) return { ok: false, error: "No such match." };
  if (!match.homeId || !match.awayId) {
    return { ok: false, error: "Both players have to be known before a score." };
  }

  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE matches SET home_score = ?, away_score = ?, status = 'complete', updated_at = ?
        WHERE id = ?`,
    )
    .bind(homeScore, awayScore, now, matchId)
    .run();

  // Recompute the whole board and persist only the slots that moved.
  const fresh = await storedBracket(eventSlug);
  if (!fresh) return { ok: true };
  const advanced = advanceWinners(fresh.bracket);
  for (const m of advanced.matches) {
    const before = fresh.bracket.matches.find((x) => x.id === m.id);
    if (!before) continue;
    if (before.homeId === m.homeId && before.awayId === m.awayId) continue;
    await db
      .prepare("UPDATE matches SET home_id = ?, away_id = ?, updated_at = ? WHERE id = ?")
      .bind(m.homeId, m.awayId, now, m.id)
      .run();
  }

  return { ok: true };
}
