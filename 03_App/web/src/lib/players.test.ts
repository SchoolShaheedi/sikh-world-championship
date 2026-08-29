import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { upsertPlayer, playerByEmail, bandFor } from "./players";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const base = {
  email: "p@example.com",
  displayName: "Jagdeep",
  ageBand: "16+" as const,
  dateOfBirth: "2000-01-01",
};

describe("bandFor", () => {
  it("splits at 16, matching the board's two pools", () => {
    expect(bandFor(15)).toBe("U16");
    expect(bandFor(16)).toBe("16+");
    expect(bandFor(8)).toBe("U16");
  });
});

describe("upsertPlayer", () => {
  it("normalises the email, so one person is not two accounts", async () => {
    const a = await upsertPlayer({ ...base, email: "  P@Example.COM " });
    expect(a.email).toBe("p@example.com");
    expect((await playerByEmail("p@example.com"))?.id).toBe(a.id);
  });

  it("entering a second event reuses the account", async () => {
    const first = await upsertPlayer(base);
    const second = await upsertPlayer({ ...base, displayName: "Jag" });
    expect(second.id).toBe(first.id);
    expect(second.displayName).toBe("Jag");
  });

  it("NEVER changes the age band on a later registration", async () => {
    // Age band is a safeguarding boundary. It must not move as a side effect of filling
    // in a sign-up form — that would put a child into the adult pool.
    const child = await upsertPlayer({ ...base, ageBand: "U16", dateOfBirth: "2013-01-01" });
    const again = await upsertPlayer({ ...base, ageBand: "16+" });
    expect(again.id).toBe(child.id);
    expect(again.ageBand).toBe("U16");
  });

  it("NEVER grants moderator through registration", async () => {
    const p = await upsertPlayer(base);
    expect(p.isModerator).toBe(false);
    expect((await upsertPlayer(base)).isModerator).toBe(false);
  });

  it("does not start anyone off as event-verified", async () => {
    // That badge means a volunteer checked them in at an event, in person.
    expect((await upsertPlayer(base)).eventVerified).toBe(false);
  });

  it("keeps a guardian email once set, and lets a later one correct it", async () => {
    await upsertPlayer({ ...base, ageBand: "U16", guardianEmail: "old@example.com" });
    // A registration without one must not wipe it.
    const kept = await upsertPlayer(base);
    expect(kept.guardianEmail).toBe("old@example.com");
    // A registration with one may correct it.
    const updated = await upsertPlayer({ ...base, guardianEmail: "new@example.com" });
    expect(updated.guardianEmail).toBe("new@example.com");
  });
});
