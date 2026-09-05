/**
 * One entrant, in full, for a moderator — and the shape of the field as a whole.
 *
 * WHY THIS EXISTS (2026-09-04). Everything a moderator needed to *decide* something was
 * already collected and none of it could be looked at. Who referred somebody, which city
 * they are travelling from, how they rated themselves, whether they are near the 12 or 25
 * line — all of it went into a form, into a column, and nowhere else. The entries list gave
 * a name, an email and a status, which is enough to delete a row and not enough to
 * understand a field of seventy-five people.
 *
 * MASKED BY DEFAULT, AND MASKED ON THE SERVER. A moderator can already see every contact
 * detail — that is what the role is — so this is not a restriction, it is about not putting
 * a child's mobile number on screen by accident while somebody is projecting /admin or
 * sharing a call. That only works if the masking is real: hiding a value with CSS leaves it
 * in the page source, so `entryDetail()` never returns an unmasked personal field at all.
 * `entryContact()` is a separate call behind its own gate, and it is the only thing that
 * returns the real values.
 *
 * WHAT COUNTS AS PERSONAL HERE. Contact routes (email, mobile, the guardian's name and
 * both of their contact routes), the date of birth itself, and everything medical. Not the
 * referral organisation, the city, the self-rating or the age — those are the answers to
 * "who is coming and how do we run the day", they are already aggregated on this page, and
 * treating them as secrets would have left the problem above unsolved.
 */
import { getDb } from "./db";
import { publicName } from "./players";
import { defaultHandle } from "./handle";
import { ageOnEventDay } from "./registration-schema";
import { parseJson, fromBool } from "./db";

/* ------------------------------------------------------------------ masking */

/**
 * A FIXED number of bullets, never one per hidden character.
 *
 * Proportional bullets were the first version and they leak the length of what they hide,
 * which for a name is a real narrowing — "R•••••••• K•••" is a short list of Sikh first
 * names. The masks are all fixed-width for the same reason, and it happens to read better
 * in a table too.
 */
const BULLETS = "•••";

/**
 * Enough of an email to recognise one you already know, not enough to send to.
 *
 * The first character and the top-level domain survive. A moderator checking "is this the
 * same person who emailed us?" is served; somebody reading over a shoulder is not.
 */
