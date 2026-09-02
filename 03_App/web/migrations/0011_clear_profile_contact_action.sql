-- A profile's contact details are now cleared when the registration behind them goes, so
-- the audit trail needs a name for it.
--
-- 2026-09-02. The profile started holding a full name, a mobile and a guardian's name,
-- relationship and mobile, so a returning player would not retype them. Those are the same
-- fields `purgeRegistrations()` deletes at twelve months, and profiles are kept
-- indefinitely — so without this rule the convenience would have quietly cancelled the
-- retention promise. See `purgeStaleProfileContact()`.
--
-- SQLite cannot widen a CHECK constraint in place; the table has to be rebuilt. Same
-- pattern as 0006, 0007 and 0008, and the existing rows are carried over because they ARE
-- the evidence that deletions happened.

ALTER TABLE retention_runs RENAME TO retention_runs_old;

CREATE TABLE retention_runs (
  id            TEXT PRIMARY KEY,
  ran_at        TEXT NOT NULL,
  -- '(platform)' for actions that are not tied to one event.
  event_slug    TEXT NOT NULL,
  action        TEXT NOT NULL CHECK (action IN
                  ('purge-medical','clear-check-in-tokens','purge-dormant-profiles',
                   'delete-account','purge-registrations','clear-profile-contact')),
  rows_affected INTEGER NOT NULL,
  note          TEXT
);

INSERT INTO retention_runs (id, ran_at, event_slug, action, rows_affected, note)
  SELECT id, ran_at, event_slug, action, rows_affected, note FROM retention_runs_old;

DROP TABLE retention_runs_old;

CREATE INDEX idx_retention_runs_event ON retention_runs (event_slug, ran_at);
