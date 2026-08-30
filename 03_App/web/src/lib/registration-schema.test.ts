/**
 * Tests for the registration validator.
 *
 * The two cases that matter most are the ones the old endpoint got wrong: an under-18
 * confirmed with no guardian on record, and arbitrary keys persisted next to a child's
 * medical notes. Both are asserted here so neither can come back quietly.
 */
import { describe, it, expect } from "vitest";
import { validateRegistration, ageOnEventDay } from "./registration-schema";
import { getEvent } from "@/data/events";

const event = getEvent("sikh-fc-27")!;
const division = event.divisions[0];


/** A complete, valid adult submission. Tests override single keys off this. */
function adult(over: Record<string, unknown> = {}) {
  return {
    divisionId: "open",
    fullName: "Real User",
    dob: "2006-04-10",
    email: "real@example.com",
    mobile: "07700 900123",
    rulesAgreed: true,
    referralOrg: "Nobody — I found it myself",
    psnId: "realuser",
    skill: "Casual player",
    // Round 25: required of every adult entrant.
    emergencyName: "A Friend",
    emergencyRelation: "Brother",
    emergencyPhone: "07700 900999",
    ...over,
  };
}

/** The four contact fields plus entry consent, common to every under-18 tier. */
const guardianContact = {
  guardianName: "A Parent",
  guardianRelation: "Mother",
  guardianEmail: "parent@example.com",
  guardianMobile: "07700 900125",
  guardianConsent: true,
};

/** A complete 12–15 submission: a guardian stays at the venue. */
function onSite(over: Record<string, unknown> = {}) {
  return adult({
    dob: "2013-05-02",
    ...guardianContact,
    guardianOnSite: true,
    skill: "First time competing",
    ...over,
  });
}

/** A complete 16–17 submission: attending independently with consent. */
function independent(over: Record<string, unknown> = {}) {
  return adult({
    dob: "2009-05-02",
    ...guardianContact,
    guardianIndependentConsent: true,
    skill: "First time competing",
    ...over,
  });
}

describe("ageOnEventDay", () => {
  it("uses the event date, not today, so eligibility doesn't drift", () => {
    expect(ageOnEventDay("2010-06-01", "2026-05-01")).toBe(15);
    expect(ageOnEventDay("2010-06-01", "2026-07-01")).toBe(16);
  });

  it("returns null for a date it cannot read", () => {
    expect(ageOnEventDay("not-a-date", "2026-07-01")).toBeNull();
  });
});

