/**
 * Who referred an applicant.
 *
 * WHY THIS EXISTS: the project's aim is to reach less-connected Sikh youth, and referred
 * applicants are drawn first. Shaping who applies — through outreach and referral — is the
 * lawful way to serve that aim. A religious test at the door would not be.
 *
 * THIS IS NOT A RELIGION FIELD, and must never be treated as one. A list of Sikh
 * organisations makes the answer a proxy for religion, which is special category data by
 * inference. Three rules follow:
 *
 *   1. "Other" and "Nobody" are real, first-class options — never a dead end.
 *   2. It is stored as a referral source only. Nothing derives religion from it.
 *   3. The privacy notice says what it is used for: draw order, and nothing else.
 *
 * Add organisations here as partnerships are agreed; the form and the draw both read this
 * list, so nothing else needs changing.
 */
export const REFERRAL_ORGS = [
  "Shaheedi Bunga",
  "Devanhaar",
  "Basics of Sikhi",
  "Sikh Helpline",
  "Uni Sikh Society",
] as const;

/** Not a referral. Kept distinct so the draw can tell "no org" from "an org we don't list". */
export const REFERRAL_NONE = "Nobody — I found it myself";
export const REFERRAL_OTHER = "Another organisation";

export const REFERRAL_OPTIONS = [
  ...REFERRAL_ORGS,
  REFERRAL_OTHER,
  REFERRAL_NONE,
] as const;

export type ReferralOption = (typeof REFERRAL_OPTIONS)[number];

/**
 * Does this answer put the applicant in the referred pool?
 *
 * "Another organisation" counts: someone referred by a Sikh society we have not listed yet
 * is exactly who the outreach is meant to reach, and penalising them for our incomplete
 * list would be arbitrary.
 */
export function isReferred(value: string | undefined | null): boolean {
  return !!value && value !== REFERRAL_NONE;
}
