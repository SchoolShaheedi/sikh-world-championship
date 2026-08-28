/**
 * Looking For Game store — Cloudflare D1.
 *
 * Signatures unchanged from the JSON version; see 00_Docs/DATA-LAYER.md.
 *
 * The safeguarding invariants in play-types.ts are enforced here. Two are now partly the
 * database's job rather than purely application code:
 *   - `age_band` is a CHECK-constrained, indexed column, so segregation is a WHERE clause
 *     on every board read rather than a filter someone could forget to chain.
 *   - `blocks` has a composite primary key, so a duplicate block is impossible by
 *     construction instead of by a pre-read.
 */
import crypto from "node:crypto";
import { getDb, bool, fromBool, parseJson } from "./db";
import {
  POST_LIFETIME_DAYS,
  type Block,
  type GameRequest,
  type LfgPost,
  type Report,
  type ReportStatus,
  type Game,
  type Platform,
  type Window,
  type Intensity,
  type PresetNote,
  type ReportReason,
  type RequestStatus,
} from "./play-types";

type Row = Record<string, unknown>;

function toPost(r: Row): LfgPost {
  return {
    id: r.id as string,
    playerId: r.player_id as string,
    ageBand: r.age_band as "U16" | "16+",
    eventVerified: fromBool(r.event_verified),
    displayName: r.display_name as string,
    avatarId: (r.avatar_id as string | null) ?? null,
    region: r.region as string,
    game: r.game as Game,
    platform: r.platform as Platform,
    windows: parseJson<Window[]>(r.windows, []),
    intensity: r.intensity as Intensity,
    note: r.note as PresetNote,
    createdAt: r.created_at as string,
    expiresAt: r.expires_at as string,
    status: r.status as LfgPost["status"],
  };
}

function toRequest(r: Row): GameRequest {
  return {
    id: r.id as string,
    postId: r.post_id as string,
    fromPlayerId: r.from_player_id as string,
    fromDisplayName: r.from_display_name as string,
    fromRegion: r.from_region as string,
    toPlayerId: r.to_player_id as string,
    fromGuardianEmail: (r.from_guardian_email as string | null) ?? null,
    proposedWindow: r.proposed_window as Window,
    note: r.note as PresetNote,
    status: r.status as RequestStatus,
    createdAt: r.created_at as string,
    respondedAt: (r.responded_at as string | null) ?? null,
    fromGamertag: r.from_gamertag as string,
    toGamertag: r.to_gamertag as string,
  };
}

function toReport(r: Row): Report {
  return {
    id: r.id as string,
    reporterId: r.reporter_id as string,
    targetPlayerId: r.target_player_id as string,
    targetDisplayName: r.target_display_name as string,
    context: r.context as string,
    reason: r.reason as ReportReason,
    detail: (r.detail as string | null) ?? "",
    status: r.status as ReportStatus,
    createdAt: r.created_at as string,
    assignedTo: (r.assigned_to as string | null) ?? null,
    handledAt: (r.handled_at as string | null) ?? null,
    resolution: (r.resolution as string | null) ?? null,
  };
}

/* ---------- Posts ---------- */

