-- Audit trail for the retention job.
--
-- 04_Legal/RETENTION-POLICY.md requires "a record that the deletion happened (date, who
-- did it, what was covered) — kept even after the data is gone, because you may need to
-- prove you complied". A purge that leaves no trace is indistinguishable from a purge
-- that never ran, and under UK GDPR the burden is on us to show it did.
--
-- Deliberately holds no personal data: counts and timestamps only, so this table itself
-- never needs purging.

CREATE TABLE retention_runs (
  id            TEXT PRIMARY KEY,
  ran_at        TEXT NOT NULL,
  event_slug    TEXT NOT NULL,
  action        TEXT NOT NULL CHECK (action IN ('purge-medical','clear-check-in-tokens')),
  rows_affected INTEGER NOT NULL,
  -- Why it ran, or why it was skipped. Read by a human months later.
  note          TEXT
);

CREATE INDEX idx_retention_runs_event ON retention_runs (event_slug, ran_at);
