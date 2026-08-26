/**
 * Guardian approval for under-16 board access.
 *
 * HOW IT WORKS
 *  1. An under-16 asks for access. We create a request with a random token and email
 *     the guardian address held from their event registration.
 *  2. The guardian opens /guardian/<token>, reads exactly what they're agreeing to, and
 *     approves or declines. No account, no password — they'd never create one.
 *  3. The same link stays valid so they can revoke at any time. Revocation is the part
 *     people forget, and it's the part that makes consent meaningful.
 *
 * KNOWN LIMITATION, stated plainly because it should not be discovered later:
 * a determined 13-year-old can put their own email in the guardian field. No email-based
 * consent system solves this. What reduces it here is that the guardian's email is
 * collected at EVENT REGISTRATION, where a volunteer is present and the guardian's phone
 * number is captured too — so the address can be checked against a real person. Treat
 * event-verified guardian emails as trustworthy and self-entered ones as weaker, and
 * consider requiring event attendance before under-16 board access.
 */

export type ApprovalStatus = "pending" | "approved" | "declined" | "revoked";

export interface GuardianApproval {
  id: string;
  playerId: string;
  childDisplayName: string;
  guardianEmail: string;
  /** Random, long, and the only thing standing between a stranger and this decision. */
  token: string;
  status: ApprovalStatus;
  createdAt: string;
  respondedAt: string | null;
  /** Every change, so a guardian can be shown the history and disputes can be settled. */
  history: {
    at: string;
    from: ApprovalStatus;
    to: ApprovalStatus;
  }[];
  /**
   * Pending requests expire. An approval link left live in an inbox for a year is a
   * liability — the child's circumstances change, and so does who reads that inbox.
   */
  expiresAt: string;
}

/** How long a PENDING request stays actionable. Approved records don't expire — the
 *  guardian needs a permanent way back in to revoke. */
export const APPROVAL_REQUEST_LIFETIME_DAYS = 30;

/** What the guardian is actually agreeing to. Shown on the approval page verbatim, and
 *  kept here so the page, the email and the safeguarding policy can never drift apart. */
export const GUARDIAN_TERMS = [
  "Your child will only ever see, and be seen by, other under-16 players. Adults cannot see or contact them here at all.",
  "There is no chat and no free typing. Posts and requests are built from a fixed set of options.",
  "Their gamertag is only shared with another player once they have both agreed to a game.",
  "You will get an email each time your child connects with someone, telling you who, where they're from, and what game.",
  "Their profile never shows a surname, a school, an exact age, or an address — only a first name and a region.",
  "You can withdraw this permission at any time using the same link, and access stops immediately.",
] as const;
