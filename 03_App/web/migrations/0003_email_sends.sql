-- Record of every email we tried to send.
--
-- src/lib/notify.ts carried this TODO from the start: "record that it was sent so we can
-- prove the notification happened if a guardian ever asks". That is not bookkeeping — the
-- guardian notification is a safeguarding promise made publicly on /safeguarding, and a
-- promise you cannot evidence is one you cannot defend.
--
-- It also makes failure visible. A guardian email that silently fails is the worst case in
-- the whole system: the connection happened, and the one person who should know does not.
-- Rows here with status 'failed' are surfaced in the moderation queue.
--
-- CONTAINS PERSONAL DATA (a guardian's email address). Retention follows the safeguarding
-- record, not the registration — see 04_Legal/RETENTION-POLICY.md. Message bodies are
-- deliberately NOT stored: the template and the context are enough to show what was sent,
-- and keeping the rendered text would duplicate a child's name into another table.

CREATE TABLE email_sends (
  id           TEXT PRIMARY KEY,
  -- Which notification this is, e.g. 'guardian-approval-request'.
  kind         TEXT NOT NULL,
  to_email     TEXT NOT NULL,
  subject      TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('sent','failed')),
  -- Resend's id, so a delivery question can be traced in their dashboard.
  provider_id  TEXT,
  error        TEXT,
  attempts     INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL,
  sent_at      TEXT,
  /**
   * Stops the same notification going twice — a retry, a double-click, or a re-render.
   * Built from the kind plus whatever makes the event unique (an approval id, a request
   * id), never from a timestamp.
   */
  idempotency_key TEXT NOT NULL UNIQUE
);

CREATE INDEX idx_email_sends_status ON email_sends (status, created_at);
CREATE INDEX idx_email_sends_kind ON email_sends (kind, created_at);
