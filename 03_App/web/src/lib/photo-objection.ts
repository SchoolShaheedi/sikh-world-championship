/**
 * The do-not-photograph list.
 *
 * WHY IT IS A LIST OF PEOPLE WHO OBJECTED, and not a consent field. Photography is a
 * CONDITION of entering (invariant 12, the team's decision in round 47), so
 * `photo_consent` is true on every row and tells a photographer nothing. The only useful
 * list is the opposite one, and until now it did not exist anywhere: an objection arrived
 * as a support message, and the "brief the photographers" job on /admin said in as many
 * words that the list "has to be carried by hand".
 *
 * A CONTROL NOBODY CAN LOOK UP IS NOT A CONTROL. The privacy notice, the sign-up form,
 * the confirmation email, the guardian email and now the reminder email all say the same
 * sentence: tell us and the photographers are told. Five promises resting on one person
 * remembering an inbox.
 *
 * WHAT THIS DOES NOT DO. It does not stop a camera and it does not claim to. It turns
 * "somebody mentioned it" into a list of names a person can read out before the doors
 * open, which is the whole of the control and should not be described as more.
 */
import { getDb } from "./db";
import { publicName } from "./players";
import { defaultHandle } from "./handle";

export interface DoNotPhotograph {
  reference: string;
  /** The name as registered — the photographers have to recognise a person. */
  fullName: string;
  /** What is on their slip and on the projector, so the two can be matched up. */
  publicName: string;
  objectedAt: string;
  /** True once they are in the building, so the list can be read against arrivals. */
  arrived: boolean;
}

/**
 * Record or clear an objection.
 *
 * `objected: false` clears it completely rather than writing a "withdrawn" marker. An
 * objection recorded in error is the likely reason this is ever unset, and keeping a
 * tombstone would leave a child on a list of people who objected to something they did
 * not object to.
 */
export async function setPhotoObjection(
  reference: string,
  objected: boolean,
  moderatorId: string,
): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT id FROM registrations WHERE reference = ?")
    .bind(reference)
    .first<{ id: string }>();
  if (!row) return false;

  await db
    .prepare(
      "UPDATE registrations SET photo_objected_at = ?, photo_objected_by = ? WHERE id = ?",
    )
    .bind(objected ? new Date().toISOString() : null, objected ? moderatorId : null, row.id)
    .run();
  return true;
}

/**
 * Everybody with a place who has objected, in the order a person reads names.
 *
 * Restricted to people who actually have a place: an applicant who was not drawn is not
 * going to be in the hall, and a longer list is a list that gets skimmed.
 */
export async function doNotPhotographList(eventSlug: string): Promise<DoNotPhotograph[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT r.reference, r.full_name, r.status, r.photo_objected_at,
              p.handle, p.display_name
         FROM registrations r
         LEFT JOIN players p ON p.id = r.player_id
        WHERE r.event_slug = ?
          AND r.photo_objected_at IS NOT NULL
          AND r.status IN ('selected', 'checked-in')
        ORDER BY r.full_name COLLATE NOCASE`,
    )
    .bind(eventSlug)
    .all<{
      reference: string;
      full_name: string;
      status: string;
      photo_objected_at: string;
      handle: string | null;
      display_name: string | null;
    }>();

  return results.map((r) => ({
    reference: r.reference,
    fullName: r.full_name,
    publicName: r.display_name
      ? publicName({ handle: r.handle, displayName: r.display_name })
      : defaultHandle(r.full_name),
    objectedAt: r.photo_objected_at,
    arrived: r.status === "checked-in",
  }));
}

/**
 * Every reference with an objection on it, whatever their status.
 *
 * The entries table wants a marker beside a row, and it lists applicants as well as the
 * people who have places — so this is deliberately wider than `doNotPhotographList()`,
 * which is the list read to the photographers and is narrowed to people who will be in
 * the hall.
 */
export async function photoObjectionRefs(eventSlug: string): Promise<Set<string>> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT reference FROM registrations
        WHERE event_slug = ? AND photo_objected_at IS NOT NULL`,
    )
    .bind(eventSlug)
    .all<{ reference: string }>();
  return new Set(results.map((r) => r.reference));
}
