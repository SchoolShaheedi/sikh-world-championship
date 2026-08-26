"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer } from "@/lib/session";
import { requestApproval } from "@/lib/guardian-store";
import { notifyGuardianApprovalRequest } from "@/lib/notify";

/**
 * An under-16 asks their guardian for board access.
 * The guardian email is NOT taken from the form — it comes from the account, which got
 * it from event registration. If a child could type the address here, the whole consent
 * mechanism would be theatre.
 */
export async function askGuardian(): Promise<{ ok: boolean; error?: string }> {
  const me = await currentPlayer();

  if (me.ageBand !== "U16") return { ok: false, error: "Not needed." };
  if (!me.guardianEmail) {
    return {
      ok: false,
      error:
        "We don't have a parent or guardian's email for you. Get in touch through Support and we'll add one.",
    };
  }

  const approval = await requestApproval({
    playerId: me.id,
    childDisplayName: me.displayName,
    guardianEmail: me.guardianEmail,
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await notifyGuardianApprovalRequest({
    guardianEmail: me.guardianEmail,
    childDisplayName: me.displayName,
    approvalUrl: `${base}/guardian/${approval.token}`,
  });

  revalidatePath("/play");
  return { ok: true };
}
