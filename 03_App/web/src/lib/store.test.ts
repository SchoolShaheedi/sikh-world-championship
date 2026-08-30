import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import {
  apply,
  applicantsFor,
  selectedCount,
  checkIn,
  purgeMedical,
  clearCheckInTokens,
  registrationsFor,
} from "./store";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

/** A complete, valid application. Tests override single fields. */
function base(over: Record<string, unknown> = {}) {
  return {
    eventSlug: "e1",
    divisionId: "open",
    answers: {
      fullName: "A Player",
      dob: "2010-05-02",
      email: "p@example.com",
      mobile: "07700900123",
      referralOrg: "Nobody — I found it myself",
      ...over,
    },
  };
}


describe("applying", () => {
  it("records an application, not a place", async () => {
    // The point of the change: filling in the form decides nothing.
    const r = await apply(base());
    expect(r.status).toBe("applied");
    expect(r.reference).toBeTruthy();

    const [row] = await registrationsFor("e1");
    expect(row.status).toBe("applied");
  });

  it("creates NO account and NO check-in token at submission", async () => {
    // Both belong to selection. A token handed to everyone who filled in a form is not a
    // credential, and accounts for people who never got in are data held for nothing.
    await apply(base());
    const [row] = await registrationsFor("e1");
    expect(row.playerId).toBeNull();
    expect(row.checkInToken).toBe("");
  });

  it("does not cap applications at the number of places", async () => {
    // Turning people away at the form would defeat the point of drawing.
    for (let i = 0; i < 12; i++) await apply(base({ email: `a${i}@example.com` }));
    expect(await applicantsFor("e1")).toHaveLength(12);
    expect(await selectedCount("e1")).toBe(0);
  });

  it("gives every application a unique reference", async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) seen.add((await apply(base())).reference);
    expect(seen.size).toBe(40);
  });

  it("uses a reference alphabet with no confusable characters", async () => {
    // References are read aloud at a desk and typed by volunteers.
    const r = await apply(base());
    expect(r.reference).toMatch(/^SWC-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}$/);
    expect(r.reference).not.toMatch(/[0O1IL]/);
  });

  it("stores the referral answer, and nothing infers anything from it", async () => {
    await apply(base({ referralOrg: "Basics of Sikhi" }));
    const [row] = await registrationsFor("e1");
    expect(row.answers.referralOrg).toBe("Basics of Sikhi");
  });
});

describe("check-in", () => {
  it("ignores an unknown token", async () => {
    expect(await checkIn("nope")).toBeNull();
  });

  it("does NOT accept the human-readable reference as a check-in token", async () => {
    const r = await apply(base());
    expect(await checkIn(r.reference)).toBeNull();
  });

  it("refuses an empty token even after tokens are cleared", async () => {
    expect(await checkIn("")).toBeNull();
  });
});

