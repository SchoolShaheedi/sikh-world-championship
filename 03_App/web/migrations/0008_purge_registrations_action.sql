-- The 12-month registration rule now runs, so the audit trail needs a name for it.
--
-- Round 46. Until now nothing deleted a registration: the medical fields went at 30 days
-- and the check-in token the day after, but the applicant's name, date of birth, email and
-- mobile were held with no end date (DPIA risk 14). The duration was the blocker, not the
-- code; it is 12 months from the event date, decided 2026-08-31 and written into
-- 04_Legal/RETENTION-POLICY.md without brackets.
--
-- SQLite cannot widen a CHECK constraint in place; the table has to be rebuilt. Same
-- pattern as 0006 and 0007, and the existing rows are carried over because they ARE the
-- evidence that deletions happened.

ALTER TABLE retention_runs RENAME TO retention_runs_old;

CREATE TABLE retention_runs (
  id            TEXT PRIMARY KEY,
  ran_at        TEXT NOT NULL,
  -- '(platform)' for actions that are not tied to one event.
  event_slug    TEXT NOT NULL,
  action        TEXT NOT NULL CHECK (action IN
                  ('purge-medical','clear-check-in-tokens','purge-dormant-profiles',
                   'delete-account','purge-registrations')),
  rows_affected INTEGER NOT NULL,
  note          TEXT
);

INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
  SELECT id, ran_at, event_slug, action, rows_affected, note FROM retention_runs_old;

DROP TABLE retention_runs_old;

CREATE INDEX idx_retention_runs_event ON retention_runs (event_slug, ran_at);
