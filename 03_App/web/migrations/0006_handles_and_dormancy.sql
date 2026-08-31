-- Two changes, both decided in round 44.
--
-- 1. PUBLIC TOURNAMENT HANDLE
--
-- What goes on the projector behind the bracket had never been settled. The two obvious
-- candidates were both wrong:
--
--   * the real name — the safeguarding policy says a public profile never shows a
--     surname, and a bracket is the most public surface the project has;
--   * the PSN ID — worse, because a PSN ID is an ADDRESS, not a label. Anyone in the hall
--     or reading the page from home can search it on PlayStation and message a
--     twelve-year-old. It is also the one field the platform protects hardest, released
--     only to two players who have both agreed to a game. Projecting it undoes that in
--     one step, and these IDs routinely contain a real name or a birth year.
--
-- So: a third string, chosen at registration, that is neither. No contact route, not
-- searchable on PlayStation, and the player picks something they are happy to see on a
-- screen. Defaults to first name plus last initial when left blank — see lib/handle.ts,
-- which also refuses a handle that matches the entrant's PSN ID or contains their
-- surname, because a rule nobody enforces is a rule that drifts.
ALTER TABLE players ADD COLUMN handle TEXT;

-- 2. DORMANT PROFILE PURGE
--
-- Round 42 started creating a profile for everyone who registers interest, not only for
-- the 64 drawn. That was the right call for the person — a profile carries benefits they
-- are entitled to whether or not they were picked — but it means the project now holds an
-- account for children who never attended anything, with no event date to measure a
-- retention period from. DPIA risk 13.
--
-- Approved duration: DELETE AFTER 24 MONTHS OF NO ACTIVITY. Recorded in
-- 04_Legal/RETENTION-POLICY.md and enforced in lib/retention.ts.
--
-- `retention_runs` has to be rebuilt rather than altered, because the action it accepts is
-- a CHECK constraint and SQLite cannot widen one in place. Same rebuild pattern as 0005.
-- The existing rows are carried over: this table is the evidence that deletions happened,
-- and losing it would defeat its purpose.
ALTER TABLE retention_runs RENAME TO retention_runs_old;

CREATE TABLE retention_runs (
  id            TEXT PRIMARY KEY,
  ran_at        TEXT NOT NULL,
  -- '(platform)' for actions that are not tied to one event. A dormant profile has no
  -- event to belong to, which is precisely why it needed its own rule.
  event_slug    TEXT NOT NULL,
  action        TEXT NOT NULL CHECK (action IN
                  ('purge-medical','clear-check-in-tokens','purge-dormant-profiles')),
  rows_affected INTEGER NOT NULL,
  note          TEXT
);

INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
  SELECT id, ran_at, event_slug, action, rows_affected, note FROM retention_runs_old;

DROP TABLE retention_runs_old;

CREATE INDEX idx_retention_runs_event ON retention_runs (event_slug, ran_at);
