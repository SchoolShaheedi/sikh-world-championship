/**
 * Organisation-level brand config. One place to change names and links.
 *
 * NO EMAIL ADDRESS HERE, deliberately. Every "contact us" goes to /support, which is a
 * form: it reaches a moderator queue with assignment and an audit trail, it works without
 * an account or a name, and it puts no address on a public page to be scraped. An address
 * can be added later if there is a reason; a form is the better default for a service used
 * by children.
 *
 * The safeguarding contact block was removed with the /safeguarding page (round 40). The
 * obligation did not go away — see 04_Legal/SAFEGUARDING-POLICY.md, which still needs its
 * named people.
 */
export const ORG = {
  name: "Sikh World Championship",
  short: "SWC",
  tagline: "One community. Every arena.",
  intro:
    "Sikh World Championship brings Sikhs together through competition — esports, sport, and mind games. We run events where players meet, compete, and build something that lasts beyond the final whistle.",

  // TODO: claim these and fill them in before announcing publicly.
  socials: {
    instagram: "TBC",
    tiktok: "TBC",
    youtube: "TBC",
  },
} as const;
