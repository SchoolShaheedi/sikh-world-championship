/**
 * Guardian requirements by age, and the medical tick-list.
 *
 * ONE SOURCE OF TRUTH. The sign-up form and the server validator both read from here, so
 * the questions a registrant is asked and the questions the server insists on can never
 * drift apart. If they drift, a child gets in without the consent we think we hold.
 *
 * ROUND 39 POLICY (supersedes the round 24 tiering):
 *
 *   12–15  a parent or guardian stays at the venue for the whole event
 *   16–17  may attend without a guardian, IF their guardian permits it
 *   18+    no guardian involvement
 *
 * The middle "dropped off and collected" tier is gone. Under-16s are no longer left at
 * the venue without their own adult.
 *
 * !! THE BOUNDARY AT 16 IS AN ASSUMPTION. The brief said "12–16 parents must remain" and
 * "16–18 parents can give permission", which overlap at 16. This reads it as 12–15 and
 * 16–17, matching the U16 / 16+ split the rest of the app already uses. If 16-year-olds
 * should instead need a parent on site, change GUARDIAN_PRESENCE_UNTIL below — it is one
 * number and everything follows.
 */

/** Below this age, a guardian must remain at the venue. */
export const GUARDIAN_PRESENCE_UNTIL = 16;
/** From this age, no guardian involvement at all. */
export const ADULT_FROM = 18;

export type GuardianTier =
  /** 12–15: a guardian stays on site for the whole event. */
  | "on-site"
  /** 16–17: may attend alone, with their guardian's permission on record. */
  | "independent"
  /** 18+: no guardian block. */
  | "none";

export function guardianTier(age: number): GuardianTier {
  if (age >= ADULT_FROM) return "none";
  if (age >= GUARDIAN_PRESENCE_UNTIL) return "independent";
  return "on-site";
}

/** Anyone under 18 has a guardian block of some shape. */
export function needsGuardian(age: number): boolean {
  return guardianTier(age) !== "none";
}

/** Shown on the form so a parent understands why they are being asked. */
export const TIER_EXPLANATION: Record<Exclude<GuardianTier, "none">, string> = {
  "on-site":
    "Players under 16 need a parent or guardian to stay at the venue for the whole event. " +
    "You don't need to sit with them — there's seating, langar and the bracket on the big " +
    "screen — but we need you in the building.",
  independent:
    "Players aged 16 and 17 can come on their own if you're happy for them to, but we " +
    "still need your permission and your contact details on record.",
};

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
