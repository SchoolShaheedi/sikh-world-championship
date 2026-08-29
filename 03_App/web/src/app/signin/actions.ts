"use server";

import { headers } from "next/headers";
import { requestSignInLink } from "@/lib/auth";
import { rateLimit, LIMITS } from "@/lib/rate-limit";

/**
 * Ask for a sign-in link.
 *
 * Always reports the same thing whether or not the address is known — otherwise this form
 * becomes a way to find out which children have accounts here.
 */
export async function sendSignInLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter the email address you signed up with." };
  }

  // Per IP: stops someone hammering the form to spray links at an address, without
  // locking out a household where several players share a connection.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limit, windowMs } = LIMITS.signInLink;
  if (!rateLimit(`signin:${ip}`, limit, windowMs).ok) {
    return { error: "That's a lot of attempts. Wait a few minutes and try again." };
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sikhchampionships.com";
  await requestSignInLink(email, base);

  return { ok: true };
}
