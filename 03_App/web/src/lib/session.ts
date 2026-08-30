/**
 * Who is asking.
 *
 * Everything that needs to know the viewer calls `currentPlayer()` and nothing else, which
 * is what made replacing the stub a single-file change. It now resolves a real session
 * cookie against the database.
 *
 * FAILS CLOSED. An unknown, expired or absent session is `null`, and every caller must
 * handle that as "no access". The stub used to return a fixed player who was also a
 * moderator, which made /moderation readable by anyone (round 24). Nothing here may ever
 * invent a viewer again.
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE, playerForSession } from "./auth";
import { hasApproval } from "./guardian-store";
import type { AgeBand } from "./types";

export interface SessionPlayer {
  id: string;
  /**
   * Their own address, shown only to them. Used to prefill the interest form so a
   * returning player is not retyping it — never rendered anywhere another player can see.
   */
  email: string;
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
 * The signed-in player, or null.
 *
 * Returns null rather than throwing: most callers want to render a signed-out view, and
 * an exception would turn "not signed in" into a 500.
 */
export async function currentPlayer(): Promise<SessionPlayer | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const player = await playerForSession(token);
  if (!player) return null;

  return {
    id: player.id,
    email: player.email,
    displayName: player.displayName,
    ageBand: player.ageBand,
    region: player.region ?? "",
    avatarId: player.avatarId ?? "kesri-1",
    gamertag: player.gamertag ?? "",
    eventVerified: player.eventVerified,
    // Read live rather than cached, so revoking permission takes effect immediately —
    // that is what makes "you can withdraw at any time" true.
    guardianApprovedForBoard:
      player.ageBand === "16+" ? true : await hasApproval(player.id),
    guardianEmail: player.ageBand === "16+" ? null : player.guardianEmail,
    isModerator: player.isModerator,
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
