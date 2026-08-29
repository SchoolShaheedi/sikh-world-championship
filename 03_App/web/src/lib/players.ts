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
  eventVerified: boolean;
  isModerator: boolean;
  guardianEmail: string | null;
  createdAt: string;
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
    eventVerified: fromBool(r.event_verified),
    isModerator: fromBool(r.is_moderator),
    guardianEmail: (r.guardian_email as string | null) ?? null,
    createdAt: r.created_at as string,
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
  /** Under-16s only, and only ever from the registration record. */
  guardianEmail?: string | null;
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
                guardian_email = COALESCE(?, guardian_email)
          WHERE id = ?`,
      )
      .bind(
        input.displayName,
        input.region ?? null,
        input.avatarId ?? null,
        input.gamertag ?? null,
        input.guardianEmail ?? null,
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
    eventVerified: false,
    isModerator: false,
    guardianEmail: input.guardianEmail ?? null,
    createdAt: new Date().toISOString(),
  };

  await db
    .prepare(
      `INSERT INTO players
         (id, email, display_name, age_band, date_of_birth, region, avatar_id, gamertag,
          event_verified, is_moderator, guardian_email, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      player.id, player.email, player.displayName, player.ageBand, player.dateOfBirth,
      player.region, player.avatarId, player.gamertag, bool(false), bool(false),
      player.guardianEmail, player.createdAt,
    )
    .run();

  return player;
}

/** Set when a volunteer checks someone in on the day. Shown as a badge on the board. */
export async function markEventVerified(playerId: string): Promise<void> {
  const db = await getDb();
  await db
    .prepare("UPDATE players SET event_verified = 1 WHERE id = ?")
    .bind(playerId)
    .run();
}
