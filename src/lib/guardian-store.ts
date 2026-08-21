/**
 * Guardian approval store — DEVELOPMENT IMPLEMENTATION.
 * JSON-file backed. Replace with Supabase before launch (docs/DATA-LAYER.md).
 * This file holds guardian email addresses, so it needs encryption at rest in production.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir } from "./data-dir";
import {
  APPROVAL_REQUEST_LIFETIME_DAYS,
  type ApprovalStatus,
  type GuardianApproval,
} from "./guardian-types";

const FILE = () => path.join(dataDir(), "guardian-approvals.json");

async function readAll(): Promise<GuardianApproval[]> {
  try {
    return JSON.parse(await fs.readFile(FILE(), "utf8")) as GuardianApproval[];
  } catch {
    return [];
  }
}

async function writeAll(rows: GuardianApproval[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(FILE(), JSON.stringify(rows, null, 2), "utf8");
}

/** 32 bytes of randomness, url-safe. Long enough that guessing is not a threat model. */
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
  const rows = await readAll();

  // An existing approved or declined decision stands. Only pending ones are replaced.
  const settled = rows.find(
    (r) =>
      r.playerId === input.playerId &&
      (r.status === "approved" || r.status === "declined"),
  );
  if (settled) return settled;

  const filtered = rows.filter(
    (r) => !(r.playerId === input.playerId && r.status === "pending"),
  );

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

  filtered.push(row);
  await writeAll(filtered);
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
  const rows = await readAll();
  return rows.find((r) => r.token === token) ?? null;
}

export async function approvalFor(
  playerId: string,
): Promise<GuardianApproval | null> {
  const rows = await readAll();
  return rows.find((r) => r.playerId === playerId) ?? null;
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
  const rows = await readAll();
  const row = rows.find((r) => r.token === token);
  if (!row || token.length < 20) return { ok: false, reason: "not-found" };

  // A pending request goes stale; a settled one stays reachable so it can be revoked
  // or reinstated. Otherwise a guardian loses control the moment the link ages out.
  if (isExpired(row)) return { ok: false, reason: "expired" };

  if (row.status === to) return { ok: false, reason: "no-change" };

  row.history.push({ at: new Date().toISOString(), from: row.status, to });
  row.status = to;
  row.respondedAt = new Date().toISOString();

  await writeAll(rows);
  return { ok: true, approval: row };
}
