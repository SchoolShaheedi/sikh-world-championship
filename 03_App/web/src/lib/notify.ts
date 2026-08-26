/**
 * Notifications — STUB. Logs instead of sending.
 *
 * REPLACE BEFORE LAUNCH. The guardian notification in particular is a safeguarding
 * commitment we make publicly on /safeguarding, so it must actually send. Until it does,
 * under-16 board access should not be switched on for real players.
 */

export interface GuardianConnectionNotice {
  guardianEmail: string;
  childDisplayName: string;
  otherPlayerName: string;
  otherPlayerRegion: string;
  game: string;
  when: string;
}

/**
 * Sent when an under-16 swaps gamertags with another player.
 * Deliberately informative rather than blocking: the guardian is told who, where from,
 * and what game, so they can step in if something looks wrong.
 */
export async function notifyGuardianOfConnection(
  n: GuardianConnectionNotice,
): Promise<void> {
  console.info(
    `[guardian-notice] to=${n.guardianEmail} child=${n.childDisplayName} ` +
      `connected-with=${n.otherPlayerName} (${n.otherPlayerRegion}) ` +
      `game=${n.game} window=${n.when}`,
  );
  // TODO: send via the real mail provider, and record that it was sent so we can prove
  // the notification happened if a guardian ever asks.
}

export async function notifyRequestReceived(
  toPlayerId: string,
  fromDisplayName: string,
): Promise<void> {
  console.info(`[request-notice] to=${toPlayerId} from=${fromDisplayName}`);
  // TODO: email/push. Without this the board only works for people who happen to visit.
}

export interface GuardianApprovalRequest {
  guardianEmail: string;
  childDisplayName: string;
  approvalUrl: string;
}

/** Sent when an under-16 asks for board access. */
export async function notifyGuardianApprovalRequest(
  n: GuardianApprovalRequest,
): Promise<void> {
  console.info(
    `[guardian-approval-request] to=${n.guardianEmail} ` +
      `child=${n.childDisplayName} url=${n.approvalUrl}`,
  );
  // TODO: real email. Must clearly identify Sikh World Championship, name the child, and
  // explain what's being asked — a bare link from an unknown sender gets deleted.
}

/** Sent to the guardian confirming their own decision, so a change they didn't make is visible. */
export async function notifyGuardianDecisionConfirmed(
  guardianEmail: string,
  childDisplayName: string,
  decision: string,
): Promise<void> {
  console.info(
    `[guardian-decision] to=${guardianEmail} child=${childDisplayName} decision=${decision}`,
  );
}

/** Sent to the child so they know where they stand without having to ask. */
export async function notifyChildOfDecision(
  playerId: string,
  decision: string,
): Promise<void> {
  console.info(`[child-decision-notice] player=${playerId} decision=${decision}`);
}
