import type { ChampionshipEvent } from "@/lib/types";

/**
 * EVENT 1 — Sikh FC 27 Championship.
 *
 * Fields marked TBC are placeholders. Fill them in and the whole site updates:
 * homepage, events list, event page, sign-up form and bracket all read from here.
 * When date + venue are confirmed, also flip `detailsConfirmed` to true.
 */
export const sikhFc27: ChampionshipEvent = {
  slug: "sikh-fc-27",
  title: "Sikh FC 27 Championship",
  shortTitle: "FC 27",
  discipline: "fifa",
  status: "announced",
  format: "single-elimination",

  tagline: "64 players. One bracket. One champion. PS5.",
  description:
    "The first Sikh World Championships event. Sixty-four players aged 12 to 25, in one " +
    "hall in Leicester, on PS5 — straight knockout, win and you go through. One open " +
    "division, one champion. Free to enter, langar on the day, and a live bracket on the " +
    "big screen from first whistle to final.",

  date: "2026-10-03",
  // Start and finish. The detailed running order — when each round is called, when each
  // station turns over, when langar is served — is not this field: it belongs on the
  // reminder email and the day sheet, and it is not confirmed yet.
  times: "09:30 – 16:30",
  venue: {
    name: "GNG FC — Riverside Football Ground",
    // The LAST line is the town or city, and code relies on that: `venueLocality()` in
    // lib/format.ts reads it for the guardian email, which says "on <date> in <place>".
    // Putting the street first and the city last is what keeps that sentence right.
    addressLines: ["51 Braunstone Lane East", "Braunstone Town", "Leicester"],
    postcode: "LE3 2FD",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=GNG+FC+Riverside+Football+Ground+LE3+2FD",
  },
  // Confirmed in round 46: date and venue are both real. This flag is what the event page
  // and the sign-up page use to decide whether they may state the details — while it was
  // false they said "being finalised" instead of naming a place we had not booked.
  detailsConfirmed: true,

  // A week before the event, leaving time to notify everyone and backfill drop-outs.
  // Configurable: move this date and the form, the countdown and the draw all follow.
  applicationsCloseAt: "2026-09-26",

  capacity: 64,
  /**
   * ONE open division, ages 12 to 25, one champion.
   *
   * CONSIDERED AND DEFERRED TWICE (round 37, and again when the range went to 25 on
   * 2026-09-02): splitting into 12–17 and 18+. The argument for it got stronger, not
   * weaker. This event seats unrelated adults and children in the same bracket, at the
   * same station, for a match with no parent present — and the widest possible draw is now
   * a 12-year-old against a 25-year-old, which is a poor game for both and a supervision
   * question for one of them. The owner chose to keep it open, twice, with the reasoning
   * recorded — so this is a decision revisited rather than one nobody thought about.
   *
   * The supervision tiers do NOT stretch with the age range: they stop at 18, because
   * that is where childhood stops. A 25-year-old is simply an adult entrant.
   *
   * If it is revisited, the app needs no new capability: the sign-up form derives division
   * from date of birth, so nobody can pick the easier bracket.
   */
  divisions: [
    // 25, not 21 — extended 2026-09-02. This is the line the form enforces: change it and
    // eligibility changes, whatever the rules text says. It widens the gap inside a single
    // open bracket to thirteen years, so a 12-year-old can be drawn against a 25-year-old
    // and sit at a station with them; the supervision tiers are unchanged and stop at 18.
    { id: "open", name: "Open", minAge: 12, maxAge: 25, capacity: 64 },
  ],

  entryFee: 0,
  currency: "GBP",

  rules: [
    "Played on PS5 — consoles, screens and controllers are provided. Bring your own controller if you prefer; it must be a standard PS5 pad.",
    "Kick-off mode only. No Ultimate Team, no custom squads.",
    "Teams must be equal star rating. Both players agree, or the referee assigns.",
    "3-minute halves. The final is played with 5-minute halves.",
    "One open division — ages 12 to 25 compete in the same bracket.",
    // A rule and not a footnote: it is checked at the door for every single player, and the
    // accepted documents live in src/data/id-check.ts so the form, both emails and the desk
    // all read the same list. Added 2026-09-03 on the team's decision.
    "Bring something showing your date of birth to check in — a birth certificate, passport, NHS card, or a school letter or card that shows it. A photo of it on a phone is fine. We look at it, hand it back, and keep nothing from it.",
    "Straight knockout from the first round. Win and you go through; lose and you are out.",
    "Knocked out early? Spare consoles are set up for friendly matches all day — nobody who came to play goes home after one game.",
    "Draws go to extra time, then penalties.",
    "Default game settings. Legacy defending off. No custom tactics carried in on a USB.",
    "Report to your station within 5 minutes of being called, or the match is forfeited.",
    "One warning for abusive language or controller throwing. Second time, you're out.",
    "Code of conduct applies all day, to players and to anyone who came with them.",
  ],

  prizes: [
    "Champion — PlayStation 5",
    "Runner-up — EA Sports FC 27",
    "Third place — PS5 controller",
  ],

  awardTiers: [
    { id: "champion",  label: "Champion",  tier: "gold" },
    { id: "runner-up", label: "Runner-up", tier: "silver" },
    { id: "third",     label: "Third",     tier: "bronze" },
  ],

  // Sport-specific sign-up questions. A chess event would ask for a FIDE rating here
  // instead, with no code change anywhere else.
  formFields: [
    {
      name: "skill",
      label: "How would you rate yourself?",
      type: "select",
      required: true,
      options: ["First time competing", "Casual player", "Play a lot", "Very competitive"],
      help: "Only used to seed the draw, so the strongest players don't all meet in round one. Be honest — it makes your day better.",
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
