/**
 * Support ticket store — DEVELOPMENT IMPLEMENTATION, same caveats as the other stores.
 * Replace with Supabase before launch (docs/DATA-LAYER.md).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir } from "./data-dir";
import type { SupportTicket, TicketStatus } from "./support-types";

const FILE = () => path.join(dataDir(), "support-tickets.json");

async function readAll(): Promise<SupportTicket[]> {
  try {
    return JSON.parse(await fs.readFile(FILE(), "utf8")) as SupportTicket[];
  } catch {
    return [];
  }
}

async function writeAll(rows: SupportTicket[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(FILE(), JSON.stringify(rows, null, 2), "utf8");
}

export async function createTicket(
  input: Omit<
    SupportTicket,
    "id" | "reference" | "status" | "createdAt" | "assignedTo" | "handledAt" | "resolution"
  >,
): Promise<SupportTicket> {
  const rows = await readAll();
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
  rows.push(ticket);
  await writeAll(rows);
  return ticket;
}

/**
 * Urgent tickets first, then oldest first within each group.
 * A safeguarding concern raised an hour ago outranks a broken button from last week,
 * and the ordering should make that impossible to get wrong by accident.
 */
export async function allTickets(): Promise<SupportTicket[]> {
  const rows = await readAll();
  const rank: Record<TicketStatus, number> = {
    new: 0,
    "in-progress": 1,
    resolved: 2,
    closed: 3,
  };
  return rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      Number(b.urgent) - Number(a.urgent) ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function updateTicket(
  id: string,
  patch: Partial<Pick<SupportTicket, "status" | "assignedTo" | "resolution">>,
): Promise<SupportTicket | null> {
  const rows = await readAll();
  const row = rows.find((t) => t.id === id);
  if (!row) return null;
  Object.assign(row, patch);
  if (patch.status === "resolved" || patch.status === "closed") {
    row.handledAt = new Date().toISOString();
  }
  await writeAll(rows);
  return row;
}

export async function supportHealth(): Promise<{
  open: number;
  urgentOpen: number;
  oldestUrgentHours: number | null;
}> {
  const rows = await readAll();
  const open = rows.filter((t) => t.status === "new" || t.status === "in-progress");
  const urgent = open.filter((t) => t.urgent);
  return {
    open: open.length,
    urgentOpen: urgent.length,
    oldestUrgentHours: urgent.length
      ? Math.floor(
          (Date.now() - Math.min(...urgent.map((t) => new Date(t.createdAt).getTime()))) /
            36e5,
        )
      : null,
  };
}
