/**
 * The arrival desk.
 *
 * Sixty-four people turn up over about forty minutes, most of them children, some with a
 * parent and some without. The desk has to answer one question per person — "are you on
 * the list, and are you already in?" — fast enough that a queue does not form, and be
 * right about it, because the list of who is in the building is a safeguarding record
 * before it is a convenience.
 *
 * HOW IT WORKS. Every selected player has a `check_in_token`, issued at selection
 * (lib/selection.ts). It is printed as a QR code on a slip; the slips are laid out on a
 * table; each person picks up their own and holds it to a camera. That is the whole
 * mechanism, and it is deliberately dumber than an app: paper does not run out of battery,
 * does not need a login, and works for a twelve-year-old with no phone.
 *
 * WHAT THE TOKEN IS NOT. It is not authentication. Anyone who photographs a slip holds a
 * copy of it, so possession alone must not be enough to mark somebody present — the
 * functions here are called only from `/admin/checkin`, which is behind the moderator
 * gate, so the AUTHORITY is the volunteer's session and the token is only an identifier.
 * That is why there is no public check-in endpoint and no self-service page: the shape
 * where a child scans their own slip on their own phone is the shape where somebody else
 * can too.
 *
 * WHY EVERY OUTCOME IS NAMED. The old `checkIn()` returned the registration or null, which
 * collapsed five different situations into "worked" and "didn't". At a desk they need five
 * different sentences:
 *
 *   checked-in   first time, green, next person
 *   already      they are in the list already — and the TIME matters, because a second
 *                scan and a slip somebody else already used look identical without it
 *   not-eligible on the list but withdrawn, or never drawn: a real person with a real
 *                problem, not a broken scan
 *   wrong-event  a valid pass for a different event, which will happen the moment there
 *                is a second one
 *   not-a-pass   somebody's loyalty card. Nothing is wrong; try again
 *   unknown      one of ours, not recognised. This is the one to escalate
 */
import { getDb } from "./db";
import { publicName, markEventVerified } from "./players";
import { defaultHandle } from "./handle";
import { tokenFromScan, checkInPayload } from "./qr";
import { ageOnEventDay } from "./registration-schema";
import type { RegistrationStatus } from "./types";

/** Statuses that mean "has a place and is expected to turn up". */
const ELIGIBLE: RegistrationStatus[] = ["selected", "checked-in"];

export interface RosterEntry {
  reference: string;
  /** The applicant's real name. Moderator-only — this page is behind the gate. */
  fullName: string;
  /** What is printed on the slip and shown on the projector: first name, last initial. */
  publicName: string;
  status: RegistrationStatus;
  checkedInAt: string | null;
  /**
   * When a moderator confirmed they had seen something showing this person's date of
   * birth. Null means not checked yet — which is the normal state until they arrive, and
   * an unresolved one afterwards. See src/data/id-check.ts.
   *
   * Deliberately separate from `checkedInAt`: attendance must be right even when the ID
   * question is not, so the two facts never gate each other.
   */
  dobVerifiedAt: string | null;
  /** Under 18 on the day of the event. A boolean, never the date of birth. */
  under18: boolean;
  /**
   * For an under-18, what was agreed about them leaving: null for adults.
   *
   * On the list because it is the one thing the door cannot look up later — by the time
   * somebody is walking out, the person holding the door needs to already know. Deliberately
   * a sentence and not the underlying consents: the desk needs the decision, not the
   * paperwork behind it.
   */
  leaving: string | null;
}

/**
 * NO CONTACT DETAILS ON THE DESK LIST, on purpose.
 *
 * A guardian's mobile number is exactly what you want if a child arrives alone and
 * something is wrong — and exactly what should not be on a screen that faces a queue, next
 * to that child's name, for forty minutes. It is one line to add if the team decides they
 * want it; it is left out until they do. Guardian contact is already reachable from the
 * entries panel on /admin by whoever needs it.
 */

