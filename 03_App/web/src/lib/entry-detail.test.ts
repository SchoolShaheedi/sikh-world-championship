/**
 * The participant detail view.
 *
 * Two properties are worth defending here and they pull against each other. The page has
 * to show a moderator enough to decide something — that is why it exists — and it must not
 * put a child's contact details on a screen that happens to be projected. The masking is
 * what reconciles them, and it is only worth anything if it is done before the data leaves
 * the server.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { apply } from "./store";
import { getDb } from "./db";
import {
  maskEmail,
  maskPhone,
  maskName,
  maskDob,
  entryDetail,
  entryContact,
  entryStats,
} from "./entry-detail";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const EVENT_DATE = "2026-10-03";

async function entrant(over: Record<string, unknown> = {}) {
  const r = await apply({
    eventSlug: "e1",
    divisionId: "open",
    answers: {
      fullName: "Amritpal Singh",
      dob: "2013-03-04",
      email: "amritpal.singh@example.com",
      mobile: "07700900123",
      region: "Leicester",
      referralOrg: "Shaheedi Bunga",
      skill: "Play a lot",
      guardianName: "Rupinder Kaur",
      guardianRelation: "Mother",
      guardianEmail: "rupinder@example.com",
      guardianMobile: "07700911222",
      emergencyName: "Rupinder Kaur",
      emergencyPhone: "07700911222",
      medicalConditions: ["Asthma"],
      medical: "Blue inhaler in his bag.",
      ...over,
    },
  });
  return r.reference;
}

describe("masking", () => {
  it("keeps an email recognisable without making it usable", () => {
    const m = maskEmail("amritpal.singh@example.com");
    expect(m.startsWith("a")).toBe(true);
    expect(m.endsWith(".com")).toBe(true);
    // The parts that would let somebody write to a child are gone.
    expect(m).not.toContain("mritpal");
    expect(m).not.toContain("example");
  });

  it("leaves the last three digits of a phone number, and nothing dialable", () => {
    // "the number ending 123" is a real thing to say to a parent who is lost on the way.
    const m = maskPhone("07700900123");
    expect(m).toBe("07•••123");
    expect(m.replace(/\D/g, "")).toHaveLength(5);
  });

  it("reduces a name to initials", () => {
    expect(maskName("Rupinder Kaur")).toBe("R••• K•••");
  });

  it("hides the LENGTH as well as the characters", () => {
    /**
     * The first version used one bullet per hidden character, which is a real narrowing
     * for a name — an eight-letter Sikh first name beginning with R is a short list.
     * Every mask is fixed-width, so two different values of different lengths mask to
     * exactly the same string.
     */
    expect(maskName("Raj Kaur")).toBe(maskName("Rupinder Kaur"));
    expect(maskEmail("a@b.com")).toBe(maskEmail("amritpal.singh@example.com"));
    // Same first two and last three digits, different lengths, identical mask.
    expect(maskPhone("07700900123")).toBe(maskPhone("077009000123"));
  });

  it("keeps the birth year and drops the identifying part", () => {
    expect(maskDob("2013-03-04")).toBe("2013-••-••");
  });

  it("says nothing at all about an absent value", () => {
    for (const f of [maskEmail, maskPhone, maskName, maskDob]) {
      expect(f(null)).toBe("—");
      expect(f("")).toBe("—");
    }
  });

  it("does not fall apart on input that is not the shape it expects", () => {
    // These come out of a database, and a row written before a validation rule existed is
    // exactly the row that makes a formatter throw on a page somebody needs.
    expect(maskEmail("no-at-sign")).not.toContain("no-at-sign");
    expect(maskPhone("123")).not.toContain("123");
    expect(maskDob("13")).toBe("—");
  });
});

