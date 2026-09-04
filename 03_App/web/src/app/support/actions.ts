"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { currentPlayer } from "@/lib/session";
import { createTicket } from "@/lib/support-store";
import { categoryById, type SupportCategoryId } from "@/lib/support-types";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { copy } from "@/copy";

export async function submitTicket(formData: FormData) {
  const categoryId = String(formData.get("category"));
  const category = categoryById(categoryId);
  if (!category) return { error: copy.support.errorNoCategory };

  // Flood protection. The urgent queue is where a safeguarding disclosure lands, and a
  // queue buried under generated tickets is a queue where a real report goes unread.
  // The limit is deliberately loose so it never turns away a person submitting twice.
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limit, windowMs } = LIMITS.supportTicket;
  if (!rateLimit(`support:${ip}`, limit, windowMs).ok) {
    return {
      error: copy.support.errorRateLimited,
    };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 10) {
    return { error: copy.support.errorTooShort };
  }

  // Signing in is optional here — see support-types.ts for why.
  // Signing in is optional here — see support-types.ts for why. The most important
  // message this system will ever receive is from a parent who has never logged in.
  const me = await currentPlayer();
  const playerId = me?.id ?? null;

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
