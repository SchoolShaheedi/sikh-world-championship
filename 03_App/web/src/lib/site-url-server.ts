/**
 * `siteUrl()` for code that runs inside a request.
 *
 * Separate from `site-url.ts` so the trust rule can be unit tested: importing
 * `next/headers` from a plain vitest process throws, and a security rule that cannot be
 * tested without a framework is a security rule nobody tests.
 */
import { headers } from "next/headers";
import { siteUrlFor } from "./site-url";

/**
 * The base URL for the request being handled. Server components, actions and route
 * handlers only.
 *
 * `x-forwarded-host` first, because that is what a proxy sets; `host` second, which is what
 * `next dev` provides. Inside a Worker neither is readable — `Host` is a forbidden header
 * name in the fetch spec — so this resolves to the production constant there, which is the
 * right answer in production and a documented limitation under `cf:preview`.
 */
export async function siteUrl(): Promise<string> {
  const h = await headers();
  return siteUrlFor(h.get("x-forwarded-host") ?? h.get("host"));
}
