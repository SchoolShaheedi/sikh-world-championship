/** Organisation-level brand config. One place to change names, links and contacts. */
export const ORG = {
  name: "Sikh World Championship",
  short: "SWC",
  tagline: "One community. Every arena.",
  intro:
    "Sikh World Championship brings Sikhs together through competition — esports, sport, and mind games. We run events where players meet, compete, and build something that lasts beyond the final whistle.",

  // TODO: confirm before launch
  email: "TBC@sikhworldchampionship.com",
  socials: {
    instagram: "TBC",
    tiktok: "TBC",
    youtube: "TBC",
  },

  /** Safeguarding contacts — required before any under-18 event goes live. */
  safeguarding: {
    leadName: "TBC",
    leadEmail: "TBC",
    /** Moderators for the 16+ chat. At least two named people. */
    moderators: ["TBC", "TBC"] as string[],
  },
} as const;
