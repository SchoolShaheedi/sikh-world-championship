"use server";

import { currentPlayer } from "@/lib/session";
import { getEvent } from "@/data/events";
import {
  checkInByScan,
  checkInByReference,
  undoCheckIn,
  setDobVerified,
  checkInRoster,
  type CheckInResult,
  type RosterEntry,
} from "@/lib/check-in";

/**
 * The desk is behind the moderator gate, and this is where that is enforced.
 *
 * THE WHOLE SECURITY MODEL OF CHECK-IN IS HERE. A printed QR code is not a secret — it sits
 * face-up on a table and anybody in the hall can photograph one. So possession of a token
 * must never be sufficient to mark a child present. The authority is the VOLUNTEER'S
 * SESSION, checked on every call below; the token only says which row to write to.
 *
 * That is also why there is no `/api/checkin` route and no page a player can open. A
 * self-service scanner would move the authority onto the thing lying on the table.
 */
async function gate() {
  const me = await currentPlayer();
  // Desk staff, not only moderators. `canWorkDesk` is moderator OR desk, computed in one
  // place (`hasDeskAccess`) so a gate cannot read half of it — see src/lib/staff.ts.
  if (!me?.canWorkDesk) throw new Error("Staff only.");
  return me;
}

export interface DeskResponse {
  result: CheckInResult | null;
  error?: string;
  /**
   * The list, as it is after the action.
   *
   * Returned WHOLE rather than revalidated, on purpose. Sixty-four rows is a few
   * kilobytes, and the alternative — invalidate the page, let it re-render, hope the
   * client catches up — is how a desk ends up looking at a counter that says 23 when 24
   * people are inside. The screen is never allowed to be a guess.
   */
  roster: RosterEntry[];
}

async function respond(
  slug: string,
  result: CheckInResult | null,
  error?: string,
): Promise<DeskResponse> {
  const event = getEvent(slug);
  return {
    result,
    error,
    roster: await checkInRoster(slug, event?.date ?? null),
  };
}

/** A code came off the camera. `raw` is exactly what was decoded, unmodified. */
export async function scanPass(slug: string, raw: string): Promise<DeskResponse> {
  const me = await gate();
  const event = getEvent(slug);
  if (!event) return respond(slug, null, "Unknown event.");

  const result = await checkInByScan(slug, event.date, raw, me.id);
  return respond(slug, result);
}

/** The fallback: a reference typed off the slip, or read out by whoever is at the desk. */
export async function checkInManually(slug: string, reference: string): Promise<DeskResponse> {
  const me = await gate();
  const event = getEvent(slug);
  if (!event) return respond(slug, null, "Unknown event.");

  const result = await checkInByReference(slug, event.date, reference, me.id);
  return respond(slug, result);
}

/** Undo one, because the wrong slip off a table is a silent mistake. */
export async function undoOne(slug: string, reference: string): Promise<DeskResponse> {
  await gate();
  const r = await undoCheckIn(slug, reference);
  return respond(slug, null, r.ok ? undefined : r.error);
}

/**
 * Record — or unrecord — that somebody's date of birth was seen.
 *
 * Its own action rather than a flag on `scanPass`, because the two happen at different
 * moments and in either order: a parent often has the passport out before the volunteer
 * has found the slip. Writes a timestamp and the moderator's id and nothing about the
 * document — see src/data/id-check.ts and migrations/0013_dob_verified.sql.
 */
export async function markDobSeen(
  slug: string,
  reference: string,
  seen: boolean,
): Promise<DeskResponse> {
  const me = await gate();
  const r = await setDobVerified(slug, reference, me.id, seen);
  return respond(slug, null, r.ok ? undefined : r.error);
}

/**
 * Re-read the list without changing anything.
 *
 * For the case where two volunteers are checking people in on two devices: each one polls
 * so neither is working from a list the other has already moved on from.
 */
export async function refreshRoster(slug: string): Promise<DeskResponse> {
  await gate();
  return respond(slug, null);
}
