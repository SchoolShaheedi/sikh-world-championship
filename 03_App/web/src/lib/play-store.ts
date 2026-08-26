/**
 * LFG board store — DEVELOPMENT IMPLEMENTATION, same caveats as lib/store.ts.
 * JSON-file backed so the board works end to end today. Replace with Supabase before
 * launch — see 00_Docs/DATA-LAYER.md.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir } from "./data-dir";
import {
  POST_LIFETIME_DAYS,
  type Block,
  type GameRequest,
  type LfgPost,
  type Report,
  type ReportStatus,
} from "./play-types";



async function read<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(
      await fs.readFile(path.join(dataDir(), file), "utf8"),
    ) as T[];
  } catch {
    return [];
  }
}

async function write<T>(file: string, rows: T[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(
    path.join(dataDir(), file),
    JSON.stringify(rows, null, 2),
    "utf8",
  );
}

/* ---------- Posts ---------- */

export async function allPosts(): Promise<LfgPost[]> {
  return read<LfgPost>("lfg-posts.json");
}

/**
 * The board as one player sees it.
 *
 * THE AGE-BAND FILTER IS THE MOST IMPORTANT LINE IN THIS FILE. An under-16 sees only
 * under-16 posts; a 16+ player sees only 16+ posts. There is no mixed view, no opt-in,
 * and no admin override. Adult-to-child contact isn't policed here — it's made
 * impossible, because the two pools never intersect.
 *
 * Also filters out: expired posts, closed posts, your own post, and anyone either of you
 * has blocked, in BOTH directions. A block must be invisible to the blocked person,
 * otherwise blocking someone invites retaliation.
 */
export async function boardFor(
  viewerId: string,
  viewerAgeBand: "U16" | "16+",
): Promise<LfgPost[]> {
  const [posts, blocks] = await Promise.all([
    allPosts(),
    read<Block>("blocks.json"),
  ]);
  const now = Date.now();

  const hidden = new Set(
    blocks
      .filter((b) => b.blockerId === viewerId || b.blockedId === viewerId)
      .map((b) => (b.blockerId === viewerId ? b.blockedId : b.blockerId)),
  );

  return posts
    .filter((p) => p.ageBand === viewerAgeBand)
    .filter((p) => p.status === "open")
    .filter((p) => new Date(p.expiresAt).getTime() > now)
    .filter((p) => p.playerId !== viewerId)
    .filter((p) => !hidden.has(p.playerId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function myPost(playerId: string): Promise<LfgPost | null> {
  const posts = await allPosts();
  const now = Date.now();
  return (
    posts.find(
      (p) =>
        p.playerId === playerId &&
        p.status === "open" &&
        new Date(p.expiresAt).getTime() > now,
    ) ?? null
  );
}

/** One open post per player. Posting again replaces the old one. */
export async function createPost(
  input: Omit<LfgPost, "id" | "createdAt" | "expiresAt" | "status">,
): Promise<LfgPost> {
  const posts = await allPosts();
  for (const p of posts) {
    if (p.playerId === input.playerId && p.status === "open") p.status = "closed";
  }

  const now = new Date();
  const post: LfgPost = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + POST_LIFETIME_DAYS * 864e5,
    ).toISOString(),
    status: "open",
  };
  posts.push(post);
  await write("lfg-posts.json", posts);
  return post;
}

export async function closePost(postId: string, playerId: string): Promise<boolean> {
  const posts = await allPosts();
  const post = posts.find((p) => p.id === postId);
  // Ownership check: never let one player close another's post.
  if (!post || post.playerId !== playerId) return false;
  post.status = "closed";
  await write("lfg-posts.json", posts);
  return true;
}

/* ---------- Requests ---------- */

export async function requestsFor(playerId: string): Promise<{
  incoming: GameRequest[];
  outgoing: GameRequest[];
}> {
  const rows = await read<GameRequest>("game-requests.json");
  return {
    incoming: rows.filter((r) => r.toPlayerId === playerId),
    outgoing: rows.filter((r) => r.fromPlayerId === playerId),
  };
}

export async function createRequest(
  input: Omit<GameRequest, "id" | "createdAt" | "respondedAt" | "status">,
  senderAgeBand: "U16" | "16+",
): Promise<GameRequest | { error: string }> {
  const rows = await read<GameRequest>("game-requests.json");

  // Second enforcement point for age segregation. The board query already prevents this
  // being reachable through the UI, but a request is the moment two people actually
  // connect, so it is checked again here against the post itself.
  const post = (await allPosts()).find((p) => p.id === input.postId);
  if (!post || post.status !== "open") {
    return { error: "This post is no longer available." };
  }
  if (post.ageBand !== senderAgeBand) {
    return { error: "This post is no longer available." };
  }

  // One pending request per pair per post — stops repeat-requesting as a way to pester.
  const existing = rows.find(
    (r) =>
      r.postId === input.postId &&
      r.fromPlayerId === input.fromPlayerId &&
      r.status === "pending",
  );
  if (existing) return { error: "You've already sent a request on this post." };

  const blocks = await read<Block>("blocks.json");
  const blocked = blocks.some(
    (b) =>
      (b.blockerId === input.toPlayerId && b.blockedId === input.fromPlayerId) ||
      (b.blockerId === input.fromPlayerId && b.blockedId === input.toPlayerId),
  );
  // Deliberately vague: telling someone they've been blocked invites retaliation.
  if (blocked) return { error: "This post is no longer available." };

  const row: GameRequest = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    respondedAt: null,
  };
  rows.push(row);
  await write("game-requests.json", rows);
  return row;
}

