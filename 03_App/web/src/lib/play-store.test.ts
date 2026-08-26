import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import {
  boardFor,
  createPost,
  createRequest,
  respondToRequest,
  gamertagsVisible,
  blockPlayer,
  closePost,
  createReport,
  allReports,
  updateReport,
  moderationHealth,
} from "./play-store";
import type { LfgPost } from "./play-types";

beforeAll(useTempDataDir);
beforeEach(clearDataDir);

type PostInput = Omit<LfgPost, "id" | "createdAt" | "expiresAt" | "status">;

function post(over: Partial<PostInput> = {}): PostInput {
  return {
    playerId: "p1",
    displayName: "Player One",
    avatarId: "kesri-1",
    region: "Birmingham",
    ageBand: "16+",
    eventVerified: false,
    game: "EA FC 26",
    platform: "PS5",
    windows: ["Weekday evenings"],
    intensity: "Either",
    note: "Happy to play with anyone",
    ...over,
  };
}

/**
 * THE MOST IMPORTANT TESTS IN THE PROJECT.
 * If age segregation breaks, adults can reach children. Everything else is a bug;
 * this would be a safeguarding failure.
 */
describe("age-band segregation", () => {
  it("never shows an under-16 post to a 16+ viewer", async () => {
    await createPost(post({ playerId: "kid", ageBand: "U16" }));
    await createPost(post({ playerId: "adult", ageBand: "16+" }));

    const board = await boardFor("viewer", "16+");

    expect(board.map((p) => p.playerId)).toEqual(["adult"]);
  });

  it("never shows a 16+ post to an under-16 viewer", async () => {
    await createPost(post({ playerId: "kid", ageBand: "U16" }));
    await createPost(post({ playerId: "adult", ageBand: "16+" }));

    const board = await boardFor("viewer", "U16");

    expect(board.map((p) => p.playerId)).toEqual(["kid"]);
  });

  it("refuses a cross-age request even if the post id is known", async () => {
    // Simulates someone bypassing the UI entirely and posting a request directly.
    const kidPost = await createPost(post({ playerId: "kid", ageBand: "U16" }));

    const result = await createRequest(
      {
        postId: kidPost.id,
        fromPlayerId: "adult",
        fromDisplayName: "Adult",
        fromRegion: "London",
        toPlayerId: "kid",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "adult_psn",
        toGamertag: "kid_psn",
      },
      "16+",
    );

    expect(result).toHaveProperty("error");
  });

  it("does not leak whether a cross-age post exists", async () => {
    const kidPost = await createPost(post({ playerId: "kid", ageBand: "U16" }));
    const result = await createRequest(
      {
        postId: kidPost.id,
        fromPlayerId: "adult",
        fromDisplayName: "Adult",
        fromRegion: "London",
        toPlayerId: "kid",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "a",
        toGamertag: "b",
      },
      "16+",
    );
    // Same wording as a genuinely missing post, so the response can't be used to probe
    // for the existence of under-16 accounts.
    expect(result).toEqual({ error: "This post is no longer available." });
  });
});

describe("gamertag privacy", () => {
  it("hides gamertags while a request is pending", async () => {
    const p = await createPost(post({ playerId: "owner" }));
    const req = await createRequest(
      {
        postId: p.id,
        fromPlayerId: "asker",
        fromDisplayName: "Asker",
        fromRegion: "Leeds",
        toPlayerId: "owner",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "asker_psn",
        toGamertag: "owner_psn",
      },
      "16+",
    );
    if ("error" in req) throw new Error(req.error);

    expect(gamertagsVisible(req, "asker")).toBe(false);
    expect(gamertagsVisible(req, "owner")).toBe(false);
  });

  it("reveals gamertags to both parties once accepted, and to nobody else", async () => {
    const p = await createPost(post({ playerId: "owner" }));
    const req = await createRequest(
      {
        postId: p.id,
        fromPlayerId: "asker",
        fromDisplayName: "Asker",
        fromRegion: "Leeds",
        toPlayerId: "owner",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "asker_psn",
        toGamertag: "owner_psn",
      },
      "16+",
    );
    if ("error" in req) throw new Error(req.error);

    const accepted = await respondToRequest(req.id, "owner", true);
    expect(accepted?.status).toBe("accepted");

    expect(gamertagsVisible(accepted!, "asker")).toBe(true);
    expect(gamertagsVisible(accepted!, "owner")).toBe(true);
    expect(gamertagsVisible(accepted!, "stranger")).toBe(false);
  });

  it("keeps gamertags hidden when a request is declined", async () => {
    const p = await createPost(post({ playerId: "owner" }));
    const req = await createRequest(
      {
        postId: p.id,
        fromPlayerId: "asker",
        fromDisplayName: "Asker",
        fromRegion: "Leeds",
        toPlayerId: "owner",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "asker_psn",
        toGamertag: "owner_psn",
      },
      "16+",
    );
    if ("error" in req) throw new Error(req.error);

    const declined = await respondToRequest(req.id, "owner", false);
    expect(gamertagsVisible(declined!, "asker")).toBe(false);
  });
});

