/**
 * Where links point, and whose word we take for it.
 *
 * The property under test is a trust boundary, not a formatting rule: a Host header is
 * supplied by whoever made the request, and a sign-in link built from an attacker's header
 * would be emailed to the account holder and hand the token to the attacker when followed.
 */
import { afterEach, describe, expect, it } from "vitest";
import { siteUrlFor, secureCookies, PRODUCTION_URL } from "./site-url";

const original = process.env.NEXT_PUBLIC_SITE_URL;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("which origin a link is built for", () => {
  it("honours a local host, so a link made on a laptop works on that laptop", () => {
    // The bug that started this: locally the base was the production domain, so the
    // magic link pointed at a site where the token does not exist.
    expect(siteUrlFor("localhost:3000")).toBe("http://localhost:3000");
    expect(siteUrlFor("localhost:8787")).toBe("http://localhost:8787");
    expect(siteUrlFor("127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    expect(siteUrlFor("[::1]:3000")).toBe("http://[::1]:3000");
    expect(siteUrlFor("localhost")).toBe("http://localhost");
  });

  it("IGNORES any other host, whatever it claims to be", () => {
    // Each of these is a header somebody could send us. None of them may end up in an
    // email: the link goes to the account holder, and following it would hand the token
    // to whoever chose the host.
    for (const host of [
      "evil.example",
      "localhost.evil.example",
      "evil.example:3000",
      "sikhchampionships.com.evil.example",
      "127.0.0.1.evil.example",
      "notlocalhost",
    ]) {
      expect(siteUrlFor(host)).toBe(PRODUCTION_URL);
    }
  });

  it("falls back to production with no host at all", () => {
    expect(siteUrlFor(null)).toBe(PRODUCTION_URL);
    expect(siteUrlFor(undefined)).toBe(PRODUCTION_URL);
    expect(siteUrlFor("")).toBe(PRODUCTION_URL);
  });

  it("lets an explicit setting win, for a staging deploy on its own domain", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.example/";
    // Trailing slash trimmed, or every built link gets a double slash in it.
    expect(siteUrlFor("localhost:3000")).toBe("https://staging.example");
    expect(siteUrlFor("evil.example")).toBe("https://staging.example");
  });
});

describe("whether the session cookie may be Secure", () => {
  it("is true for production and false for a local http origin", () => {
    // A Secure cookie over plain http is refused by some browsers, and the symptom is
    // signing in successfully and landing back on the sign-in page.
    expect(secureCookies(PRODUCTION_URL)).toBe(true);
    expect(secureCookies("http://localhost:3000")).toBe(false);
    expect(secureCookies("http://127.0.0.1:8787")).toBe(false);
  });

  it("cannot be turned off in production, because the base there is a constant", () => {
    expect(secureCookies(siteUrlFor("evil.example"))).toBe(true);
    expect(secureCookies(siteUrlFor(null))).toBe(true);
  });
});
