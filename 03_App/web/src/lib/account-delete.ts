/**
 * Deleting an account, and everything keyed to it.
 *
 * ONE place knows every table that holds a player id. There were two before — the
 * retention job's cascade and nothing else — and the moment a second caller appeared
 * (deleting a test account from /admin) the duplication would have become the bug where
 * one path forgets a table and leaves a child's row behind an id nobody can resolve.
 *
 * Written out rather than left to `ON DELETE CASCADE` because only two of these tables
 * declare it, and SQLite does not enforce foreign keys unless asked. Relying on a
 * constraint that is not there is worse than not relying on one.
 *
 * ADDING A TABLE THAT STORES A PLAYER ID MEANS ADDING A LINE HERE.
 */
import crypto from "node:crypto";
import { getDb } from "./db";
import { PLATFORM_SCOPE } from "./retention-scope";

const CASCADE: { sql: string; params: (id: string) => unknown[] }[] = [
  { sql: "DELETE FROM sessions WHERE player_id = ?", params: (id) => [id] },
  { sql: "DELETE FROM auth_tokens WHERE player_id = ?", params: (id) => [id] },
  { sql: "DELETE FROM guardian_approvals WHERE player_id = ?", params: (id) => [id] },
  { sql: "DELETE FROM lfg_posts WHERE player_id = ?", params: (id) => [id] },
  {
    sql: "DELETE FROM game_requests WHERE from_player_id = ? OR to_player_id = ?",
    params: (id) => [id, id],
  },
  {
    sql: "DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?",
    params: (id) => [id, id],
  },
  /**
   * Matches are EMPTIED, not deleted.
   *
   * A match row is a record of the competition — who played whom in the quarter-final and
   * what the score was — rather than a record about a person, and deleting it would put a
   * hole in the middle of a bracket that other people are also in. Nulling the id removes
   * everything that identifies the deleted player: the row keeps a score and a shape, the
   * screen renders an empty slot, and no name can come back because names are read live
   * from `players` and never stored here.
   */
  {
    sql: "UPDATE matches SET home_id = NULL WHERE home_id = ?",
    params: (id) => [id],
  },
  {
    sql: "UPDATE matches SET away_id = NULL WHERE away_id = ?",
    params: (id) => [id],
  },
];

/**
 * Reports and support tickets are deliberately NOT in the list above.
 *
 * A safeguarding record outlives the account it names — six years — and a report whose
 * subject has been deleted cannot be acted on. Both the retention job and the admin panel
 * refuse to delete an account that appears on one, so this function is never reached for
 * such a player; the refusal lives with the caller because the reason is a policy, not a
 * schema fact.
 */

export interface DeleteAccountOptions {
  /**
   * Also delete the registration rows.
   *
   * FALSE for retention: the registration has its own period, measured from the event, and
   * it is the record of who applied. The link is nulled instead.
   *
   * TRUE for an erasure request or a test account, where the point is that nothing is
   * left — including the name, date of birth, email and mobile that live on the
   * registration and not on the profile.
   */
  deleteRegistrations: boolean;
  /** Recorded in the audit trail. Say why, in words a person would use. */
  reason: string;
}

export interface DeleteAccountResult {
  playerDeleted: boolean;
  registrationsDeleted: number;
  registrationsUnlinked: number;
}

