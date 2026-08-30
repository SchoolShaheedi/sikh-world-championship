/**
 * Selecting who gets a place.
 *
 * Referred applicants are drawn first; the remaining places are drawn from everyone else.
 * Both pools are shuffled at random — there is no scoring, no judgement of individuals,
 * and nothing that depends on who anyone is.
 *
 * WHY IT IS DESCRIBED AS TWO POOLS RATHER THAN "RANDOM":
 * a draw that gives referred applicants preference is not a random draw, it is a weighted
 * one, and a published policy that says otherwise is the kind of inaccuracy that gets
 * challenged. Two pools, each random within itself, is what actually happens and is what
 * the policy should say.
 *
 * SAFEGUARDING SURVIVES RANDOMISATION. Only applicants who already passed eligibility and
 * safeguarding are in the pools at all — "random instead of vetting" must never mean
 * drawing someone with a known concern.
 *
 * EVERY DRAW IS RECORDED WITH ITS SEED, so it can be recomputed and shown to be honest.
 * "How were places decided?" is a question a community event has to be able to answer
 * months later, and a process nobody can inspect is one nobody will trust.
 */
import crypto from "node:crypto";
import { getDb } from "./db";
import { applicantsFor, selectedCount } from "./store";
import { isReferred } from "@/data/referral-orgs";
import type { Registration } from "./types";

/**
 * Deterministic shuffle from a seed.
 *
 * Fisher–Yates, driven by a SHA-256 keystream rather than Math.random, so the same seed
 * always produces the same order. That is what makes the draw auditable: the seed is
 * stored, and anyone can recompute the result from it.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let counter = 0;
  let pool: number[] = [];

  const nextByte = (): number => {
    if (pool.length === 0) {
      const h = crypto.createHash("sha256").update(`${seed}:${counter++}`).digest();
      pool = Array.from(h);
    }
    return pool.shift()!;
  };

  // Rejection sampling keeps the distribution even; a plain modulo would bias the draw
  // towards lower indexes, which is exactly the sort of quiet unfairness this must avoid.
  const below = (n: number): number => {
    const limit = Math.floor(256 / n) * n;
    for (;;) {
      const b = nextByte();
      if (b < limit) return b % n;
    }
  };

  for (let i = out.length - 1; i > 0; i--) {
    const j = below(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface DrawResult {
  drawId: string;
  seed: string;
  places: number;
  applicants: number;
  referredTaken: number;
  generalTaken: number;
  selected: Registration[];
  notSelected: Registration[];
}

/**
 * Run the draw for an event.
 *
 * `dryRun` computes and returns the outcome without writing anything, so a draw can be
 * inspected before it is made real. Places already taken are subtracted, so this can be
 * re-run to backfill drop-outs without displacing anyone.
 */
export async function runDraw(
  eventSlug: string,
  capacity: number,
  opts: { seed?: string; dryRun?: boolean; note?: string } = {},
): Promise<DrawResult> {
  const seed = opts.seed ?? crypto.randomBytes(16).toString("hex");
  const applicants = await applicantsFor(eventSlug);
  const alreadyTaken = await selectedCount(eventSlug);
  const places = Math.max(0, capacity - alreadyTaken);

  const referred = applicants.filter((r) => isReferred(r.answers.referralOrg as string));
  const general = applicants.filter((r) => !isReferred(r.answers.referralOrg as string));

  // Distinct seeds per pool so the two draws are independent; deriving both from the one
  // recorded seed keeps the whole thing reproducible from a single value.
  const shuffledReferred = seededShuffle(referred, `${seed}:referred`);
  const shuffledGeneral = seededShuffle(general, `${seed}:general`);

  const takenReferred = shuffledReferred.slice(0, places);
  const takenGeneral = shuffledGeneral.slice(0, Math.max(0, places - takenReferred.length));

  const selected = [...takenReferred, ...takenGeneral];
  const selectedIds = new Set(selected.map((r) => r.id));
  const notSelected = applicants.filter((r) => !selectedIds.has(r.id));

  const result: DrawResult = {
    drawId: crypto.randomUUID(),
    seed,
    places,
    applicants: applicants.length,
    referredTaken: takenReferred.length,
    generalTaken: takenGeneral.length,
    selected,
    notSelected,
  };

  if (opts.dryRun) return result;

  const db = await getDb();
  const ranAt = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO draws (id, event_slug, ran_at, seed, places, applicants,
                          referred_taken, general_taken, note)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      result.drawId, eventSlug, ranAt, seed, places, applicants.length,
      takenReferred.length, takenGeneral.length, opts.note ?? null,
    )
    .run();

  // Only the drawn applications are marked. Everyone else stays 'applied' until a
  // decision is actually communicated — marking someone 'not-selected' before you have
  // told them is a state nobody can explain if they ring up.
  for (const r of selected) {
    await db
      .prepare(
        "UPDATE registrations SET status = 'selected', decided_at = ?, draw_id = ? WHERE id = ?",
      )
      .bind(ranAt, result.drawId, r.id)
      .run();
  }

  return result;
}

/**
 * Close the draw: everyone still 'applied' after places are filled becomes 'not-selected'.
 * Separate from `runDraw` so the two decisions — who gets in, and telling the rest — can
 * happen at different moments.
 */
export async function closeDraw(eventSlug: string, drawId: string): Promise<number> {
  const db = await getDb();
  const pending = await applicantsFor(eventSlug);
  const now = new Date().toISOString();
  for (const r of pending) {
    await db
      .prepare(
        "UPDATE registrations SET status = 'not-selected', decided_at = ?, draw_id = ? WHERE id = ?",
      )
      .bind(now, drawId, r.id)
      .run();
  }
  return pending.length;
}