export async function allPosts(): Promise<LfgPost[]> {
  const db = await getDb();
  const { results } = await db.prepare("SELECT * FROM lfg_posts").all<Row>();
  return results.map(toPost);
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
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT * FROM lfg_posts
        WHERE age_band = ?
          AND status = 'open'
          AND expires_at > ?
          AND player_id != ?
          AND player_id NOT IN (
            SELECT blocked_id FROM blocks WHERE blocker_id = ?
            UNION
            SELECT blocker_id FROM blocks WHERE blocked_id = ?
          )
        ORDER BY created_at DESC`,
    )
    .bind(viewerAgeBand, new Date().toISOString(), viewerId, viewerId, viewerId)
    .all<Row>();
  return results.map(toPost);
}

export async function myPost(playerId: string): Promise<LfgPost | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT * FROM lfg_posts
        WHERE player_id = ? AND status = 'open' AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(playerId, new Date().toISOString())
    .first<Row>();
  return row ? toPost(row) : null;
}

/** One open post per player. Posting again replaces the old one. */
export async function createPost(
  input: Omit<LfgPost, "id" | "createdAt" | "expiresAt" | "status">,
): Promise<LfgPost> {
  const db = await getDb();
  const now = new Date();
  const post: LfgPost = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + POST_LIFETIME_DAYS * 864e5).toISOString(),
    status: "open",
  };

  await db.batch([
    db
      .prepare("UPDATE lfg_posts SET status = 'closed' WHERE player_id = ? AND status = 'open'")
      .bind(input.playerId),
    db
      .prepare(
        `INSERT INTO lfg_posts
           (id, player_id, age_band, event_verified, display_name, avatar_id, region,
            game, platform, windows, intensity, note, created_at, expires_at, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .bind(
        post.id, post.playerId, post.ageBand, bool(post.eventVerified),
        post.displayName, post.avatarId, post.region, post.game, post.platform,
        JSON.stringify(post.windows), post.intensity, post.note,
        post.createdAt, post.expiresAt, post.status,
      ),
  ]);

  return post;
}

export async function closePost(postId: string, playerId: string): Promise<boolean> {
  const db = await getDb();
  // Ownership check in the WHERE clause: never let one player close another's post.
  const existing = await db
    .prepare("SELECT id FROM lfg_posts WHERE id = ? AND player_id = ?")
    .bind(postId, playerId)
    .first();
  if (!existing) return false;
  await db
    .prepare("UPDATE lfg_posts SET status = 'closed' WHERE id = ? AND player_id = ?")
    .bind(postId, playerId)
    .run();
  return true;
}

/* ---------- Requests ---------- */

export async function requestsFor(playerId: string): Promise<{
  incoming: GameRequest[];
  outgoing: GameRequest[];
}> {
  const db = await getDb();
  const [inc, out] = await Promise.all([
    db.prepare("SELECT * FROM game_requests WHERE to_player_id = ?").bind(playerId).all<Row>(),
    db.prepare("SELECT * FROM game_requests WHERE from_player_id = ?").bind(playerId).all<Row>(),
  ]);
  return {
    incoming: inc.results.map(toRequest),
    outgoing: out.results.map(toRequest),
  };
}

export async function createRequest(
  input: Omit<GameRequest, "id" | "createdAt" | "respondedAt" | "status">,
  senderAgeBand: "U16" | "16+",
): Promise<GameRequest | { error: string }> {
  const db = await getDb();

  // Second enforcement point for age segregation. The board query already prevents this
  // being reachable through the UI, but a request is the moment two people actually
  // connect, so it is checked again here against the post itself.
  const post = await db
    .prepare("SELECT * FROM lfg_posts WHERE id = ?")
    .bind(input.postId)
    .first<Row>();
  if (!post || post.status !== "open") {
    return { error: "This post is no longer available." };
  }
  if (post.age_band !== senderAgeBand) {
    return { error: "This post is no longer available." };
  }

  // One pending request per pair per post — stops repeat-requesting as a way to pester.
  const existing = await db
    .prepare(
      `SELECT id FROM game_requests
        WHERE post_id = ? AND from_player_id = ? AND status = 'pending'`,
    )
    .bind(input.postId, input.fromPlayerId)
    .first();
  if (existing) return { error: "You've already sent a request on this post." };

  const blocked = await db
    .prepare(
      `SELECT 1 AS x FROM blocks
        WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
    )
    .bind(input.toPlayerId, input.fromPlayerId, input.fromPlayerId, input.toPlayerId)
    .first();
  // Deliberately vague: telling someone they've been blocked invites retaliation.
  if (blocked) return { error: "This post is no longer available." };

  const row: GameRequest = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    respondedAt: null,
  };

  await db
    .prepare(
      `INSERT INTO game_requests
         (id, post_id, from_player_id, from_display_name, from_region, to_player_id,
          from_guardian_email, proposed_window, note, status, created_at, responded_at,
          from_gamertag, to_gamertag)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      row.id, row.postId, row.fromPlayerId, row.fromDisplayName, row.fromRegion,
      row.toPlayerId, row.fromGuardianEmail, row.proposedWindow, row.note,
      row.status, row.createdAt, null, row.fromGamertag, row.toGamertag,
    )
    .run();

  return row;
}

