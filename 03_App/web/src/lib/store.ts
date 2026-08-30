/**
 * Registration store — Cloudflare D1.
 *
 * Replaces the JSON file. Every exported signature is unchanged, so callers and tests did
 * not move; see 00_Docs/DATA-LAYER.md and DECISIONS.md round 30.
 *
 * Why columns rather than one JSON blob per registration: 04_Legal/RETENTION-POLICY.md
 * gives different lifetimes to different parts of the SAME record — medical notes die
 * about thirty days after an event, the registration itself lives about twelve months.
 * The JSON store could only delete whole rows, which made that policy unenforceable. It
 * is now a single UPDATE (`purgeMedical` below).
 *
 * Only event-specific answers (PSN ID, favourite team) stay in a JSON column, because
 * they are defined by each event's own `formFields` and would otherwise need a migration
 * per event. Guardian and medical fields are never in there.
 */
import crypto from "node:crypto";
import { getDb, bool, fromBool, parseJson } from "./db";
import type { Registration, RegistrationStatus } from "./types";

/** Columns that are not part of an event's `formFields`. */
const CORE_FIELDS = [
  "fullName", "dob", "email", "mobile", "region",
  "medicalConditions", "medical", "dietary", "accessibility",
  "emergencyName", "emergencyRelation", "emergencyPhone",
  "guardianName", "guardianRelation", "guardianEmail", "guardianMobile",
  "guardianConsent", "guardianOnSite", "guardianDropOff",
  "guardianIndependentConsent", "mayLeaveUnaccompanied", "guardianDistance",
  "guardianPhotoConsent", "rulesAgreed", "photoConsent",
  "avatarId", "divisionId", "referralOrg",
] as const;

type Row = Record<string, unknown>;

/** Rebuild the shape callers expect, from the flat row. */
function toRegistration(r: Row): Registration {
  const answers: Record<string, string | boolean | string[]> = {
    ...parseJson<Record<string, string | boolean | string[]>>(r.answers, {}),
    fullName: r.full_name as string,
    dob: r.dob as string,
    email: r.email as string,
    mobile: r.mobile as string,
    rulesAgreed: fromBool(r.rules_agreed),
    photoConsent: fromBool(r.photo_consent),
    guardianConsent: fromBool(r.guardian_consent),
    guardianOnSite: fromBool(r.guardian_on_site),
    guardianDropOff: fromBool(r.guardian_drop_off),
    guardianIndependentConsent: fromBool(r.guardian_independent_consent),
    mayLeaveUnaccompanied: fromBool(r.may_leave_unaccompanied),
    guardianPhotoConsent: fromBool(r.guardian_photo_consent),
    divisionId: r.division_id as string,
  };

  // Nullable columns are omitted rather than set to null, matching what the JSON store
  // produced when an optional field was left blank.
  const optional: Record<string, unknown> = {
    region: r.region,
    referralOrg: r.referral_org,
    medical: r.medical,
    dietary: r.dietary,
    accessibility: r.accessibility,
    emergencyName: r.emergency_name,
    emergencyRelation: r.emergency_relation,
    emergencyPhone: r.emergency_phone,
    guardianName: r.guardian_name,
    guardianRelation: r.guardian_relation,
    guardianEmail: r.guardian_email,
    guardianMobile: r.guardian_mobile,
    guardianDistance: r.guardian_distance,
    avatarId: r.avatar_id,
  };
  for (const [k, v] of Object.entries(optional)) {
    if (v !== null && v !== undefined) answers[k] = v as string;
  }

  const conditions = parseJson<string[] | null>(r.medical_conditions, null);
  if (conditions) answers.medicalConditions = conditions;

  return {
    id: r.id as string,
    eventSlug: r.event_slug as string,
    divisionId: r.division_id as string,
    playerId: r.player_id as string,
    status: r.status as RegistrationStatus,
    waitlistPosition: (r.waitlist_position as number | null) ?? null,
    reference: r.reference as string,
    checkInToken: (r.check_in_token as string | null) ?? "",
    createdAt: r.created_at as string,
    answers,
  };
}

export async function registrationsFor(eventSlug: string): Promise<Registration[]> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM registrations WHERE event_slug = ? ORDER BY created_at")
    .bind(eventSlug)
    .all<Row>();
  return results.map(toRegistration);
}

/**
 * Alphabet with the confusable characters removed — no 0/O, no 1/I/L.
 * References get read aloud at a check-in desk and typed by volunteers, so "was that
 * an O or a zero?" is a real cost.
 */
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomRef(): string {
  let out = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return `SWC-${out.slice(0, 3)}-${out.slice(3)}`;
}

/**
 * A short reference for humans, guaranteed unique against what's already stored.
 *
 * An earlier version used 2 random bytes with no uniqueness check — ~2.6% chance of a
 * duplicate within a single 64-player event. A test caught it (round 10). The uniqueness
 * check is now also enforced by the database: `reference` is UNIQUE, so a collision
 * becomes a failed insert rather than two players sharing a reference at the desk.
 */
