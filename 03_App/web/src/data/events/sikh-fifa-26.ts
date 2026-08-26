import type { ChampionshipEvent } from "@/lib/types";

/**
 * EVENT 1 — Sikh FIFA 26 Championship.
 *
 * Fields marked TBC are placeholders. Fill them in and the whole site updates:
 * homepage, events list, event page, sign-up form and bracket all read from here.
 * When date + venue are confirmed, also flip `detailsConfirmed` to true.
 */
export const sikhFifa26: ChampionshipEvent = {
  slug: "sikh-fifa-26",
  title: "Sikh FIFA 26 Championship",
  shortTitle: "FIFA 26",
  discipline: "fifa",
  status: "announced",
  format: "groups-then-knockout",

  tagline: "64 players. One bracket. One champion. PS5.",
  description:
    "The first Sikh World Championship event. Sixty-four players, in one hall, on PS5 — " +
    "group stage into knockouts, so everyone plays at least three matches. One open " +
    "division, all ages, one champion. Free to enter, langar on the day, and a live " +
    "bracket on the big screen from first whistle to final.",

  date: null,        // TODO
  times: null,       // TODO — suggested 09:30–16:30
  venue: null,       // TODO
  detailsConfirmed: false,

  capacity: 64,
  // ONE open division: everyone in the same bracket, all ages, one champion.
  // minAge is the only judgement call here — set at 8. Change this single number to
  // raise or lower the floor; the sign-up form reads it and turns anyone younger away
  // with an explanation.
  divisions: [
    { id: "open", name: "Open", minAge: 8, maxAge: 99, capacity: 64 },
  ],

  entryFee: 0,
  currency: "GBP",

  rules: [
    "Played on PS5. Consoles, screens and controllers are provided — bring your own controller if you prefer, it must be a standard PS5 pad.",
    "Kick-off mode only. No Ultimate Team, no custom squads.",
    "Teams must be equal star rating. Both players agree, or the referee assigns.",
    "6-minute halves in the group stage. The final is played with 8-minute halves.",
    "One open division — all ages compete in the same bracket.",
    "Group stage: 16 groups of 4. Top two in each group go through to the knockouts.",
    "Knockouts are single elimination. Draws go to extra time, then penalties.",
    "Default game settings. Legacy defending off. No custom tactics carried in on a USB.",
    "Report to your station within 5 minutes of being called, or the match is forfeited.",
    "Disconnects before the 10th minute are replayed. After that, the score stands.",
    "One warning for abusive language or controller throwing. Second time, you're out.",
    "Code of conduct applies all day, to players and to anyone who came with them.",
  ],

  prizes: [
    "Champion trophy",
    "Runner-up and semi-finalist trophies",
    "Medal for every player who competes",
    "Golden Boot — most goals scored across the day",
    "Clean Sheet award — fewest goals conceded",
    "Fair Play award — chosen by the volunteer team",
  ],

  awardTiers: [
    { id: "champion",    label: "Champion",      tier: "gold" },
    { id: "runner-up",   label: "Runner-up",     tier: "silver" },
    { id: "semi",        label: "Semi-finalist", tier: "bronze" },
    { id: "participant", label: "Competitor",    tier: "participant" },
    { id: "golden-boot", label: "Golden Boot",   tier: "special" },
    { id: "clean-sheet", label: "Clean Sheet",   tier: "special" },
    { id: "fair-play",   label: "Fair Play",     tier: "special" },
  ],

  // Sport-specific sign-up questions. A chess event would ask for a FIDE rating here
  // instead, with no code change anywhere else.
  formFields: [
    {
      name: "psnId",
      label: "PSN ID",
      type: "text",
      required: true,
      placeholder: "your PlayStation username",
      help: "This goes on your player card and is how we find you on the day.",
    },
    {
      name: "skill",
      label: "How would you rate yourself?",
      type: "select",
      required: true,
      options: ["First time competing", "Casual player", "Play a lot", "Very competitive"],
      help: "Only used for seeding, so first-round matches aren't lopsided. Be honest — it makes your day better.",
    },
    {
      name: "favouriteTeam",
      label: "Favourite team",
      type: "text",
      required: false,
      placeholder: "goes on your player card",
    },
    {
      name: "ownController",
      label: "I'll bring my own PS5 controller",
      type: "checkbox",
      required: false,
    },
  ],
};
