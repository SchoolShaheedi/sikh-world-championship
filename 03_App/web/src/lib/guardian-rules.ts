/**
 * Guardian requirements by age, and the medical tick-list.
 *
 * ONE SOURCE OF TRUTH. The sign-up form and the server validator both read from here, so
 * the questions a registrant is asked and the questions the server insists on can never
 * drift apart. If they drift, a child gets in without the consent we think we hold.
 *
 * Round 24 decision: tiered, not blanket. Requiring a parent to stay on site for a
 * 17-year-old is out of step with what 16–17s already do independently, and it quietly
 * excludes families who cannot spare an adult for a whole Saturday — which works against
 * the point of the event. Requiring it for an 8-year-old is obviously right. So the rule
 * sits where the risk actually is.
 */

export type GuardianTier =
  /** 8–11: a guardian stays on site for the whole event. */
  | "on-site"
  /** 12–15: dropped off and collected, guardian contactable, no unaccompanied exit. */
  | "drop-off"
  /** 16–17: may attend and leave independently, with guardian consent on record. */
  | "independent"
  /** 18+: no guardian block. */
  | "none";

export function guardianTier(age: number): GuardianTier {
  if (age >= 18) return "none";
  if (age >= 16) return "independent";
  if (age >= 12) return "drop-off";
  return "on-site";
}

/** Anyone under 18 has a guardian block of some shape. */
export function needsGuardian(age: number): boolean {
  return guardianTier(age) !== "none";
}

/** Shown on the form so a parent understands why they are being asked. */
export const TIER_EXPLANATION: Record<Exclude<GuardianTier, "none">, string> = {
  "on-site":
    "Players under 12 need a parent or guardian to stay at the venue for the whole event. " +
    "You don't need to sit with them — there's seating, langar and a big screen — but we " +
    "need you contactable in the building.",
  "drop-off":
    "Players aged 12 to 15 need a parent or guardian to drop them off and collect them. " +
    "You don't have to stay, but you do need to be reachable and able to get back to the " +
    "venue if we call.",
  independent:
    "Players aged 16 and 17 can come and go on their own, but we still need a parent or " +
    "guardian's permission and their contact details on record.",
};

/**
 * How far a 12–15's guardian will be during the event.
 *
 * A fixed menu rather than a text box: it is answerable honestly in one tap, and it gives
 * a volunteer something comparable to act on at the desk. "Roughly an hour away" is a
 * different conversation from "in the car park".
 */
export const GUARDIAN_DISTANCE = [
  "Staying at the venue anyway",
  "Within 15 minutes",
  "Within 30 minutes",
  "Within an hour",
  "More than an hour away",
] as const;
export type GuardianDistance = (typeof GUARDIAN_DISTANCE)[number];

/**
 * Medical tick-list.
 *
 * Structured rather than one free-text box, for three reasons: a volunteer can scan it in
 * an emergency instead of reading prose, "None" becomes an explicit answer rather than a
 * blank nobody can interpret, and structured data is far easier to retention-manage than
 * free text (00_Docs/DATA-LAYER.md, and the retention policy owed in 04_Legal/).
 *
 * The free-text `medical` box stays, for the detail that actually matters — which
 * inhaler, which allergy, what to do.
 */
export const MEDICAL_CONDITIONS = [
  "Asthma",
  "Severe allergy (incl. anaphylaxis)",
  "Epilepsy or seizures",
  "Diabetes",
  "Heart condition",
  "Additional needs or learning disability",
  "Other (described below)",
  "None",
] as const;
export type MedicalCondition = (typeof MEDICAL_CONDITIONS)[number];

/** The one value that means "nothing to declare", so blank never has to be guessed at. */
export const MEDICAL_NONE: MedicalCondition = "None";