async function makeReference(): Promise<string> {
  const db = await getDb();
  for (let attempt = 0; attempt < 50; attempt++) {
    const ref = randomRef();
    const clash = await db
      .prepare("SELECT 1 AS x FROM registrations WHERE reference = ?")
      .bind(ref)
      .first();
    if (!clash) return ref;
  }
  return `SWC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export interface ApplyResult {
  status: Extract<RegistrationStatus, "applied">;
  reference: string;
}

const str = (v: unknown): string | null =>
  typeof v === "string" && v !== "" ? v : null;

/**
 * Record an application.
 *
 * Deliberately does NOT: check capacity, assign a queue position, issue a check-in token,
 * or create an account. None of those are true yet — a place is decided by the draw, and
 * pretending otherwise at submission is what the old "You're in" screen got wrong.
 *
 * Applications are uncapped. Turning people away at the form would defeat the point of
 * drawing, and the number of applicants is not something we reveal anyway.
 */
export async function apply(input: {
  eventSlug: string;
  divisionId: string;
  answers: Record<string, string | boolean | string[]>;
}): Promise<ApplyResult> {
  const db = await getDb();
  const a = input.answers;
  const reference = await makeReference();

  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(a)) {
    if (!(CORE_FIELDS as readonly string[]).includes(k)) extra[k] = v;
  }

  await db
    .prepare(
      `INSERT INTO registrations (
        id, event_slug, division_id, player_id, status, reference, check_in_token,
        created_at, full_name, dob, email, mobile, region, referral_org,
        medical_conditions, medical, dietary, accessibility,
        emergency_name, emergency_relation, emergency_phone,
        guardian_name, guardian_relation, guardian_email, guardian_mobile,
        guardian_consent, guardian_on_site, guardian_drop_off,
        guardian_independent_consent, may_leave_unaccompanied, guardian_distance,
        guardian_photo_consent, rules_agreed, photo_consent, avatar_id, answers
      ) VALUES (?,?,?,NULL,'applied',?,NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.eventSlug,
      input.divisionId,
      reference,
      new Date().toISOString(),
      String(a.fullName ?? ""),
      String(a.dob ?? ""),
      String(a.email ?? ""),
      String(a.mobile ?? ""),
      str(a.region),
      str(a.referralOrg),
      Array.isArray(a.medicalConditions) ? JSON.stringify(a.medicalConditions) : null,
      str(a.medical),
      str(a.dietary),
      str(a.accessibility),
      str(a.emergencyName),
      str(a.emergencyRelation),
      str(a.emergencyPhone),
      str(a.guardianName),
      str(a.guardianRelation),
      str(a.guardianEmail),
      str(a.guardianMobile),
      bool(a.guardianConsent),
      bool(a.guardianOnSite),
      bool(a.guardianDropOff),
      bool(a.guardianIndependentConsent),
      bool(a.mayLeaveUnaccompanied),
      str(a.guardianDistance),
      bool(a.guardianPhotoConsent),
      bool(a.rulesAgreed),
      bool(a.photoConsent),
      str(a.avatarId),
      JSON.stringify(extra),
    )
    .run();

  return { status: "applied", reference };
}

/** Everyone still awaiting a decision. The pool the draw runs over. */
export async function applicantsFor(eventSlug: string): Promise<Registration[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      "SELECT * FROM registrations WHERE event_slug = ? AND status = 'applied' ORDER BY created_at",
    )
    .bind(eventSlug)
    .all<Row>();
  return results.map(toRegistration);
}

/** How many places are already taken. Never shown to applicants. */
export async function selectedCount(eventSlug: string): Promise<number> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM registrations
        WHERE event_slug = ? AND status IN ('selected','checked-in')`,
    )
    .bind(eventSlug)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** Mark a player present from their QR check-in token. */
export async function checkIn(token: string): Promise<Registration | null> {
  const db = await getDb();
  // An emptied token must never match: it is cleared after the event, and "" would
  // otherwise check in whoever was purged first.
  if (!token) return null;
  const row = await db
    .prepare("SELECT * FROM registrations WHERE check_in_token = ?")
    .bind(token)
    .first<Row>();
  if (!row) return null;
  await db
    .prepare("UPDATE registrations SET status = 'checked-in' WHERE id = ?")
    .bind(row.id)
    .run();
  return toRegistration({ ...row, status: "checked-in" });
}

/**
 * Delete the special-category fields from an event's registrations, keeping the rows.
 *
 * This is the operation the JSON store could not perform, and the reason
 * 04_Legal/RETENTION-POLICY.md was unenforceable: medical notes have a much shorter
 * lifetime than the registration they belong to. Records the purge so it is provable.
 */
export async function purgeMedical(eventSlug: string): Promise<number> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT id FROM registrations WHERE event_slug = ? AND medical_purged_at IS NULL`,
    )
    .bind(eventSlug)
    .all<{ id: string }>();
  if (results.length === 0) return 0;

  await db
    .prepare(
      `UPDATE registrations
         SET medical_conditions = NULL, medical = NULL, dietary = NULL,
             accessibility = NULL, medical_purged_at = ?
       WHERE event_slug = ? AND medical_purged_at IS NULL`,
    )
    .bind(new Date().toISOString(), eventSlug)
    .run();
  return results.length;
}

/**
 * Clear check-in tokens after an event. They are live credentials; holding one past the
 * day it can be used is pure risk.
 */
export async function clearCheckInTokens(eventSlug: string): Promise<void> {
  const db = await getDb();
  await db
    .prepare("UPDATE registrations SET check_in_token = NULL WHERE event_slug = ?")
    .bind(eventSlug)
    .run();
}
