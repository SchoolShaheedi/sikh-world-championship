/**
 * Turning a drawn application into a place.
 *
 * THIS is where an account is created — not at submission. Filling in a form does not make
 * someone a player, and creating profiles for everyone who applied would mean holding
 * accounts for people who never got in.
 *
 * It is also where the check-in token is issued, for the same reason: it is the credential
 * that marks someone present, and it should not exist before there is a place to attend.
 */
import crypto from "node:crypto";
import { getDb } from "./db";
import { upsertPlayer, bandFor } from "./players";
import { ageOnEventDay } from "./registration-schema";
import { sendEmail } from "./email";
import { applicationOutcome } from "./email-templates";
import type { ChampionshipEvent, Registration } from "./types";

function makeCheckInToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Create the account, issue the check-in token, and tell them.
 *
 * Safe to re-run: an application that already has a player keeps it, and the email is
 * idempotent on the reference, so a repeated pass will not create a second account or send
 * a second message.
 */
export async function confirmSelection(
  event: ChampionshipEvent,
  registration: Registration,
): Promise<{ ok: boolean; playerId: string }> {
  const db = await getDb();
  const a = registration.answers;
  const age = ageOnEventDay(String(a.dob), event.date) ?? 18;

  const player = await upsertPlayer({
    email: String(a.email),
    displayName: String(a.fullName).split(" ")[0] || String(a.fullName),
    ageBand: bandFor(age),
    dateOfBirth: String(a.dob),
    region: typeof a.region === "string" ? a.region : null,
    avatarId: typeof a.avatarId === "string" ? a.avatarId : null,
    gamertag: typeof a.psnId === "string" ? a.psnId : null,
    // From this record and nowhere else — never a field a child can fill in.
    guardianEmail:
      age < 18 && typeof a.guardianEmail === "string" ? a.guardianEmail : null,
  });

  const token = registration.checkInToken || makeCheckInToken();
  await db
    .prepare("UPDATE registrations SET player_id = ?, check_in_token = ? WHERE id = ?")
    .bind(player.id, token, registration.id)
    .run();

  const t = applicationOutcome({
    selected: true,
    displayName: player.displayName,
    eventTitle: event.title,
    eventDate: event.date,
    reference: registration.reference,
  });
  await sendEmail({
    kind: "application-selected",
    to: String(a.email),
    ...t,
    idempotencyKey: `application-selected:${registration.reference}`,
  });

  return { ok: true, playerId: player.id };
}

/** Tell someone they were not drawn. No account is created. */
export async function notifyNotSelected(
  event: ChampionshipEvent,
  registration: Registration,
): Promise<void> {
  const a = registration.answers;
  const t = applicationOutcome({
    selected: false,
    displayName: String(a.fullName).split(" ")[0] || String(a.fullName),
    eventTitle: event.title,
    eventDate: event.date,
    reference: registration.reference,
  });
  await sendEmail({
    kind: "application-not-selected",
    to: String(a.email),
    ...t,
    idempotencyKey: `application-not-selected:${registration.reference}`,
  });
}
