/**
 * The do-not-photograph list.
 *
 * Photography is a condition of entering, so `photo_consent` is true on every row and the
 * only list that means anything is the opposite one. What is tested here is that it can
 * be recorded, cleared, and read as a list of names a person can be handed — because
 * before this the answer to "who objected?" was somebody's memory of an inbox.
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { apply } from "./store";
import { upsertPlayer } from "./players";
import { defaultHandle } from "./handle";
import {
  setPhotoObjection,
  doNotPhotographList,
  photoObjectionRefs,
} from "./photo-objection";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const SLUG = "e1";

async function entrant(name: string, status: string) {
  const player = await upsertPlayer({
    email: `${name.replace(/\s+/g, "")}@example.com`,
    displayName: name.split(" ")[0],
    ageBand: "16+",
    dateOfBirth: "2006-05-02",
    handle: defaultHandle(name),
  });
  const r = await apply({
    eventSlug: SLUG,
    divisionId: "open",
    answers: {
      fullName: name,
      dob: "2006-05-02",
      email: `${name.replace(/\s+/g, "")}@example.com`,
      mobile: "07700900123",
      referralOrg: "Nobody — I found it myself",
      // What `validateRegistration` sets: photography is a condition of entering, so
      // consent is true on every row. That is exactly why it is useless to a photographer.
      photoConsent: true,
    },
    playerId: player.id,
  });
  const db = await getDb();
  await db
    .prepare("UPDATE registrations SET status = ? WHERE reference = ?")
    .bind(status, r.reference)
    .run();
  return r;
}

describe("recording an objection", () => {
  it("records who said so and when, and shows on the list", async () => {
    const r = await entrant("Jasleen Kaur", "selected");
    expect(await setPhotoObjection(r.reference, true, "mod-1")).toBe(true);

    const list = await doNotPhotographList(SLUG);
    expect(list).toHaveLength(1);
    expect(list[0].fullName).toBe("Jasleen Kaur");
    // The public name is on it too, because that is what is on their slip and on the
    // projector — the photographer has to match a face to one of the two.
    expect(list[0].publicName).toBe("Jasleen K.");
    expect(list[0].objectedAt).not.toBe(null);
    expect(list[0].arrived).toBe(false);
  });

  it("clears completely rather than leaving a tombstone", async () => {
    const r = await entrant("Jasleen Kaur", "selected");
    await setPhotoObjection(r.reference, true, "mod-1");
    await setPhotoObjection(r.reference, false, "mod-1");

    expect(await doNotPhotographList(SLUG)).toHaveLength(0);
    const db = await getDb();
    const row = await db
      .prepare(
        "SELECT photo_objected_at, photo_objected_by FROM registrations WHERE reference = ?",
      )
      .bind(r.reference)
      .first<{ photo_objected_at: string | null; photo_objected_by: string | null }>();
    // The likely reason to clear one is that it was recorded against the wrong person, and
    // leaving a marker would keep a child on a list of people who objected to nothing.
    expect(row!.photo_objected_at).toBeNull();
    expect(row!.photo_objected_by).toBeNull();
  });

  it("does not touch the consent column, which records what they were told", async () => {
    const r = await entrant("Jasleen Kaur", "selected");
    await setPhotoObjection(r.reference, true, "mod-1");
    const db = await getDb();
    const row = await db
      .prepare("SELECT photo_consent FROM registrations WHERE reference = ?")
      .bind(r.reference)
      .first<{ photo_consent: number }>();
    expect(row!.photo_consent).toBe(1);
  });

  it("reports an unknown reference instead of silently doing nothing", async () => {
    expect(await setPhotoObjection("NOPE-1", true, "mod-1")).toBe(false);
  });
});

describe("the list the photographers are read", () => {
  it("holds only people who will actually be in the hall", async () => {
    const out = await entrant("Not Drawn", "not-selected");
    const waiting = await entrant("Still Waiting", "applied");
    const going = await entrant("Has Place", "selected");
    for (const r of [out, waiting, going]) {
      await setPhotoObjection(r.reference, true, "mod-1");
    }

    const list = await doNotPhotographList(SLUG);
    // A longer list is a list that gets skimmed, and two of these three are not coming.
    expect(list.map((p) => p.fullName)).toEqual(["Has Place"]);
  });

  it("marks whoever is already through the door", async () => {
    const r = await entrant("Has Arrived", "checked-in");
    await setPhotoObjection(r.reference, true, "mod-1");
    expect((await doNotPhotographList(SLUG))[0].arrived).toBe(true);
  });

  it("is empty, not broken, when nobody has objected", async () => {
    await entrant("Nobody Objected", "selected");
    expect(await doNotPhotographList(SLUG)).toEqual([]);
  });
});

describe("the marker in the entries table", () => {
  it("is wider than the photographers' list, because that page shows applicants too", async () => {
    const waiting = await entrant("Still Waiting", "applied");
    await setPhotoObjection(waiting.reference, true, "mod-1");

    expect(await doNotPhotographList(SLUG)).toHaveLength(0);
    expect(await photoObjectionRefs(SLUG)).toEqual(new Set([waiting.reference]));
  });
});
