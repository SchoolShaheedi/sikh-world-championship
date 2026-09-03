/**
 * A draw run by somebody else.
 *
 * WHY (2026-09-03, team decision): places are to be drawn by an outside random service so
 * the draw can be WITNESSED rather than trusted. `src/lib/draw.ts` is still here and still
 * honest — every seeded draw is recomputable from its stored seed — but "you can recompute
 * it from a seed" is an argument that convinces a developer and not a hall full of parents.
 *
 * THE THREE STEPS, AND WHY THE ORDER IS THE WHOLE POINT:
 *
 *   1. LOCK THE LIST. Every applicant is given a number, and the mapping from number to
 *      person is written down with the moderator and the moment. Nothing else can happen
 *      until this exists.
 *   2. THE DRAW HAPPENS ELSEWHERE. The service is handed the numbers 1..N.
 *   3. PASTE THE NUMBERS BACK. They resolve against a mapping that provably could not have
 *      moved, because it was recorded first.
 *
 * A number drawn against a mapping invented afterwards is worth nothing at all — it is the
 * same as picking the winners by hand and writing down some numbers. The locking step is
 * not administrative tidiness; it is the entire audit.
 *
 * NO PERSONAL DATA LEAVES US. The service gets integers. No names, no ages, no references.
 * That means no processor agreement, no children's names sitting in somebody else's logs,
 * and a picker that could not favour a name if it wanted to. `draw_ballots` holds
 * registration ids only, the same rule as `matches`.
 *
 * THERE IS ONLY EVER ONE LIST TO HAND OVER. Referred applicants take priority for every
 * place, so while there is room they get one with no draw at all — which means at most one
 * pool is ever PARTLY filled, and that is the only pool a draw is needed for. Either the
 * referred pool fits and the general pool is drawn, or the referred pool does not fit and
 * it is drawn while the general pool gets nothing. Never both.
 */
import crypto from "node:crypto";
import { getDb } from "./db";
import { applicantsFor, selectedCount } from "./store";
import { isReferred } from "@/data/referral-orgs";
import type { Registration } from "./types";

export type Pool = "referred" | "general";

export interface BallotEntry {
  number: number;
  reference: string;
  fullName: string;
  /** False once an applicant has withdrawn or been decided since the list was locked. */
  stillApplied: boolean;
}

export interface Ballot {
  listId: string;
  lockedAt: string;
  /** Which pool the numbered list is for — the only pool that needs drawing. */
  pool: Pool;
  /** How many places the numbers are competing for. */
  places: number;
  /** Referred applicants who get a place with no draw needed. Empty when pool is referred. */
  automatic: BallotEntry[];
  /** The numbered list. The numbers, and only the numbers, go to the draw service. */
  entries: BallotEntry[];
  /**
   * Applicants who arrived AFTER the list was locked and are therefore not in it.
   *
   * Surfaced rather than silently ignored: a locked list going stale is the normal
   * consequence of leaving entries open, and a moderator has to choose between drawing
   * from the list they published and re-locking to include everyone.
   */
  appliedSinceLock: number;
}

/** How the pools divide, given the places actually left. Pure, so it can be tested alone. */
export function splitPools(
  applicants: Registration[],
  placesLeft: number,
): { pool: Pool; places: number; automatic: Registration[]; entries: Registration[] } {
  const referred = applicants.filter((r) => isReferred(r.answers.referralOrg as string));
  const general = applicants.filter((r) => !isReferred(r.answers.referralOrg as string));

  if (referred.length <= placesLeft) {
    // Every referred applicant fits, so only the general pool is contested.
    return {
      pool: "general",
      places: Math.max(0, placesLeft - referred.length),
      automatic: referred,
      entries: general,
    };
  }
  // More referred applicants than places: they are the contested pool and the general pool
  // is not drawn at all. Saying so is better than handing over a list that cannot win.
  return { pool: "referred", places: placesLeft, automatic: [], entries: referred };
}

