/**
 * Locks invariant 3 from play-types.ts: GUARDIAN NOTIFIED ON EVERY CONNECTION.
 *
 * This existed as a comment and a half-implementation. `answerRequest` notified only the
 * ACCEPTING player's guardian, so whenever a child started the contact — the likelier
 * direction — their own guardian was never told. Age segregation guarantees both players
 * are in the same band, so if one is under 16 both are, and both guardians are owed the
 * notice. These tests fail if either side is dropped again.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { useTempDataDir, clearDataDir } from "@/lib/test-helpers";

const notices: { guardianEmail: string; childDisplayName: string; otherPlayerName: string }[] = [];

// The accepting player. Mutated per test so we can accept as either child.
let acceptingPlayer: Record<string, unknown>;

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

vi.mock("@/lib/notify", () => ({
  notifyGuardianOfConnection: async (n: {
    guardianEmail: string;
    childDisplayName: string;
    otherPlayerName: string;
  }) => {
    notices.push(n);
  },
  notifyRequestReceived: async () => {},
}));

vi.mock("@/lib/session", () => ({
  currentPlayer: async () => acceptingPlayer,
  canUseBoard: () => true,
}));

beforeAll(useTempDataDir);

describe("guardian notification on connection", () => {
  beforeEach(async () => {
    await clearDataDir();
    notices.length = 0;
    acceptingPlayer = {
      id: "kid-b",
      displayName: "Kid B",
      ageBand: "U16",
      region: "Leeds",
      avatarId: "kesri-1",
      gamertag: "kidb_psn",
      eventVerified: true,
      guardianApprovedForBoard: true,
      guardianEmail: "guardian-b@example.com",
      isModerator: false,
    };
  });

  /** Kid A posts, Kid B requests, Kid A accepts -> both guardians told. */
  async function connectTwoChildren() {
    const { createPost, createRequest } = await import("@/lib/play-store");
    const { answerRequest } = await import("./actions");

    const post = await createPost({
      playerId: "kid-a",
      displayName: "Kid A",
      avatarId: "kesri-1",
      region: "Birmingham",
      ageBand: "U16",
      eventVerified: true,
      game: "EA FC 26",
      platform: "PS5",
      windows: ["Weekday evenings"],
      intensity: "Just for fun",
      note: "Happy to play with anyone",
    });

    const req = await createRequest(
      {
        postId: post.id,
        fromPlayerId: "kid-b",
        fromDisplayName: "Kid B",
        fromRegion: "Leeds",
        toPlayerId: "kid-a",
        fromGuardianEmail: "guardian-b@example.com",
        proposedWindow: "Weekday evenings",
        note: "Happy to play with anyone",
        fromGamertag: "kidb_psn",
        toGamertag: "kida_psn",
      },
      "U16",
    );
    if ("error" in req) throw new Error(req.error);

    // Kid A is the one accepting.
    acceptingPlayer = {
      ...acceptingPlayer,
      id: "kid-a",
      displayName: "Kid A",
      region: "Birmingham",
      guardianEmail: "guardian-a@example.com",
    };

    const fd = new FormData();
    fd.set("requestId", req.id);
    fd.set("answer", "accept");
    await answerRequest(fd);
  }

  it("tells BOTH children's guardians, not just the accepter's", async () => {
    await connectTwoChildren();
    const emailed = notices.map((n) => n.guardianEmail).sort();
    expect(emailed).toEqual(["guardian-a@example.com", "guardian-b@example.com"]);
  });

  it("names the other player, not the child themselves, in each notice", async () => {
    await connectTwoChildren();
    const a = notices.find((n) => n.guardianEmail === "guardian-a@example.com");
    const b = notices.find((n) => n.guardianEmail === "guardian-b@example.com");

    // Guardian A is told about their child Kid A connecting with Kid B.
    expect(a?.childDisplayName).toBe("Kid A");
    expect(a?.otherPlayerName).toBe("Kid B");

    // Guardian B is told about their child Kid B connecting with Kid A.
    expect(b?.childDisplayName).toBe("Kid B");
    expect(b?.otherPlayerName).toBe("Kid A");
  });

  it("sends nothing when a declined request means no gamertags were exchanged", async () => {
    const { createPost, createRequest } = await import("@/lib/play-store");
    const { answerRequest } = await import("./actions");

    const post = await createPost({
      playerId: "kid-a", displayName: "Kid A", avatarId: null, region: "Birmingham",
      ageBand: "U16", eventVerified: false, game: "EA FC 26", platform: "PS5",
      windows: ["Weekday evenings"], intensity: "Either", note: "Happy to play with anyone",
    });
    const req = await createRequest(
      {
        postId: post.id, fromPlayerId: "kid-b", fromDisplayName: "Kid B",
        fromRegion: "Leeds", toPlayerId: "kid-a",
        fromGuardianEmail: "guardian-b@example.com",
        proposedWindow: "Weekday evenings", note: "Happy to play with anyone",
        fromGamertag: "kidb_psn", toGamertag: "kida_psn",
      },
      "U16",
    );
    if ("error" in req) throw new Error(req.error);

    acceptingPlayer = { ...acceptingPlayer, id: "kid-a", displayName: "Kid A",
      guardianEmail: "guardian-a@example.com" };

    const fd = new FormData();
    fd.set("requestId", req.id);
    fd.set("answer", "decline");
    await answerRequest(fd);

    expect(notices).toHaveLength(0);
  });
});
