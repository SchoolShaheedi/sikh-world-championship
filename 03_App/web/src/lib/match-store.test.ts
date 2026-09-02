/**
 * The live bracket.
 *
 * This is the code the hall watches. Two failures matter more than the rest and both are
 * tested directly: a winner who does not advance (the tournament stops), and a corrected
 * score that leaves the wrong player in the next round (the tournament continues, wrongly,
 * and nobody notices until a final between two people who lost).
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { apply } from "./store";
import { upsertPlayer } from "./players";
import { deleteAccount } from "./account-delete";
import {
  generateBracket,
  storedBracket,
  recordScore,
  clearBracket,
} from "./match-store";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const SLUG = "e1";

/** A player with a place: a profile, a registration, and the status the bracket reads. */
async function place(handle: string) {
  const player = await upsertPlayer({
    email: `${handle}@example.com`,
    displayName: handle,
    ageBand: "16+",
    dateOfBirth: "2006-05-02",
    handle,
  });
  const r = await apply({
    eventSlug: SLUG,
    divisionId: "open",
    answers: {
      fullName: `${handle} Player`,
      dob: "2006-05-02",
      email: `${handle}@example.com`,
      mobile: "07700900123",
      referralOrg: "Nobody — I found it myself",
    },
    playerId: player.id,
  });
  const db = await getDb();
  await db
    .prepare("UPDATE registrations SET status = 'selected' WHERE reference = ?")
    .bind(r.reference)
    .run();
  return player;
}

async function field(n: number) {
  const players = [];
  // Names that sort in this order, because the bracket seeds on the alphabetical read.
  for (let i = 0; i < n; i++) players.push(await place(`p${String(i).padStart(2, "0")}`));
  return players;
}

async function build() {
  return generateBracket(SLUG, "open", "Open");
}

describe("building the bracket", () => {
  it("refuses with fewer than two players, rather than making a bracket of one", async () => {
    await place("solo");
    const r = await build();
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/two players/i);
  });

  it("makes n-1 matches for a power-of-two field", async () => {
    await field(8);
    const r = await build();
    expect(r.ok).toBe(true);
    const stored = await storedBracket(SLUG);
    expect(stored!.bracket.matches).toHaveLength(7);
    expect(stored!.bracket.rounds).toBe(3);
  });

  it("resolves byes before anything is stored, so round one is already right", async () => {
    // Six players in an eight-slot bracket: two first-round matches are byes, and the two
    // players holding them must already be sitting in round two.
    await field(6);
    await build();
    const stored = await storedBracket(SLUG);
    const roundTwo = stored!.bracket.matches.filter((m) => m.round === 1);
    const seated = roundTwo.flatMap((m) => [m.homeId, m.awayId]).filter(Boolean);
    expect(seated).toHaveLength(2);
  });

  it("stores no names, only ids", async () => {
    await field(4);
    await build();
    const db = await getDb();
    const { results } = await db.prepare("SELECT * FROM matches").all<Record<string, unknown>>();
    const text = JSON.stringify(results);
    // The handle must not appear anywhere in the table — it is read live from `players`,
    // which is what lets a moderator rename somebody and lets a deletion be complete.
    expect(text).not.toContain("p00");
  });

  it("reads the display names live from the profile", async () => {
    const players = await field(4);
    await build();
    const db = await getDb();
    await db
      .prepare("UPDATE players SET handle = ? WHERE id = ?")
      .bind("Renamed", players[0].id)
      .run();

    const stored = await storedBracket(SLUG);
    expect(stored!.names[players[0].id]).toBe("Renamed");
  });

  it("refuses to rebuild over a bracket that already has a score", async () => {
    await field(4);
    await build();
    const stored = await storedBracket(SLUG);
    const first = stored!.bracket.matches.find((m) => m.round === 0)!;
    await recordScore(SLUG, first.id, 3, 1);

    const again = await build();
    expect(again.ok).toBe(false);
    if (again.ok) return;
    expect(again.error).toMatch(/score already/i);
  });

  it("rebuilds happily once the bracket is cleared", async () => {
    await field(4);
    await build();
    const stored = await storedBracket(SLUG);
    await recordScore(SLUG, stored!.bracket.matches[0].id, 3, 1);

    expect(await clearBracket(SLUG)).toBe(3);
    expect((await build()).ok).toBe(true);
  });
});

