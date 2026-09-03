/**
 * Access grants became clickable on 2026-09-03, and these are the guardrails that made
 * that safe to do.
 *
 * Moderator had no button in the app from round 24 until now, because it grants
 * safeguarding disclosures, every applicant's contact details, the draw and deletion. What
 * changed is not the size of that grant — it is that the desk no longer needs it. So the
 * tests here are mostly about the two roles staying distinct, and about the two ways one
 * careless click could lock everybody out of a live event.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { upsertPlayer, playerByEmail, hasDeskAccess } from "./players";
import { grantStaff, revokeStaff, staffList, staffGrants } from "./staff";
import { deletionBlockers } from "./account-delete";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

/** An acting moderator, and the actor object the functions take. */
async function moderator(email = "boss@example.com") {
  const p = await upsertPlayer({
    email,
    displayName: "Boss",
    ageBand: "16+",
    dateOfBirth: "1990-01-01",
  });
  const db = await getDb();
  await db.prepare("UPDATE players SET is_moderator = 1 WHERE id = ?").bind(p.id).run();
  return { id: p.id, email, isModerator: true };
}

describe("granting", () => {
  it("creates a staff account for an address that has never been here", async () => {
    // The useful action is "add this volunteer". Making a moderator ask the person to
    // register as a player first, then find them, then grant, is three steps of which two
    // are beside the point.
    const boss = await moderator();
    const r = await grantStaff(boss, "Volunteer@Example.com ", "desk");

    expect(r.ok && r.created).toBe(true);
    const p = await playerByEmail("volunteer@example.com");
    expect(p!.isDesk).toBe(true);
    expect(p!.isModerator).toBe(false);
    // The obviously-fake date of birth, the same convention grant-moderator.mjs uses: a
    // plausible one nobody can tell from real is worse than an obvious one.
    expect(p!.dateOfBirth).toBe("1900-01-01");
  });

  it("upgrades an existing player without touching anything else about them", async () => {
    const boss = await moderator();
    await upsertPlayer({
      email: "player@example.com",
      displayName: "Amrit",
      ageBand: "16+",
      dateOfBirth: "2004-03-03",
      region: "Leicester",
    });

    await grantStaff(boss, "player@example.com", "desk");

    const p = await playerByEmail("player@example.com");
    expect(p!.isDesk).toBe(true);
    expect(p!.displayName).toBe("Amrit");
    expect(p!.dateOfBirth).toBe("2004-03-03");
    expect(p!.region).toBe("Leicester");
  });

  it("keeps the two roles from ever disagreeing about one person", async () => {
    // A moderator already has everything the desk needs, so is_desk is never set on one.
    // Every gate therefore has to check both, which is why `hasDeskAccess` exists.
    const boss = await moderator();
    await grantStaff(boss, "both@example.com", "desk");
    await grantStaff(boss, "both@example.com", "moderator");

    const p = await playerByEmail("both@example.com");
    expect(p!.isModerator).toBe(true);
    expect(p!.isDesk).toBe(false);
    expect(hasDeskAccess(p)).toBe(true);
  });

  it("refuses to 'grant' desk to a moderator, because that is a downgrade in disguise", async () => {
    const boss = await moderator();
    await grantStaff(boss, "mod2@example.com", "moderator");

    const r = await grantStaff(boss, "mod2@example.com", "desk");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/already a moderator[\s\S]*revoke moderator first/i);
    // And nothing changed, so a mis-click cannot quietly reduce somebody's access.
    expect((await playerByEmail("mod2@example.com"))!.isModerator).toBe(true);
  });

  it("only a moderator can grant", async () => {
    const notBoss = { id: "x", email: "x@example.com", isModerator: false };
    const r = await grantStaff(notBoss, "new@example.com", "desk");
    expect(r.ok).toBe(false);
    expect(await playerByEmail("new@example.com")).toBeNull();
  });

  it("rejects something that is not an address at all", async () => {
    const boss = await moderator();
    for (const bad of ["", "not-an-email", "a@b", "a b@c.com"]) {
      expect((await grantStaff(boss, bad, "desk")).ok).toBe(false);
    }
  });
});

