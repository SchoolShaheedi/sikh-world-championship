/**
 * The reminder that goes out in the week before the event.
 *
 * WHY IT EXISTS. `applicationOutcome` has told every selected player "we will email again
 * with the venue address and what to bring" since it was written, and nothing sent it.
 * A promise in an email to a child and their parent, kept by nobody.
 *
 * TWO EMAILS PER UNDER-18, NOT ONE WITH A CC. The guardian address comes from the
 * registration record and the child's does not (invariant 3), and the two people need
 * different sentences: the twelve-year-old does not need to be told they must be
 * collected — the person collecting them does.
 *
 * SAFE TO PRESS TWICE, AND IT WILL BE. The idempotency key is the reference, so a second
 * run after three drop-outs are backfilled emails the three and nobody else. `sendEmail`
 * reports `duplicate` for the rest, and this counts them separately so the panel can say
 * "12 sent, 48 already had it" rather than implying sixty emails just went out.
 *
 * NOT AUTOMATIC, ON PURPOSE. A cron job that emails everybody the venue address on a
 * fixed day cannot be told that the hall changed. A moderator presses this when the
 * details are right.
 */
import { getDb } from "./db";
import { registrationsFor } from "./store";
import { sendEmail } from "./email";
import { eventReminder, guardianEventReminder } from "./email-templates";
import { ageOnEventDay } from "./registration-schema";
import { venueAddressLine } from "./format";
import { GUARDIAN_PRESENCE_UNTIL } from "./guardian-rules";
import type { ChampionshipEvent } from "./types";

/** Everyone with a place — offered one, or already through the door. */
const HAS_PLACE = new Set(["selected", "checked-in"]);

export const REMINDER_KIND = "event-reminder";
export const GUARDIAN_REMINDER_KIND = "event-reminder-guardian";

export interface ReminderSummary {
  /** How many people have a place, i.e. the size of the audience. */
  withPlace: number;
  /** Reminders recorded as sent to players, from `email_sends`. */
  alreadySent: number;
  /** Guardian copies recorded as sent. */
  guardiansSent: number;
}

/**
 * What the panel shows before anybody presses anything.
 *
 * Counted from `email_sends` rather than a column on the registration, because that table
 * is already the record of what left the building and a second copy of the same fact is a
 * second thing to keep true.
 */
export async function reminderSummary(event: ChampionshipEvent): Promise<ReminderSummary> {
  const db = await getDb();
  const rows = await registrationsFor(event.slug);

  const counted = await db
    .prepare(
      `SELECT kind, COUNT(*) AS n FROM email_sends
        WHERE status = 'sent' AND kind IN (?, ?) GROUP BY kind`,
    )
    .bind(REMINDER_KIND, GUARDIAN_REMINDER_KIND)
    .all<{ kind: string; n: number }>();

  const by = new Map(counted.results.map((r) => [r.kind, r.n]));
  return {
    withPlace: rows.filter((r) => HAS_PLACE.has(r.status)).length,
    alreadySent: by.get(REMINDER_KIND) ?? 0,
    guardiansSent: by.get(GUARDIAN_REMINDER_KIND) ?? 0,
  };
}

export interface ReminderResult {
  sent: number;
  guardians: number;
  /** Already had it — not an error, and the usual case on a second run. */
  skipped: number;
  failed: number;
}

/**
 * Send it. Never throws: `sendEmail` records a failure and returns, because one bad
 * address must not stop the other sixty-three going out.
 */
export async function sendEventReminders(
  event: ChampionshipEvent,
): Promise<ReminderResult> {
  const rows = (await registrationsFor(event.slug)).filter((r) => HAS_PLACE.has(r.status));
  const venueAddress = venueAddressLine(event);
  const out: ReminderResult = { sent: 0, guardians: 0, skipped: 0, failed: 0 };

  for (const reg of rows) {
    const a = reg.answers;
    const fullName = String(a.fullName ?? "");
    const firstName = fullName.split(" ")[0] || fullName;
    const age = ageOnEventDay(String(a.dob), event.date);
    const under18 = age !== null && age < 18;
    const under16 = age !== null && age < GUARDIAN_PRESENCE_UNTIL;
    const mayLeave = a.mayLeaveUnaccompanied === true;

    const t = eventReminder({
      displayName: firstName,
      eventTitle: event.title,
      eventDate: event.date,
      times: event.times,
      venueName: event.venue?.name ?? null,
      venueAddress,
      mapsUrl: event.venue?.mapsUrl ?? null,
      reference: reg.reference,
      under16,
      under18,
      mayLeaveUnaccompanied: mayLeave,
    });
    const r = await sendEmail({
      kind: REMINDER_KIND,
      to: String(a.email),
      ...t,
      idempotencyKey: `${REMINDER_KIND}:${reg.reference}`,
    });
    if (r.duplicate) out.skipped += 1;
    else if (r.ok) out.sent += 1;
    else out.failed += 1;

    // The guardian copy. Only for an under-18, only from the registration record, and
    // only when there is an address on it — an adult entrant has no guardian block at all.
    const guardianEmail = under18 && typeof a.guardianEmail === "string" ? a.guardianEmail : null;
    if (!guardianEmail) continue;

    const g = guardianEventReminder({
      childName: firstName,
      eventTitle: event.title,
      eventDate: event.date,
      times: event.times,
      venueName: event.venue?.name ?? null,
      venueAddress,
      mapsUrl: event.venue?.mapsUrl ?? null,
      under16,
      mayLeaveUnaccompanied: mayLeave,
    });
    const gr = await sendEmail({
      kind: GUARDIAN_REMINDER_KIND,
      to: guardianEmail,
      ...g,
      idempotencyKey: `${GUARDIAN_REMINDER_KIND}:${reg.reference}`,
    });
    if (gr.duplicate) out.skipped += 1;
    else if (gr.ok) out.guardians += 1;
    else out.failed += 1;
  }

  return out;
}
