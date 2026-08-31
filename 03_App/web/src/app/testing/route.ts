/**
 * Turn on real registration for this browser.
 *
 *   /testing?key=<the value of the SWC_TEST_KEY secret>   → open for 8 hours
 *   /testing?key=clear                                    → close again
 *
 * Returns 404 when no key is configured, so on a normal deployment this route does not
 * appear to exist. A 403 would confirm that there is something here to guess at.
 *
 * The key travels in a query string, which means it lands in Cloudflare's request logs.
 * Accepted deliberately: the alternative is a form, and the whole point of this is to be
 * one link you can open on a phone at the venue. It is a short-lived testing credential,
 * rotatable with one `wrangler secret put`, and it grants exactly one thing — the ability
 * to submit the registration form. Not admin, not moderation, not the data.
 */
import { NextResponse } from "next/server";
import { registrationTestKey } from "@/lib/features";
import { keyMatches, TESTER_COOKIE, TESTER_COOKIE_MAX_AGE } from "@/lib/testing-access";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = registrationTestKey();
  if (!key) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supplied = new URL(req.url).searchParams.get("key") ?? "";

  if (supplied === "clear") {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete(TESTER_COOKIE);
    return res;
  }

  if (!keyMatches(supplied, key)) {
    // Same response as a missing key. Nothing here distinguishes "wrong" from "no such
    // route", so there is nothing to iterate against.
    return new NextResponse("Not found", { status: 404 });
  }

  const res = NextResponse.redirect(new URL("/join", req.url));
  res.cookies.set(TESTER_COOKIE, key, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TESTER_COOKIE_MAX_AGE,
  });
  return res;
}
