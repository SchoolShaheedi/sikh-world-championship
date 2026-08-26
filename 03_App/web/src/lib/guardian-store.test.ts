import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import {
  requestApproval,
  findByToken,
  recordDecision,
  hasApproval,
  approvalFor,
  newToken,
} from "./guardian-store";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

const child = {
  playerId: "kid-1",
  childDisplayName: "Amrit",
  guardianEmail: "parent@example.com",
};

describe("guardian approval", () => {
  it("denies access until a guardian explicitly approves", async () => {
    // Fail-closed is the whole point: no record must never mean "allowed".
    expect(await hasApproval("nobody")).toBe(false);

    await requestApproval(child);
    expect(await hasApproval(child.playerId)).toBe(false);
  });

  it("grants access once approved", async () => {
    const a = await requestApproval(child);
    await recordDecision(a.token, "approved");
    expect(await hasApproval(child.playerId)).toBe(true);
  });

  it("removes access immediately when revoked", async () => {
    // "You can withdraw at any time" is a promise made to guardians in writing.
    const a = await requestApproval(child);
    await recordDecision(a.token, "approved");
    expect(await hasApproval(child.playerId)).toBe(true);

    await recordDecision(a.token, "revoked");
    expect(await hasApproval(child.playerId)).toBe(false);
  });

  it("lets a guardian reinstate access after revoking", async () => {
    const a = await requestApproval(child);
    await recordDecision(a.token, "approved");
    await recordDecision(a.token, "revoked");
    await recordDecision(a.token, "approved");
    expect(await hasApproval(child.playerId)).toBe(true);
  });

  it("keeps a full history of every change", async () => {
    const a = await requestApproval(child);
    await recordDecision(a.token, "approved");
    await recordDecision(a.token, "revoked");

    const row = await approvalFor(child.playerId);
    expect(row?.history).toHaveLength(2);
    expect(row?.history[0]).toMatchObject({ from: "pending", to: "approved" });
    expect(row?.history[1]).toMatchObject({ from: "approved", to: "revoked" });
  });
});

describe("approval tokens", () => {
  it("generates long, unique, url-safe tokens", async () => {
    const tokens = new Set(Array.from({ length: 500 }, newToken));
    expect(tokens.size).toBe(500);
    for (const t of tokens) {
      expect(t.length).toBeGreaterThanOrEqual(40);
      expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("rejects empty and short tokens without touching the store", async () => {
    expect(await findByToken("")).toBeNull();
    expect(await findByToken("short")).toBeNull();
    expect(await recordDecision("", "approved")).toEqual({
      ok: false,
      reason: "not-found",
    });
  });

  it("rejects an unknown token", async () => {
    await requestApproval(child);
    expect(await findByToken(newToken())).toBeNull();
    expect(await recordDecision(newToken(), "approved")).toEqual({
      ok: false,
      reason: "not-found",
    });
  });
});

describe("re-requesting permission", () => {
  it("replaces a pending request rather than stacking them", async () => {
    // Otherwise an impatient child can flood a parent's inbox with live links.
    const first = await requestApproval(child);
    const second = await requestApproval(child);

    expect(second.token).not.toBe(first.token);
    expect(await findByToken(first.token)).toBeNull();
    expect(await findByToken(second.token)).not.toBeNull();
  });

  it("does not overwrite a decision the guardian has already made", async () => {
    const a = await requestApproval(child);
    await recordDecision(a.token, "declined");

    const again = await requestApproval(child);
    expect(again.token).toBe(a.token);
    expect(again.status).toBe("declined");
  });

  it("keeps an approved link working so it can still be revoked", async () => {
    const a = await requestApproval(child);
    await recordDecision(a.token, "approved");
    const again = await requestApproval(child);
    expect(again.token).toBe(a.token);
  });
});

describe("expiry", () => {
  it("refuses a decision on an expired pending request", async () => {
    const a = await requestApproval(child);

    // Age the request past its lifetime.
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const file = path.join(process.env.SWC_DATA_DIR!, "guardian-approvals.json");
    const rows = JSON.parse(await fs.readFile(file, "utf8"));
    rows[0].expiresAt = new Date(Date.now() - 1000).toISOString();
    await fs.writeFile(file, JSON.stringify(rows));

    expect(await recordDecision(a.token, "approved")).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(await hasApproval(child.playerId)).toBe(false);
  });

  it("lets an approved record be revoked even long after the original expiry", async () => {
    // A guardian must never lose the ability to withdraw permission.
    const a = await requestApproval(child);
    await recordDecision(a.token, "approved");

    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const file = path.join(process.env.SWC_DATA_DIR!, "guardian-approvals.json");
    const rows = JSON.parse(await fs.readFile(file, "utf8"));
    rows[0].expiresAt = new Date(Date.now() - 1000).toISOString();
    await fs.writeFile(file, JSON.stringify(rows));

    expect(await recordDecision(a.token, "revoked")).toMatchObject({ ok: true });
    expect(await hasApproval(child.playerId)).toBe(false);
  });
});
