"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/session";
import { setVolunteerStatus, deleteVolunteer } from "@/lib/volunteer-store";
import type { VolunteerStatus } from "@/lib/volunteer-types";

async function gate() {
  const me = await currentPlayer();
  if (!me?.isModerator) throw new Error("Moderators only.");
  return me;
}

const STATUSES: VolunteerStatus[] = ["new", "accepted", "declined"];

/** Mark somebody in or out. Recorded with who decided, the same as every other decision. */
export async function decideVolunteer(formData: FormData) {
  const me = await gate();
  const reference = String(formData.get("reference") ?? "");
  const raw = String(formData.get("status") ?? "");
  // Invariant 5: accepted only because it appears in our own list.
  const status = STATUSES.find((s) => s === raw);
  if (!status) return { error: "Unknown status." };

  const done = await setVolunteerStatus(reference, status, me.id);
  if (!done) return { error: "No volunteer with that reference." };

  revalidatePath("/admin/volunteers");
  revalidatePath("/admin");
  return { ok: true as const, message: `${reference} marked ${status}.` };
}

/**
 * Delete one sign-up.
 *
 * THE ONLY THING THAT REMOVES ONE. There is no automatic purge for this table and that is
 * deliberate — invariant 9: nobody has decided how long a volunteer record is kept, and
 * inventing a duration in code is exactly what that invariant exists to stop. Until the
 * team sets one, deletion is a person pressing this, and the page says so.
 *
 * Typing the reference back is the same confirmation the entry-delete button uses: this
 * removes somebody's contact details and a third party's, and a misplaced click should
 * not be able to do it.
 */
export async function removeVolunteer(formData: FormData) {
  await gate();
  const reference = String(formData.get("reference") ?? "");
  const typed = String(formData.get("confirm") ?? "").trim();
  if (typed !== reference) {
    return { error: `Type ${reference} to confirm.` };
  }

  const done = await deleteVolunteer(reference);
  if (!done) return { error: "No volunteer with that reference." };

  revalidatePath("/admin/volunteers");
  revalidatePath("/admin");
  return { ok: true as const, message: `${reference} deleted.` };
}
