/**
 * What a Sikh World Championship profile is for.
 *
 * `live: true` means it works today. `live: false` renders as "coming" wherever this list
 * is shown, and that distinction is not decoration: the support page had to be rewritten
 * in round 41 because it described features the app did not have. A person deciding
 * whether to hand over their child's details should be able to tell what they are actually
 * getting from what is planned.
 *
 * The sponsor perks are the owner's intent (round 42) and are real as a plan, but no
 * sponsor has yet agreed a discount — see 00_Docs/MEETING-QUESTIONS.md. Move one to
 * `live: true` only when there is an offer a profile holder can actually redeem.
 */
export interface ProfileBenefit {
  title: string;
  detail: string;
  live: boolean;
}

export const PROFILE_BENEFITS: ProfileBenefit[] = [
  {
    title: "Register interest in one step, every time",
    detail:
      "Your details are already with us, so entering the next event asks only what is specific to it.",
    live: true,
  },
  {
    title: "Your player card",
    detail:
      "A card with your name, region and division that you can share — issued when you get a place.",
    live: true,
  },
  {
    title: "A trophy cabinet that follows you",
    detail:
      "Every event you compete in, across every sport and every year, in one place.",
    live: true,
  },
  {
    title: "Sponsor offers",
    detail:
      "Discounts from the businesses backing the championship — the plan is things like money off game merchandise and pre-orders, and offers from Sikh businesses. Nothing is live yet; profile holders get them first when they are.",
    live: false,
  },
];
