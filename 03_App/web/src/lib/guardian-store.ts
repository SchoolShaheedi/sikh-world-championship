/**
 * Guardian approval store — Cloudflare D1.
 *
 * Signatures unchanged from the JSON version; see 00_Docs/DATA-LAYER.md.
 *
 * One thing the database now enforces that application code used to: `player_id` is
 * UNIQUE, so there can only ever be one live approval record per child. Re-asking
 * replaces the pending request instead of stacking links in a parent's inbox.
 */
import crypto from "node:crypto";
import { getDb, parseJson } from "./db";
import {
  APPROVAL_REQUEST_LIFETIME_DAYS,
  type ApprovalStatus,
  type GuardianApproval,
} from "./guardian-types";

type Row = Record<string, unknown>;

function toApproval(r: Row): GuardianApproval {
  return {
    id: r.id as string,
    playerId: r.player_id as string,
    childDisplayName: r.child_display_name as string,
    guardianEmail: r.guardian_email as string,
    token: r.token as string,
    status: r.status as ApprovalStatus,
    createdAt: r.created_at as string,
    respondedAt: (r.responded_at as string | null) ?? null,
    history: parseJson<GuardianApproval["history"]>(r.history, []),
    expiresAt: r.expires_at as string,
  };
}

export function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Ask a guardian for permission. Re-asking replaces any pending request rather than
 * stacking them up, so an impatient child can't fill a parent's inbox — and so there is
 * only ever one live link.
 */
export async function requestApproval(input: {
  playerId: string;
  childDisplayName: string;
  guardianEmail: string;
}): Promise<GuardianApproval> {
  const db = await getDb();

  // An existing approved or declined decision stands. Only pending ones are replaced.
  const existing = await db
    .prepare("SELECT * FROM guardian_approvals WHERE player_id = ?")
    .bind(input.playerId)
    .first<Row>();
  if (existing && (existing.status === "approved" || existing.status === "declined")) {
    return toApproval(existing);
  }

  const now = new Date();
  const row: GuardianApproval = {
    id: crypto.randomUUID(),
    playerId: input.playerId,
    childDisplayName: input.childDisplayName,
    guardianEmail: input.guardianEmail,
    token: newToken(),
    status: "pending",
    createdAt: now.toISOString(),
    respondedAt: null,
    history: [],
    expiresAt: new Date(
      now.getTime() + APPROVAL_REQUEST_LIFETIME_DAYS * 864e5,
    ).toISOString(),
  };

  // Replaces the pending row if there is one — the old token stops working, which is the
  // intended effect of asking again.
  await db
    .prepare(
      `INSERT INTO guardian_approvals
         (id, player_id, child_display_name, guardian_email, token, status,
          created_at, responded_at, expires_at, history)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(player_id) DO UPDATE SET
         id = excluded.id, child_display_name = excluded.child_display_name,
         guardian_email = excluded.guardian_email, token = excluded.token,
         status = excluded.status, created_at = excluded.created_at,
         responded_at = NULL, expires_at = excluded.expires_at`,
    )
    .bind(
      row.id, row.playerId, row.childDisplayName, row.guardianEmail, row.token,
      row.status, row.createdAt, null, row.expiresAt, "[]",
    )
    .run();

  return row;
}

/**
 * Is a pending request past its window? Settled records never expire — a guardian must
 * keep a permanent way back in to revoke.
 * Lives here rather than in the page so the time check stays out of render.
 */
export function isExpired(row: GuardianApproval): boolean {
  return (
    row.status === "pending" && new Date(row.expiresAt).getTime() < Date.now()
  );
}

export async function findByToken(
  token: string,
): Promise<GuardianApproval | null> {
  // Reject empty/short tokens outright rather than letting them reach the lookup.
  if (!token || token.length < 20) return null;
  const db = await getDb();
  const row = await db
    .prepare("SELECT * FROM guardian_approvals WHERE token = ?")
    .bind(token)
    .first<Row>();
  return row ? toApproval(row) : null;
}

export async function approvalFor(
  playerId: string,
): Promise<GuardianApproval | null> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT * FROM guardian_approvals WHERE player_id = ?")
    .bind(playerId)
    .first<Row>();
  return row ? toApproval(row) : null;
}

/**
 * The question the board asks. Deliberately fail-closed: anything other than an explicit,
 * live approval means no access.
 */
export async function hasApproval(playerId: string): Promise<boolean> {
  const row = await approvalFor(playerId);
  return row?.status === "approved";
}

export type DecisionResult =
  | { ok: true; approval: GuardianApproval }
  | { ok: false; reason: "not-found" | "expired" | "no-change" };

/**
 * Record a guardian's decision. Handles approve, decline and revoke through one path so
 * the history is always written the same way.
 */
export async function recordDecision(
  token: string,
  to: Extract<ApprovalStatus, "approved" | "declined" | "revoked">,
): Promise<DecisionResult> {
  const row = await findByToken(token);
  if (!row) return { ok: false, reason: "not-found" };

  // A pending request goes stale; a settled one stays reachable so it can be revoked
  // or reinstated. Otherwise a guardian loses control the moment the link ages out.
  if (isExpired(row)) return { ok: false, reason: "expired" };
  if (row.status === to) return { ok: false, reason: "no-change" };

  const at = new Date().toISOString();
  const history = [...row.history, { at, from: row.status, to }];

  const db = await getDb();
  await db
    .prepare(
      "UPDATE guardian_approvals SET status = ?, responded_at = ?, history = ? WHERE token = ?",
    )
    .bind(to, at, JSON.stringify(history), token)
    .run();

  return { ok: true, approval: { ...row, status: to, respondedAt: at, history } };
}
