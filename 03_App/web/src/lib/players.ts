/**
 * Player records.
 *
 * A player is created as part of registering for an event, never as a separate step —
 * decision 15: "the account creation must be *part of* the registration flow, not a
 * separate step before it. One form, account created at the end."
 */
import crypto from "node:crypto";
import { getDb, bool, fromBool } from "./db";
import type { AgeBand } from "./types";

export interface Player {
  id: string;
  email: string;
  displayName: string;
  ageBand: AgeBand;
  dateOfBirth: string;
  region: string | null;
  avatarId: string | null;
  gamertag: string | null;
  /**
   * The name shown publicly — bracket, projector, player card. Never the surname, never
   * the PSN ID. See lib/handle.ts for why it is a separate field.
   *
   * Nullable only because accounts created before round 44 predate it. `publicName()`
   * below is what callers should read.
   */
  handle: string | null;
  eventVerified: boolean;
  isModerator: boolean;
  guardianEmail: string | null;
  /**
   * REUSABLE CONTACT DETAILS, added 2026-09-02 so a second event does not ask for them
   * again. Shown only to the person themselves, to prefill their next entry form.
   *
   * These are the same fields the twelve-month registration purge deletes, so they are
   * NOT kept for the life of the profile: `purgeStaleProfileContact()` clears all five
   * once the person has no registration left. The profile survives; the contact details
   * do not outlive the event they were given for.
   */
  fullName: string | null;
  mobile: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
  createdAt: string;
  /**
   * Last time this account was used, or null if never since it was made.
   *
   * LOAD-BEARING FOR RETENTION, not analytics. The dormant-profile rule deletes an account
   * after 24 months of no activity, and without this the only clock available would be
   * `created_at` — which would delete the account of somebody who signs in every month.
   *
   * Written from the two paths that are unambiguously activity and are already writes:
   * redeeming a magic link (`redeemSignInToken`) and registering interest (`upsertPlayer`
   * below). Deliberately NOT written by `currentPlayer()`: that runs while rendering, on
   * nearly every request, and turning a page view into a database write is the wrong trade
   * for a field that only has to answer "used in the last two years?".
   */
  lastSeenAt: string | null;
}

type Row = Record<string, unknown>;

function toPlayer(r: Row): Player {
  return {
    id: r.id as string,
    email: r.email as string,
    displayName: r.display_name as string,
    ageBand: r.age_band as AgeBand,
    dateOfBirth: r.date_of_birth as string,
    region: (r.region as string | null) ?? null,
    avatarId: (r.avatar_id as string | null) ?? null,
    gamertag: (r.gamertag as string | null) ?? null,
    handle: (r.handle as string | null) ?? null,
    eventVerified: fromBool(r.event_verified),
    isModerator: fromBool(r.is_moderator),
    guardianEmail: (r.guardian_email as string | null) ?? null,
    fullName: (r.full_name as string | null) ?? null,
    mobile: (r.mobile as string | null) ?? null,
    guardianName: (r.guardian_name as string | null) ?? null,
    guardianRelation: (r.guardian_relation as string | null) ?? null,
    guardianMobile: (r.guardian_mobile as string | null) ?? null,
    createdAt: r.created_at as string,
    lastSeenAt: (r.last_seen_at as string | null) ?? null,
  };
}

/**
 * The band that decides who a player can see and be seen by.
 *
 * Computed once, at account creation, and then stored. Deriving it from date of birth on
 * every read would mean a child's sixteenth birthday silently moved them into the adult
 * pool — including into conversations already in progress. Moving band should be a
 * deliberate act, not a clock tick.
 */
export function bandFor(age: number): AgeBand {
  return age < 16 ? "U16" : "16+";
}

export async function playerByEmail(email: string): Promise<Player | null> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT * FROM players WHERE email = ?")
    .bind(email.trim().toLowerCase())
    .first<Row>();
  return row ? toPlayer(row) : null;
}