describe("requests", () => {
  it("only lets the recipient answer", async () => {
    const p = await createPost(post({ playerId: "owner" }));
    const req = await createRequest(
      {
        postId: p.id,
        fromPlayerId: "asker",
        fromDisplayName: "Asker",
        fromRegion: "Leeds",
        toPlayerId: "owner",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "a",
        toGamertag: "b",
      },
      "16+",
    );
    if ("error" in req) throw new Error(req.error);

    // The sender must not be able to accept on the recipient's behalf.
    expect(await respondToRequest(req.id, "asker", true)).toBeNull();
    expect(await respondToRequest(req.id, "stranger", true)).toBeNull();
    expect(await respondToRequest(req.id, "owner", true)).not.toBeNull();
  });

  it("blocks repeat requests on the same post", async () => {
    const p = await createPost(post({ playerId: "owner" }));
    const base = {
      postId: p.id,
      fromPlayerId: "asker",
      fromDisplayName: "Asker",
      fromRegion: "Leeds",
      toPlayerId: "owner",
      proposedWindow: "Weekday evenings" as const,
      note: "Happy to play with anyone" as const,
      fromGamertag: "a",
      toGamertag: "b",
    };
    expect(await createRequest(base, "16+")).not.toHaveProperty("error");
    expect(await createRequest(base, "16+")).toHaveProperty("error");
  });
});

describe("blocking", () => {
  it("hides the blocked player's post from the blocker", async () => {
    await createPost(post({ playerId: "rude" }));
    await blockPlayer("me", "rude");

    expect(await boardFor("me", "16+")).toHaveLength(0);
  });

  it("also hides the blocker's post from the blocked player", async () => {
    // A one-directional block tells the blocked person they've been blocked, which
    // invites retaliation. It must work both ways.
    await createPost(post({ playerId: "me" }));
    await blockPlayer("me", "rude");

    expect(await boardFor("rude", "16+")).toHaveLength(0);
  });

  it("refuses a request between blocked players", async () => {
    const p = await createPost(post({ playerId: "owner" }));
    await blockPlayer("owner", "asker");

    const result = await createRequest(
      {
        postId: p.id,
        fromPlayerId: "asker",
        fromDisplayName: "Asker",
        fromRegion: "Leeds",
        toPlayerId: "owner",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "a",
        toGamertag: "b",
      },
      "16+",
    );
    expect(result).toHaveProperty("error");
  });
});

describe("posts", () => {
  it("keeps only one open post per player", async () => {
    await createPost(post({ playerId: "p1", game: "EA FC 26" }));
    await createPost(post({ playerId: "p1", game: "Rocket League" }));

    const board = await boardFor("viewer", "16+");
    expect(board).toHaveLength(1);
    expect(board[0].game).toBe("Rocket League");
  });

  it("never shows a player their own post", async () => {
    await createPost(post({ playerId: "me" }));
    expect(await boardFor("me", "16+")).toHaveLength(0);
  });

  it("refuses to close someone else's post", async () => {
    const p = await createPost(post({ playerId: "owner" }));
    expect(await closePost(p.id, "someone-else")).toBe(false);
    expect(await closePost(p.id, "owner")).toBe(true);
  });

  it("gives posts an expiry", async () => {
    const p = await createPost(post());
    expect(new Date(p.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("moderation queue", () => {
  const report = (over = {}) => ({
    reporterId: "r",
    targetPlayerId: "t",
    targetDisplayName: "Target",
    context: "profile",
    reason: "Abusive or threatening" as const,
    detail: "",
    ...over,
  });

  it("puts open reports before handled ones", async () => {
    const a = await createReport(report());
    await createReport(report());
    await updateReport(a.id, { status: "dismissed" });

    const sorted = await allReports();
    expect(sorted[0].status).toBe("open");
    expect(sorted[sorted.length - 1].status).toBe("dismissed");
  });

  it("counts open reports and reports nothing waiting when clear", async () => {
    expect(await moderationHealth()).toEqual({ open: 0, oldestOpenHours: null });
    await createReport(report());
    const health = await moderationHealth();
    expect(health.open).toBe(1);
    expect(health.oldestOpenHours).toBe(0);
  });

  it("records who handled a report", async () => {
    const r = await createReport(report());
    const updated = await updateReport(r.id, {
      status: "actioned",
      assignedTo: "Mod One",
      resolution: "Warned.",
    });
    expect(updated?.assignedTo).toBe("Mod One");
    expect(updated?.handledAt).not.toBeNull();
  });
});
