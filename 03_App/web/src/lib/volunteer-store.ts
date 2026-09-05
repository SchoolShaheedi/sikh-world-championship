/**
 * Volunteer sign-ups — validation and storage.
 *
 * The validation is a pure function on purpose, separate from the write. Invariant 5 says
 * the UI is not a security boundary: the browser marks fields required and the server
 * decides. Keeping the deciding half pure is what makes it testable without a database,
 * and every rule below has a test.
 *
 * ONE RULE HERE IS A SAFEGUARDING RULE RATHER THAN A DATA RULE — `over18`. This is an
 * event for twelve- to twenty-five-year-olds, and a volunteer is somebody given a job
 * near them. A seventeen-year-old who wants to help is welcome at an event; they are not
 * signed up through a form with no guardian involved and no check behind it. The form
 * says so, refuses without the declaration, and points them at the support form so a
 * person answers rather than a validation message.
 */
import crypto from "node:crypto";
import { getDb, bool, fromBool, parseJson } from "./db";
import {
  VOLUNTEER_ROLES,
  VOLUNTEER_AVAILABILITY,
  VOLUNTEER_DBS,
  type Volunteer,
  type VolunteerRoleId,
  type VolunteerAvailability,
  type VolunteerDbs,
  type VolunteerStatus,
} from "./volunteer-types";

/** What a submitted form looks like once the strings are out of the FormData. */
export interface VolunteerInput {
  eventSlug: string;
  fullName: string;
  email: string;
  mobile: string;
  roles: string[];
  availability: string;
  dbs: string;
  over18: boolean;
  refereeName: string;
  refereeRelation: string;
  refereeContact: string;
}

export type Validated = Omit<
  Volunteer,
  "id" | "reference" | "status" | "createdAt" | "decidedAt" | "decidedBy"
>;

/**
 * Field lengths. Generous — the point is to stop a megabyte being posted at us, not to
 * argue with somebody's name. A refused sign-up is a volunteer we do not get.
 */
const MAX = { name: 100, email: 200, mobile: 30, relation: 120, contact: 200 } as const;

const clean = (v: unknown, max: number): string =>
  String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/**
 * Deliberately loose. A real address that this refuses costs us a volunteer; a fake one
 * that it lets through costs us an email that bounces, which we can see.
 */
function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function validateVolunteer(
  input: VolunteerInput,
): { ok: true; value: Validated } | { ok: false; error: string } {
  const fullName = clean(input.fullName, MAX.name);
  if (fullName.length < 2) return { ok: false, error: "Please give your name." };

  const email = clean(input.email, MAX.email).toLowerCase();
  if (!looksLikeEmail(email)) {
    return { ok: false, error: "That email address does not look right." };
  }

  // Required, unlike on the support form. This is the number somebody rings at 08:40 on
  // the day when a volunteer has not arrived and a desk is unstaffed.
  const mobile = clean(input.mobile, MAX.mobile);
  if (mobile.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Please give a mobile number we can reach you on." };
  }

  // Invariant 5: accepted only because they appear in our own list.
  const roles = input.roles.filter((r): r is VolunteerRoleId =>
    VOLUNTEER_ROLES.some((x) => x.id === r),
  );
  if (roles.length === 0) {
    return { ok: false, error: "Pick at least one job you could do." };
  }

  const availability = VOLUNTEER_AVAILABILITY.find((a) => a.id === input.availability)?.id;
  if (!availability) return { ok: false, error: "Tell us when you can be there." };

  const dbs = VOLUNTEER_DBS.find((d) => d.id === input.dbs)?.id;
  if (!dbs) return { ok: false, error: "Answer the DBS question — “not sure” is fine." };

  if (!input.over18) {
    return {
      ok: false,
      error:
        "Volunteers have to be 18 or over. If you are younger and want to help, message us " +
        "at /support and we will find a way — it just is not this form.",
    };
  }

  const refereeName = clean(input.refereeName, MAX.name);
  const refereeRelation = clean(input.refereeRelation, MAX.relation);
  const refereeContact = clean(input.refereeContact, MAX.contact);
  if (refereeName.length < 2 || refereeRelation.length < 2 || refereeContact.length < 5) {
    return {
      ok: false,
      error:
        "We need somebody who will vouch for you — their name, how they know you, and one " +
        "way to reach them.",
    };
  }

  return {
    ok: true,
    value: {
      eventSlug: input.eventSlug,
      fullName,
      email,
      mobile,
      roles,
      availability: availability as VolunteerAvailability,
      dbs: dbs as VolunteerDbs,
      over18: true,
      refereeName,
      refereeRelation,
      refereeContact,
    },
  };
}

