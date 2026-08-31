-- Record a MANUAL deletion in the same audit trail as an automatic one.
--
-- /admin can now delete an account outright — a test account after a rehearsal, or a real
-- erasure request. A deletion that leaves no trace that it happened is how you end up
-- unable to answer "did you delete it?", which is the one question a subject access
-- request always asks. So manual deletions go in `retention_runs` alongside the nightly
-- job, with the reason in `note`.
--
-- SQLite cannot widen a CHECK constraint in place; the table has to be rebuilt. Same
-- pattern as 0006, and the existing rows are carried over because they ARE the evidence.

ALTER TABLE retention_runs RENAME TO retention_runs_old;

CREATE TABLE retention_runs (
  id            TEXT PRIMARY KEY,
  ran_at        TEXT NOT NULL,
  -- '(platform)' for actions that are not tied to one event.
  event_slug    TEXT NOT NULL,
  action        TEXT NOT NULL CHECK (action IN
                  ('purge-medical','clear-check-in-tokens','purge-dormant-profiles',
                   'delete-account')),
  rows_affected INTEGER NOT NULL,
  note          TEXT
);

INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
  SELECT id, ran_at, event_slug, action, rows_affected, note FROM retention_runs_old;

DROP TABLE retention_runs_old;

CREATE INDEX idx_retention_runs_event ON retention_runs (event_slug, ran_at);