export async function playerById(id: string): Promise<Player | null> {
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM players WHERE id = ?").bind(id).first<Row>();
  return row ? toPlayer(row) : null;
}

export interface NewPlayer {
  email: string;
  displayName: string;
  ageBand: AgeBand;
  dateOfBirth: string;
  region?: string | null;
  avatarId?: string | null;
  gamertag?: string | null;
  /** Public tournament handle. Defaulted from the full name when absent — see handle.ts. */
  handle?: string | null;
  /** Under-16s only, and only ever from the registration record. */
  guardianEmail?: string | null;
  /**
   * The reusable contact details. All optional and all only ever written from a
   * registration — never from a page the person can edit, which is what keeps the
   * guardian fields trustworthy (invariant 3).
   */
  fullName?: string | null;
  mobile?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianMobile?: string | null;
}

/**
 * Create the player, or return the existing one for that address.
 *
 * Registering for a second event must not mint a second account, and must not fail. What
 * it does update is the details a later registration is more likely to have right —
 * display name, region, avatar, and the guardian email, which a guardian may have
 * corrected between events.
 *
 * It deliberately does NOT update `age_band` or `is_moderator`. Age band is a safeguarding
 * boundary and moderator status is an access grant; neither should change as a side effect
 * of filling in a sign-up form.
 */
