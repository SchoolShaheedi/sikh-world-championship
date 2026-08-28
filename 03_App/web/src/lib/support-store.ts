/**
 * Support ticket store — Cloudflare D1.
 *
 * Signatures unchanged from the JSON version; see 00_Docs/DATA-LAYER.md.
 *
 * These rows carry the most sensitive free text in the app: a parent describing a
 * safeguarding concern, often without an account. Retention differs from everything else
 * too — safety tickets are kept far longer (04_Legal/RETENTION-POLICY.md), which is why
 * `urgent` is a column rather than something derived at read time.
 */
import crypto from "node:crypto";
import { getDb, bool, fromBool } from "./db";
import type { SupportTicket, SupportCategoryId, TicketStatus } from "./support-types";

type Row = Record<string, unknown>;

function toTicket(r: Row): SupportTicket {
  return {
    id: r.id as string,
    reference: r.reference as string,
    category: r.category as SupportCategoryId,
    urgent: fromBool(r.urgent),
    subject: r.subject as string,
    message: r.message as string,
    name: (r.name as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    playerId: (r.player_id as string | null) ?? null,
    fromGuardian: fromBool(r.from_guardian),
    status: r.status as TicketStatus,
    createdAt: r.created_at as string,
    assignedTo: (r.assigned_to as string | null) ?? null,
    handledAt: (r.handled_at as string | null) ?? null,
    resolution: (r.resolution as string | null) ?? null,
  };
}

export async function createTicket(
  input: Omit<
    SupportTicket,
    "id" | "reference" | "status" | "createdAt" | "assignedTo" | "handledAt" | "resolution"
  >,
): Promise<SupportTicket> {
  const db = await getDb();
  const ticket: SupportTicket = {
    ...input,
    id: crypto.randomUUID(),
    reference: `SUP-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    status: "new",
    createdAt: new Date().toISOString(),
    assignedTo: null,
    handledAt: null,
    resolution: null,
  };

  await db
    .prepare(
      `INSERT INTO support_tickets
         (id, reference, category, urgent, subject, message, name, email,
          player_id, from_guardian, status, created_at, assigned_to, handled_at, resolution)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      ticket.id, ticket.reference, ticket.category, bool(ticket.urgent),
      ticket.subject, ticket.message, ticket.name, ticket.email,
      ticket.playerId, bool(ticket.fromGuardian), ticket.status, ticket.createdAt,
      null, null, null,
    )
    .run();

  return ticket;
}

/**
 * Urgent tickets first, then oldest first within each group.
 * A safeguarding concern raised an hour ago outranks a broken button from last week,
 * and the ordering should make that impossible to get wrong by accident.
 *
 * The ordering is now in SQL rather than a comparator, so it cannot be lost by a caller
 * re-sorting the array — which is a real risk for the one list where order is a safety
 * property rather than a presentation choice.
 */
export async function allTickets(): Promise<SupportTicket[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT * FROM support_tickets
       ORDER BY
         CASE status WHEN 'new' THEN 0 WHEN 'in-progress' THEN 1
                     WHEN 'resolved' THEN 2 ELSE 3 END ASC,
         urgent DESC,
         created_at ASC`,
    )
    .all<Row>();
  return results.map(toTicket);
}

export async function updateTicket(
  id: string,
  patch: Partial<Pick<SupportTicket, "status" | "assignedTo" | "resolution">>,
): Promise<SupportTicket | null> {
  const db = await getDb();
  const existing = await db
    .prepare("SELECT * FROM support_tickets WHERE id = ?")
    .bind(id)
    .first<Row>();
  if (!existing) return null;

  const merged = { ...toTicket(existing), ...patch };
  const handledAt =
    patch.status === "resolved" || patch.status === "closed"
      ? new Date().toISOString()
      : merged.handledAt;

  await db
    .prepare(
      "UPDATE support_tickets SET status = ?, assigned_to = ?, resolution = ?, handled_at = ? WHERE id = ?",
    )
    .bind(merged.status, merged.assignedTo, merged.resolution, handledAt, id)
    .run();

  return { ...merged, handledAt };
}

export async function supportHealth(): Promise<{
  open: number;
  urgentOpen: number;
  oldestUrgentHours: number | null;
}> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT
         COUNT(*) AS open,
         SUM(CASE WHEN urgent = 1 THEN 1 ELSE 0 END) AS urgent_open,
         MIN(CASE WHEN urgent = 1 THEN created_at END) AS oldest_urgent
       FROM support_tickets
       WHERE status IN ('new','in-progress')`,
    )
    .first<{ open: number; urgent_open: number | null; oldest_urgent: string | null }>();

  const oldest = row?.oldest_urgent ?? null;
  return {
    open: row?.open ?? 0,
    urgentOpen: row?.urgent_open ?? 0,
    oldestUrgentHours: oldest
      ? Math.floor((Date.now() - new Date(oldest).getTime()) / 36e5)
      : null,
  };
}
