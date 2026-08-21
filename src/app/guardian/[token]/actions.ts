"use server";

import { revalidatePath } from "next/cache";
import { recordDecision } from "@/lib/guardian-store";
import {
  notifyGuardianDecisionConfirmed,
  notifyChildOfDecision,
} from "@/lib/notify";
import type { ApprovalStatus } from "@/lib/guardian-types";

const ALLOWED: ApprovalStatus[] = ["approved", "declined", "revoked"];

/** Used from a plain <form action>, so it returns void — the page re-reads the state. */
export async function decide(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const decision = String(formData.get("decision") ?? "") as ApprovalStatus;
  if (!ALLOWED.includes(decision)) return;

  const result = await recordDecision(
    token,
    decision as "approved" | "declined" | "revoked",
  );

  if (result.ok) {
    // Confirm to the guardian in writing. If a decision is ever changed by someone who
    // shouldn't have, this email is how the guardian finds out.
    await notifyGuardianDecisionConfirmed(
      result.approval.guardianEmail,
      result.approval.childDisplayName,
      decision,
    );
    await notifyChildOfDecision(result.approval.playerId, decision);
  }

  revalidatePath(`/guardian/${token}`);
  revalidatePath("/play");
}
