/**
 * The arrival desk.
 *
 * Every test here is a situation somebody at a door will actually be in on 3 October, and
 * the reason each one is written down is that the failure mode is a wrong answer to "is
 * this child in the building?" rather than an error message.
 *
 * The pair that matter most are the two that look almost identical: a slip scanned twice
 * in a second (harmless, and constant), and a slip somebody else already used half an hour
 * ago (the only real attack on a paper pass, and how a child ends up unaccounted for). The
 * only thing that separates them is that the second one has a time on it.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { apply } from "./store";
import { upsertPlayer, playerByEmail } from "./players";
import { defaultHandle } from "./handle";
import { checkInPayload } from "./qr";
import {
  checkInRoster,
  checkInSlips,
  slipReadiness,
  checkInByScan,
  checkInByReference,
  undoCheckIn,
  setDobVerified,
  deskCounts,
} from "./check-in";

const EVENT_DATE = "2026-10-03";
const DESK = "moderator-on-the-desk";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

/**
 * Somebody with a place and a printed pass — the state `confirmSelection` leaves behind.
 * Built here rather than by calling selection.ts so these tests do not also send email.
 */
async function selected(over: {
  fullName?: string;
  dob?: string;
  email?: string;
  token?: string;
  slug?: string;
  guardianOnSite?: boolean;
  mayLeaveUnaccompanied?: boolean;
  withPlayer?: boolean;
} = {}) {
  const fullName = over.fullName ?? "Amritpal Singh";
  const email = over.email ?? "a@example.com";
  const slug = over.slug ?? "e1";
  const token = over.token ?? "tok-amritpal";

  const player = over.withPlayer === false
    ? null
    : await upsertPlayer({
        email,
        displayName: fullName.split(" ")[0],
        ageBand: "U16",
        dateOfBirth: over.dob ?? "2013-05-02",
        // Set exactly as `confirmSelection` sets it, because the public name is what ends
        // up on the slip and on the projector, and the two must not be able to differ.
        handle: defaultHandle(fullName),
      });

  const r = await apply({
    eventSlug: slug,
    divisionId: "open",
    answers: {
      fullName,
      dob: over.dob ?? "2013-05-02",
      email,
      mobile: "07700900123",
      guardianOnSite: over.guardianOnSite ?? false,
      mayLeaveUnaccompanied: over.mayLeaveUnaccompanied ?? false,
    },
    playerId: player?.id ?? null,
  });

  const db = await getDb();
  await db
    .prepare(
      "UPDATE registrations SET status = 'selected', check_in_token = ? WHERE reference = ?",
    )
    .bind(token, r.reference)
    .run();

  return { reference: r.reference, token, playerId: player?.id ?? null, email };
}

const scan = (raw: string) => checkInByScan("e1", EVENT_DATE, raw, DESK);

