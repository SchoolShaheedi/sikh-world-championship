"use server";

import { revalidatePath } from "next/cache";
import { currentPlayer, canUseBoard } from "@/lib/session";
import { notifyGuardianOfConnection, notifyRequestReceived } from "@/lib/notify";
import {
  createPost,
  closePost,
  createRequest,
  respondToRequest,
  createReport,
  blockPlayer,
  allPosts,
} from "@/lib/play-store";
import {
  GAMES,
  PLATFORMS,
  WINDOWS,
  INTENSITY,
  PRESET_NOTES,
  REPORT_REASONS,
  type Game,
  type Platform,
  type Window,
  type Intensity,
  type PresetNote,
  type ReportReason,
} from "@/lib/play-types";

/**
 * Every action re-checks the 16+ gate server-side. The UI also hides the board from
 * under-16s, but the UI is not a security boundary.
 */
async function gate() {
  const me = await currentPlayer();
  if (!canUseBoard(me)) throw new Error("The board is 16+ only.");
  return me;
}

/** Values arriving from a form are strings. Only accept ones from our own lists. */
function pick<T extends readonly string[]>(
  list: T,
  value: FormDataEntryValue | null,
): T[number] | null {
  const v = String(value ?? "");
  return (list as readonly string[]).includes(v) ? (v as T[number]) : null;
}

export async function postToBoard(formData: FormData) {
  const me = await gate();

  const game = pick(GAMES, formData.get("game"));
  const platform = pick(PLATFORMS, formData.get("platform"));
  const intensity = pick(INTENSITY, formData.get("intensity"));
  const note = pick(PRESET_NOTES, formData.get("note"));
  const windows = formData
    .getAll("windows")
    .map((w) => pick(WINDOWS, w))
    .filter((w): w is Window => w !== null);

  if (!game || !platform || !intensity || !note || windows.length === 0) {
    return { error: "Pick a game, a platform, at least one time, and a note." };
  }

  await createPost({
    playerId: me.id,
    displayName: me.displayName,
    avatarId: me.avatarId,
    region: me.region,
    ageBand: me.ageBand,
    eventVerified: me.eventVerified,
    game: game as Game,
    platform: platform as Platform,
    windows,
    intensity: intensity as Intensity,
    note: note as PresetNote,
  });

  revalidatePath("/play");
  return { ok: true };
}

export async function takeDownMyPost(formData: FormData) {
  const me = await gate();
  await closePost(String(formData.get("postId")), me.id);
  revalidatePath("/play");
}

export async function sendRequest(formData: FormData) {
  const me = await gate();

  const postId = String(formData.get("postId"));
  const proposedWindow = pick(WINDOWS, formData.get("window"));
  const note = pick(PRESET_NOTES, formData.get("note"));
  if (!proposedWindow || !note) return { error: "Pick a time and a note." };

  const post = (await allPosts()).find((p) => p.id === postId);
  if (!post || post.status !== "open") return { error: "This post is no longer available." };

  const result = await createRequest(
    {
      postId,
      fromPlayerId: me.id,
      fromDisplayName: me.displayName,
      fromRegion: me.region,
      toPlayerId: post.playerId,
      proposedWindow: proposedWindow as Window,
      note: note as PresetNote,
      fromGamertag: me.gamertag,
      // The recipient's gamertag is stored with the request but only revealed to either
      // side once it's accepted — see gamertagsVisible().
      toGamertag: `${post.displayName.toLowerCase()}_psn`,
    },
    me.ageBand,
  );

  if (!("error" in result)) {
    await notifyRequestReceived(post.playerId, me.displayName);
  }

  revalidatePath("/play");
  return "error" in result ? result : { ok: true };
}

export async function answerRequest(formData: FormData) {
  const me = await gate();
  const accepted = formData.get("answer") === "accept";
  const req = await respondToRequest(
    String(formData.get("requestId")),
    me.id,
    accepted,
  );

  // An accepted request is the moment gamertags are exchanged. If either side is under
  // 16, their guardian is told who their child just connected with. This is the promise
  // made on /safeguarding, so it fires here and nowhere else.
  if (req && accepted && me.ageBand === "U16" && me.guardianEmail) {
    const post = (await allPosts()).find((p) => p.id === req.postId);
    await notifyGuardianOfConnection({
      guardianEmail: me.guardianEmail,
      childDisplayName: me.displayName,
      // The OTHER player is the requester — the post is the child's own, so its region
      // would name the child rather than the person they've just connected with.
      otherPlayerName: req.fromDisplayName,
      otherPlayerRegion: req.fromRegion,
      game: post?.game ?? "unknown",
      when: req.proposedWindow,
    });
  }

  revalidatePath("/play");
}

export async function reportPlayer(formData: FormData) {
  const me = await currentPlayer();
  const reason = pick(REPORT_REASONS, formData.get("reason"));
  if (!reason) return { error: "Pick a reason." };

  await createReport({
    reporterId: me.id,
    targetPlayerId: String(formData.get("targetPlayerId")),
    targetDisplayName: String(formData.get("targetDisplayName")),
    context: String(formData.get("context") ?? "profile"),
    reason: reason as ReportReason,
    detail: String(formData.get("detail") ?? "").slice(0, 1000),
  });

  revalidatePath("/play");
  revalidatePath("/moderation");
  return { ok: true };
}

export async function blockAndHide(formData: FormData) {
  const me = await currentPlayer();
  await blockPlayer(me.id, String(formData.get("targetPlayerId")));
  revalidatePath("/play");
}
