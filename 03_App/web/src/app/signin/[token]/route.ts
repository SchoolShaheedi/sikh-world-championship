import { NextResponse } from "next/server";
import { redeemSignInToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";

/**
 * Redeem a sign-in link.
 *
 * A Route Handler, not a page: Next only allows cookies to be set from a Route Handler or
 * a Server Action, so doing this during a page render throws a 500 — which is exactly what
 * the first version did.
 *
 * Failures redirect back to /signin with a reason rather than rendering their own page, so
 * there is one place that explains what to do next.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await redeemSignInToken(token);

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sikhchampionships.com";

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/signin?error=${result.reason}`, base));
  }

  const res = NextResponse.redirect(new URL("/profile", base));
  res.cookies.set(SESSION_COOKIE, result.sessionToken, {
    httpOnly: true, // not readable from JavaScript
    secure: true, // HTTPS only
    sameSite: "lax", // survives following a link out of an email client
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
