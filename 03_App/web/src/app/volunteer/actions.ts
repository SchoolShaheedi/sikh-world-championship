"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { EVENTS } from "@/data/events";
import { validateVolunteer, createVolunteer } from "@/lib/volunteer-store";
import { roleNames } from "@/lib/volunteer-types";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { volunteerReceived } from "@/lib/email-templates";

/**
 * Somebody offering to help.
 *
 * OPEN TO PEOPLE WITHOUT AN ACCOUNT, like the support form and for the same reason: the
 * person who can give a Saturday is not the person who already has a profile here. There
 * is no gate to pass and nothing to sign in to.
 *
 * The validation lives in `validateVolunteer` — pure, tested, and the only thing that
 * decides. Invariant 5: the browser marks fields required, the server accepts or refuses.
 */
export async function submitVolunteer(formData: FormData) {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limit, windowMs } = LIMITS.volunteerSignup;
  if (!rateLimit(`volunteer:${ip}`, limit, windowMs).ok) {
    return {
      error:
        "That is a lot of sign-ups from one connection. Give it a few minutes, or tell us " +
        "at /support.",
    };
  }

  const validated = validateVolunteer({
    // One event for now. `EVENTS[0]` is how every other page picks the current one.
    eventSlug: EVENTS[0]?.slug ?? "",
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    roles: formData.getAll("roles").map(String),
    availability: String(formData.get("availability") ?? ""),
    dbs: String(formData.get("dbs") ?? ""),
    over18: formData.get("over18") === "on",
    refereeName: String(formData.get("refereeName") ?? ""),
    refereeRelation: String(formData.get("refereeRelation") ?? ""),
    refereeContact: String(formData.get("refereeContact") ?? ""),
  });
  if (!validated.ok) return { error: validated.error };

  const volunteer = await createVolunteer(validated.value);
  const event = EVENTS[0];

  // Acknowledged immediately, for the reason `interestReceived` exists: a form that
  // answers with a screen and then silence reads as a scam, and this one has just asked
  // for somebody's phone number and a referee.
  await sendEmail({
    kind: "volunteer-received",
    to: volunteer.email,
    ...volunteerReceived({
      fullName: volunteer.fullName.split(" ")[0] || volunteer.fullName,
      eventTitle: event?.title ?? "the next event",
      eventDate: event?.date ?? null,
      reference: volunteer.reference,
      roles: roleNames(volunteer.roles),
      dbsAsked: volunteer.dbs !== "yes",
    }),
    idempotencyKey: `volunteer-received:${volunteer.reference}`,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/volunteers");
  return { ok: true as const, reference: volunteer.reference };
}