export async function respondToRequest(
  requestId: string,
  playerId: string,
  accept: boolean,
): Promise<GameRequest | null> {
  const db = await getDb();
  // Only the recipient can answer, and only a pending request.
  const row = await db
    .prepare(
      "SELECT * FROM game_requests WHERE id = ? AND to_player_id = ? AND status = 'pending'",
    )
    .bind(requestId, playerId)
    .first<Row>();
  if (!row) return null;

  const status = accept ? "accepted" : "declined";
  const respondedAt = new Date().toISOString();
  await db
    .prepare("UPDATE game_requests SET status = ?, responded_at = ? WHERE id = ?")
    .bind(status, respondedAt, requestId)
    .run();

  return toRequest({ ...row, status, responded_at: respondedAt });
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
  const db = await getDb();
  const row: Report = {
    ...input,
    id: crypto.randomUUID(),
    status: "open",
    createdAt: new Date().toISOString(),
    assignedTo: null,
    handledAt: null,
    resolution: null,
  };
  await db
    .prepare(
      `INSERT INTO reports
         (id, reporter_id, target_player_id, target_display_name, context, reason,
          detail, status, created_at, assigned_to, handled_at, resolution)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      row.id, row.reporterId, row.targetPlayerId, row.targetDisplayName,
      row.context, row.reason, row.detail, row.status, row.createdAt, null, null, null,
    )
    .run();
  return row;
}

export async function allReports(): Promise<Report[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT * FROM reports
        ORDER BY
          CASE status WHEN 'open' THEN 0 WHEN 'investigating' THEN 1
                      WHEN 'actioned' THEN 2 ELSE 3 END ASC,
          created_at ASC`,
    )
    .all<Row>();
  return results.map(toReport);
}

export async function updateReport(
  reportId: string,
  patch: Partial<Pick<Report, "status" | "assignedTo" | "resolution">>,
): Promise<Report | null> {
  const db = await getDb();
  const existing = await db
    .prepare("SELECT * FROM reports WHERE id = ?")
    .bind(reportId)
    .first<Row>();
  if (!existing) return null;

  const merged = { ...toReport(existing), ...patch };
  const handledAt =
    patch.status === "actioned" || patch.status === "dismissed"
      ? new Date().toISOString()
      : merged.handledAt;

  await db
    .prepare(
      "UPDATE reports SET status = ?, assigned_to = ?, resolution = ?, handled_at = ? WHERE id = ?",
    )
    .bind(merged.status, merged.assignedTo, merged.resolution, handledAt, reportId)
    .run();

  return { ...merged, handledAt };
}

export async function blockPlayer(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const db = await getDb();
  // The composite primary key makes a duplicate impossible; OR IGNORE turns a repeat
  // block into a no-op rather than an error.
  await db
    .prepare("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?,?,?)")
    .bind(blockerId, blockedId, new Date().toISOString())
    .run();
}

/** How long reports have been sitting — the number that tells you if moderation is working. */
export async function moderationHealth(): Promise<{
  open: number;
  oldestOpenHours: number | null;
}> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS open, MIN(created_at) AS oldest FROM reports
        WHERE status IN ('open','investigating')`,
    )
    .first<{ open: number; oldest: string | null }>();
  if (!row || row.open === 0) return { open: 0, oldestOpenHours: null };
  return {
    open: row.open,
    oldestOpenHours: Math.floor((Date.now() - new Date(row.oldest!).getTime()) / 36e5),
  };
}

export type { Block };
