/**
 * Volunteer sign-ups.
 *
 * Two things here are not ordinary form validation and both have a test of their own:
 * the 18-or-over rule, which is a safeguarding rule at an event for children; and the
 * referee, which is the only place in this app where somebody hands us a THIRD party's
 * contact details.
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import {
  validateVolunteer,
  createVolunteer,
  allVolunteers,
  setVolunteerStatus,
  deleteVolunteer,
  volunteerCounts,
  type VolunteerInput,
} from "./volunteer-store";
import { VOLUNTEER_ROLES } from "./volunteer-types";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const SLUG = "e1";

const input = (over: Partial<VolunteerInput> = {}): VolunteerInput => ({
  eventSlug: SLUG,
  fullName: "Harpreet Singh",
  email: "Harpreet@Example.com",
  mobile: "07700 900123",
  roles: ["desk", "langar"],
  availability: "all-day",
  dbs: "not-sure",
  over18: true,
  refereeName: "Manjit Kaur",
  refereeRelation: "youth lead at our gurdwara",
  refereeContact: "manjit@example.com",
  ...over,
});

async function seed(over: Partial<VolunteerInput> = {}) {
  const v = validateVolunteer(input(over));
  if (!v.ok) throw new Error(v.error);
  return createVolunteer(v.value);
}

describe("who is allowed to sign up", () => {
  it("refuses anybody who has not said they are 18 or over", async () => {
    const r = validateVolunteer(input({ over18: false }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    // And the refusal has to offer a way through, or a willing seventeen-year-old just
    // leaves. The message names the support form.
    expect(r.error).toMatch(/18 or over/i);
    expect(r.error).toMatch(/support/i);
  });

  it("insists on a referee — name, relationship, and one way to reach them", async () => {
    for (const missing of [
      { refereeName: "" },
      { refereeRelation: "" },
      { refereeContact: "" },
    ]) {
      expect(validateVolunteer(input(missing)).ok).toBe(false);
    }
  });

  it("insists on a mobile, because it is the only route that works on the day", async () => {
    expect(validateVolunteer(input({ mobile: "" })).ok).toBe(false);
    expect(validateVolunteer(input({ mobile: "0770" })).ok).toBe(false);
    expect(validateVolunteer(input({ mobile: "+44 7700 900123" })).ok).toBe(true);
  });

  it("wants at least one job, so nobody signs up for nothing", async () => {
    expect(validateVolunteer(input({ roles: [] })).ok).toBe(false);
  });
});

describe("what the server will accept", () => {
  it("drops a role that is not one of ours rather than storing it", async () => {
    // Invariant 5: the browser offers our list, and the server accepts only our list.
    const r = validateVolunteer(input({ roles: ["desk", "admin-god-mode"] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.roles).toEqual(["desk"]);
  });

  it("refuses an availability or a DBS answer it did not offer", async () => {
    expect(validateVolunteer(input({ availability: "whenever" })).ok).toBe(false);
    expect(validateVolunteer(input({ dbs: "probably" })).ok).toBe(false);
  });

  it("every role on the public page is one the server accepts", async () => {
    for (const role of VOLUNTEER_ROLES) {
      const r = validateVolunteer(input({ roles: [role.id] }));
      expect(r.ok).toBe(true);
    }
  });

  it("tidies the contact details rather than arguing about them", async () => {
    const r = validateVolunteer(
      input({ fullName: "  Harpreet   Singh ", email: " HARPREET@Example.COM " }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.fullName).toBe("Harpreet Singh");
    expect(r.value.email).toBe("harpreet@example.com");
  });
});

describe("the stored record", () => {
  it("holds the role ids and not the labels", async () => {
    const v = await seed();
    const db = await getDb();
    const row = await db
      .prepare("SELECT roles FROM volunteers WHERE id = ?")
      .bind(v.id)
      .first<{ roles: string }>();
    // A label is copy and will be reworded; a stored label rewrites history silently.
    expect(JSON.parse(row!.roles)).toEqual(["desk", "langar"]);
    expect(row!.roles).not.toContain("Check-in desk");
  });

  it("has NO column for a DBS certificate number or anything a check found", async () => {
    const db = await getDb();
    const { results } = await db
      .prepare("PRAGMA table_info(volunteers)")
      .all<{ name: string }>();
    const columns = results.map((c) => c.name);
    for (const banned of [
      "dbs_number",
      "dbs_certificate",
      "certificate_number",
      "dbs_issued",
      "convictions",
      "date_of_birth",
      "dob",
    ]) {
      expect(columns).not.toContain(banned);
    }
    // Three words, and nothing else — see migrations/0015.
    expect(columns).toContain("dbs");
  });

  it("queues the unanswered ones first", async () => {
    const a = await seed({ fullName: "Amrit Kaur", email: "a@example.com" });
    const b = await seed({ fullName: "Baljit Singh", email: "b@example.com" });
    await setVolunteerStatus(a.reference, "accepted", "mod-1");

    const list = await allVolunteers(SLUG);
    expect(list[0].reference).toBe(b.reference);
    expect(list[1].status).toBe("accepted");
  });

  it("records who decided, and when", async () => {
    const v = await seed();
    await setVolunteerStatus(v.reference, "declined", "mod-7");
    const [row] = await allVolunteers(SLUG);
    expect(row.status).toBe("declined");
    expect(row.decidedBy).toBe("mod-7");
    expect(row.decidedAt).not.toBeNull();
  });

  it("counts what the badge on /admin shows", async () => {
    const a = await seed({ email: "a@example.com" });
    await seed({ email: "b@example.com" });
    await setVolunteerStatus(a.reference, "accepted", "mod-1");
    expect(await volunteerCounts(SLUG)).toEqual({ total: 2, waiting: 1, accepted: 1 });
  });
});

describe("removing one", () => {
  it("is the only thing that deletes a row, and it takes the referee with it", async () => {
    // There is deliberately no automatic purge — invariant 9, and no retention duration
    // for volunteer records has been decided. This button is the whole mechanism, so it
    // has to actually remove the third party's details as well.
    const v = await seed();
    expect(await deleteVolunteer(v.reference)).toBe(true);

    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM volunteers")
      .all<Record<string, unknown>>();
    expect(results).toHaveLength(0);
    expect(JSON.stringify(results)).not.toContain("Manjit");
  });

  it("reports a reference it does not know rather than pretending", async () => {
    expect(await deleteVolunteer("VOL-NOPE")).toBe(false);
    expect(await setVolunteerStatus("VOL-NOPE", "accepted", "mod-1")).toBe(false);
  });
});
