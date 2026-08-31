/**
 * The test key.
 *
 * This is a password that opens the registration form — the form that asks a child for
 * medical details — on the live site. It is small enough to read in one sitting and that
 * is deliberate, because the entire safeguarding argument for having it at all is that it
 * cannot be guessed and cannot be forged.
 */
import { describe, it, expect, afterEach } from "vitest";
import { keyMatches } from "./testing-access";
import { registrationTestKey } from "./features";

const GOOD = "a".repeat(24) + "-real-key";

afterEach(() => {
  delete process.env.SWC_TEST_KEY;
});

describe("keyMatches", () => {
  it("accepts the exact key", () => {
    expect(keyMatches(GOOD, GOOD)).toBe(true);
  });

  it("rejects a near miss", () => {
    expect(keyMatches(GOOD + "x", GOOD)).toBe(false);
    expect(keyMatches(GOOD.slice(0, -1), GOOD)).toBe(false);
  });

  it("rejects the obvious forgeries — the reason the cookie holds the key itself", () => {
    for (const forged of ["1", "true", "yes", "swc_tester", ""]) {
      expect(keyMatches(forged, GOOD)).toBe(false);
    }
  });

  it("rejects everything when no key is configured", () => {
    expect(keyMatches(GOOD, null)).toBe(false);
    expect(keyMatches("", null)).toBe(false);
  });

  it("rejects a non-string, rather than coercing it", () => {
    expect(keyMatches(undefined, GOOD)).toBe(false);
    expect(keyMatches(null, GOOD)).toBe(false);
    expect(keyMatches(1, GOOD)).toBe(false);
  });
});

describe("registrationTestKey", () => {
  it("is null when unset — the feature does not exist by default", () => {
    expect(registrationTestKey()).toBeNull();
  });

  it("refuses a short key, so a typo cannot become a working password", () => {
    process.env.SWC_TEST_KEY = "true";
    expect(registrationTestKey()).toBeNull();
    process.env.SWC_TEST_KEY = "short";
    expect(registrationTestKey()).toBeNull();
  });

  it("accepts a key of 24 characters or more", () => {
    process.env.SWC_TEST_KEY = GOOD;
    expect(registrationTestKey()).toBe(GOOD);
  });
});
