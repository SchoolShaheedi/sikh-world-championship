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
import { deleteAccount } from "./account-delete";
import { PLATFORM_SCOPE as SCOPE } from "./retention-scope";

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

/**
 * Months of no activity before a profile that never attended an event is deleted.
 *
 * Signed off in round 44 and written into RETENTION-POLICY.md. It is the one duration in
 * this file that is NOT anchored to an event date, and that is exactly why it had to be
 * decided: round 42 began creating a profile for everyone who registers interest, so the
 * project now holds accounts for children with no event to measure from. Without a rule
 * they would be held forever, and "we never decided" defaults to keeping a child's data
 * indefinitely. DPIA risk 13.
 */
export const DORMANT_PROFILE_RETENTION_MONTHS = 24;

/**
 * Months after the event before the registration itself is deleted.
 *
 * DECIDED 2026-08-31 (round 46), and the last duration in RETENTION-POLICY.md that was
 * still in brackets. Until it was set, NOTHING deleted a registration: the medical fields
 * went at 30 days and the check-in token the day after, but the applicant's name, date of
 * birth, email and mobile — most of them children's — were held with no end date. That was
 * DPIA risk 14, and the largest storage-limitation gap in the project.
 *
 * Twelve months is long enough to answer "was I there?", settle a dispute and plan the
 * next event from real numbers, and short enough that a child who applied once and never
 * came back is not on file when the second event runs.
 *
 * ONE EXEMPTION, and it is the same one everywhere else in this file: a registration whose
 * applicant is named on a report, or on a safety support ticket, is kept — those records
 * run six years, and a safeguarding record whose subject's details have been deleted
 * cannot be acted on.
 */
export const REGISTRATION_RETENTION_MONTHS = 12;

/**
 * Re-exported so existing callers (and the admin page) keep one import site. The constant
 * itself lives in `retention-scope.ts` — see the note there.
 */
export { PLATFORM_SCOPE } from "./retention-scope";

