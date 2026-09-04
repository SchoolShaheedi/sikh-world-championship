"use server";

import { headers } from "next/headers";
import { requestSignInLink } from "@/lib/auth";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url-server";
import { copy } from "@/copy";

/**
 * Ask for a sign-in link.
 *
 * Always reports the same thing whether or not the address is known — otherwise this form
 * becomes a way to find out which children have accounts here.
 */
export async function sendSignInLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: copy.signin.needEmail };
  }

  // Per IP: stops someone hammering the form to spray links at an address, without
  // locking out a household where several players share a connection.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limit, windowMs } = LIMITS.signInLink;
  if (!rateLimit(`signin:${ip}`, limit, windowMs).ok) {
    return { error: copy.signin.rateLimited };
  }

  // From the request, not from a constant: a link built on a laptop has to point at the
  // laptop. See src/lib/site-url.ts for why the host is trusted only when it is localhost.
  await requestSignInLink(email, await siteUrl());

  return { ok: true };
}
