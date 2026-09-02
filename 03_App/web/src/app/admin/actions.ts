"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/session";
import { getEvent } from "@/data/events";
import { runDraw, closeDraw } from "@/lib/draw";
import { confirmSelection, notifyNotSelected } from "@/lib/selection";
import { registrationsFor } from "@/lib/store";
import { setHandle } from "@/lib/players";
import { normaliseHandle, HANDLE_MIN, HANDLE_MAX } from "@/lib/handle";
import {
  deleteAccount,
  deleteRegistrationByReference,
  deletionBlockers,
} from "@/lib/account-delete";
import { purgeDormantProfiles } from "@/lib/retention";
import { generateBracket, clearBracket, recordScore } from "@/lib/match-store";

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

/**
 * Delete one entry and the account behind it, permanently.
 *
 * WHAT THIS IS FOR
 *  1. Clearing up after a rehearsal. Testing the real registration path means real rows;
 *     leaving them in the live database is how a test entry ends up on a projector.
 *  2. An erasure request. UK GDPR Art. 17 is not optional and it applies to a child who
 *     asks, or a parent who asks on their behalf. Before this existed the only way to
 *     honour one was a hand-written SQL statement against production.
 *
 * It deletes the REGISTRATION as well as the profile — unlike the nightly retention job,
 * which unlinks the registration and leaves it, because that row has its own period
 * measured from the event. Here the point is that nothing is left.
 *
 * Refusals live in `deletionBlockers()`: a moderator, or anyone named on a report or a
 * support ticket. A safeguarding record about someone who has been deleted cannot be
 * acted on, so the account has to outlive the request to remove it. That is a legitimate
 * refusal under Art. 17(3), and it is stated to whoever pressed the button rather than
 * failing quietly.
 */
export async function deleteAccountAndEntry(formData: FormData) {
  const me = await gate();
  const playerId = String(formData.get("playerId") ?? "");
  const label = String(formData.get("label") ?? "unnamed");
  if (!playerId) return { error: "No player." };

  const blockers = await deletionBlockers(playerId);
  if (blockers.length > 0) {
    return { error: `Not deleted. ${blockers.join(" ")}` };
  }

  const r = await deleteAccount(playerId, {
    deleteRegistrations: true,
    // Who did it, not just that it happened. `retention_runs` is the only record that a
    // deletion took place, and "somebody deleted an applicant" is not an answer.
    reason: `Deleted from the admin panel by ${me.email}: ${label}`,
  });

  if (!r.playerDeleted) return { error: "That account no longer exists." };
  revalidatePath("/admin");
  return {
    ok: true as const,
    message:
      `Deleted the profile and ${r.registrationsDeleted} ` +
      `${r.registrationsDeleted === 1 ? "entry" : "entries"}.`,
  };
}

/** Delete an entry that has no account behind it — a row the retention job has unlinked. */
export async function deleteEntryOnly(formData: FormData) {
  const me = await gate();
  const reference = String(formData.get("reference") ?? "");
  if (!reference) return { error: "No reference." };

  const done = await deleteRegistrationByReference(
    reference,
    `Deleted from the admin panel by ${me.email}: entry ${reference}, no account attached`,
  );
  if (!done) return { error: "No entry with that reference." };
  revalidatePath("/admin");
  return { ok: true as const, message: `Deleted entry ${reference}.` };
}

/**
 * The manual dormant-profile sweep.
 *
 * The nightly job stopped doing this on 2026-09-01 — the team decided to keep profiles and
 * clean them up when they choose to (DORMANT_PROFILE_AUTO_PURGE in src/lib/retention.ts).
 * This is the "when they choose to": the same code, the same exemptions, run deliberately
 * by a named moderator and recorded in `retention_runs` like every other deletion.
 *
 * It deletes profiles that have never attended an event and have had no activity for 24
 * months. Moderators, attendees, and anyone named on a report or a support ticket are
 * exempt — that list is inside `purgeDormantProfiles`, not here, so the manual sweep can
 * never be more aggressive than the automatic one was.
 */
export async function purgeDormantNow() {
  await gate();
  const rows = await purgeDormantProfiles();
  revalidatePath("/admin");
  return {
    ok: true as const,
    message:
      rows === 0
        ? "Nothing was due — no profile has been inactive that long."
        : `Deleted ${rows} dormant profile${rows === 1 ? "" : "s"}.`,
  };
}

/**
 * Build the bracket from the players who have places.
 *
 * Separate from the draw on purpose: the draw decides who is coming, this decides who
 * plays whom, and on the day they happen hours apart. Refuses to overwrite a bracket that
 * already has a score in it — see `generateBracket`.
 */
export async function buildBracket(formData: FormData) {
  await gate();
  const slug = String(formData.get("slug") ?? "");
  const event = getEvent(slug);
  if (!event) return { error: "Unknown event" };
  const division = event.divisions[0];
  if (!division) return { error: "That event has no divisions." };

  const r = await generateBracket(slug, division.id, division.name);
  if (!r.ok) return { error: r.error };
  revalidatePath("/admin");
  revalidatePath(`/events/${slug}/bracket`);
  return { ok: true as const, message: `Bracket built — ${r.matches} matches.` };
}

/** Throw the bracket away. Deliberately its own action, never a side effect of building one. */
export async function wipeBracket(formData: FormData) {
  await gate();
  const slug = String(formData.get("slug") ?? "");
  const rows = await clearBracket(slug);
  revalidatePath("/admin");
  revalidatePath(`/events/${slug}/bracket`);
  return { ok: true as const, message: `Cleared ${rows} matches.` };
}

/**
 * Enter a score, which is also what moves the tournament forward.
 *
 * This is the one action that will be used under pressure, standing up, by somebody
 * holding a clipboard — so it validates and returns a sentence rather than throwing, and
 * a corrected score recomputes the whole board rather than patching the next match.
 */
export async function enterScore(formData: FormData) {
  await gate();
  const slug = String(formData.get("slug") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  const home = Number(formData.get("home"));
  const away = Number(formData.get("away"));

  const r = await recordScore(slug, matchId, home, away);
  if (!r.ok) return { error: r.error };
  revalidatePath("/admin");
  revalidatePath(`/events/${slug}/bracket`);
  return { ok: true as const, message: "Score recorded." };
}
