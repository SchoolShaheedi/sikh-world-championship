"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/session";
import { getEvent } from "@/data/events";
import { runDraw, closeDraw } from "@/lib/draw";
import { confirmSelection, notifyNotSelected } from "@/lib/selection";
import { registrationsFor } from "@/lib/store";
import { setHandle } from "@/lib/players";
import { normaliseHandle, HANDLE_MIN, HANDLE_MAX } from "@/lib/handle";

/**
 * Every action re-checks moderator status.
 *
 * These decide who gets to come and send the emails that tell them. The page also checks,
 * but a page check is not a security boundary — a server action is callable directly.
 */
async function gate() {
  const me = await currentPlayer();
  if (!me?.isModerator) throw new Error("Moderators only.");
  return me;
}

/** Compute the draw and show it, without changing anything. */
export async function previewDraw(formData: FormData) {
  await gate();
  const slug = String(formData.get("slug"));
  const event = getEvent(slug);
  if (!event) return { error: "Unknown event" };

  const r = await runDraw(slug, event.capacity, { dryRun: true });
  return {
    ok: true as const,
    preview: {
      applicants: r.applicants,
      places: r.places,
      referredTaken: r.referredTaken,
      generalTaken: r.generalTaken,
      names: r.selected.map((x) => String(x.answers.fullName)),
    },
  };
}

/**
 * Run the draw for real, then create accounts and send the offers.
 *
 * Selection and notification happen together on purpose: a place that has been decided but
 * not communicated is a state nobody can explain if the person rings up.
 */
export async function commitDraw(formData: FormData) {
  await gate();
  const slug = String(formData.get("slug"));
  const event = getEvent(slug);
  if (!event) return { error: "Unknown event" };

  const r = await runDraw(slug, event.capacity, { note: "Run from the admin panel" });

  let created = 0;
  for (const reg of r.selected) {
    // The account and the check-in token are created HERE, not at application.
    await confirmSelection(event, { ...reg, status: "selected" });
    created += 1;
  }

  revalidatePath("/admin");
  return {
    ok: true as const,
    message: `Drew ${r.selected.length} of ${r.applicants} applicants (${r.referredTaken} referred, ${r.generalTaken} general). ${created} accounts created and offers emailed.`,
  };
}

/**
 * Tell everyone who was not drawn.
 *
 * Separate from the draw so the two decisions — who gets in, and telling the rest — can
 * happen at different moments. Backfilling drop-outs is easier before this runs.
 */
export async function closeAndNotify(formData: FormData) {
  await gate();
  const slug = String(formData.get("slug"));
  const drawId = String(formData.get("drawId"));
  const event = getEvent(slug);
  if (!event) return { error: "Unknown event" };

  const before = await registrationsFor(slug);
  const pending = before.filter((r) => r.status === "applied");

  await closeDraw(slug, drawId);
  for (const reg of pending) await notifyNotSelected(event, reg);

  revalidatePath("/admin");
  return { ok: true as const, message: `${pending.length} applicants told they were not selected.` };
}


/**
 * Correct a public name.
 *
 * The last line of the projector safety argument: the handle is free text a child typed,
 * lib/handle.ts catches only the two problems a machine can see, and this is how a
 * moderator fixes the rest. Gated like every other action here — the page check is not a
 * security boundary.
 */
export async function overrideHandle(formData: FormData) {
  await gate();
  const playerId = String(formData.get("playerId") ?? "");
  const handle = normaliseHandle(String(formData.get("handle") ?? ""));

  if (!playerId) return { error: "No player." };
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) {
    return { error: `A name has to be ${HANDLE_MIN}–${HANDLE_MAX} characters.` };
  }
  if (!/^[A-Za-z0-9 ._-]+$/.test(handle)) {
    return { error: "Letters, numbers, spaces, full stops, hyphens and underscores only." };
  }

  await setHandle(playerId, handle);
  revalidatePath("/admin");
  return { ok: true as const, message: `Public name set to “${handle}”.` };
}