export async function respondToRequest(
  requestId: string,
  playerId: string,
  accept: boolean,
): Promise<GameRequest | null> {
  const rows = await read<GameRequest>("game-requests.json");
  const row = rows.find((r) => r.id === requestId);
  // Only the recipient can answer.
  if (!row || row.toPlayerId !== playerId || row.status !== "pending") return null;

  row.status = accept ? "accepted" : "declined";
  row.respondedAt = new Date().toISOString();
  await write("game-requests.json", rows);
  return row;
}

/**
 * Gamertags are released ONLY on an accepted request, and only to the two people in it.
 * Everything else on the board is anonymous by design.
 */
export function gamertagsVisible(req: GameRequest, viewerId: string): boolean {
  return (
    req.status === "accepted" &&
    (req.fromPlayerId === viewerId || req.toPlayerId === viewerId)
  );
}

/* ---------- Reports & blocks ---------- */

export async function createReport(
  input: Omit<
    Report,
    "id" | "createdAt" | "status" | "assignedTo" | "handledAt" | "resolution"
  >,
): Promise<Report> {
  const rows = await read<Report>("reports.json");
  const row: Report = {
    ...input,
    id: crypto.randomUUID(),
    status: "open",
    createdAt: new Date().toISOString(),
    assignedTo: null,
    handledAt: null,
    resolution: null,
  };
  rows.push(row);
  await write("reports.json", rows);
  return row;
}

export async function allReports(): Promise<Report[]> {
  const rows = await read<Report>("reports.json");
  const rank: Record<ReportStatus, number> = {
    open: 0,
    investigating: 1,
    actioned: 2,
    dismissed: 3,
  };
  return rows.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function updateReport(
  reportId: string,
  patch: Partial<Pick<Report, "status" | "assignedTo" | "resolution">>,
): Promise<Report | null> {
  const rows = await read<Report>("reports.json");
  const row = rows.find((r) => r.id === reportId);
  if (!row) return null;
  Object.assign(row, patch);
  if (patch.status === "actioned" || patch.status === "dismissed") {
    row.handledAt = new Date().toISOString();
  }
  await write("reports.json", rows);
  return row;
}

export async function blockPlayer(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const rows = await read<Block>("blocks.json");
  if (rows.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)) {
    return;
  }
  rows.push({ blockerId, blockedId, createdAt: new Date().toISOString() });
  await write("blocks.json", rows);
}

/** How long reports have been sitting — the number that tells you if moderation is working. */
export async function moderationHealth(): Promise<{
  open: number;
  oldestOpenHours: number | null;
}> {
  const rows = await read<Report>("reports.json");
  const open = rows.filter((r) => r.status === "open" || r.status === "investigating");
  if (open.length === 0) return { open: 0, oldestOpenHours: null };
  const oldest = Math.min(...open.map((r) => new Date(r.createdAt).getTime()));
  return {
    open: open.length,
    oldestOpenHours: Math.floor((Date.now() - oldest) / 36e5),
  };
}