type Row = {
  reference: string;
  full_name: string;
  dob: string;
  status: RegistrationStatus;
  checked_in_at: string | null;
  dob_verified_at: string | null;
  handle: string | null;
  display_name: string | null;
  guardian_on_site: number | null;
  may_leave_unaccompanied: number | null;
  check_in_token: string | null;
  player_id: string | null;
  event_slug: string;
};

function leavingNote(row: Row, under18: boolean): string | null {
  if (!under18) return null;
  if (row.may_leave_unaccompanied) return "May leave on their own";
  if (row.guardian_on_site) return "Adult staying on site";
  return "Must be collected by an adult";
}

function toEntry(row: Row, eventDate: string | null): RosterEntry {
  const age = ageOnEventDay(row.dob, eventDate);
  const under18 = age !== null && age < 18;
  return {
    reference: row.reference,
    fullName: row.full_name,
    // LEFT JOIN, because the retention job unlinks a dormant profile and leaves the
    // registration behind. A row with no player still has a name to show at a desk.
    publicName: row.display_name
      ? publicName({ handle: row.handle, displayName: row.display_name })
      : defaultHandle(row.full_name),
    status: row.status,
    checkedInAt: row.checked_in_at,
    dobVerifiedAt: row.dob_verified_at,
    under18,
    leaving: leavingNote(row, under18),
  };
}

const SELECT = `
  SELECT r.reference, r.full_name, r.dob, r.status, r.checked_in_at, r.dob_verified_at,
         r.event_slug,
         r.guardian_on_site, r.may_leave_unaccompanied, r.check_in_token, r.player_id,
         p.handle, p.display_name
    FROM registrations r
    LEFT JOIN players p ON p.id = r.player_id`;

/**
 * Everyone expected at the door, ordered as a volunteer reads a list: by first name.
 *
 * Surname order is the convention for a name-badge table and it is the wrong one here.
 * Sikh surnames are overwhelmingly Singh and Kaur, so a surname sort produces two long
 * undifferentiated blocks; a first-name sort spreads the list out and matches what
 * somebody says when they arrive.
 *
 * Never returns a token. This feeds a client component, and props are serialised into the
 * page — a roster with tokens in it would put sixty-four live credentials into the HTML of
 * a page left open on a desk all day.
 */
export async function checkInRoster(
  eventSlug: string,
  eventDate: string | null,
): Promise<RosterEntry[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `${SELECT} WHERE r.event_slug = ? AND r.status IN ('selected','checked-in')
        ORDER BY r.full_name COLLATE NOCASE`,
    )
    .bind(eventSlug)
    .all<Row>();
  return results.map((r) => toEntry(r, eventDate));
}

export interface Slip {
  reference: string;
  publicName: string;
  /** What goes in the QR code. A live credential — see the header of the slips page. */
  payload: string;
}

/**
 * The slips to print: one per person with a place.
 *
 * Only `selected` and `checked-in`, so a reprint mid-morning does not hand out a pass to
 * somebody who withdrew. Anybody with no token is skipped rather than printed blank — a
 * slip with no code is worse than no slip, because it looks like it should work.
 */
export async function checkInSlips(eventSlug: string): Promise<Slip[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `${SELECT} WHERE r.event_slug = ? AND r.status IN ('selected','checked-in')
         AND r.check_in_token IS NOT NULL AND r.check_in_token != ''
        ORDER BY r.full_name COLLATE NOCASE`,
    )
    .bind(eventSlug)
    .all<Row>();

  return results.map((r) => ({
    reference: r.reference,
    publicName: r.display_name
      ? publicName({ handle: r.handle, displayName: r.display_name })
      : defaultHandle(r.full_name),
    payload: checkInPayload(r.check_in_token as string),
  }));
}

