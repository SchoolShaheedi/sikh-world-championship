import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { register, confirmedCount, promoteFromWaitlist, checkIn } from "./store";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const entry = (playerId: string, capacity = 3) => ({
  eventSlug: "sikh-fifa-26",
  divisionId: "u16",
  divisionCapacity: capacity,
  playerId,
  answers: {},
});

describe("event capacity", () => {
  it("confirms players up to capacity and waitlists the rest", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await register(entry(`p${i}`))).status).toBe("confirmed");
    }
    const overflow = await register(entry("p3"));
    expect(overflow.status).toBe("waitlisted");
    expect(overflow.waitlistPosition).toBe(1);

    expect(await confirmedCount("sikh-fifa-26", "u16")).toBe(3);
  });

  it("numbers the waitlist in order", async () => {
    for (let i = 0; i < 3; i++) await register(entry(`p${i}`));
    expect((await register(entry("a"))).waitlistPosition).toBe(1);
    expect((await register(entry("b"))).waitlistPosition).toBe(2);
    expect((await register(entry("c"))).waitlistPosition).toBe(3);
  });

  it("keeps divisions independent", async () => {
    for (let i = 0; i < 3; i++) await register(entry(`p${i}`));

    const other = await register({
      ...entry("adult"),
      divisionId: "16up",
    });
    expect(other.status).toBe("confirmed");
  });

  it("gives every registration a unique reference", async () => {
    // Regression: an earlier version used 2 random bytes with no uniqueness check,
    // which duplicated within a single 64-player event about 2.6% of the time.
    const refs = new Set<string>();
    for (let i = 0; i < 200; i++) {
      refs.add((await register(entry(`p${i}`, 500))).reference);
    }
    expect(refs.size).toBe(200);
  });

  it("uses a reference alphabet with no confusable characters", async () => {
    // References get read aloud at a check-in desk; O/0 and I/1/L cause real mistakes.
    for (let i = 0; i < 40; i++) {
      const { reference } = await register(entry(`p${i}`, 500));
      expect(reference).toMatch(/^SWC-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/);
    }
  });

  it("issues a check-in credential that is not the human reference", async () => {
    // The reference is printed on lists and read aloud. If it were also the check-in
    // token, anyone who overheard it could check in as that player.
    const r = await register(entry("p1"));
    expect(r.checkInToken).not.toBe(r.reference);
    expect(r.checkInToken.length).toBeGreaterThanOrEqual(30);
  });

  it("gives every registration a unique check-in credential", async () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 200; i++) {
      tokens.add((await register(entry(`p${i}`, 500))).checkInToken);
    }
    expect(tokens.size).toBe(200);
  });
});

describe("waitlist promotion", () => {
  it("promotes the first in the queue and shuffles everyone up", async () => {
    for (let i = 0; i < 3; i++) await register(entry(`p${i}`));
    await register(entry("first"));
    await register(entry("second"));

    const promoted = await promoteFromWaitlist("sikh-fifa-26", "u16");
    expect(promoted?.playerId).toBe("first");
    expect(promoted?.status).toBe("confirmed");
    expect(promoted?.waitlistPosition).toBeNull();

    // The person behind them moves to the front rather than being stranded at 2.
    const next = await promoteFromWaitlist("sikh-fifa-26", "u16");
    expect(next?.playerId).toBe("second");
  });

  it("returns null when the waitlist is empty", async () => {
    expect(await promoteFromWaitlist("sikh-fifa-26", "u16")).toBeNull();
  });
});

describe("check-in", () => {
  it("marks a player present from their check-in token", async () => {
    const r = await register(entry("p1"));
    const row = await checkIn(r.checkInToken);
    expect(row?.status).toBe("checked-in");
  });

  it("does NOT accept the human-readable reference as a check-in token", async () => {
    const r = await register(entry("p1"));
    expect(await checkIn(r.reference)).toBeNull();
  });

  it("ignores an unknown token", async () => {
    expect(await checkIn("SWC-NOPE")).toBeNull();
  });

  it("still counts a checked-in player against capacity", async () => {
    // Otherwise checking someone in would silently free up their place.
    const r = await register(entry("p1"));
    await checkIn(r.checkInToken);
    expect(await confirmedCount("sikh-fifa-26", "u16")).toBe(1);
  });
});