describe("scanning a pass", () => {
  it("checks somebody in, and says so", async () => {
    const s = await selected();

    const r = await scan(checkInPayload(s.token));

    expect(r.kind).toBe("checked-in");
    if (r.kind !== "checked-in") throw new Error("unreachable");
    expect(r.entry.fullName).toBe("Amritpal Singh");
    expect(r.entry.status).toBe("checked-in");
    expect(r.entry.checkedInAt).not.toBeNull();
  });

  it("records WHEN and WHICH VOLUNTEER — the whole point of migration 0012", async () => {
    const s = await selected();
    await scan(checkInPayload(s.token));

    const db = await getDb();
    const row = await db
      .prepare("SELECT checked_in_at, checked_in_by FROM registrations WHERE reference = ?")
      .bind(s.reference)
      .first<{ checked_in_at: string; checked_in_by: string }>();
    expect(row!.checked_in_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(row!.checked_in_by).toBe(DESK);
  });

  it("reports a SECOND scan rather than doing it again, and keeps the first time", async () => {
    // The distinction the desk lives on. A double scan is noise; a slip somebody else
    // already used is the one thing a paper pass is vulnerable to. Overwriting the
    // timestamp would erase the only evidence of the difference.
    const s = await selected();
    const first = await scan(checkInPayload(s.token));
    if (first.kind !== "checked-in") throw new Error("unreachable");

    const again = await scan(checkInPayload(s.token));

    expect(again.kind).toBe("already");
    if (again.kind !== "already") throw new Error("unreachable");
    expect(again.entry.checkedInAt).toBe(first.entry.checkedInAt);
  });

  it("tells a stranger's QR code apart from a pass it does not recognise", async () => {
    // Two different sentences and two different actions: "try again with your slip"
    // versus "come round the side, something is wrong".
    expect((await scan("https://example.com/loyalty")).kind).toBe("not-a-pass");
    expect((await scan(checkInPayload("never-issued"))).kind).toBe("unknown");
  });

  it("refuses an empty token, even though cleared tokens are empty strings", async () => {
    // `clearCheckInTokens` blanks the column the day after an event. If "" matched, the
    // first purged row in the table would become a master pass.
    const s = await selected();
    const db = await getDb();
    await db.prepare("UPDATE registrations SET check_in_token = '' WHERE reference = ?")
      .bind(s.reference).run();

    expect((await scan(checkInPayload(""))).kind).toBe("not-a-pass");
    expect((await scan("SWC1:")).kind).toBe("not-a-pass");
  });

  it("will not accept the human-readable reference as a pass", async () => {
    const s = await selected();
    expect((await scan(checkInPayload(s.reference))).kind).toBe("unknown");
  });

  it("refuses a valid pass for a DIFFERENT event, and names it", async () => {
    // Not hypothetical the moment there is a second event, and the failure would be
    // silent: somebody checked in to a tournament they are not in.
    const s = await selected({ slug: "e2", token: "tok-other-event" });
    const r = await scan(checkInPayload(s.token));
    expect(r.kind).toBe("wrong-event");
    if (r.kind !== "wrong-event") throw new Error("unreachable");
    expect(r.eventSlug).toBe("e2");
  });

  it("refuses somebody who withdrew, without pretending the pass is broken", async () => {
    const s = await selected();
    const db = await getDb();
    await db.prepare("UPDATE registrations SET status = 'withdrawn' WHERE reference = ?")
      .bind(s.reference).run();

    const r = await scan(checkInPayload(s.token));
    expect(r.kind).toBe("not-eligible");
    if (r.kind !== "not-eligible") throw new Error("unreachable");
    expect(r.entry.fullName).toBe("Amritpal Singh");
  });

  it("sets the attended badge on the profile", async () => {
    const s = await selected({ email: "badge@example.com" });
    expect((await playerByEmail("badge@example.com"))!.eventVerified).toBe(false);

    await scan(checkInPayload(s.token));

    expect((await playerByEmail("badge@example.com"))!.eventVerified).toBe(true);
  });

  it("still works for a registration the retention job has unlinked", async () => {
    // A dormant profile is deleted and the registration is left behind with player_id
    // NULL. Rare, but the person still turns up at a door, and a crash there is not an
    // option.
    const s = await selected({ withPlayer: false, token: "tok-orphan" });
    const r = await scan(checkInPayload(s.token));
    expect(r.kind).toBe("checked-in");
    if (r.kind !== "checked-in") throw new Error("unreachable");
    expect(r.entry.publicName).toBe("Amritpal S.");
  });
});

describe("the manual fallback", () => {
  it("checks somebody in by reference, identically to a scan", async () => {
    const s = await selected();
    const r = await checkInByReference("e1", EVENT_DATE, s.reference, DESK);
    expect(r.kind).toBe("checked-in");

    const db = await getDb();
    const row = await db
      .prepare("SELECT checked_in_by FROM registrations WHERE reference = ?")
      .bind(s.reference)
      .first<{ checked_in_by: string }>();
    // The same audit row. A fallback that records less than the happy path is a fallback
    // that quietly becomes the normal route and takes the record with it.
    expect(row!.checked_in_by).toBe(DESK);
  });

  it("forgives lower case and stray spaces", async () => {
    // It is typed by a volunteer, standing up, off a slip, while somebody waits.
    const s = await selected();
    const r = await checkInByReference("e1", EVENT_DATE, `  ${s.reference.toLowerCase()} `, DESK);
    expect(r.kind).toBe("checked-in");
  });

  it("reports an unknown reference instead of doing nothing", async () => {
    expect((await checkInByReference("e1", EVENT_DATE, "SWC-XXX-XXX", DESK)).kind).toBe("unknown");
    expect((await checkInByReference("e1", EVENT_DATE, "", DESK)).kind).toBe("unknown");
  });
});

describe("undoing one", () => {
  it("puts them back, and clears the record of the mistake", async () => {
    // The mistake this exists for is silent: scan the wrong slip off the table and the
    // register says a child is inside who is standing in the car park.
    const s = await selected();
    await scan(checkInPayload(s.token));

    expect(await undoCheckIn("e1", s.reference)).toEqual({ ok: true });

    const db = await getDb();
    const row = await db
      .prepare("SELECT status, checked_in_at, checked_in_by FROM registrations WHERE reference = ?")
      .bind(s.reference)
      .first<{ status: string; checked_in_at: string | null; checked_in_by: string | null }>();
    expect(row!.status).toBe("selected");
    expect(row!.checked_in_at).toBeNull();
    expect(row!.checked_in_by).toBeNull();
  });

  it("lets them be checked in again afterwards", async () => {
    const s = await selected();
    await scan(checkInPayload(s.token));
    await undoCheckIn("e1", s.reference);
    expect((await scan(checkInPayload(s.token))).kind).toBe("checked-in");
  });

  it("leaves the attended badge alone", async () => {
    // A mis-scan grants a badge for a few seconds. Clearing it here would strip one
    // legitimately earned at an earlier event, which is the worse of the two.
    const s = await selected({ email: "keepbadge@example.com" });
    await scan(checkInPayload(s.token));
    await undoCheckIn("e1", s.reference);
    expect((await playerByEmail("keepbadge@example.com"))!.eventVerified).toBe(true);
  });

  it("refuses what it cannot undo, and says why", async () => {
    const s = await selected();
    expect((await undoCheckIn("e1", s.reference)).error).toMatch(/not checked in/i);
    expect((await undoCheckIn("e1", "SWC-XXX-XXX")).error).toMatch(/No entry/i);

    const other = await selected({ slug: "e2", token: "tok-e2", email: "b@example.com" });
    const db = await getDb();
    await db.prepare("UPDATE registrations SET status = 'checked-in' WHERE reference = ?")
      .bind(other.reference).run();
    expect((await undoCheckIn("e1", other.reference)).error).toMatch(/another event/i);
  });
});

describe("the desk list", () => {
  it("holds nobody who has not been drawn", async () => {
    await selected({ fullName: "Amritpal Singh", email: "a@example.com" });
    // An applicant awaiting the draw has no place, so no slip and no row at the door.
    await apply({
      eventSlug: "e1",
      divisionId: "open",
      answers: { fullName: "Not Drawn", dob: "2013-05-02", email: "n@example.com", mobile: "07700900124" },
    });

    const roster = await checkInRoster("e1", EVENT_DATE);
    expect(roster.map((r) => r.fullName)).toEqual(["Amritpal Singh"]);
  });

  it("NEVER carries a token — this list is serialised into a page left open all day", async () => {
    await selected();
    const roster = await checkInRoster("e1", EVENT_DATE);
    expect(JSON.stringify(roster)).not.toContain("tok-amritpal");
  });

  it("orders by first name, not surname", async () => {
    // Sikh surnames are overwhelmingly Singh and Kaur, so a surname sort produces two
    // undifferentiated blocks. First name is also what somebody says when they arrive.
    await selected({ fullName: "Zorawar Singh", email: "z@example.com", token: "t1" });
    await selected({ fullName: "Amrit Kaur", email: "am@example.com", token: "t2" });
    await selected({ fullName: "Manvir Singh", email: "m@example.com", token: "t3" });

    const roster = await checkInRoster("e1", EVENT_DATE);
    expect(roster.map((r) => r.fullName)).toEqual([
      "Amrit Kaur",
      "Manvir Singh",
      "Zorawar Singh",
    ]);
  });

  it("flags the children, without putting a date of birth on the screen", async () => {
    await selected({ fullName: "Child One", dob: "2013-05-02", email: "c@example.com", token: "t1" });
    await selected({ fullName: "Adult Two", dob: "2000-05-02", email: "d@example.com", token: "t2" });

    const roster = await checkInRoster("e1", EVENT_DATE);
    const child = roster.find((r) => r.fullName === "Child One")!;
    const adult = roster.find((r) => r.fullName === "Adult Two")!;

    expect(child.under18).toBe(true);
    expect(adult.under18).toBe(false);
    expect(JSON.stringify(roster)).not.toContain("2013-05-02");
  });

  it("says what was agreed about a child leaving, and nothing for an adult", async () => {
    // The exit is the one decision the door cannot look up in the moment.
    await selected({ fullName: "Aaa Collected", email: "1@example.com", token: "t1" });
    await selected({
      fullName: "Bbb Independent", email: "2@example.com", token: "t2",
      mayLeaveUnaccompanied: true,
    });
    await selected({
      fullName: "Ccc Parented", email: "3@example.com", token: "t3", guardianOnSite: true,
    });
    await selected({ fullName: "Ddd Grown", dob: "2000-01-01", email: "4@example.com", token: "t4" });

    const by = Object.fromEntries(
      (await checkInRoster("e1", EVENT_DATE)).map((r) => [r.fullName, r.leaving]),
    );
    expect(by["Aaa Collected"]).toMatch(/collected/i);
    expect(by["Bbb Independent"]).toMatch(/on their own/i);
    expect(by["Ccc Parented"]).toMatch(/on site/i);
    expect(by["Ddd Grown"]).toBeNull();
  });

  it("shows the public name, never the surname, alongside the real one", async () => {
    await selected({ fullName: "Amritpal Singh" });
    const [row] = await checkInRoster("e1", EVENT_DATE);
    expect(row.publicName).toBe("Amritpal S.");
  });

  it("uses publicName() rather than a rule of its own", async () => {
    /**
     * An account made before round 44 has no handle, and `publicName()` falls back to the
     * display name — a bare first name. The slip and the desk list show that, deliberately,
     * even though "Amritpal S." would be easier to find on a table: the projector, the
     * player card and the slip all read the same field, and a special case here is how
     * they start disagreeing about what somebody is called.
     */
    await upsertPlayer({
      email: "nohandle@example.com",
      displayName: "Amritpal",
      ageBand: "U16",
      dateOfBirth: "2013-05-02",
    });
    const p = await playerByEmail("nohandle@example.com");
    const r = await apply({
      eventSlug: "e1",
      divisionId: "open",
      answers: {
        fullName: "Amritpal Singh", dob: "2013-05-02",
        email: "nohandle@example.com", mobile: "07700900123",
      },
      playerId: p!.id,
    });
    const db = await getDb();
    await db
      .prepare("UPDATE registrations SET status = 'selected', check_in_token = 'tk' WHERE reference = ?")
      .bind(r.reference).run();

    const [row] = await checkInRoster("e1", EVENT_DATE);
    expect(row.publicName).toBe("Amritpal");
  });
});

describe("the slips to print", () => {
  it("carries the payload a camera will read, keyed to the person", async () => {
    const s = await selected();
    const [slip] = await checkInSlips("e1");
    expect(slip.payload).toBe(checkInPayload(s.token));
    expect(slip.reference).toBe(s.reference);
    expect(slip.publicName).toBe("Amritpal S.");
  });

  it("prints no surname and no contact details", async () => {
    // These end up face-up on a table in a public hall. What is on them is exactly what
    // already goes on the projector, and nothing else.
    await selected({ fullName: "Amritpal Singh" });
    const json = JSON.stringify(await checkInSlips("e1"));
    expect(json).not.toContain("Singh");
    expect(json).not.toContain("07700900123");
    expect(json).not.toContain("a@example.com");
    expect(json).not.toContain("2013-05-02");
  });

  it("skips anybody with no token rather than printing a slip that cannot work", async () => {
    // A blank slip looks like it should scan, so somebody holds it to a camera and waits.
    await selected({ fullName: "Has Token", email: "h@example.com", token: "t1" });
    const s = await selected({ fullName: "No Token", email: "x@example.com", token: "t2" });
    const db = await getDb();
    await db.prepare("UPDATE registrations SET check_in_token = NULL WHERE reference = ?")
      .bind(s.reference).run();

    expect((await checkInSlips("e1")).map((x) => x.publicName)).toEqual(["Has T."]);
    expect(await slipReadiness("e1")).toEqual({ printable: 1, missingToken: 1 });
  });

  it("still prints for somebody already checked in, so a reprint is safe", async () => {
    // Reprinting at half past ten must not silently drop everybody already inside.
    const s = await selected();
    await scan(checkInPayload(s.token));
    expect(await checkInSlips("e1")).toHaveLength(1);
  });
});

/**
 * Proof of date of birth (2026-09-03).
 *
 * Every player must bring something showing their date of birth. The reason is age, not
 * identity: one bracket runs 12 to 25 and every supervision rule hangs off a date typed
 * into a form. src/data/id-check.ts holds the policy.
 *
 * The two properties worth testing are both about what this must NOT do. It must not gate
 * the door — a register that refuses to admit somebody standing in the hall is simply
 * wrong — and it must not accumulate anything about the document.
 */
describe("proof of date of birth", () => {
  it("records that it was seen, when, and by which moderator", async () => {
    const s = await selected();
    expect(await setDobVerified("e1", s.reference, DESK, true)).toEqual({ ok: true });

    const db = await getDb();
    const row = await db
      .prepare("SELECT dob_verified_at, dob_verified_by FROM registrations WHERE reference = ?")
      .bind(s.reference)
      .first<{ dob_verified_at: string; dob_verified_by: string }>();
    expect(row!.dob_verified_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(row!.dob_verified_by).toBe(DESK);
  });

  it("stores NOTHING about the document — there is no column that could", async () => {
    /**
     * A structural test, guarding the promise made in the copy and in
     * migrations/0013_dob_verified.sql: we look at it, hand it back, and write down
     * nothing from it. The failure this catches is a well-meaning future migration adding
     * `id_type` or `id_number` — "passport" against a child's name is a nationality
     * signal we have no use for, and the copy in four places would silently become a lie.
     */
    const db = await getDb();
    const { results } = await db.prepare("PRAGMA table_info(registrations)").all<{ name: string }>();
    const names = results.map((r) => r.name);
    expect(names).toContain("dob_verified_at");
    expect(names).toContain("dob_verified_by");
    for (const n of names) {
      expect(n).not.toMatch(/document|id_type|id_number|passport|id_image|id_seen_type/);
    }
  });

  it("can be taken back, because somebody will tap the wrong row", async () => {
    const s = await selected();
    await setDobVerified("e1", s.reference, DESK, true);
    await setDobVerified("e1", s.reference, DESK, false);

    const [row] = await checkInRoster("e1", EVENT_DATE);
    expect(row.dobVerifiedAt).toBeNull();
  });

  it("works BEFORE they are checked in as well as after", async () => {
    // A parent usually has the passport out while the volunteer is still finding the slip.
    // Refusing to record it until the scan has happened would mean asking them twice.
    const s = await selected();
    await setDobVerified("e1", s.reference, DESK, true);

    const r = await scan(checkInPayload(s.token));
    expect(r.kind).toBe("checked-in");
    if (r.kind !== "checked-in") throw new Error("unreachable");
    expect(r.entry.dobVerifiedAt).not.toBeNull();
  });

  it("does NOT gate the door — no document still means checked in", async () => {
    // The whole shape of the feature. Who is in the building is a safeguarding fact and
    // must be right even while the ID question is unresolved.
    const s = await selected();
    const r = await scan(checkInPayload(s.token));
    expect(r.kind).toBe("checked-in");
    if (r.kind !== "checked-in") throw new Error("unreachable");
    expect(r.entry.dobVerifiedAt).toBeNull();
    expect((await deskCounts("e1")).arrived).toBe(1);
  });

  it("is cleared by undoing a check-in", async () => {
    // The wrong tap that checks in the wrong person is the same wrong tap that confirmed
    // their date of birth. A false "we checked" is worse than an extra tap.
    const s = await selected();
    await scan(checkInPayload(s.token));
    await setDobVerified("e1", s.reference, DESK, true);

    await undoCheckIn("e1", s.reference);

    const [row] = await checkInRoster("e1", EVENT_DATE);
    expect(row.dobVerifiedAt).toBeNull();
  });

  it("refuses a reference from another event, and an unknown one", async () => {
    const other = await selected({ slug: "e2", token: "tok-e2", email: "b@example.com" });
    expect((await setDobVerified("e1", other.reference, DESK, true)).error).toMatch(/another event/i);
    expect((await setDobVerified("e1", "SWC-XXX-XXX", DESK, true)).error).toMatch(/No entry/i);
  });

  it("counts arrivals and checks separately, because they are separate facts", async () => {
    const a = await selected({ fullName: "Aaa One", email: "1@example.com", token: "t1" });
    const b = await selected({ fullName: "Bbb Two", email: "2@example.com", token: "t2" });
    await selected({ fullName: "Ccc Three", email: "3@example.com", token: "t3" });

    await scan(checkInPayload(a.token));
    await scan(checkInPayload(b.token));
    await setDobVerified("e1", a.reference, DESK, true);

    expect(await deskCounts("e1")).toEqual({ expected: 3, arrived: 2, dobChecked: 1 });
  });
});