export async function upsertPlayer(input: NewPlayer): Promise<Player> {
  const db = await getDb();
  const email = input.email.trim().toLowerCase();

  const existing = await playerByEmail(email);
  if (existing) {
    await db
      .prepare(
        `UPDATE players
            SET display_name = ?, region = COALESCE(?, region),
                avatar_id = COALESCE(?, avatar_id), gamertag = COALESCE(?, gamertag),
                handle = COALESCE(?, handle),
                guardian_email = COALESCE(?, guardian_email),
                -- COALESCE, like everything above it: a later registration is more
                -- likely to be right, and a field the new form did not send must not
                -- blank out one we already had.
                full_name = COALESCE(?, full_name),
                mobile = COALESCE(?, mobile),
                guardian_name = COALESCE(?, guardian_name),
                guardian_relation = COALESCE(?, guardian_relation),
                guardian_mobile = COALESCE(?, guardian_mobile),
                -- Registering interest is activity. See touchPlayer().
                last_seen_at = ?
          WHERE id = ?`,
      )
      .bind(
        input.displayName,
        input.region ?? null,
        input.avatarId ?? null,
        input.gamertag ?? null,
        input.handle ?? null,
        input.guardianEmail ?? null,
        input.fullName ?? null,
        input.mobile ?? null,
        input.guardianName ?? null,
        input.guardianRelation ?? null,
        input.guardianMobile ?? null,
        new Date().toISOString(),
        existing.id,
      )
      .run();
    return (await playerById(existing.id))!;
  }

  const player: Player = {
    id: crypto.randomUUID(),
    email,
    displayName: input.displayName,
    ageBand: input.ageBand,
    dateOfBirth: input.dateOfBirth,
    region: input.region ?? null,
    avatarId: input.avatarId ?? null,
    gamertag: input.gamertag ?? null,
    handle: input.handle ?? null,
    eventVerified: false,
    isModerator: false,
    guardianEmail: input.guardianEmail ?? null,
    fullName: input.fullName ?? null,
    mobile: input.mobile ?? null,
    guardianName: input.guardianName ?? null,
    guardianRelation: input.guardianRelation ?? null,
    guardianMobile: input.guardianMobile ?? null,
    createdAt: new Date().toISOString(),
    lastSeenAt: null,
  };

  await db
    .prepare(
      `INSERT INTO players
         (id, email, display_name, age_band, date_of_birth, region, avatar_id, gamertag,
          handle, event_verified, is_moderator, guardian_email,
          full_name, mobile, guardian_name, guardian_relation, guardian_mobile,
          created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      player.id, player.email, player.displayName, player.ageBand, player.dateOfBirth,
      player.region, player.avatarId, player.gamertag, player.handle,
      bool(false), bool(false), player.guardianEmail,
      player.fullName, player.mobile, player.guardianName, player.guardianRelation,
      player.guardianMobile,
      player.createdAt,
    )
    .run();

  return player;
}

/**
 * The name to show anywhere the public can see it.
 *
 * Prefer the handle; fall back to the display name, which is already first-name-only.
 * Every public surface must go through this rather than reading `handle` directly, so an
 * account created before round 44 (handle NULL) still renders something.
 */
export function publicName(player: Pick<Player, "handle" | "displayName">): string {
  return player.handle?.trim() || player.displayName;
}

/** Set when a volunteer checks someone in on the day. Shown as a badge on the board. */
export async function markEventVerified(playerId: string): Promise<void> {
  const db = await getDb();
  await db
    .prepare("UPDATE players SET event_verified = 1 WHERE id = ?")
    .bind(playerId)
    .run();
}


/**
 * Grant or revoke moderator.
 *
 * Deliberately NOT reachable from the app — there is no button for it anywhere. Moderators
 * read safeguarding disclosures, applicants' names and guardians' contact details, and run
 * the draw. Granting that is a decision someone makes once, on purpose, with a record of
 * it, not something clickable by whoever already has access.
 *
 * Run it against the database directly:
 *
 *   npx wrangler d1 execute swc-production --remote \
 *     --command "UPDATE players SET is_moderator = 1 WHERE email = 'them@example.com'"
 *
 * The function exists so the same rule is expressible in a script or a test, and so
 * there is one documented place describing how the grant happens.
 */
export async function setModerator(email: string, isModerator: boolean): Promise<boolean> {
  const db = await getDb();
  const player = await playerByEmail(email);
  if (!player) return false;
  await db
    .prepare("UPDATE players SET is_moderator = ? WHERE id = ?")
    .bind(bool(isModerator), player.id)
    .run();
  return true;
}


export interface BracketName {
  playerId: string;
  /** What the projector will say. */
  handle: string;
  /** First name only, as held on the profile — for a moderator to check it against. */
  displayName: string;
  status: string;
}

/**
 * The names that will appear publicly for one event, for a moderator to read before the
 * day.
 *
 * This list is the whole reason the handle is safe to project. The field is free text a
 * twelve-year-old typed, and the automatic checks in lib/handle.ts only catch the two
 * cases they can see — a PSN ID match and a surname. Everything else (an insult, a phone
 * number, somebody else's name) needs a person to look, once, at 64 rows.
 *
 * Selected and checked-in only: an applicant awaiting the draw is not going on a screen,
 * and reading names that may never be used is how a review of 64 becomes a review of 400
 * that nobody does.
 */
export async function bracketNames(eventSlug: string): Promise<BracketName[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT p.id, p.handle, p.display_name, r.status
         FROM registrations r
         JOIN players p ON p.id = r.player_id
        WHERE r.event_slug = ? AND r.status IN ('selected','checked-in')
        ORDER BY p.handle COLLATE NOCASE`,
    )
    .bind(eventSlug)
    .all<{ id: string; handle: string | null; display_name: string; status: string }>();

  return results.map((r) => ({
    playerId: r.id,
    handle: publicName({ handle: r.handle, displayName: r.display_name }),
    displayName: r.display_name,
    status: r.status,
  }));
}

/**
 * Change a player's public name.
 *
 * A moderator-only correction, for when the review above finds something that should not
 * go on a screen. Deliberately does NOT apply the surname and PSN-ID refusals: those exist
 * to steer a child filling in a form, and a moderator fixing a problem must not be blocked
 * by a rule aimed at somebody else. Length and charset still hold, because the string is
 * printed on a card.
 */
export async function setHandle(playerId: string, handle: string): Promise<void> {
  const db = await getDb();
  await db
    .prepare("UPDATE players SET handle = ? WHERE id = ?")
    .bind(handle, playerId)
    .run();
}
