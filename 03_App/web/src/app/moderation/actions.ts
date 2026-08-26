"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/session";
import { updateReport } from "@/lib/play-store";
import { updateTicket } from "@/lib/support-store";
import type { ReportStatus } from "@/lib/play-types";
import type { TicketStatus } from "@/lib/support-types";

const VALID: ReportStatus[] = ["open", "investigating", "actioned", "dismissed"];

export async function handleReport(formData: FormData) {
  const me = await currentPlayer();
  if (!me.isModerator) throw new Error("Moderators only.");

  const status = String(formData.get("status")) as ReportStatus;
  if (!VALID.includes(status)) throw new Error("Bad status.");

  await updateReport(String(formData.get("reportId")), {
    status,
    // Claiming a report records who took it, so two volunteers on a rota don't both
    // work the same one — and so there's an audit trail if a decision is questioned.
    assignedTo: me.displayName,
    resolution: String(formData.get("resolution") ?? "") || null,
  });

  revalidatePath("/moderation");
}

const VALID_TICKET: TicketStatus[] = ["new", "in-progress", "resolved", "closed"];

export async function handleTicket(formData: FormData) {
  const me = await currentPlayer();
  if (!me.isModerator) throw new Error("Moderators only.");

  const status = String(formData.get("status")) as TicketStatus;
  if (!VALID_TICKET.includes(status)) throw new Error("Bad status.");

  await updateTicket(String(formData.get("ticketId")), {
    status,
    assignedTo: me.displayName,
    resolution: String(formData.get("resolution") ?? "") || null,
  });

  revalidatePath("/moderation");
}