/**
 * Fix the numbering, and record it.
 *
 * Numbered in application order rather than shuffled. There is no advantage to a position
 * in the list — the randomness comes from the draw service — and an order somebody can
 * check against the entry list is one less thing to have to take on trust.
 *
 * Locking again replaces the previous list. Deliberate: a list locked before another twenty
 * people applied is a list a moderator may well want to redo, and refusing would send them
 * to the database. The replaced list disappears, which is safe because a list that was
 * actually USED is referenced by a `draws` row and that row keeps the numbers pasted
 * against it.
 */
export async function lockBallot(
  eventSlug: string,
  capacity: number,
  byPlayerId: string,
): Promise<{ ok: true; listId: string; entries: number } | { ok: false; error: string }> {
  const applicants = await applicantsFor(eventSlug);
  if (applicants.length === 0) {
    return { ok: false, error: "Nobody is awaiting a decision, so there is nothing to draw." };
  }
  const placesLeft = Math.max(0, capacity - (await selectedCount(eventSlug)));
  if (placesLeft === 0) {
    return { ok: false, error: "Every place is already taken." };
  }

  const { pool, automatic, entries } = splitPools(applicants, placesLeft);
  const listId = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = await getDb();

  await db.prepare("DELETE FROM draw_ballots WHERE event_slug = ?").bind(eventSlug).run();

  const rows = [
    ...automatic.map((r, i) => ({ pool: "referred" as Pool, n: i + 1, id: r.id, auto: 1 })),
    ...entries.map((r, i) => ({ pool, n: i + 1, id: r.id, auto: 0 })),
  ];
  // One batch, so a half-written list cannot exist. A list missing rows would map numbers
  // to the wrong people, which is the one failure this whole module is built to prevent.
  await db.batch(
    rows.map((r) =>
      db
        .prepare(
          `INSERT INTO draw_ballots
             (list_id, event_slug, pool, number, registration_id, auto, locked_at, locked_by)
           VALUES (?,?,?,?,?,?,?,?)`,
        )
        .bind(listId, eventSlug, r.pool, r.n, r.id, r.auto, now, byPlayerId),
    ),
  );

  return { ok: true, listId, entries: entries.length };
}

/** Throw the list away without drawing. */
export async function clearBallot(eventSlug: string): Promise<number> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT number FROM draw_ballots WHERE event_slug = ?")
    .bind(eventSlug)
    .all<{ number: number }>();
  await db.prepare("DELETE FROM draw_ballots WHERE event_slug = ?").bind(eventSlug).run();
  return results.length;
}

