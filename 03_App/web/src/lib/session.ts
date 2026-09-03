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
import { hasDeskAccess } from "./players";
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
  /**
   * Their own date of birth, shown only to them, and only to prefill the interest form
   * for a second event. Never rendered anywhere another player can see — the public
   * subset is an age BAND, which is the whole reason the band exists as a field.
   */
  dateOfBirth: string;
  region: string;
  avatarId: string;
  gamertag: string;
  /**
   * The name shown publicly — bracket, big screen, player card. Null on an account made
   * before round 44; read `publicName()` rather than this when rendering.
   */
  handle: string | null;
  /** Attended an SWC event and was checked in by a volunteer. */
  eventVerified: boolean;
  /**
   * Under-16s only: has a parent or guardian switched the board on for them?
   * Meaningless for 16+ and always treated as true for them.
   */
  guardianApprovedForBoard: boolean;
  /** Where the guardian notification goes when an under-16 connects with someone. */
  guardianEmail: string | null;
  /**
   * The reusable contact details, so entering a second event is confirming rather than
   * retyping. Their own data, shown only to them, and cleared from the profile once the
   * registration behind it is purged — see `purgeStaleProfileContact()`.
   */
  fullName: string | null;
  mobile: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
  isModerator: boolean;
  /**
   * Desk staff only: the arrival desk and nothing else (2026-09-03). False for a
   * moderator, who has more — use `canWorkDesk` rather than either flag on its own.
   */
  isDesk: boolean;
  /** Moderator OR desk staff. What every check-in gate actually asks. */
  canWorkDesk: boolean;
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
    dateOfBirth: player.dateOfBirth,
    region: player.region ?? "",
    avatarId: player.avatarId ?? "kesri-1",
    gamertag: player.gamertag ?? "",
    handle: player.handle,
    eventVerified: player.eventVerified,
    // Read live rather than cached, so revoking permission takes effect immediately —
    // that is what makes "you can withdraw at any time" true.
    guardianApprovedForBoard:
      player.ageBand === "16+" ? true : await hasApproval(player.id),
    guardianEmail: player.ageBand === "16+" ? null : player.guardianEmail,
    fullName: player.fullName,
    mobile: player.mobile,
    // Guardian details are meaningless for 16+ and must not be offered to an adult's
    // next entry form — the same reasoning as guardianEmail directly above.
    guardianName: player.ageBand === "16+" ? null : player.guardianName,
    guardianRelation: player.ageBand === "16+" ? null : player.guardianRelation,
    guardianMobile: player.ageBand === "16+" ? null : player.guardianMobile,
    isModerator: player.isModerator,
    isDesk: player.isDesk,
    canWorkDesk: hasDeskAccess(player),
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