export interface RetentionAction {
  eventSlug: string;
  action:
    | "purge-medical"
    | "clear-check-in-tokens"
    | "purge-dormant-profiles"
    | "purge-registrations";
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

/**
 * `now` shifted back by whole calendar months.
 *
 * Calendar months rather than 730 days because the policy is written in months and a
 * parent asking "you said two years" should get an answer that matches a calendar.
 */
function monthsBefore(now: Date, months: number): string {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
}

/**
 * The SQL behind the dormant-profile rule, shared by the purge and the admin preview so
 * the number a moderator sees is produced by the same query that does the deleting.
 *
 * WHAT COUNTS AS ACTIVITY: the latest of account creation, last sign-in, and the most
 * recent registration of interest. All three, because any one alone gets it wrong —
 * `created_at` alone would delete somebody who signs in monthly, and `last_seen_at` alone
 * would delete somebody who registered for an event last week without signing in again.
 *
 * FOUR EXEMPTIONS, each for a reason worth stating:
 *
 *  1. `is_moderator` — a staff account is not a dormant child's profile, and deleting one
 *     silently removes someone's access to the safeguarding queue.
 *  2. `event_verified`, and any registration checked in — somebody who ATTENDED is out of
 *     scope entirely. This rule exists for the profile with no event behind it.
 *  3. Named in a report, as reporter or as subject — safeguarding records are kept for six
 *     years (RETENTION-POLICY.md) and a record whose subject has been deleted is a record
 *     that cannot be acted on. Deleting it early is the classic safeguarding failure.
 *  4. Named on a support ticket — same reasoning; a safety ticket is a safeguarding record.
 */
const DORMANT_WHERE = `
  FROM players p
 WHERE p.is_moderator = 0
   AND p.event_verified = 0
   AND NOT EXISTS (SELECT 1 FROM registrations r
                    WHERE r.player_id = p.id AND r.status = 'checked-in')
   AND NOT EXISTS (SELECT 1 FROM reports rep
                    WHERE rep.reporter_id = p.id OR rep.target_player_id = p.id)
   AND NOT EXISTS (SELECT 1 FROM support_tickets t WHERE t.player_id = p.id)
   AND MAX(
         p.created_at,
         COALESCE(p.last_seen_at, p.created_at),
         COALESCE((SELECT MAX(r2.created_at) FROM registrations r2
                    WHERE r2.player_id = p.id), p.created_at)
       ) < ?`;


/**
 * Delete profiles that never attended an event and have been untouched for the policy
 * period. Returns the number deleted.
 *
 * Deletes by id in a loop rather than one big `DELETE ... WHERE id IN (subquery)`, because
 * each player fans out across seven statements and doing it per-player keeps the set the
 * cascade operates on identical to the set that was selected.
 */
export async function purgeDormantProfiles(now: Date = new Date()): Promise<number> {
  const db = await getDb();
  const cutoff = monthsBefore(now, DORMANT_PROFILE_RETENTION_MONTHS);
  const { results } = await db
    .prepare(`SELECT p.id ${DORMANT_WHERE}`)
    .bind(cutoff)
    .all<{ id: string }>();

  for (const { id } of results) {
    /**
     * `deleteRegistrations: false` is the whole distinction between this job and the
     * delete button in /admin. The registration has its own period, measured from the
     * event, and it is the record of who applied — so the link goes and the row stays.
     * Worth being honest that the row still holds the applicant's name, date of birth
     * and email; the rule that would delete those is not built yet (DPIA risk 14).
     */
    await deleteAccount(id, {
      deleteRegistrations: false,
      reason: `Dormant profile: no attended event and no activity for ${DORMANT_PROFILE_RETENTION_MONTHS} months.`,
    });
  }
  return results.length;
}

/**
 * Delete the registrations for an event whose retention period has passed.
 *
 * This is a whole-row delete, not a field purge like `purgeMedical`. The row IS the
 * personal data: name, date of birth, email, mobile, the guardian's name and contact, and
 * the answers. There is nothing left worth keeping once the period is up — the numbers
 * that matter for planning the next event (how many applied, how many were drawn, how many
 * turned up) belong in aggregate form, not in 64 rows holding children's contact details.
 *
 * KEPT BACK, and this is the whole subtlety of the query: a registration whose applicant is
 * named on a report, or on a safety support ticket, is not deleted. Those records run six
 * years and a safeguarding concern about somebody whose details have been erased cannot be
 * investigated. It is the same exemption `purgeDormantProfiles` and the admin delete button
 * apply, expressed against the registration instead of the account.
 *
 * A registration with no `player_id` — the retention job nulls the link when it deletes a
 * dormant profile — is deleted normally. It cannot be safeguarding-linked, because a
 * profile named on a report is never purged in the first place.
 */
export async function purgeRegistrations(eventSlug: string): Promise<number> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT r.id FROM registrations r
        WHERE r.event_slug = ?
          AND NOT EXISTS (SELECT 1 FROM reports rep
                           WHERE rep.reporter_id = r.player_id
                              OR rep.target_player_id = r.player_id)
          AND NOT EXISTS (SELECT 1 FROM support_tickets t
                           WHERE t.player_id = r.player_id AND t.category = 'safety')`,
    )
    .bind(eventSlug)
    .all<{ id: string }>();

  // One at a time, and counted from the SELECT above: `run()` does not report a row count
  // portably across D1 and node:sqlite (see db.ts), and a deletion job that cannot say how
  // many rows it deleted is not an audit trail.
  for (const { id } of results) {
    await db.prepare("DELETE FROM registrations WHERE id = ?").bind(id).run();
  }
  return results.length;
}

export interface DormancySnapshot {
  /** Every profile on the platform, including moderators and people who attended. */
  profiles: number;
  /** In scope of this rule: no attendance, no safeguarding record. */
  inScope: number;
  /** Past the policy period right now. Should be zero the day after a run. */
  dueNow: number;
  /** Will pass it within 90 days, so a moderator sees it coming rather than after. */
  dueWithin90Days: number;
  /** Total ever deleted by this rule, from the audit trail. */
  deletedAllTime: number;
  lastRunAt: string | null;
}

/**
 * Numbers for the admin panel.
 *
 * The point of showing this is that a silent deletion job is indistinguishable from one
 * that has stopped working. `dueWithin90Days` is the useful column: it is the only one
 * that is ever non-zero on a healthy system, and it is what lets somebody notice the rule
 * is about to delete accounts before it does.
 */
export async function dormancySnapshot(now: Date = new Date()): Promise<DormancySnapshot> {
  const db = await getDb();
  const cutoff = monthsBefore(now, DORMANT_PROFILE_RETENTION_MONTHS);
  const soon = monthsBefore(
    new Date(now.getTime() + 90 * 864e5),
    DORMANT_PROFILE_RETENTION_MONTHS,
  );

  const count = async (sql: string, ...params: unknown[]) =>
    (await db.prepare(sql).bind(...params).first<{ n: number }>())?.n ?? 0;

  const [profiles, inScope, dueNow, dueSoon, deleted, last] = await Promise.all([
    count("SELECT COUNT(*) AS n FROM players"),
    // The same filter with a cutoff far in the future: everyone the rule could ever touch.
    count(`SELECT COUNT(*) AS n ${DORMANT_WHERE}`, "9999-12-31T00:00:00.000Z"),
    count(`SELECT COUNT(*) AS n ${DORMANT_WHERE}`, cutoff),
    count(`SELECT COUNT(*) AS n ${DORMANT_WHERE}`, soon),
    count(
      `SELECT COALESCE(SUM(rows_affected), 0) AS n FROM retention_runs
        WHERE action = 'purge-dormant-profiles'`,
    ),
    db
      .prepare(
        `SELECT MAX(ran_at) AS ran_at FROM retention_runs
          WHERE action = 'purge-dormant-profiles'`,
      )
      .first<{ ran_at: string | null }>(),
  ]);

  return {
    profiles,
    inScope,
    dueNow,
    // dueSoon includes anything already due; the panel wants "coming up", not a total.
    dueWithin90Days: Math.max(0, dueSoon - dueNow),
    deletedAllTime: deleted,
    lastRunAt: last?.ran_at ?? null,
  };
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
  // Computed once, outside the loop: every event is measured against the same instant.
  const registrationCutoff = monthsBefore(now, REGISTRATION_RETENTION_MONTHS);

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

    /**
     * The registration itself, 12 months after the event.
     *
     * Measured in calendar months against the event date, like the dormancy rule and for
     * the same reason: the policy is written in months, and a parent told "a year" should
     * get an answer that matches a calendar rather than 365 days of arithmetic.
     *
     * Recorded only when it actually deleted something. The token clear already proves the
     * job ran every night; a zero row per event per night for years would bury the entries
     * that matter under the ones that do not.
     */
    if (new Date(event.date).getTime() <= new Date(registrationCutoff).getTime()) {
      const rows = await purgeRegistrations(event.slug);
      if (rows > 0) {
        const a: RetentionAction = {
          eventSlug: event.slug,
          action: "purge-registrations",
          rowsAffected: rows,
          note:
            `${REGISTRATION_RETENTION_MONTHS} months after the event. Registrations ` +
            `linked to a report or a safety ticket were kept.`,
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

  /**
   * Not inside the event loop, and deliberately last.
   *
   * This is the one rule with no event behind it, so it runs once per job rather than once
   * per event. Recorded even at zero rows, for the same reason as the token clear: proving
   * the job ran is half the point of the audit trail.
   */
  const dormant = await purgeDormantProfiles(now);
  const a: RetentionAction = {
    eventSlug: SCOPE,
    action: "purge-dormant-profiles",
    rowsAffected: dormant,
    note:
      `Profiles with no attended event and no activity for ` +
      `${DORMANT_PROFILE_RETENTION_MONTHS} months.`,
  };
  actions.push(a);
  await record(a, ranAt);

  return { ranAt, actions, skipped };
}