describe("revoking, and the two ways it could lock everybody out", () => {
  it("will not let a moderator remove their own moderator access", async () => {
    // One careless click mid-event, and the only route back is a database console
    // somebody may not have with them.
    const boss = await moderator();
    const r = await revokeStaff(boss, boss.email);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/cannot remove your own/i);
    expect((await playerByEmail(boss.email))!.isModerator).toBe(true);
  });

  it("will not remove the last moderator, by any route", async () => {
    // The same disaster from the other direction: two moderators, each revoking the
    // other, and the second one succeeds into an empty room.
    const boss = await moderator();
    const second = await moderator("second@example.com");

    expect((await revokeStaff(boss, second.email)).ok).toBe(true);
    // Now boss is the only one left, and a third party cannot remove them either.
    const third = { ...boss, id: "someone-else", email: "third@example.com" };
    const r = await revokeStaff(third, boss.email);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/only moderator/i);
  });

  it("clears BOTH flags — 'remove their access' must not leave them holding some", async () => {
    const boss = await moderator();
    await grantStaff(boss, "mod2@example.com", "moderator");

    await revokeStaff(boss, "mod2@example.com");

    const p = await playerByEmail("mod2@example.com");
    expect(p!.isModerator).toBe(false);
    expect(p!.isDesk).toBe(false);
    expect(hasDeskAccess(p)).toBe(false);
  });

  it("says so for somebody who never had access", async () => {
    const boss = await moderator();
    expect((await revokeStaff(boss, "nobody@example.com")).ok).toBe(false);
    await upsertPlayer({
      email: "ordinary@example.com",
      displayName: "A",
      ageBand: "16+",
      dateOfBirth: "2004-01-01",
    });
    const r = await revokeStaff(boss, "ordinary@example.com");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/does not have staff access/i);
  });
});

describe("the audit trail", () => {
  it("records every grant and revocation with who did it", async () => {
    // "Somebody made them a moderator" is not an answer. The actor's EMAIL is stored as
    // well as their id, so the record still reads as a sentence after the account is gone.
    const boss = await moderator();
    await grantStaff(boss, "a@example.com", "desk", "on the door");
    await revokeStaff(boss, "a@example.com");

    const rows = await staffGrants();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      actorEmail: boss.email,
      targetEmail: "a@example.com",
      role: "desk",
      granted: false,
    });
    expect(rows[1]).toMatchObject({ granted: true, note: "on the door" });
  });

  it("records nothing for an attempt that was refused", async () => {
    const notBoss = { id: "x", email: "x@example.com", isModerator: false };
    await grantStaff(notBoss, "a@example.com", "moderator");
    expect(await staffGrants()).toHaveLength(0);
  });
});

describe("the list", () => {
  it("puts moderators first, then desk staff alphabetically", async () => {
    const boss = await moderator("zzz@example.com");
    await grantStaff(boss, "b@example.com", "desk");
    await grantStaff(boss, "a@example.com", "desk");

    const list = await staffList();
    expect(list.map((s) => [s.email, s.role])).toEqual([
      ["zzz@example.com", "moderator"],
      ["a@example.com", "desk"],
      ["b@example.com", "desk"],
    ]);
  });

  it("flags an account that has never signed in", async () => {
    // The invitation is a magic link to an address a moderator typed. A typo produces an
    // account that can never be used, and the day of the event is a bad time to find out.
    const boss = await moderator();
    await grantStaff(boss, "typo@exmaple.com", "desk");
    const list = await staffList();
    expect(list.find((s) => s.email === "typo@exmaple.com")!.neverSignedIn).toBe(true);
  });
});

describe("a staff account cannot be deleted while it holds access", () => {
  it("blocks deletion, and names the role and the way out", async () => {
    // Otherwise `staff_grants` ends up pointing at somebody who no longer exists, and the
    // whole point of that table is that "who had access" stays answerable.
    const boss = await moderator();
    await grantStaff(boss, "desk@example.com", "desk");
    const p = await playerByEmail("desk@example.com");

    const blockers = await deletionBlockers(p!.id);
    expect(blockers.join(" ")).toMatch(/desk access[\s\S]*\/admin\/people/i);

    await revokeStaff(boss, "desk@example.com");
    expect(await deletionBlockers(p!.id)).toEqual([]);
  });
});
