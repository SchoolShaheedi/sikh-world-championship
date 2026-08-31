/**
 * Support & report a problem.
 *
 * Deliberately open to people WITHOUT an account. The most important message this system
 * will ever receive is a worried parent who has never logged in, and making them create
 * an account first would lose exactly the report we most need to see.
 */

export const SUPPORT_CATEGORIES = [
  {
    id: "safety",
    label: "A safety or safeguarding concern",
    help: "Someone's behaviour towards a young person, or anything that worries you about a player's safety. These go straight to the top of the moderators' queue.",
    urgent: true,
  },
  {
    id: "player",
    label: "Report a player",
    help: "Abuse, bullying, cheating, or someone breaking the code of conduct.",
    urgent: true,
  },
  {
    id: "account",
    label: "Account or sign-up problem",
    help: "Can't sign in, wrong details on your registration, want your account deleted.",
    urgent: false,
  },
  {
    id: "event",
    label: "Question about an event",
    help: "Dates, venue, what to bring, accessibility, langar and dietary needs.",
    urgent: false,
  },
  {
    id: "volunteer",
    label: "I'd like to volunteer",
    help: "Which role suits you, and whether you can give the whole day. A 64-player event needs about 15 people.",
    urgent: false,
  },
  {
    id: "technical",
    label: "Something on the site is broken",
    help: "A page won't load, a button doesn't work, something looks wrong.",
    urgent: false,
  },
  {
    id: "other",
    label: "Something else",
    help: "Anything that doesn't fit above, including feedback and suggestions.",
    urgent: false,
  },
] as const;

export type SupportCategoryId = (typeof SUPPORT_CATEGORIES)[number]["id"];

export type TicketStatus = "new" | "in-progress" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  /** Short human reference, given to the person so they can follow up. */
  reference: string;
  category: SupportCategoryId;
  /** True for safety and player reports — these jump the queue. */
  urgent: boolean;
  subject: string;
  message: string;
  /** Optional — someone can raise a concern anonymously. */
  name: string | null;
  email: string | null;
  /** Set when the reporter is signed in. Null for anonymous or logged-out reports. */
  playerId: string | null;
  /** Flagged when the reporter says they're a parent or guardian. */
  fromGuardian: boolean;
  status: TicketStatus;
  createdAt: string;
  assignedTo: string | null;
  handledAt: string | null;
  resolution: string | null;
}

export function categoryById(id: string) {
  return SUPPORT_CATEGORIES.find((c) => c.id === id);
}
