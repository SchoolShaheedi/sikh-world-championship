/**
 * TEMPORARY SESSION STUB.
 *
 * Accounts are a locked decision but auth isn't built yet, so the board needs someone to
 * be "you". This returns a fixed demo player.
 *
 * REPLACE BEFORE LAUNCH with the real session lookup (Supabase auth). Everything that
 * needs to know who the viewer is calls currentPlayer() and nothing else, so this is the
 * only file that changes.
 */
import type { AgeBand } from "./types";
import { hasApproval } from "./guardian-store";

export interface SessionPlayer {
  id: string;
  displayName: string;
  ageBand: AgeBand;
  region: string;
  avatarId: string;
  gamertag: string;
  /** Attended an SWC event and was checked in by a volunteer. */
  eventVerified: boolean;
  /**
   * Under-16s only: has a parent or guardian switched the board on for them?
   * Meaningless for 16+ and always treated as true for them.
   */
  guardianApprovedForBoard: boolean;
  /** Where the guardian notification goes when an under-16 connects with someone. */
  guardianEmail: string | null;
  isModerator: boolean;
}

/**
 * Moderator access, while auth is still a stub.
 *
 * DENY BY DEFAULT. This used to return `true` unconditionally, which made /moderation —
 * the page that renders safeguarding disclosures, reporter identities and parents' email
 * addresses — readable by anyone who typed the URL. A stub that fails open is a data
 * breach waiting for a deploy.
 *
 * To work on the page locally: SWC_DEV_MODERATOR=1 npm run dev
 * It is refused in production even if the variable is set, so the opt-in cannot escape
 * a developer's machine. Delete this whole function when real auth lands.
 */
function stubModeratorAccess(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.SWC_DEV_MODERATOR === "1";
}

/**
 * Flip `ageBand` to "U16" (and set a guardianEmail) to see the under-16 board and the
 * guardian-consent gate while developing.
 */
export async function currentPlayer(): Promise<SessionPlayer> {
  const id = "demo-player-1";
  const ageBand: AgeBand = "16+";

  return {
    id,
    displayName: "Jagdeep",
    ageBand,
    region: "Birmingham",
    avatarId: "kesri-1",
    gamertag: "jagdeep_10",
    eventVerified: true,
    // Read from the approval store rather than hardcoded, so revoking permission takes
    // effect immediately — that's what makes "you can withdraw at any time" true.
    guardianApprovedForBoard:
      ageBand === "16+" ? true : await hasApproval(id),
    guardianEmail: ageBand === "16+" ? null : "parent@example.com",
    isModerator: stubModeratorAccess(),
  };
}

/**
 * Can this player use the board?
 * Everyone can, EXCEPT an under-16 whose guardian hasn't switched it on yet.
 * Age segregation is handled separately, in the board query — see boardFor().
 */
export function canUseBoard(player: SessionPlayer): boolean {
  if (player.ageBand === "16+") return true;
  return player.guardianApprovedForBoard;
}
