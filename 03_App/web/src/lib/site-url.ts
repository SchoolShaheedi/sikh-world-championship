/**
 * Where a link we put in an email should point, and where a redirect should land.
 *
 * WHY THIS EXISTS. Three places built this string themselves and two of them were wrong.
 * `signin/actions.ts` and `signin/[token]/route.ts` fell back to the production domain, so
 * a sign-in link generated on a laptop pointed at sikhchampionships.com, where that token
 * does not exist — the local magic link was unusable and the failure looked like the email
 * simply not being sent. `play/guardian-actions.ts` fell back the other way, to
 * `http://localhost:3000`, which means the guardian approval email would have carried a
 * localhost link in PRODUCTION. It is unreachable today only because the Looking For Game
 * board is switched off; it would have shipped the day it was switched on.
 *
 * Neither default is right, because the answer is not a constant — it depends on where the
 * request came from. So it is derived from the request, with one rule:
 *
 *   THE HOST HEADER IS TRUSTED ONLY WHEN IT IS LOCALHOST.
 *
 * That matters. A Host header is supplied by whoever made the request, so trusting it
 * generally would let somebody send us a header and receive a sign-in link pointing at
 * their own domain — handing them the token in the process. Anything that is not localhost
 * therefore resolves to the constant below and no header can change it. Localhost is safe
 * to honour because a request that arrives claiming to be localhost is one already on the
 * machine.
 *
 * `NEXT_PUBLIC_SITE_URL` still wins when it is set, for a staging deploy on its own domain.
 * It is not set in production or locally, and nothing depends on somebody remembering to
 * set it any more.
 *
 * ONE ENVIRONMENT DOES NOT SEE A HOST AT ALL, and it is worth knowing which. `Host` is a
 * forbidden header name in the fetch spec, so inside a Worker `request.headers.get("host")`
 * is null — measured, not assumed: under `npm run cf:preview` the resolved base is the
 * constant below even when the request went to localhost. That is the *safe* answer and
 * production is unaffected (the answer there is the constant either way), but it means a
 * sign-in link generated under `cf:preview` points at the live site. Test sign-in with
 * `npm run dev`, where the host header is present and the link points at the laptop.
 */

/** The one canonical origin. Not read from a header, deliberately. */
export const PRODUCTION_URL = "https://sikhchampionships.com";

/** localhost, 127.0.0.1 or ::1, with or without a port. */
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/**
 * Resolve the base URL for a request whose Host header is `host`.
 *
 * Pure, so the trust rule can be tested without a request. `http://` for a local host
 * because that is what `next dev` and `wrangler dev` actually serve.
 */
export function siteUrlFor(host: string | null | undefined): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (host && LOCAL_HOST.test(host)) return `http://${host}`;
  return PRODUCTION_URL;
}

/**
 * True when a cookie set for this base URL may carry `Secure`.
 *
 * A `Secure` cookie over plain http is refused by some browsers, which on a laptop turns
 * "signed in" into a redirect loop with nothing to show for it. Derived from the resolved
 * base rather than from an environment variable, so it cannot be weakened in production:
 * there the base is the constant above and always https.
 */
export function secureCookies(base: string): boolean {
  return base.startsWith("https://");
}
