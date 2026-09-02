/**
 * Who is backing the championship, and what a profile holder actually gets from them.
 *
 * `offer` is the thing a player can redeem. It is shown on /sponsors and on /join, so it
 * must be true and it must be redeemable TODAY — the site spent three rounds promising
 * sponsor perks that did not exist, and a discount code that does not work is worse for
 * the sponsor than no mention at all.
 *
 * Adding a sponsor: add an entry here. Nothing else needs changing.
 */
export interface Sponsor {
  name: string;
  /** Shown as the link text and used as the link. No scheme — added at render. */
  domain: string;
  /** One line on who they are. */
  blurb: string;
  /** What a profile holder gets, or null for a supporter with no offer. */
  offer: { detail: string; code: string } | null;
}

export const SPONSORS: Sponsor[] = [
  {
    name: "Vismaad Creatives",
    domain: "vismaadcreatives.com",
    blurb: "Design and creative studio, and the first business to back the championship.",
    offer: { detail: "10% off", code: "SWC26" },
  },
];

/** The offers that are actually live, for the profile benefits list. */
export function liveOffers(): Sponsor[] {
  return SPONSORS.filter((s) => s.offer !== null);
}