/** How many slips would print, and how many people have no token to print one from. */
export async function slipReadiness(
  eventSlug: string,
): Promise<{ printable: number; missingToken: number }> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN check_in_token IS NOT NULL AND check_in_token != '' THEN 1 ELSE 0 END) AS printable,
         SUM(CASE WHEN check_in_token IS NULL OR check_in_token = '' THEN 1 ELSE 0 END) AS missing
       FROM registrations
       WHERE event_slug = ? AND status IN ('selected','checked-in')`,
    )
    .bind(eventSlug)
    .first<{ printable: number | null; missing: number | null }>();
  return { printable: row?.printable ?? 0, missingToken: row?.missing ?? 0 };
}

export type CheckInResult =
  | { kind: "checked-in"; entry: RosterEntry }
  | { kind: "already"; entry: RosterEntry }
  | { kind: "not-eligible"; entry: RosterEntry }
  | { kind: "wrong-event"; eventSlug: string }
  | { kind: "not-a-pass" }
  | { kind: "unknown" };

/** Load one registration by whichever identifier we have. */
async function findBy(column: "check_in_token" | "reference", value: string) {
  const db = await getDb();
  return db.prepare(`${SELECT} WHERE r.${column} = ?`).bind(value).first<Row>();
}

/**
 * Mark somebody present.
 *
 * Shared by the scanner and the manual list, so the two cannot drift: whatever a scan
 * does, typing a reference does the same thing, and the audit row looks identical.
 * `byPlayerId` is the moderator on the desk — see migrations/0012_check_in_desk.sql.
 */
async function mark(
  row: Row,
  eventSlug: string,
  eventDate: string | null,
  byPlayerId: string,
): Promise<CheckInResult> {
  if (row.event_slug !== eventSlug) {
    return { kind: "wrong-event", eventSlug: row.event_slug };
  }
  const entry = toEntry(row, eventDate);
  if (!ELIGIBLE.includes(row.status)) return { kind: "not-eligible", entry };

  // Already in. Reported rather than silently re-stamped: overwriting the time would
  // destroy the only evidence that two people used one slip.
  if (row.status === "checked-in") return { kind: "already", entry };

  const now = new Date().toISOString();
  const db = await getDb();
  await db
    .prepare(
      `UPDATE registrations
          SET status = 'checked-in', checked_in_at = ?, checked_in_by = ?
        WHERE reference = ? AND status = 'selected'`,
    )
    .bind(now, byPlayerId, row.reference)
    .run();

  /**
   * The "attended an event" badge on the profile. Set here because this is the only
   * moment anybody knows it is true.
   *
   * NOT undone by `undoCheckIn` below: a mis-scan grants a badge for a few seconds, but
   * clearing it would strip one legitimately earned at an earlier event. The wrong of the
   * two to risk is obvious.
   */
  if (row.player_id) await markEventVerified(row.player_id);

  return { kind: "checked-in", entry: { ...entry, status: "checked-in", checkedInAt: now } };
}

/** Check somebody in from a scanned QR code. `raw` is exactly what the camera decoded. */
export async function checkInByScan(
  eventSlug: string,
  eventDate: string | null,
  raw: string,
  byPlayerId: string,
): Promise<CheckInResult> {
  const token = tokenFromScan(raw);
  if (!token) return { kind: "not-a-pass" };

  const row = await findBy("check_in_token", token);
  if (!row) return { kind: "unknown" };
  return mark(row, eventSlug, eventDate, byPlayerId);
}

/**
 * Check somebody in from their reference — the fallback for a slip that will not scan, a
 * camera that will not start, and the person who left their slip at home.
 *
 * Not a lesser path. A printed code is a physical object in a hall full of children, so
 * some proportion of them will be creased, dropped, or picked up by the wrong person. The
 * manual route has to be as fast and as fully recorded as the scanner, which is why it
 * goes through the same `mark()`.
 */
export async function checkInByReference(
  eventSlug: string,
  eventDate: string | null,
  reference: string,
  byPlayerId: string,
): Promise<CheckInResult> {
  const ref = reference.trim().toUpperCase();
  if (!ref) return { kind: "unknown" };
  const row = await findBy("reference", ref);
  if (!row) return { kind: "unknown" };
  return mark(row, eventSlug, eventDate, byPlayerId);
}

/**
 * Undo a check-in.
 *
 * Needed because the mistake this makes is silent: scan the wrong slip off the table and
 * the register says a child is in the building who is standing in the car park. There has
 * to be a way back, and it has to be in reach of the person who made the mistake rather
 * than an SQL statement someone runs later.
 *
 * Returns to `selected` and clears all four columns — the arrival time, who recorded it,
 * and the date-of-birth confirmation with it. The last one is deliberate: the wrong tap
 * that checks in the wrong person is the same wrong tap that confirmed their date of
 * birth, and a false "we checked" is worse than an extra tap. It does not touch the
 * profile badge — see `mark()`.
 */
export async function undoCheckIn(
  eventSlug: string,
  reference: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb();
  const row = await findBy("reference", reference.trim().toUpperCase());
  if (!row) return { ok: false, error: "No entry with that reference." };
  if (row.event_slug !== eventSlug) return { ok: false, error: "That entry is for another event." };
  if (row.status !== "checked-in") return { ok: false, error: "That entry is not checked in." };

  await db
    .prepare(
      `UPDATE registrations
          SET status = 'selected', checked_in_at = NULL, checked_in_by = NULL,
              dob_verified_at = NULL, dob_verified_by = NULL
        WHERE reference = ?`,
    )
    .bind(row.reference)
    .run();
  return { ok: true };
}

/**
 * Record that a moderator saw something showing this person's date of birth — or take it
 * back, for the inevitable wrong tap.
 *
 * WHAT IS WRITTEN: a timestamp and the moderator's player id. Not the document, not its
 * type, not its number, not the date read off it. There is no column for any of those and
 * migrations/0013_dob_verified.sql says why.
 *
 * NOT A GATE ON ANYTHING. It does not check somebody in, it cannot prevent a check-in, and
 * a person with no document still gets through the door — `ID_NO_DOCUMENT_RULE` in
 * src/data/id-check.ts is the rule, and it is a rule for the safeguarding lead rather than
 * for this function. All this does is stop "did we check?" being answered from memory.
 *
 * Works before arrival as well as after. Somebody will show a passport while the volunteer
 * is still hunting for their slip, and refusing to record it until the scan has happened
 * would mean asking a parent to get it out twice.
 */
export async function setDobVerified(
  eventSlug: string,
  reference: string,
  byPlayerId: string,
  seen: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb();
  const row = await findBy("reference", reference.trim().toUpperCase());
  if (!row) return { ok: false, error: "No entry with that reference." };
  if (row.event_slug !== eventSlug) {
    return { ok: false, error: "That entry is for another event." };
  }
  await db
    .prepare(
      `UPDATE registrations SET dob_verified_at = ?, dob_verified_by = ? WHERE reference = ?`,
    )
    .bind(seen ? new Date().toISOString() : null, seen ? byPlayerId : null, row.reference)
    .run();
  return { ok: true };
}

/** Arrived, and how many of those have had a date of birth confirmed. */
export async function deskCounts(
  eventSlug: string,
): Promise<{ expected: number; arrived: number; dobChecked: number }> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS expected,
              SUM(CASE WHEN status = 'checked-in' THEN 1 ELSE 0 END) AS arrived,
              SUM(CASE WHEN dob_verified_at IS NOT NULL THEN 1 ELSE 0 END) AS dob
         FROM registrations
        WHERE event_slug = ? AND status IN ('selected','checked-in')`,
    )
    .bind(eventSlug)
    .first<{ expected: number | null; arrived: number | null; dob: number | null }>();
  return {
    expected: row?.expected ?? 0,
    arrived: row?.arrived ?? 0,
    dobChecked: row?.dob ?? 0,
  };
}
