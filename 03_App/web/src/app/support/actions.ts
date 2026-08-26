"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { currentPlayer } from "@/lib/session";
import { createTicket } from "@/lib/support-store";
import { categoryById, type SupportCategoryId } from "@/lib/support-types";
import { rateLimit, LIMITS } from "@/lib/rate-limit";

export async function submitTicket(formData: FormData) {
  const categoryId = String(formData.get("category"));
  const category = categoryById(categoryId);
  if (!category) return { error: "Pick what your message is about." };

  // Flood protection. The urgent queue is where a safeguarding disclosure lands, and a
  // queue buried under generated tickets is a queue where a real report goes unread.
  // The limit is deliberately loose so it never turns away a person submitting twice.
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limit, windowMs } = LIMITS.supportTicket;
  if (!rateLimit(`support:${ip}`, limit, windowMs).ok) {
    return {
      error:
        "That's a lot of messages in a short time. If this is urgent, use the emergency " +
        "contacts above the form — they reach a person directly.",
    };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 10) {
    return { error: "Tell us a bit more so we can actually help." };
  }

  // Signing in is optional here — see support-types.ts for why.
  let playerId: string | null = null;
  try {
    playerId = (await currentPlayer()).id;
  } catch {
    playerId = null;
  }

  const ticket = await createTicket({
    category: categoryId as SupportCategoryId,
    urgent: category.urgent,
    subject: String(formData.get("subject") ?? "").slice(0, 200) || category.label,
    message: message.slice(0, 5000),
    name: String(formData.get("name") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    playerId,
    fromGuardian: formData.get("fromGuardian") === "on",
  });

  revalidatePath("/moderation");
  return { ok: true, reference: ticket.reference, urgent: category.urgent };
}