describe("entering a score", () => {
  it("refuses a draw — a knockout has to produce somebody", async () => {
    await field(4);
    await build();
    const stored = await storedBracket(SLUG);
    const r = await recordScore(SLUG, stored!.bracket.matches[0].id, 2, 2);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/level/i);
  });

  it("refuses nonsense", async () => {
    await field(4);
    await build();
    const stored = await storedBracket(SLUG);
    const id = stored!.bracket.matches[0].id;
    expect((await recordScore(SLUG, id, -1, 0)).ok).toBe(false);
    expect((await recordScore(SLUG, id, 1.5, 0)).ok).toBe(false);
    expect((await recordScore(SLUG, id, 100, 0)).ok).toBe(false);
  });

  it("refuses a match whose players are not both known yet", async () => {
    await field(4);
    await build();
    const stored = await storedBracket(SLUG);
    const final = stored!.bracket.matches.find((m) => m.round === 1)!;
    const r = await recordScore(SLUG, final.id, 1, 0);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/both players/i);
  });

  it("advances the winner into the next round", async () => {
    await field(4);
    await build();
    const before = await storedBracket(SLUG);
    const m0 = before!.bracket.matches.find((m) => m.round === 0 && m.position === 0)!;

    expect((await recordScore(SLUG, m0.id, 3, 1)).ok).toBe(true);

    const after = await storedBracket(SLUG);
    const final = after!.bracket.matches.find((m) => m.round === 1)!;
    expect(final.homeId).toBe(m0.homeId);
  });

  it("puts the RIGHT player through when a score is corrected", async () => {
    // The failure this guards: a score typed in wrong, fixed a minute later, and the
    // loser left standing in the next round. Advancement is recomputed from the whole
    // board for exactly this case.
    await field(4);
    await build();
    const before = await storedBracket(SLUG);
    const m0 = before!.bracket.matches.find((m) => m.round === 0 && m.position === 0)!;

    await recordScore(SLUG, m0.id, 3, 1);
    let final = (await storedBracket(SLUG))!.bracket.matches.find((m) => m.round === 1)!;
    expect(final.homeId).toBe(m0.homeId);

    // "Sorry — it was the other way round."
    await recordScore(SLUG, m0.id, 1, 3);
    final = (await storedBracket(SLUG))!.bracket.matches.find((m) => m.round === 1)!;
    expect(final.homeId).toBe(m0.awayId);
  });

  it("changes the version, so the television knows to redraw", async () => {
    await field(4);
    await build();
    const before = await storedBracket(SLUG);
    await recordScore(SLUG, before!.bracket.matches[0].id, 3, 1);
    const after = await storedBracket(SLUG);
    expect(after!.version).not.toBe(before!.version);
  });

  it("changes the version when a NAME changes, not only a score", async () => {
    /**
     * Names are not stored on a match — they are read live from the profile so a
     * moderator can correct one. That only reaches the projector if the version notices,
     * and the first version scheme (a timestamp on the match rows) did not. This is the
     * test that caught it.
     */
    const players = await field(4);
    await build();
    const before = await storedBracket(SLUG);

    const db = await getDb();
    await db
      .prepare("UPDATE players SET handle = ? WHERE id = ?")
      .bind("Corrected", players[0].id)
      .run();

    const after = await storedBracket(SLUG);
    expect(after!.version).not.toBe(before!.version);
  });

  it("is stable when nothing has changed, so a quiet poll costs no redraw", async () => {
    await field(4);
    await build();
    const a = await storedBracket(SLUG);
    const b = await storedBracket(SLUG);
    expect(a!.version).toBe(b!.version);
  });
});

describe("a deleted account", () => {
  it("leaves the match standing, with an empty slot", async () => {
    const players = await field(4);
    await build();
    const before = await storedBracket(SLUG);
    const m0 = before!.bracket.matches.find((m) => m.homeId === players[0].id)
      ?? before!.bracket.matches.find((m) => m.awayId === players[0].id)!;

    await deleteAccount(players[0].id, {
      deleteRegistrations: true,
      reason: "test",
    });

    const after = await storedBracket(SLUG);
    // The bracket keeps its shape — other people are in it — and the id is gone.
    expect(after!.bracket.matches).toHaveLength(before!.bracket.matches.length);
    const same = after!.bracket.matches.find((m) => m.id === m0.id)!;
    expect(same.homeId).not.toBe(players[0].id);
    expect(same.awayId).not.toBe(players[0].id);
  });
});
