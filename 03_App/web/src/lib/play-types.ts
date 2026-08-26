/**
 * Online play — "Looking For Game" board.
 *
 * SWC does not host gameplay. The match happens on PlayStation. This is matchmaking and
 * coordination only: find someone, agree a window, swap PSN IDs, go.
 *
 * OPEN TO ALL AGES, with under-16s protected by four things working together
 * (see DECISIONS.md round 9). No one of these is sufficient alone:
 *
 *  1. STRICT AGE-BAND SEGREGATION. U16 and 16+ are two separate pools. An adult cannot
 *     see, request, or be requested by an under-16 — enforced in the data layer, not the
 *     UI. This is the load-bearing protection: it removes adult-to-child contact entirely
 *     rather than trying to police it.
 *  2. GUARDIAN CONSENT TO USE THE BOARD AT ALL. Under-16s need their guardian to switch
 *     it on. We already hold the guardian's email from event sign-up.
 *  3. GUARDIAN NOTIFIED ON EVERY CONNECTION. When an under-16 swaps gamertags with
 *     someone, their guardian gets an email saying who with. Transparency beats blocking:
 *     a guardian who can see what's happening can step in early.
 *  4. NO FREE TEXT, ANYWHERE. Posts and requests are built from fixed menus.
 *
 * Plus report and block on everything, with a moderation queue behind them.
 */

/** Availability windows, not "online now" — see ONLINE-PLAY-AND-CHAT.md recommendation 2. */
export const WINDOWS = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekday late night",
  "Saturday daytime",
  "Saturday evening",
  "Sunday daytime",
  "Sunday evening",
] as const;
export type Window = (typeof WINDOWS)[number];

export const PLATFORMS = ["PS5", "Xbox", "PC", "Switch"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const GAMES = [
  "EA FC 26",
  "EA FC 25",
  "Rocket League",
  "Call of Duty",
  "Fortnite",
  "NBA 2K",
  "F1",
  "Chess (online)",
] as const;
export type Game = (typeof GAMES)[number];

export const INTENSITY = ["Just for fun", "Competitive", "Either"] as const;
export type Intensity = (typeof INTENSITY)[number];

/**
 * Preset notes. A fixed menu rather than a text box: it keeps the board friendly, and
 * it is the single line of code that makes the board safe without a moderator.
 */
export const PRESET_NOTES = [
  "New to this, happy to learn",
  "Looking for regular games",
  "Up for a rematch any time",
  "Prefer a relaxed game, no rage",
  "Would like a decent challenge",
  "Happy to play with anyone",
] as const;
export type PresetNote = (typeof PRESET_NOTES)[number];

export interface LfgPost {
  id: string;
  playerId: string;
  /**
   * The pool this post belongs to. Under-16 posts are only ever shown to under-16s.
   * Copied onto the post rather than looked up, so a player changing age band later
   * can never retroactively expose an old post to the wrong pool.
   */
  ageBand: "U16" | "16+";
  /** Attended an SWC event and was checked in by a volunteer. Shown as a badge. */
  eventVerified: boolean;
  /** Display name only — never a surname. */
  displayName: string;
  avatarId: string | null;
  /** Region, never a postcode. */
  region: string;
  game: Game;
  platform: Platform;
  windows: Window[];
  intensity: Intensity;
  note: PresetNote;
  createdAt: string;
  /** Posts expire so the board doesn't fill with people who left months ago. */
  expiresAt: string;
  status: "open" | "closed" | "removed";
}

export type RequestStatus = "pending" | "accepted" | "declined" | "expired";

export interface GameRequest {
  id: string;
  postId: string;
  fromPlayerId: string;
  fromDisplayName: string;
  /**
   * The requester's region, copied onto the request.
   * Needed because the post belongs to the RECIPIENT — so when a guardian is told who
   * their child just connected with, the post's region is the child's own, not the
   * other player's. Storing it here is the only way to name the right person.
   */
  fromRegion: string;
  toPlayerId: string;
  proposedWindow: Window;
  note: PresetNote;
  status: RequestStatus;
  createdAt: string;
  respondedAt: string | null;
  /**
   * PSN IDs are held here and released to BOTH players only once the request is
   * accepted. Never expose a gamertag on the open board — that's the one piece of
   * information that lets someone contact a player outside our walls.
   */
  fromGamertag: string;
  toGamertag: string;
}

export const REPORT_REASONS = [
  "Abusive or threatening",
  "Bullying or harassment",
  "Adult or inappropriate content",
  "Asking for personal information",
  "Trying to move the chat elsewhere",
  "Someone under 16 using the board",
  "Spam or advertising",
  "Something else",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportStatus = "open" | "investigating" | "actioned" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  targetPlayerId: string;
  targetDisplayName: string;
  /** What was reported — a post id, a request id, or just the profile. */
  context: string;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  createdAt: string;
  /** Moderator handling it. Set on claim, so two volunteers don't duplicate work. */
  assignedTo: string | null;
  handledAt: string | null;
  resolution: string | null;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export const POST_LIFETIME_DAYS = 14;

/** Pending requests expire, so nobody is left waiting on a player who's gone. */
export const REQUEST_LIFETIME_DAYS = 7;