describe("the detail a moderator gets", () => {
  it("NEVER contains an unmasked contact detail", async () => {
    /**
     * The property the whole design rests on. Hiding a value with CSS leaves it in the page
     * source, so a masked field has to be genuinely absent — otherwise "safe to project"
     * is false and nobody would know.
     */
    const ref = await entrant();
    const d = await entryDetail(ref, EVENT_DATE);
    const serialised = JSON.stringify(d);

    for (const secret of [
      "amritpal.singh@example.com",
      "07700900123",
      "rupinder@example.com",
      "07700911222",
      "Rupinder Kaur",
      "2013-03-04",
      "Blue inhaler in his bag.",
      "Asthma",
    ]) {
      expect(serialised).not.toContain(secret);
    }
  });

  it("still says THAT there is something medical, without saying what", async () => {
    // A moderator has to know a record exists before they know to look at it.
    const d = await entryDetail(await entrant(), EVENT_DATE);
    expect(d!.hasMedical).toBe(true);
  });

  it("does not call an explicit 'None' a medical record", async () => {
    // "None" is a real answer to the tick-list, not a blank. Flagging it would put an
    // amber marker against half the field and make the marker worthless.
    const ref = await entrant({ medicalConditions: ["None"], medical: undefined });
    const d = await entryDetail(ref, EVENT_DATE);
    expect(d!.hasMedical).toBe(false);
  });

  it("gives the age on the day of the EVENT, not today's age", async () => {
    // Every supervision rule turns on the age on 3 October. A birthday in between is
    // exactly how somebody ends up in the wrong tier.
    const ref = await entrant({ dob: "2010-12-01" });
    const d = await entryDetail(ref, EVENT_DATE);
    expect(d!.ageOnEventDay).toBe(15); // 16 in December, still 15 on 3 October
    expect(d!.under16).toBe(true);
  });

  it("shows the answers it exists to show, plainly", async () => {
    const d = await entryDetail(await entrant(), EVENT_DATE);
    expect(d!.referralOrg).toBe("Shaheedi Bunga");
    expect(d!.region).toBe("Leicester");
    expect(d!.selfRating).toBe("Play a lot");
  });

  it("reports a purge rather than an empty record", async () => {
    // A blank medical block after the 30-day purge and a blank one because nothing was
    // declared look identical, and only one of them means "nothing was ever wrong".
    const ref = await entrant();
    const db = await getDb();
    await db
      .prepare("UPDATE registrations SET medical_purged_at = ? WHERE reference = ?")
      .bind("2026-11-03T00:00:00Z", ref)
      .run();
    const d = await entryDetail(ref, EVENT_DATE);
    expect(d!.medicalPurged).toBe(true);
  });

  it("returns null for a reference that does not exist", async () => {
    expect(await entryDetail("SWC-NOT-REAL", EVENT_DATE)).toBeNull();
  });
});

describe("the reveal", () => {
  it("returns the real values, and is the only thing that does", async () => {
    const ref = await entrant();
    const c = await entryContact(ref);
    expect(c!.email).toBe("amritpal.singh@example.com");
    expect(c!.mobile).toBe("07700900123");
    expect(c!.guardianEmail).toBe("rupinder@example.com");
    expect(c!.medical).toBe("Blue inhaler in his bag.");
  });
});

describe("the shape of the field", () => {
  it("counts referrals, cities and self-ratings without naming anybody", async () => {
    await entrant();
    await entrant({ email: "b@example.com", region: "Derby", referralOrg: "Nobody — I found it myself", skill: "Casual player" });
    await entrant({ email: "c@example.com", region: "Derby", referralOrg: "Devanhaar", skill: "Casual player" });

    const s = await entryStats("e1", EVENT_DATE);
    expect(s.total).toBe(3);
    expect(s.referredTotal).toBe(2);
    expect(s.byRegion[0]).toEqual({ label: "Derby", count: 2 });
    expect(s.bySelfRating[0]).toEqual({ label: "Casual player", count: 2 });

    // Nothing identifying is in the counts at all.
    const serialised = JSON.stringify(s);
    expect(serialised).not.toContain("Amritpal");
    expect(serialised).not.toContain("example.com");
  });

  it("groups ages by what each group NEEDS, not by number", async () => {
    await entrant({ dob: "2013-03-04" }); // 13 — parent stays
    await entrant({ email: "b@example.com", dob: "2009-03-04" }); // 17 — leaving permission
    await entrant({ email: "c@example.com", dob: "2004-03-04" }); // 22 — adult

    const s = await entryStats("e1", EVENT_DATE);
    const labels = s.byAgeGroup.map((t) => t.label).sort();
    expect(labels).toEqual(["12–15 (parent stays)", "16–17 (leaving permission)", "18+"]);
    expect(s.under18).toBe(2);
  });

  it("orders biggest first, and identically for identical counts", async () => {
    // A table that reshuffles between two refreshes with the same numbers in it is a table
    // nobody trusts.
    await entrant({ region: "Derby" });
    await entrant({ email: "b@example.com", region: "Ayr" });
    const a = await entryStats("e1", EVENT_DATE);
    const b = await entryStats("e1", EVENT_DATE);
    expect(a.byRegion).toEqual(b.byRegion);
    expect(a.byRegion[0].label).toBe("Ayr"); // tie broken alphabetically
  });

  it("counts an unanswered optional question rather than dropping it", async () => {
    await entrant({ region: undefined });
    const s = await entryStats("e1", EVENT_DATE);
    expect(s.byRegion).toEqual([{ label: "Not given", count: 1 }]);
  });
});
