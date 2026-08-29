/**
 * Notifications.
 *
 * These used to be `console.info` and nothing else, which meant the guardian notification
 * promised publicly on /safeguarding did not exist. It does now, via Resend.
 *
 * WHAT STILL CANNOT SEND, AND WHY THAT IS SAID OUT LOUD:
 * two of these take a `playerId`, not an address, and there is no accounts system to look
 * an address up in (`session.ts` is still a stub). Rather than pretend, they record the
 * attempt as a failure with a clear reason, so it shows up in the moderation queue instead
 * of vanishing. They start working when accounts do.
 */
import crypto from "node:crypto";
import { sendEmail } from "./email";
import {
  guardianApprovalRequest,
  guardianConnectionNotice,
  guardianDecisionConfirmed,
} from "./email-templates";
import { getDb } from "./db";

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
  const t = guardianConnectionNotice(n);
  await sendEmail({
    kind: "guardian-connection",
    to: n.guardianEmail,
    ...t,
    // One notice per child per counterpart per window. A page re-render or a double
    // submit must not email a parent twice about the same game.
    idempotencyKey: `guardian-connection:${n.guardianEmail}:${n.childDisplayName}:${n.otherPlayerName}:${n.when}`,
  });
}

/**
 * Neither of the two player-addressed notifications can send yet.
 *
 * Recorded rather than dropped: a moderator seeing "no email address on record" in the
 * failed queue is how this gets noticed, instead of everyone assuming it works.
 */
async function recordUnsendable(kind: string, playerId: string, note: string): Promise<void> {
  console.warn(`[notify] ${kind} for player=${playerId}: ${note}`);
  const db = await getDb();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO email_sends
         (id, kind, to_email, subject, status, error, attempts, created_at, idempotency_key)
       VALUES (?,?,?,?,'failed',?,1,?,?)
       ON CONFLICT(idempotency_key) DO UPDATE SET attempts = email_sends.attempts + 1`,
    )
    .bind(
      crypto.randomUUID(),
      kind,
      `player:${playerId}`,
      "(not sent)",
      note,
      now,
      `${kind}:${playerId}:${now}`,
    )
    .run();
}

export async function notifyRequestReceived(
  toPlayerId: string,
  fromDisplayName: string,
): Promise<void> {
  await recordUnsendable(
    "request-received",
    toPlayerId,
    `No email address on record for this player (${fromDisplayName} sent them a request). ` +
      `Player accounts do not exist yet — src/lib/session.ts is a stub.`,
  );
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
  const t = guardianApprovalRequest(n);
  await sendEmail({
    kind: "guardian-approval-request",
    to: n.guardianEmail,
    ...t,
    // Keyed on the approval token: asking again mints a new token, which is a genuinely
    // new email, while a retry of the same request is not.
    idempotencyKey: `guardian-approval-request:${n.approvalUrl}`,
  });
}

/** Sent to the guardian confirming their own decision, so a change they didn't make is visible. */
export async function notifyGuardianDecisionConfirmed(
  guardianEmail: string,
  childDisplayName: string,
  decision: string,
): Promise<void> {
  const t = guardianDecisionConfirmed({ childDisplayName, decision });
  await sendEmail({
    kind: "guardian-decision",
    to: guardianEmail,
    ...t,
    idempotencyKey: `guardian-decision:${guardianEmail}:${childDisplayName}:${decision}`,
  });
}

/** Sent to the child so they know where they stand without having to ask. */
export async function notifyChildOfDecision(
  playerId: string,
  decision: string,
): Promise<void> {
  await recordUnsendable(
    "child-decision",
    playerId,
    `No email address on record for this player (decision: ${decision}). ` +
      `Player accounts do not exist yet — src/lib/session.ts is a stub.`,
  );
}