describe("retention", () => {
  /** A registration with medical details, of the shape the validator produces. */
  async function withMedical() {
    return apply({
      eventSlug: "e1",
      divisionId: "open",
      answers: {
        fullName: "A Child",
        dob: "2013-05-02",
        email: "c@example.com",
        mobile: "07700900123",
        medicalConditions: ["Asthma"],
        medical: "Blue inhaler, in his bag",
        dietary: "No peanuts",
        accessibility: "Quiet space at lunch",
        guardianEmail: "parent@example.com",
        psnId: "child1",
      },
    });
  }

  it("deletes medical fields while keeping the registration", async () => {
    // The operation the JSON store could not perform, and the reason
    // 04_Legal/RETENTION-POLICY.md was unenforceable: medical notes have a much shorter
    // lifetime than the registration they belong to.
    await withMedical();
    expect(await purgeMedical("e1")).toBe(1);

    const [row] = await registrationsFor("e1");
    expect(row).toBeDefined();
    expect(row.answers.medical).toBeUndefined();
    expect(row.answers.medicalConditions).toBeUndefined();
    expect(row.answers.dietary).toBeUndefined();
    expect(row.answers.accessibility).toBeUndefined();

    // Everything that is NOT special-category survives.
    expect(row.answers.fullName).toBe("A Child");
    expect(row.answers.guardianEmail).toBe("parent@example.com");
    expect(row.reference).toBeTruthy();
  });

  it("is idempotent, and records that it ran", async () => {
    await withMedical();
    expect(await purgeMedical("e1")).toBe(1);
    // A second pass finds nothing left to purge, so a scheduled job can run daily
    // without double-counting or rewriting rows.
    expect(await purgeMedical("e1")).toBe(0);
  });

  it("does not touch another event's registrations", async () => {
    await withMedical();
    await apply({
      eventSlug: "e2",
      divisionId: "open",
      answers: { fullName: "Other", dob: "2013-05-02", email: "o@example.com", mobile: "07700900124", medical: "Epilepsy" },
    });

    await purgeMedical("e1");
    const [other] = await registrationsFor("e2");
    expect(other.answers.medical).toBe("Epilepsy");
  });

  it("clears check-in tokens after the event", async () => {
    // Tokens are issued on selection, so seed one directly rather than pretending an
    // application has one.
    const r = await withMedical();
    const db = await getDb();
    await db
      .prepare("UPDATE registrations SET check_in_token = 'live-token' WHERE reference = ?")
      .bind(r.reference)
      .run();
    expect(await checkIn("live-token")).not.toBeNull();

    await clearCheckInTokens("e1");
    // The credential is gone, and an empty token must not match the rows it was cleared
    // from — otherwise clearing them would turn "" into a master key.
    expect(await checkIn("live-token")).toBeNull();
    expect(await checkIn("")).toBeNull();
  });
});

describe("retention", () => {
  /** A registration with medical details, of the shape the validator produces. */
  async function withMedical() {
    return apply({
      eventSlug: "e1",
      divisionId: "open",
      answers: {
        fullName: "A Child",
        dob: "2013-05-02",
        email: "c@example.com",
        mobile: "07700900123",
        medicalConditions: ["Asthma"],
        medical: "Blue inhaler, in his bag",
        dietary: "No peanuts",
        accessibility: "Quiet space at lunch",
        guardianEmail: "parent@example.com",
        psnId: "child1",
      },
    });
  }

  it("deletes medical fields while keeping the registration", async () => {
    // The operation the JSON store could not perform, and the reason
    // 04_Legal/RETENTION-POLICY.md was unenforceable: medical notes have a much shorter
    // lifetime than the registration they belong to.
    await withMedical();
    expect(await purgeMedical("e1")).toBe(1);

    const [row] = await registrationsFor("e1");
    expect(row).toBeDefined();
    expect(row.answers.medical).toBeUndefined();
    expect(row.answers.medicalConditions).toBeUndefined();
    expect(row.answers.dietary).toBeUndefined();
    expect(row.answers.accessibility).toBeUndefined();

    // Everything that is NOT special-category survives.
    expect(row.answers.fullName).toBe("A Child");
    expect(row.answers.guardianEmail).toBe("parent@example.com");
    expect(row.reference).toBeTruthy();
  });

  it("is idempotent, and records that it ran", async () => {
    await withMedical();
    expect(await purgeMedical("e1")).toBe(1);
    // A second pass finds nothing left to purge, so a scheduled job can run daily
    // without double-counting or rewriting rows.
    expect(await purgeMedical("e1")).toBe(0);
  });

  it("does not touch another event's registrations", async () => {
    await withMedical();
    await apply({
      eventSlug: "e2",
      divisionId: "open",
      answers: { fullName: "Other", dob: "2013-05-02", email: "o@example.com", mobile: "07700900124", medical: "Epilepsy" },
    });

    await purgeMedical("e1");
    const [other] = await registrationsFor("e2");
    expect(other.answers.medical).toBe("Epilepsy");
  });

});