/** The locked list as it stands now, or null if none has been locked. */
export async function currentBallot(
  eventSlug: string,
  capacity: number,
): Promise<Ballot | null> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT b.list_id, b.pool, b.number, b.auto, b.locked_at,
              r.reference, r.full_name, r.status
         FROM draw_ballots b
         JOIN registrations r ON r.id = b.registration_id
        WHERE b.event_slug = ?
        ORDER BY b.auto DESC, b.number`,
    )
    .bind(eventSlug)
    .all<{
      list_id: string;
      pool: Pool;
      number: number;
      auto: number;
      locked_at: string;
      reference: string;
      full_name: string;
      status: string;
    }>();
  if (results.length === 0) return null;

  const toEntry = (r: (typeof results)[number]): BallotEntry => ({
    number: r.number,
    reference: r.reference,
    fullName: r.full_name,
    stillApplied: r.status === "applied",
  });

  const automatic = results.filter((r) => r.auto === 1).map(toEntry);
  const drawn = results.filter((r) => r.auto === 0);
  const placesLeft = Math.max(0, capacity - (await selectedCount(eventSlug)));

  const applicants = await applicantsFor(eventSlug);
  const inList = new Set(results.map((r) => r.reference));
  const appliedSinceLock = applicants.filter((r) => !inList.has(r.reference)).length;

  return {
    listId: results[0].list_id,
    lockedAt: results[0].locked_at,
    pool: drawn[0]?.pool ?? "general",
    places: Math.max(0, placesLeft - automatic.length),
    automatic,
    entries: drawn.map(toEntry),
    appliedSinceLock,
  };
}

export interface ParsedWinners {
  numbers: number[];
  /** Sentences to put in front of a moderator. Non-empty means do not commit. */
  problems: string[];
  /** Worth saying, but not a reason to stop. */
  warnings: string[];
}

/**
 * Read the numbers a draw service gave back.
 *
 * DELIBERATELY FORGIVING ABOUT FORMAT. Every service returns something different — commas,
 * newlines, a wall of text with the numbers in it — and the moderator doing this is copying
 * out of a browser tab in front of an audience. Anything that is not a digit is a separator.
 *
 * DELIBERATELY UNFORGIVING ABOUT CONTENT. A duplicate, a number nobody was given, or more
 * winners than there are places all stop the commit with a sentence, because each one means
 * the paste does not say what the person pasting it thinks it says.
 *
 * THE ONE TRAP, FOUND BY A TEST BEFORE IT WAS FOUND BY A DRAW. A service that returns a
 * NUMBERED list — "1. 5 / 2. 8 / 3. 12" — hands us the list positions as well as the
 * winners, and 1, 2 and 3 are perfectly valid entry numbers. Stripping ordinals by pattern
 * was the obvious fix and is the wrong one: it means guessing which digits the moderator
 * meant, and guessing wrong here gives a place to the wrong child.
 *
 * It is caught by arithmetic instead, which cannot be fooled: a numbered list of k winners
 * always yields 2k numbers, and 2k is always more than k, so the count check below refuses
 * it every time. What was missing was not safety but a useful sentence, so the over-count
 * problem now names this cause — a moderator seeing "6 winners for 3 places" in front of an
 * audience needs to know why, not just that.
 */
export function parseWinners(raw: string, max: number, places: number): ParsedWinners {
  const problems: string[] = [];
  const warnings: string[] = [];

  const found = (raw.match(/\d+/g) ?? []).map(Number);
  if (found.length === 0) {
    return { numbers: [], problems: ["No numbers in that. Paste the winning numbers."], warnings };
  }

  const seen = new Set<number>();
  const duplicates = new Set<number>();
  const outOfRange = new Set<number>();
  const numbers: number[] = [];

  for (const n of found) {
    if (n < 1 || n > max) {
      outOfRange.add(n);
      continue;
    }
    if (seen.has(n)) {
      duplicates.add(n);
      continue;
    }
    seen.add(n);
    numbers.push(n);
  }

  if (outOfRange.size > 0) {
    problems.push(
      `${[...outOfRange].join(", ")} ${outOfRange.size === 1 ? "is not a number" : "are not numbers"} ` +
        `on the list — it only goes up to ${max}.`,
    );
  }
  if (duplicates.size > 0) {
    problems.push(
      `${[...duplicates].join(", ")} appear${duplicates.size === 1 ? "s" : ""} more than once.`,
    );
  }
  if (numbers.length > places) {
    problems.push(
      `That is ${numbers.length} winners for ${places} place${places === 1 ? "" : "s"}. ` +
        `If you pasted a numbered list — "1. 5", "2. 8" — the list positions have been read ` +
        `as winners too. Paste just the drawn numbers.`,
    );
  } else if (numbers.length < places) {
    warnings.push(
      `${numbers.length} winner${numbers.length === 1 ? "" : "s"} for ` +
        `${places} places — ${places - numbers.length} will be left unfilled. ` +
        `Fine if you are drawing in stages.`,
    );
  }

  return { numbers, problems, warnings };
}

export interface ExternalDrawPlan {
  /** Everyone who would get a place: the automatic ones plus the drawn ones. */
  selected: Registration[];
  /** In the list, drawn, but no longer awaiting a decision — skipped, and said out loud. */
  skipped: { number: number; reference: string; fullName: string; status: string }[];
  automaticCount: number;
  drawnCount: number;
}

/**
 * Work out who the numbers mean, without changing anything.
 *
 * The skipped list matters more than it looks. Somebody can withdraw between the list being
 * locked and the numbers coming back, and their number can still be drawn — at which point
 * a place would go to a person who is not coming and a real applicant would miss out
 * silently. So it is reported, and the places it frees can be drawn again.
 */
export async function planExternalDraw(
  eventSlug: string,
  numbers: number[],
): Promise<ExternalDrawPlan> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT b.number, b.auto, b.registration_id, r.reference, r.full_name, r.status
         FROM draw_ballots b
         JOIN registrations r ON r.id = b.registration_id
        WHERE b.event_slug = ? AND b.auto = 0
        ORDER BY b.number`,
    )
    .bind(eventSlug)
    .all<{
      number: number;
      registration_id: string;
      reference: string;
      full_name: string;
      status: string;
    }>();

  const byNumber = new Map(results.map((r) => [r.number, r]));
  const applicants = await applicantsFor(eventSlug);
  const byId = new Map(applicants.map((r) => [r.id, r]));

  const drawn: Registration[] = [];
  const skipped: ExternalDrawPlan["skipped"] = [];
  for (const n of numbers) {
    const row = byNumber.get(n);
    if (!row) continue;
    const reg = byId.get(row.registration_id);
    if (!reg) {
      skipped.push({
        number: n,
        reference: row.reference,
        fullName: row.full_name,
        status: row.status,
      });
      continue;
    }
    drawn.push(reg);
  }

  const { results: autoRows } = await db
    .prepare(
      `SELECT registration_id FROM draw_ballots
        WHERE event_slug = ? AND auto = 1 ORDER BY number`,
    )
    .bind(eventSlug)
    .all<{ registration_id: string }>();
  const automatic = autoRows
    .map((r) => byId.get(r.registration_id))
    .filter((r): r is Registration => !!r);

  return {
    selected: [...automatic, ...drawn],
    skipped,
    automaticCount: automatic.length,
    drawnCount: drawn.length,
  };
}

