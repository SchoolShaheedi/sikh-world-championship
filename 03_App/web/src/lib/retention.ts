/**
 * Applying the retention policy.
 *
 * 04_Legal/RETENTION-POLICY.md sets different lifetimes for different parts of the same
 * registration. This is the code that enforces them. Until it ran, the policy was a
 * document rather than a control, and DPIA risk #8 ("data kept indefinitely") stayed open.
 *
 * TWO RULES THAT MATTER MORE THAN THE REST:
 *
 *  1. Everything is anchored to the EVENT DATE, never to "now" or to when a row was
 *     created. A registration's medical notes exist for the event; the clock starts when
 *     the event happens.
 *  2. An event with no confirmed date is SKIPPED, loudly. Guessing a date here would mean
 *     deleting a child's medical details before the first aider has read them, or holding
 *     them long past the policy. Neither failure is acceptable, so the job refuses to
 *     assume and says so in the audit trail.
 */
import crypto from "node:crypto";
import { getDb } from "./db";
import { purgeMedical, clearCheckInTokens } from "./store";
import { EVENTS } from "@/data/events";

/**
 * Days after the event before special-category data is deleted.
 * Proposed in RETENTION-POLICY.md; change it there and here together.
 */
export const MEDICAL_RETENTION_DAYS = 30;

/**
 * Check-in tokens are live credentials — holding one past the day it can be used is pure
 * risk. One day's grace covers a late finish and a volunteer reconciling the desk.
 */
export const CHECK_IN_TOKEN_RETENTION_DAYS = 1;

export interface RetentionAction {
  eventSlug: string;
  action: "purge-medical" | "clear-check-in-tokens";
  rowsAffected: number;
  note: string;
}

export interface RetentionReport {
  ranAt: string;
  actions: RetentionAction[];
  skipped: { eventSlug: string; reason: string }[];
}

function daysSince(dateIso: string, now: Date): number {
  return (now.getTime() - new Date(dateIso).getTime()) / 864e5;
}

async function record(a: RetentionAction, ranAt: string): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
       VALUES (?,?,?,?,?,?)`,
    )
    .bind(crypto.randomUUID(), ranAt, a.eventSlug, a.action, a.rowsAffected, a.note)
    .run();
}

/**
 * Apply the policy across every event.
 *
 * Safe to run repeatedly: `purgeMedical` only touches rows not already purged, and an
 * already-cleared token column is simply set to NULL again. A daily cron is the intended
 * cadence.
 *
 * `now` is injectable so the tests can age an event without waiting a month.
 */
export async function applyRetention(now: Date = new Date()): Promise<RetentionReport> {
  const ranAt = now.toISOString();
  const actions: RetentionAction[] = [];
  const skipped: { eventSlug: string; reason: string }[] = [];

  for (const event of EVENTS) {
    if (!event.date) {
      // Deliberately loud. An undated event is a configuration gap, not a quiet no-op —
      // and the day someone sets a date, this stops appearing and the purges begin.
      skipped.push({
        eventSlug: event.slug,
        reason: "No event date set, so nothing can be measured from. Nothing deleted.",
      });
      continue;
    }

    const age = daysSince(event.date, now);

    if (age >= MEDICAL_RETENTION_DAYS) {
      const rows = await purgeMedical(event.slug);
      if (rows > 0) {
        const a: RetentionAction = {
          eventSlug: event.slug,
          action: "purge-medical",
          rowsAffected: rows,
          note: `${Math.floor(age)} days after the event (policy: ${MEDICAL_RETENTION_DAYS}).`,
        };
        actions.push(a);
        await record(a, ranAt);
      }
    }

    if (age >= CHECK_IN_TOKEN_RETENTION_DAYS) {
      await clearCheckInTokens(event.slug);
      // Recorded even at zero rows: "we checked and there was nothing left" is itself
      // worth being able to show.
      const a: RetentionAction = {
        eventSlug: event.slug,
        action: "clear-check-in-tokens",
        rowsAffected: 0,
        note: `${Math.floor(age)} days after the event (policy: ${CHECK_IN_TOKEN_RETENTION_DAYS}).`,
      };
      actions.push(a);
      await record(a, ranAt);
    }
  }

  return { ranAt, actions, skipped };
}
