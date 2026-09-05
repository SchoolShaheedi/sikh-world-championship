"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/session";
import { entryContact, type EntryContact } from "@/lib/entry-detail";
import { setPhotoObjection } from "@/lib/photo-objection";

/**
 * Uncover one entrant's contact and medical details.
 *
 * A SEPARATE ROUND TRIP, ON PURPOSE. The detail page never receives an unmasked value, so
 * hiding one is not a matter of CSS — a masked field genuinely is not in the page source.
 * That is the difference between a screen that is tidy and a screen that is safe to
 * project, and it is invariant 5 applied to reading rather than writing: the UI is not the
 * boundary, this gate is.
 *
 * Deliberately NOT recorded. An audit of who looked at which child was considered on
 * 2026-09-04 and left out: it needs a table, and a table of "which moderator read which
 * child's medical notes" needs its own retention rule and its own answer to a subject
 * access request. Worth doing when there is a rota of moderators; not worth doing for two
 * or three people who can already see everything.
 */
export async function revealEntry(
  reference: string,
): Promise<{ ok: true; contact: EntryContact } | { error: string }> {
  const me = await currentPlayer();
  if (!me?.isModerator) return { error: "Moderators only." };
  if (!reference) return { error: "No reference." };

  const contact = await entryContact(reference);
  if (!contact) return { error: "No entry with that reference." };
  return { ok: true, contact };
}

/**
 * Record — or clear — that somebody does not want to be photographed.
 *
 * WHY A MODERATOR PRESSES THIS RATHER THAN THE PERSON TICKING A BOX. Photography is a
 * condition of entering, and an objection is a conversation: somebody writes in, or a
 * parent says it at the door, and it is often narrower than "no photos at all". The
 * moderator answers them in words and records the one fact a photographer can act on.
 * A self-service toggle would turn a stated condition back into a consent checkbox, which
 * invariant 12 is specifically about not doing.
 *
 * Gated here as well as on the page: the page check is not a security boundary.
 */
export async function togglePhotoObjection(
  reference: string,
  objected: boolean,
): Promise<{ ok: true } | { error: string }> {
  const me = await currentPlayer();
  if (!me?.isModerator) return { error: "Moderators only." };
  if (!reference) return { error: "No reference." };

  const done = await setPhotoObjection(reference, objected, me.id);
  if (!done) return { error: "No entry with that reference." };

  revalidatePath("/admin");
  revalidatePath("/admin/entries");
  revalidatePath(`/admin/entries/${encodeURIComponent(reference)}`);
  return { ok: true };
}
