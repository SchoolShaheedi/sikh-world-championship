"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/session";
import { grantStaff, revokeStaff, type StaffRole } from "@/lib/staff";

/**
 * Granting access is itself moderator-only, and re-checked here.
 *
 * `staff.ts` also checks `actor.isModerator`, which is not redundant: this gate stops a
 * non-moderator reaching the function at all, and that one stops the function ever being
 * called with a non-moderator actor from anywhere else. The page check is not a boundary —
 * a server action is callable directly.
 */
async function gate() {
  const me = await currentPlayer();
  if (!me?.isModerator) throw new Error("Moderators only.");
  return me;
}

function role(v: FormDataEntryValue | null): StaffRole | null {
  return v === "moderator" || v === "desk" ? v : null;
}

export async function addStaff(formData: FormData) {
  const me = await gate();
  const r = role(formData.get("role"));
  if (!r) return { error: "Pick a role." };

  const note = String(formData.get("note") ?? "").trim();
  const result = await grantStaff(
    { id: me.id, email: me.email, isModerator: me.isModerator },
    String(formData.get("email") ?? ""),
    r,
    note || undefined,
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/people");
  return { ok: true as const, message: result.message };
}

export async function removeStaff(formData: FormData) {
  const me = await gate();
  const result = await revokeStaff(
    { id: me.id, email: me.email, isModerator: me.isModerator },
    String(formData.get("email") ?? ""),
    String(formData.get("note") ?? "").trim() || undefined,
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/people");
  return { ok: true as const, message: result.message };
}
