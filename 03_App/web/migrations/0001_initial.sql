-- Sikh World Championship — initial schema.
--
-- Replaces the JSON files in .data/. See 00_Docs/DATA-LAYER.md.
--
-- Two things drive the shape here beyond "store the app's types":
--
--  1. RETENTION. 04_Legal/RETENTION-POLICY.md gives different lifetimes to different
--     fields of the SAME record — medical notes die ~30 days after an event while the
--     registration lives ~12 months. The JSON store could only delete whole records, so
--     that policy was unenforceable. Columns make a field-level purge a single UPDATE.
--  2. SAFEGUARDING QUERIES. Age-band segregation and guardian approval are checked on
--     every board read, so they are indexed columns rather than keys inside a JSON blob.
--
-- Answers that vary per event (PSN ID, favourite team) stay in a JSON column: they are
-- defined by each event's own formFields and would otherwise need a migration per event.

CREATE TABLE registrations (
  id                  TEXT PRIMARY KEY,
  event_slug          TEXT NOT NULL,
  division_id         TEXT NOT NULL,
  player_id           TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('confirmed','waitlisted','withdrawn','checked-in')),
  waitlist_position   INTEGER,
  reference           TEXT NOT NULL UNIQUE,
  -- A live credential. RETENTION-POLICY says delete the day after the event, so it is
  -- nullable: the row outlives the token.
  check_in_token      TEXT,
  created_at          TEXT NOT NULL,

  full_name           TEXT NOT NULL,
  dob                 TEXT NOT NULL,
  email               TEXT NOT NULL,
  mobile              TEXT NOT NULL,
  region              TEXT,

  -- Special category data. Purged as a group ~30 days after the event; see
  -- purge_medical_after in the events table comment below.
  medical_conditions  TEXT,   -- JSON array
  medical             TEXT,
  dietary             TEXT,
  accessibility       TEXT,
  medical_purged_at   TEXT,   -- set when the purge runs, so it is provable

  emergency_name      TEXT,
  emergency_relation  TEXT,
  emergency_phone     TEXT,

  guardian_name       TEXT,
  guardian_relation   TEXT,
  guardian_email      TEXT,
  guardian_mobile     TEXT,
  guardian_consent    INTEGER NOT NULL DEFAULT 0,
  guardian_on_site    INTEGER NOT NULL DEFAULT 0,
  guardian_drop_off   INTEGER NOT NULL DEFAULT 0,
  guardian_independent_consent INTEGER NOT NULL DEFAULT 0,
  may_leave_unaccompanied      INTEGER NOT NULL DEFAULT 0,
  guardian_distance   TEXT,
  guardian_photo_consent       INTEGER NOT NULL DEFAULT 0,

  rules_agreed        INTEGER NOT NULL DEFAULT 0,
  account_consent     INTEGER NOT NULL DEFAULT 0,
  photo_consent       INTEGER NOT NULL DEFAULT 0,
  avatar_id           TEXT,

  -- Event-specific answers only. Never guardian or medical fields.
  answers             TEXT NOT NULL DEFAULT '{}'
);

-- Capacity is counted per event+division on every submission.
CREATE INDEX idx_registrations_event_division ON registrations (event_slug, division_id, status);
CREATE INDEX idx_registrations_player ON registrations (player_id);

CREATE TABLE lfg_posts (
  id             TEXT PRIMARY KEY,
  player_id      TEXT NOT NULL,
  -- Copied onto the post, never looked up. A player whose age band changes must not
  -- retroactively expose an old post to the wrong pool.
  age_band       TEXT NOT NULL CHECK (age_band IN ('U16','16+')),
  event_verified INTEGER NOT NULL DEFAULT 0,
  display_name   TEXT NOT NULL,
  avatar_id      TEXT,
  region         TEXT NOT NULL,
  game           TEXT NOT NULL,
  platform       TEXT NOT NULL,
  windows        TEXT NOT NULL,   -- JSON array
  intensity      TEXT NOT NULL,
  note           TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('open','closed','removed'))
);

-- The board query filters on age band first. This index is load-bearing for the
-- segregation invariant being cheap enough to always apply.
CREATE INDEX idx_lfg_band_status ON lfg_posts (age_band, status, expires_at);
CREATE INDEX idx_lfg_player ON lfg_posts (player_id, status);

CREATE TABLE game_requests (
  id                 TEXT PRIMARY KEY,
  post_id            TEXT NOT NULL REFERENCES lfg_posts(id) ON DELETE CASCADE,
  from_player_id     TEXT NOT NULL,
  from_display_name  TEXT NOT NULL,
  from_region        TEXT NOT NULL,
  to_player_id       TEXT NOT NULL,
  -- The requester's guardian, captured at send time so BOTH guardians can be told when
  -- the request is accepted. See play-types.ts.
  from_guardian_email TEXT,
  proposed_window    TEXT NOT NULL,
  note               TEXT NOT NULL,
  status             TEXT NOT NULL CHECK (status IN ('pending','accepted','declined','expired')),
  created_at         TEXT NOT NULL,
  responded_at       TEXT,
  -- Released only on acceptance, to those two players. Deleted with the row at ~90 days.
  from_gamertag      TEXT NOT NULL,
  to_gamertag        TEXT NOT NULL
);

CREATE INDEX idx_requests_to ON game_requests (to_player_id, status);
CREATE INDEX idx_requests_post_from ON game_requests (post_id, from_player_id, status);

CREATE TABLE guardian_approvals (
  id                 TEXT PRIMARY KEY,
  -- One live record per child. Re-asking replaces a pending request rather than stacking
  -- links, so an impatient child cannot fill a parent's inbox — the uniqueness is now the
  -- database's job rather than a filter in application code.
  player_id          TEXT NOT NULL UNIQUE,
  child_display_name TEXT NOT NULL,
  guardian_email     TEXT NOT NULL,
  -- The only thing standing between a stranger and this decision.
  token              TEXT NOT NULL UNIQUE,
  status             TEXT NOT NULL CHECK (status IN ('pending','approved','declined','revoked')),
  created_at         TEXT NOT NULL,
  responded_at       TEXT,
  -- Pending requests expire. Settled ones do not: a guardian needs a permanent way back
  -- in to revoke, and losing that would make the consent meaningless.
  expires_at         TEXT NOT NULL,
  history            TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_guardian_token ON guardian_approvals (token);

CREATE TABLE reports (
  id                  TEXT PRIMARY KEY,
  reporter_id         TEXT NOT NULL,
  target_player_id    TEXT NOT NULL,
  target_display_name TEXT NOT NULL,
  context             TEXT NOT NULL,
  reason              TEXT NOT NULL,
  -- The only free text a player can submit. Moderators only; never shown to the person
  -- reported. Retained ~6 years per RETENTION-POLICY.md.
  detail              TEXT,
  status              TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  assigned_to         TEXT,
  handled_at          TEXT,
  resolution          TEXT
);

CREATE INDEX idx_reports_status ON reports (status, created_at);

CREATE TABLE blocks (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE support_tickets (
  id            TEXT PRIMARY KEY,
  reference     TEXT NOT NULL UNIQUE,
  category      TEXT NOT NULL,
  urgent        INTEGER NOT NULL DEFAULT 0,
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  name          TEXT,
  email         TEXT,
  player_id     TEXT,
  from_guardian INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  assigned_to   TEXT,
  handled_at    TEXT,
  resolution    TEXT
);

-- Urgent tickets jump the moderation queue; this is the index behind that.
CREATE INDEX idx_tickets_urgent ON support_tickets (urgent DESC, status, created_at);
