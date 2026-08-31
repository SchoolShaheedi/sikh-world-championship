/**
 * Registering interest in an event.
 *
 * This is the one place that turns a validated form submission into records. It does three
 * things, in this order:
 *
 *   1. creates or finds the person's PROFILE
 *   2. records the application against it
 *   3. tells the applicant, and their guardian if they are under 18
 *
 * WHY THE PROFILE IS CREATED HERE AND NOT ON SELECTION (changed in round 42). Until now an
 * account was minted only when someone was drawn, on the reasoning that filling in a form
 * does not make you a player. That reasoning was sound while a profile did nothing for
 * anyone who was not selected. It no longer holds: registration is for the PLATFORM, a
 * profile carries benefits of its own — a saved identity so the next event is one step,
 * a trophy cabinet, sponsor offers — and a person who registers interest and is not drawn
 * is still someone we want back for the next event.
 *
 * The cost of the change is real and is recorded in DECISIONS.md and the DPIA: we now hold
 * an account for everyone who ever registered interest, including children who never
 * attended. 04_Legal/RETENTION-POLICY.md is what stops that becoming indefinite.
 */
import { upsertPlayer, bandFor } from "./players";
import { resolveHandle } from "./handle";
import { ageOnEventDay } from "./registration-schema";
import { guardianTier, TIER_EXPLANATION } from "./guardian-rules";
import { apply, type ApplyResult } from "./store";
import { sendEmail } from "./email";
import { interestReceived, guardianInterestNotice } from "./email-templates";
import type { ChampionshipEvent, Division } from "./types";
import { venueLocality } from "./format";

export interface InterestResult extends ApplyResult {
  playerId: string;
}

export async function registerInterest(
  event: ChampionshipEvent,
  division: Division,
  answers: Record<string, string | boolean | string[]>,
): Promise<InterestResult> {
  const email = String(answers.email);
  const fullName = String(answers.fullName);
  // Falls back to 18 the same way selection.ts does: a missing date of birth cannot reach
  // here (the schema requires it), and defaulting to an adult band is the failure this
  // code must never make silently — so it is the schema, not this line, that guards it.
  const age = ageOnEventDay(String(answers.dob), event.date) ?? 18;
  const tier = guardianTier(age);

  const player = await upsertPlayer({
    email,
    // First name only. The display name is shown to other players; a surname is one of
    // the pieces that makes a child findable off-platform.
    displayName: fullName.split(" ")[0] || fullName,
    ageBand: bandFor(age),
    dateOfBirth: String(answers.dob),
    region: typeof answers.region === "string" ? answers.region : null,
    avatarId: typeof answers.avatarId === "string" ? answers.avatarId : null,
    gamertag: typeof answers.psnId === "string" ? answers.psnId : null,
    /**
     * The public name. Resolved here rather than in the form so a submission made outside
     * the browser still gets one — the bracket must never fall back to a full name.
     */
    handle: resolveHandle(
      answers.handle,
      fullName,
      typeof answers.psnId === "string" ? answers.psnId : undefined,
    ),
    // From this record and nowhere else — never a field a child can fill in about
    // themselves later.
    guardianEmail:
      age < 18 && typeof answers.guardianEmail === "string"
        ? answers.guardianEmail
        : null,
  });

  const result = await apply({
    eventSlug: event.slug,
    divisionId: division.id,
    answers,
    playerId: player.id,
  });

  // Emails never block the write. sendEmail records failures rather than throwing, and a
  // failed acknowledgement must not lose an application that is already saved — moderators
  // see failed sends at the top of /moderation.
  await sendEmail({
    kind: "interest-received",
    to: email,
    ...interestReceived({
      displayName: player.displayName,
      eventTitle: event.title,
      eventDate: event.date,
      reference: result.reference,
      drawAfter: event.applicationsCloseAt ?? null,
    }),
    idempotencyKey: `interest-received:${result.reference}`,
  });

  /**
   * The guardian copy.
   *
   * Sent whenever the applicant is under 18, even if the guardian address is the same as
   * the one on the form. It is the only thing that puts "your child registered, and the
   * form says you agreed" in front of the adult it was claimed about — everything else on
   * that form was typed by whoever was sitting at the keyboard.
   */
  const guardianEmail =
    typeof answers.guardianEmail === "string" ? answers.guardianEmail.trim() : "";
  if (age < 18 && guardianEmail) {
    await sendEmail({
      kind: "guardian-interest-notice",
      to: guardianEmail,
      ...guardianInterestNotice({
        childDisplayName: player.displayName,
        eventTitle: event.title,
        eventDate: event.date,
        venue: venueLocality(event),
        supervision:
          tier === "none"
            ? "They are old enough to attend without a parent or guardian."
            : TIER_EXPLANATION[tier],
        reference: result.reference,
      }),
      idempotencyKey: `guardian-interest-notice:${result.reference}`,
    });
  }

  return { ...result, playerId: player.id };
}