/**
 * Make it real.
 *
 * Records the draw before marking anybody, so a failure halfway leaves evidence of what was
 * attempted rather than a set of selections with no draw behind them. `seed` is the string
 * 'external' because there is no seed — we did not generate the randomness. What stands in
 * its place is `winners`, stored EXACTLY as pasted: a tidied copy would be our reading of
 * the evidence rather than the evidence.
 */
export async function commitExternalDraw(
  eventSlug: string,
  input: { service: string; rawWinners: string; numbers: number[]; note?: string },
): Promise<{ drawId: string; plan: ExternalDrawPlan }> {
  const db = await getDb();
  const plan = await planExternalDraw(eventSlug, input.numbers);

  const listRow = await db
    .prepare("SELECT list_id, pool FROM draw_ballots WHERE event_slug = ? AND auto = 0 LIMIT 1")
    .bind(eventSlug)
    .first<{ list_id: string; pool: string }>();

  const drawId = crypto.randomUUID();
  const ranAt = new Date().toISOString();
  const applicants = await applicantsFor(eventSlug);

  await db
    .prepare(
      `INSERT INTO draws (id, event_slug, ran_at, seed, places, applicants,
                          referred_taken, general_taken, note,
                          method, service, winners, ballot_list, drawn_pool)
       VALUES (?,?,?, 'external', ?,?,?,?,?, 'external', ?,?,?,?)`,
    )
    .bind(
      drawId,
      eventSlug,
      ranAt,
      plan.selected.length,
      applicants.length,
      plan.automaticCount + (listRow?.pool === "referred" ? plan.drawnCount : 0),
      listRow?.pool === "general" ? plan.drawnCount : 0,
      input.note ?? null,
      input.service,
      input.rawWinners,
      listRow?.list_id ?? null,
      listRow?.pool ?? null,
    )
    .run();

  for (const r of plan.selected) {
    await db
      .prepare(
        "UPDATE registrations SET status = 'selected', decided_at = ?, draw_id = ? WHERE id = ?",
      )
      .bind(ranAt, drawId, r.id)
      .run();
  }

  return { drawId, plan };
}
