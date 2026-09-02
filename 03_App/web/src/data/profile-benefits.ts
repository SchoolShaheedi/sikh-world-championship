/**
 * What a Sikh World Championships profile is for.
 *
 * `live: true` means it works today. `live: false` renders as "coming" wherever this list
 * is shown, and that distinction is not decoration: the support page had to be rewritten
 * in round 41 because it described features the app did not have. A person deciding
 * whether to hand over their child's details should be able to tell what they are actually
 * getting from what is planned.
 *
 * The sponsor perk went `live: true` on 2026-09-01, when the first sponsor agreed a real
 * code. The rule that got it there stands for the next one: an offer goes live only when
 * a profile holder can actually redeem it. The offers themselves live in
 * `src/data/sponsors.ts`, so this file never has to be edited to add one.
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
      "What the businesses backing the championship put up for players. Live now: day-exclusive SWC merch from Vismaad Creatives. More as they are agreed — profile holders hear first.",
    live: true,
  },
];