type Row = Record<string, unknown>;

function toVolunteer(r: Row): Volunteer {
  return {
    id: r.id as string,
    reference: r.reference as string,
    eventSlug: r.event_slug as string,
    fullName: r.full_name as string,
    email: r.email as string,
    mobile: r.mobile as string,
    roles: parseJson<VolunteerRoleId[]>(r.roles, []),
    availability: r.availability as VolunteerAvailability,
    dbs: r.dbs as VolunteerDbs,
    over18: fromBool(r.over_18),
    refereeName: r.referee_name as string,
    refereeRelation: r.referee_relation as string,
    refereeContact: r.referee_contact as string,
    status: r.status as VolunteerStatus,
    createdAt: r.created_at as string,
    decidedAt: (r.decided_at as string | null) ?? null,
    decidedBy: (r.decided_by as string | null) ?? null,
  };
}

export async function createVolunteer(value: Validated): Promise<Volunteer> {
  const db = await getDb();
  const volunteer: Volunteer = {
    ...value,
    id: crypto.randomUUID(),
    reference: `VOL-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    status: "new",
    createdAt: new Date().toISOString(),
    decidedAt: null,
    decidedBy: null,
  };

  await db
    .prepare(
      `INSERT INTO volunteers
         (id, reference, event_slug, full_name, email, mobile, roles, availability, dbs,
          over_18, referee_name, referee_relation, referee_contact, status, created_at,
          decided_at, decided_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,NULL)`,
    )
    .bind(
      volunteer.id,
      volunteer.reference,
      volunteer.eventSlug,
      volunteer.fullName,
      volunteer.email,
      volunteer.mobile,
      JSON.stringify(volunteer.roles),
      volunteer.availability,
      volunteer.dbs,
      bool(volunteer.over18),
      volunteer.refereeName,
      volunteer.refereeRelation,
      volunteer.refereeContact,
      volunteer.status,
      volunteer.createdAt,
    )
    .run();

  return volunteer;
}

/** Undecided first, then oldest first — the same shape as the support queue, and for the
 *  same reason: the list should read as a queue of work rather than a filing cabinet. */
export async function allVolunteers(eventSlug: string): Promise<Volunteer[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT * FROM volunteers WHERE event_slug = ?
        ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END ASC,
                 created_at ASC`,
    )
    .bind(eventSlug)
    .all<Row>();
  return results.map(toVolunteer);
}

export async function setVolunteerStatus(
  reference: string,
  status: VolunteerStatus,
  moderatorId: string,
): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT id FROM volunteers WHERE reference = ?")
    .bind(reference)
    .first<{ id: string }>();
  if (!row) return false;

  await db
    .prepare(
      "UPDATE volunteers SET status = ?, decided_at = ?, decided_by = ? WHERE id = ?",
    )
    .bind(status, status === "new" ? null : new Date().toISOString(), moderatorId, row.id)
    .run();
  return true;
}

/**
 * The only way one of these ever goes away.
 *
 * There is no automatic purge and that is deliberate — invariant 9, and no duration for
 * volunteer records has been decided. Until one is, deletion is a person pressing a
 * button, and /admin/volunteers says so on the page rather than implying a clock that
 * does not exist.
 */
export async function deleteVolunteer(reference: string): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT id FROM volunteers WHERE reference = ?")
    .bind(reference)
    .first<{ id: string }>();
  if (!row) return false;
  await db.prepare("DELETE FROM volunteers WHERE id = ?").bind(row.id).run();
  return true;
}

/** For the badge on /admin — how many offers are sitting unanswered. */
export async function volunteerCounts(
  eventSlug: string,
): Promise<{ total: number; waiting: number; accepted: number }> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS waiting,
              SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted
         FROM volunteers WHERE event_slug = ?`,
    )
    .bind(eventSlug)
    .first<{ total: number; waiting: number | null; accepted: number | null }>();
  return {
    total: row?.total ?? 0,
    waiting: row?.waiting ?? 0,
    accepted: row?.accepted ?? 0,
  };
}
