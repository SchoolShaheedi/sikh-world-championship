/**
 * The public tournament handle.
 *
 * These tests exist because of a safeguarding decision, not a formatting one: what goes on
 * the projector must never be the entrant's PSN ID (a contact route — search it and you
 * can message a twelve-year-old) and never their surname (the policy promise on every
 * public surface). Both refusals below fail without the code in lib/handle.ts.
 */
import { describe, it, expect } from "vitest";
import { checkHandle, defaultHandle, resolveHandle, HANDLE_MAX } from "./handle";

describe("defaultHandle", () => {
  it("is first name plus last initial", () => {
    expect(defaultHandle("Amritpal Singh")).toBe("Amritpal S.");
  });

  it("uses the LAST word as the initial, not the second", () => {
    expect(defaultHandle("Gurpreet Kaur Dhillon")).toBe("Gurpreet D.");
  });

  it("leaves a single-word name alone rather than inventing an initial", () => {
    expect(defaultHandle("Tegh")).toBe("Tegh");
  });

  it("never exceeds the cap, and truncates the tail so the start stays readable", () => {
    const out = defaultHandle("Harjinderpalvinder Singh");
    expect(out.length).toBeLessThanOrEqual(HANDLE_MAX);
    expect(out.startsWith("Harjinder")).toBe(true);
    expect(out.endsWith("S.")).toBe(true);
  });

  it("does not throw on an empty name", () => {
    expect(defaultHandle("   ")).toBe("Player");
  });
});

describe("checkHandle", () => {
  it("accepts an ordinary nickname", () => {
    expect(checkHandle("Tegh_FC", { fullName: "Tegh Bajwa" })).toBeNull();
  });

  it("REFUSES the entrant's own PSN ID", () => {
    const problem = checkHandle("harman_2013", {
      fullName: "Harman Sandhu",
      psnId: "harman_2013",
    });
    expect(problem?.code).toBe("psn-id");
    // The message has to explain why, not just refuse: a child who is told "no" with no
    // reason retypes a variant.
    expect(problem?.message).toMatch(/PlayStation/);
  });

  it("refuses the PSN ID regardless of case", () => {
    expect(
      checkHandle("Harman_2013", { fullName: "Harman Sandhu", psnId: "harman_2013" })?.code,
    ).toBe("psn-id");
  });

  it("REFUSES the surname, even embedded in a longer handle", () => {
    expect(checkHandle("Singh_FC", { fullName: "Amrit Singh" })?.code).toBe("surname");
  });

  it("does not refuse a surname that merely appears as part of another word", () => {
    // "Sing" is not "Singh", and "Singer" must not be caught by a substring match.
    expect(checkHandle("Singer", { fullName: "Amrit Sing" })).toBeNull();
  });

  it("ignores a two-letter surname, where false positives outnumber real ones", () => {
    expect(checkHandle("Ho.Ho.Ho", { fullName: "Daniel Ho" })).toBeNull();
  });

  it("rejects characters that have no business on a printed card", () => {
    expect(checkHandle("<b>hi</b>", { fullName: "A B" })?.code).toBe("charset");
  });

  it("rejects something too short or too long", () => {
    expect(checkHandle("x")?.code).toBe("length");
    expect(checkHandle("x".repeat(HANDLE_MAX + 1))?.code).toBe("length");
  });

  it("has no opinion when there is no PSN ID or surname to compare against", () => {
    expect(checkHandle("Anything99")).toBeNull();
  });
});

describe("resolveHandle", () => {
  it("keeps a good handle", () => {
    expect(resolveHandle("Tegh_FC", "Tegh Bajwa", "tegh_psn")).toBe("Tegh_FC");
  });

  it("falls back to the default when the box was left empty", () => {
    expect(resolveHandle("", "Amrit Singh")).toBe("Amrit S.");
  });

  it("falls back rather than storing something the checks refuse", () => {
    // The server rejects a bad handle with a message before reaching here. This is the
    // last line: a name on the card beats a crash, and it must not be the PSN ID.
    expect(resolveHandle("harman_2013", "Harman Sandhu", "harman_2013")).toBe("Harman S.");
  });

  it("falls back when the value is not a string at all", () => {
    expect(resolveHandle(undefined, "Amrit Singh")).toBe("Amrit S.");
    expect(resolveHandle({ nope: true }, "Amrit Singh")).toBe("Amrit S.");
  });

  it("normalises the whitespace it keeps", () => {
    expect(resolveHandle("  Tegh   FC  ", "Tegh Bajwa")).toBe("Tegh FC");
  });
});