export function maskEmail(value: string | null | undefined): string {
  if (!value) return "—";
  const at = value.indexOf("@");
  if (at < 1) return `${BULLETS}@${BULLETS}`;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${local[0]}${BULLETS}@${BULLETS}${tld}`;
}

/**
 * A phone number with its middle removed.
 *
 * The leading two and trailing three digits are kept, which is what makes "the number
 * ending 109" a usable thing for a moderator to say on the phone to a parent who is lost
 * on the way to the venue. Eleven digits with five missing is not dialable.
 */
export function maskPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7) return BULLETS;
  return `${digits.slice(0, 2)}${BULLETS}${digits.slice(-3)}`;
}

/** A name reduced to its initials, so a guardian is identifiable without being named. */
export function maskName(value: string | null | undefined): string {
  if (!value) return "—";
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.map((w) => `${w[0]}${BULLETS}`).join(" ");
}

/** A date of birth as the year alone. The month and day are the identifying part. */
export function maskDob(value: string | null | undefined): string {
  if (!value || value.length < 4) return "—";
  return `${value.slice(0, 4)}-••-••`;
}

/* ------------------------------------------------------------------ the detail */

export interface EntryDetail {
  reference: string;
  /** First name plus last initial — what the projector and the slip show. */
  publicName: string;
  /** The name as registered. A moderator needs it to match a document at the desk. */
  fullName: string;
  status: string;
  createdAt: string;
  decidedAt: string | null;

  /* The answers that exist to be looked at. */
  referralOrg: string | null;
  referralDetail: string | null;
  region: string | null;
  selfRating: string | null;
  favouriteTeam: string | null;
  ownController: boolean;
  divisionId: string;

  /** Age on the day of the event, which is the only age that decides anything. */
  ageOnEventDay: number | null;
  under18: boolean;
  under16: boolean;

  /* Supervision. Facts, not contact routes — see the header. */
  guardianOnSite: boolean;
  mayLeaveUnaccompanied: boolean;
  guardianRelation: string | null;

  /* Arrival. */
  checkedInAt: string | null;
  dobVerifiedAt: string | null;

  /**
   * When somebody said they did not want to be photographed, or null.
   *
   * NOT a consent field — photography is a condition of entering, so consent is true on
   * every row and says nothing. See src/lib/photo-objection.ts.
   */
  photoObjectedAt: string | null;

  /** True when there is something medical recorded, without saying what. */
  hasMedical: boolean;
  /** True when the medical fields have already been purged by the retention job. */
  medicalPurged: boolean;

  /* Masked. The real values come from `entryContact()` and nowhere else. */
  masked: {
    email: string;
    mobile: string;
    dob: string;
    guardianName: string;
    guardianEmail: string;
    guardianMobile: string;
    emergencyName: string;
    emergencyPhone: string;
  };
}

/** The unmasked values. Returned only by the gated action that a moderator has to press. */
export interface EntryContact {
  email: string;
  mobile: string;
  dob: string;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianEmail: string | null;
  guardianMobile: string | null;
  emergencyName: string | null;
  emergencyRelation: string | null;
  emergencyPhone: string | null;
  medicalConditions: string[];
  medical: string | null;
  accessibility: string | null;
}

type Row = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

async function rowFor(reference: string): Promise<Row | null> {
  const db = await getDb();
  return await db
    .prepare(
      `SELECT r.*, p.handle, p.display_name
         FROM registrations r
         LEFT JOIN players p ON p.id = r.player_id
        WHERE r.reference = ?`,
    )
    .bind(reference)
    .first<Row>();
}

export async function entryDetail(
  reference: string,
  eventDate: string | null,
): Promise<EntryDetail | null> {
  const r = await rowFor(reference);
  if (!r) return null;

  const answers = parseJson<Record<string, unknown>>(r.answers, {});
  const age = ageOnEventDay(r.dob as string, eventDate);
  const conditions = parseJson<string[] | null>(r.medical_conditions, null) ?? [];
  // "None" is an explicit answer to the tick-list and is not something to flag.
  const realConditions = conditions.filter((c) => c !== "None");

  return {
    reference: r.reference as string,
    publicName: r.display_name
      ? publicName({ handle: r.handle as string | null, displayName: r.display_name as string })
      : defaultHandle(r.full_name as string),
    fullName: r.full_name as string,
    status: r.status as string,
    createdAt: r.created_at as string,
    decidedAt: str(r.decided_at),

    referralOrg: str(r.referral_org),
    referralDetail: str(answers.referralDetail) ?? str(answers.referralOther),
    region: str(r.region),
    selfRating: str(answers.skill),
    favouriteTeam: str(answers.favouriteTeam),
    ownController: answers.ownController === true,
    divisionId: r.division_id as string,

    ageOnEventDay: age,
    under18: age !== null && age < 18,
    under16: age !== null && age < 16,

    guardianOnSite: fromBool(r.guardian_on_site),
    mayLeaveUnaccompanied: fromBool(r.may_leave_unaccompanied),
    guardianRelation: str(r.guardian_relation),

    checkedInAt: str(r.checked_in_at),
    dobVerifiedAt: str(r.dob_verified_at),
    photoObjectedAt: str(r.photo_objected_at),

    hasMedical:
      realConditions.length > 0 || !!str(r.medical) || !!str(r.accessibility),
    medicalPurged: !!str(r.medical_purged_at),

    masked: {
      email: maskEmail(r.email as string),
      mobile: maskPhone(r.mobile as string),
      dob: maskDob(r.dob as string),
      guardianName: maskName(str(r.guardian_name)),
      guardianEmail: maskEmail(str(r.guardian_email)),
      guardianMobile: maskPhone(str(r.guardian_mobile)),
      emergencyName: maskName(str(r.emergency_name)),
      emergencyPhone: maskPhone(str(r.emergency_phone)),
    },
  };
}

/** The real values. Every caller must have checked the moderator gate first. */
export async function entryContact(reference: string): Promise<EntryContact | null> {
  const r = await rowFor(reference);
  if (!r) return null;
  return {
    email: r.email as string,
    mobile: r.mobile as string,
    dob: r.dob as string,
    guardianName: str(r.guardian_name),
    guardianRelation: str(r.guardian_relation),
    guardianEmail: str(r.guardian_email),
    guardianMobile: str(r.guardian_mobile),
    emergencyName: str(r.emergency_name),
    emergencyRelation: str(r.emergency_relation),
    emergencyPhone: str(r.emergency_phone),
    medicalConditions: parseJson<string[] | null>(r.medical_conditions, null) ?? [],
    medical: str(r.medical),
    accessibility: str(r.accessibility),
  };
}

/* ------------------------------------------------------------------ the field as a whole */

export interface Tally {
  label: string;
  count: number;
}

export interface EntryStats {
  total: number;
  byStatus: Tally[];
  byReferral: Tally[];
  byRegion: Tally[];
  bySelfRating: Tally[];
  /** Age bands that mean something operationally, not demographic curiosity. */
  byAgeGroup: Tally[];
  referredTotal: number;
  under18: number;
  withMedical: number;
}

/**
 * Counts, and no names.
 *
 * The point is the shape of the field: whether the outreach is working, where people are
 * travelling from, whether a hall of self-declared beginners needs a different running
 * order. Nothing here identifies anybody, which is what makes it safe to leave on screen.
 *
 * Age is grouped rather than listed, and the groups are the ones the day actually turns on:
 * 12–15 means a parent stays, 16–17 means a leaving permission to check, 18+ is an adult.
 */
export async function entryStats(
  eventSlug: string,
  eventDate: string | null,
): Promise<EntryStats> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT status, referral_org, region, dob, answers,
              medical_conditions, medical, accessibility
         FROM registrations WHERE event_slug = ?`,
    )
    .bind(eventSlug)
    .all<Row>();

  const tally = (rows: (string | null)[], noneLabel: string): Tally[] => {
    const m = new Map<string, number>();
    for (const v of rows) {
      const k = v && v.trim() !== "" ? v : noneLabel;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    // Biggest first, then alphabetically — a stable order, so the table does not reshuffle
    // between two refreshes with the same numbers in it.
    return [...m.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  };

  const ages = results.map((r) => ageOnEventDay(r.dob as string, eventDate));
  const group = (age: number | null): string => {
    if (age === null) return "Unknown";
    if (age < 12) return "Under 12";
    if (age < 16) return "12–15 (parent stays)";
    if (age < 18) return "16–17 (leaving permission)";
    return "18+";
  };

  const NONE = "Nobody — I found it myself";
  const referral = results.map((r) => str(r.referral_org));

  return {
    total: results.length,
    byStatus: tally(results.map((r) => r.status as string), "unknown"),
    byReferral: tally(referral, NONE),
    byRegion: tally(results.map((r) => str(r.region)), "Not given"),
    bySelfRating: tally(
      results.map((r) => str(parseJson<Record<string, unknown>>(r.answers, {}).skill)),
      "Not given",
    ),
    byAgeGroup: tally(ages.map(group), "Unknown"),
    referredTotal: referral.filter((v) => v && v !== NONE).length,
    under18: ages.filter((a) => a !== null && a < 18).length,
    withMedical: results.filter((r) => {
      const conditions = parseJson<string[] | null>(r.medical_conditions, null) ?? [];
      return (
        conditions.some((c) => c !== "None") || !!str(r.medical) || !!str(r.accessibility)
      );
    }).length,
  };
}