describe("guardian tiers", () => {
  it("accepts each tier when its own block is complete", () => {
    expect(validateRegistration(event, division, onSite()).ok).toBe(true);
    expect(validateRegistration(event, division, onSite()).ok).toBe(true);
    expect(validateRegistration(event, division, independent()).ok).toBe(true);
  });

  it("REJECTS any under-18 with no guardian details at all", () => {
    const r = validateRegistration(event, division, adult({ dob: "2013-01-01" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors).toHaveProperty("guardianEmail");
    expect(r.fieldErrors).toHaveProperty("guardianConsent");
  });

  it("REJECTS an under-18 whose guardian withheld entry consent", () => {
    const r = validateRegistration(event, division, onSite({ guardianConsent: false }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors?.guardianConsent).toMatch(/parent or guardian/i);
  });

  it("requires the on-site promise from an under-16, and nothing weaker", () => {
    const r = validateRegistration(event, division, onSite({ guardianOnSite: false }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors?.guardianOnSite).toMatch(/under 16/i);
  });




  it("requires independent-attendance consent from a 16–17", () => {
    const r = validateRegistration(
      event, division, independent({ guardianIndependentConsent: false }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors?.guardianIndependentConsent).toMatch(/16 or 17/i);
  });

  it("lets a 16–17's guardian decide about leaving unaccompanied, either way", () => {
    expect(validateRegistration(event, division, independent({ mayLeaveUnaccompanied: true })).ok).toBe(true);
    expect(validateRegistration(event, division, independent({ mayLeaveUnaccompanied: false })).ok).toBe(true);
  });

  it("does not demand a guardian block from an adult", () => {
    expect(validateRegistration(event, division, adult()).ok).toBe(true);
  });

  it("treats a 17-year-old as a minor, not an adult", () => {
    // Born 2008-12-31 -> 17 today (2026). Must still need a guardian.
    const r = validateRegistration(event, division, adult({ dob: "2009-12-31" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors).toHaveProperty("guardianEmail");
  });
});

describe("photo consent for under-18s", () => {
  it("is the guardian's to give, and never blocks entry either way", () => {
    // Decision 18: the photo is optional on purpose. Refusing must not stop a child
    // competing, and the child must not be able to answer it for themselves.
    expect(validateRegistration(event, division, onSite({ guardianPhotoConsent: true })).ok).toBe(true);
    expect(validateRegistration(event, division, onSite({ guardianPhotoConsent: false })).ok).toBe(true);
    const body = onSite();
    delete (body as Record<string, unknown>).guardianPhotoConsent;
    expect(validateRegistration(event, division, body).ok).toBe(true);
  });
});

describe("medical tick-list", () => {
  it("accepts conditions from the list", () => {
    const r = validateRegistration(event, division, adult({ medicalConditions: ["Asthma", "Diabetes"] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.answers.medicalConditions).toEqual(["Asthma", "Diabetes"]);
  });

  it("records 'None' as an explicit answer rather than a blank", () => {
    const r = validateRegistration(event, division, adult({ medicalConditions: ["None"] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.answers.medicalConditions).toEqual(["None"]);
  });

  it("rejects a condition that is not on the list", () => {
    expect(
      validateRegistration(event, division, adult({ medicalConditions: ["Lycanthropy"] })).ok,
    ).toBe(false);
  });

  it("keeps the free-text detail box alongside it", () => {
    const r = validateRegistration(
      event, division,
      adult({ medicalConditions: ["Asthma"], medical: "Blue inhaler, in his bag" }),
    );
    expect(r.ok).toBe(true);
  });
});

describe("avatarId", () => {
  it("accepts a real avatar id, because the form always sends one", () => {
    expect(validateRegistration(event, division, adult({ avatarId: "kesri-1" })).ok).toBe(true);
  });

  it("rejects an id that would render a broken player card", () => {
    expect(validateRegistration(event, division, adult({ avatarId: "not-an-avatar" })).ok).toBe(false);
  });
});

describe("unknown keys", () => {
  it("REJECTS a body carrying a field we never asked for", () => {
    const r = validateRegistration(event, division, adult({ injectedKey: "evil" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/don't recognise/i);
  });

  it("never lets an unknown key reach the stored answers", () => {
    const r = validateRegistration(event, division, adult({ isAdmin: true }));
    expect(r.ok).toBe(false);
  });
});

describe("required consents", () => {
  it.each(["rulesAgreed", "referralOrg"])("requires %s", (key) => {
    const body = adult();
    delete (body as Record<string, unknown>)[key];
    const r = validateRegistration(event, division, body);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors).toHaveProperty(key);
  });

  it("leaves the photo consent genuinely optional", () => {
    // Decision 18: the photo is optional on purpose, so absence must not block entry.
    expect(validateRegistration(event, division, adult()).ok).toBe(true);
    expect(validateRegistration(event, division, adult({ photoConsent: false })).ok).toBe(true);
  });
});

describe("event-specific fields", () => {
  it("only accepts a select value from that field's own options", () => {
    const r = validateRegistration(event, division, adult({ skill: "Grandmaster" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors).toHaveProperty("skill");
  });

  it("requires a required event field", () => {
    const body = adult();
    delete (body as Record<string, unknown>).psnId;
    expect(validateRegistration(event, division, body).ok).toBe(false);
  });
});

describe("untouched optional fields", () => {
  it("accepts empty strings from the form's shared state object", () => {
    // The browser form submits "" for every box the user never touched. Rejecting those
    // as "too short" broke the real form once; this is the guard against a repeat.
    const r = validateRegistration(
      event,
      division,
      adult({ region: "", medical: "", dietary: "", accessibility: "", favouriteTeam: "" }),
    );
    expect(r.ok).toBe(true);
  });

  it("resolves them to undefined, so nothing empty is persisted", () => {
    const r = validateRegistration(event, division, adult({ region: "", favouriteTeam: "" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.answers.region).toBeUndefined();
    expect(r.answers.favouriteTeam).toBeUndefined();
    // The store writes with JSON.stringify, which omits undefined — so the guarantee
    // that matters is what survives serialisation, not the in-memory key.
    const persisted = JSON.parse(JSON.stringify(r.answers));
    expect(persisted).not.toHaveProperty("region");
    expect(persisted).not.toHaveProperty("favouriteTeam");
  });
});

describe("field hygiene", () => {
  it("normalises the email so one person is not two registrations", () => {
    const r = validateRegistration(event, division, adult({ email: "  Real@Example.COM " }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.answers.email).toBe("real@example.com");
  });

  it("rejects an unusable email", () => {
    expect(validateRegistration(event, division, adult({ email: "not-an-email" })).ok).toBe(false);
  });

  it("rejects a phone number a volunteer could not dial", () => {
    expect(validateRegistration(event, division, adult({ mobile: "call me" })).ok).toBe(false);
  });

  it("caps medical notes rather than storing an unbounded blob", () => {
    const r = validateRegistration(event, division, adult({ medical: "x".repeat(5000) }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors).toHaveProperty("medical");
  });

  it("explains a mistyped future year instead of quoting the age limit", () => {
    const r = validateRegistration(event, division, adult({ dob: "2030-01-01" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/future/i);
  });

  it("still enforces the division's own age floor", () => {
    // Event 1 admits 12 to 21, so a four-year-old is turned away with that range named.
    const r = validateRegistration(event, division, onSite({ dob: "2022-01-01" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/ages 12/);
  });

  it("enforces the division's age CEILING too", () => {
    // New with FC 27: the event has an upper bound of 21, which no previous event had.
    const r = validateRegistration(event, division, adult({ dob: "1990-01-01" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/ages 12/);
  });

  it("rejects a body that is not an object at all", () => {
    expect(validateRegistration(event, division, "hello").ok).toBe(false);
    expect(validateRegistration(event, division, null).ok).toBe(false);
    expect(validateRegistration(event, division, []).ok).toBe(false);
  });
});


describe("emergency contact", () => {
  it("is required of an adult entrant", () => {
    for (const key of ["emergencyName", "emergencyRelation", "emergencyPhone"]) {
      const body = adult();
      delete (body as Record<string, unknown>)[key];
      const r = validateRegistration(event, division, body);
      expect(r.ok, `${key} should be required`).toBe(false);
      if (r.ok) continue;
      expect(r.fieldErrors).toHaveProperty(key);
    }
  });

  it("rejects a phone number nobody could dial in an emergency", () => {
    expect(
      validateRegistration(event, division, adult({ emergencyPhone: "ask around" })).ok,
    ).toBe(false);
  });

  it("is NOT asked of an under-18 a second time — the guardian is the contact", () => {
    // Duplicating a child's guardian into a second set of fields would mean holding the
    // same personal data twice for no gain.
    // onSite is an under-12, which event 1 does not admit — check it on the wide event.
    for (const [ev, div, body] of [
      [event, division, onSite()],
      [event, division, onSite()],
      [event, division, independent()],
    ] as const) {
      delete (body as Record<string, unknown>).emergencyName;
      delete (body as Record<string, unknown>).emergencyRelation;
      delete (body as Record<string, unknown>).emergencyPhone;
      expect(validateRegistration(ev, div, body).ok).toBe(true);
    }
  });

  it("means every accepted registration has someone to call", () => {
    // The property that actually matters: adult -> emergency fields; minor -> guardian.
    const adultResult = validateRegistration(event, division, adult());
    expect(adultResult.ok).toBe(true);
    if (adultResult.ok) {
      expect(adultResult.answers.emergencyPhone).toBeTruthy();
    }

    const minorResult = validateRegistration(event, division, onSite());
    expect(minorResult.ok).toBe(true);
    if (minorResult.ok) {
      expect(minorResult.answers.guardianMobile).toBeTruthy();
    }
  });
});


describe("the age boundary between tiers", () => {
  // One number decides whether a child's parent has to give up their whole Saturday, and
  // the brief was ambiguous at 16. These pin the reading down so a change is deliberate.
  it("a 15-year-old needs a guardian at the venue", () => {
    const r = validateRegistration(event, division, onSite({ dob: "2011-01-01" }));
    expect(r.ok).toBe(true);
  });

  it("a 15-year-old CANNOT substitute independent-attendance permission", () => {
    const body = onSite({ dob: "2011-01-01", guardianOnSite: false, guardianIndependentConsent: true });
    const r = validateRegistration(event, division, body);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors?.guardianOnSite).toMatch(/under 16/i);
  });

  it("a 16-year-old may come alone with permission, no on-site promise needed", () => {
    const r = validateRegistration(event, division, independent({ dob: "2010-01-01" }));
    expect(r.ok).toBe(true);
  });

  it("an 18-year-old needs no guardian at all", () => {
    expect(validateRegistration(event, division, adult({ dob: "2008-01-01" })).ok).toBe(true);
  });
});