/** Rows that would block a deletion, with the reason a person needs to hear. */
export async function deletionBlockers(playerId: string): Promise<string[]> {
  const db = await getDb();
  const blockers: string[] = [];

  const p = await db
    .prepare("SELECT is_moderator, is_desk FROM players WHERE id = ?")
    .bind(playerId)
    .first<{ is_moderator: number; is_desk: number }>();
  // Any staff access, not only moderator. Deleting an account that still holds a grant
  // would leave `staff_grants` pointing at somebody who no longer exists — and the whole
  // point of that table is that "who had access" stays answerable. Revoke, then delete.
  if (p?.is_moderator || p?.is_desk) {
    blockers.push(
      `This account has ${p.is_moderator ? "moderator" : "desk"} access. ` +
        `Remove it on /admin/people first.`,
    );
  }

  const report = await db
    .prepare(
      "SELECT 1 AS x FROM reports WHERE reporter_id = ? OR target_player_id = ? LIMIT 1",
    )
    .bind(playerId, playerId)
    .first<{ x: number }>();
  if (report) {
    blockers.push(
      "This account is named on a report. Safeguarding records are kept for six years " +
        "and a report about someone who has been deleted cannot be acted on.",
    );
  }

  const ticket = await db
    .prepare("SELECT 1 AS x FROM support_tickets WHERE player_id = ? LIMIT 1")
    .bind(playerId)
    .first<{ x: number }>();
  if (ticket) blockers.push("This account has an open support history.");

  return blockers;
}

/**
 * Delete an account. Assumes the caller has already checked `deletionBlockers`.
 *
 * Every deletion is recorded in `retention_runs` — including a manual one from the admin
 * panel. Deleting a person's record without leaving a trace that it happened is how you
 * end up unable to answer "did you delete it?", which is the one question a subject access
 * request always asks.
 */
export async function deleteAccount(
  playerId: string,
  opts: DeleteAccountOptions,
): Promise<DeleteAccountResult> {
  const db = await getDb();

  for (const step of CASCADE) {
    await db.prepare(step.sql).bind(...step.params(playerId)).run();
  }

  /**
   * Counted with a SELECT rather than from `run()`. The two database backends — D1 and
   * `node:sqlite` in tests — do not agree on the shape of a result's row count, so
   * `Stmt.run()` is typed `unknown` on purpose (see db.ts). Every other counted write in
   * this codebase does the same.
   */
  const { results: regs } = await db
    .prepare("SELECT id FROM registrations WHERE player_id = ?")
    .bind(playerId)
    .all<{ id: string }>();

  let registrationsDeleted = 0;
  let registrationsUnlinked = 0;
  if (opts.deleteRegistrations) {
    await db.prepare("DELETE FROM registrations WHERE player_id = ?").bind(playerId).run();
    registrationsDeleted = regs.length;
  } else {
    await db
      .prepare("UPDATE registrations SET player_id = NULL WHERE player_id = ?")
      .bind(playerId)
      .run();
    registrationsUnlinked = regs.length;
  }

  const existed = await db
    .prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first<{ id: string }>();
  await db.prepare("DELETE FROM players WHERE id = ?").bind(playerId).run();
  const playerDeleted = existed !== null;

  if (playerDeleted) {
    await db
      .prepare(
        `INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
         VALUES (?, ?, ?, 'delete-account', 1, ?)`,
      )
      .bind(crypto.randomUUID(), new Date().toISOString(), PLATFORM_SCOPE, opts.reason)
      .run();
  }

  return { playerDeleted, registrationsDeleted, registrationsUnlinked };
}

/**
 * Delete a registration that has no account behind it.
 *
 * An applicant who was never selected still has a registration row holding their name,
 * date of birth, email and mobile. Since round 42 they also have a profile — but an
 * unlinked row can exist (retention nulls the link), and erasure has to be able to reach
 * one.
 */
export async function deleteRegistrationByReference(
  reference: string,
  reason: string,
): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT id, player_id FROM registrations WHERE reference = ?")
    .bind(reference)
    .first<{ id: string; player_id: string | null }>();
  if (!row) return false;

  await db.prepare("DELETE FROM registrations WHERE id = ?").bind(row.id).run();
  await db
    .prepare(
      `INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
       VALUES (?, ?, ?, 'delete-account', 1, ?)`,
    )
    .bind(crypto.randomUUID(), new Date().toISOString(), PLATFORM_SCOPE, reason)
    .run();
  return true;
}
