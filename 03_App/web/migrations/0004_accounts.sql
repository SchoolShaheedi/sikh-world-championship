-- Player accounts.
--
-- AUTH APPROACH: passwordless magic links, D1-backed sessions, no third-party library.
--
-- That is a deliberate choice against the usual "never roll your own auth", so the
-- reasoning is written down:
--
--  * There are no passwords to store, hash, reset or leak. That removes most of what
--    makes auth dangerous.
--  * A session token is a 256-bit random bearer value looked up in this table — not a
--    signed cookie — so there is no signature scheme to get wrong, and revocation is a
--    DELETE.
--  * The remaining surface is small and testable: single-use tokens, short expiry,
--    constant response regardless of whether an address exists.
--  * The decisive reason: under-16 accounts are guardian-linked, and no off-the-shelf
--    library models that. Adopting one would mean fighting its user model on exactly the
--    part that matters most here.
--
-- Revisit if this ever needs OAuth, MFA or password login. Any of those and a library
-- becomes the right answer.

CREATE TABLE players (
  id            TEXT PRIMARY KEY,
  -- Lowercased at write time. The identity a magic link is sent to.
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  -- Copied from the registration, and the basis of every segregation decision. Stored
  -- rather than derived from date of birth so a birthday cannot silently move a child
  -- into the adult pool mid-event.
  age_band      TEXT NOT NULL CHECK (age_band IN ('U16','16+')),
  date_of_birth TEXT NOT NULL,
  region        TEXT,
  avatar_id     TEXT,
  gamertag      TEXT,
  -- Attended an SWC event and was checked in by a volunteer.
  event_verified INTEGER NOT NULL DEFAULT 0,
  is_moderator  INTEGER NOT NULL DEFAULT 0,
  /**
   * Under-16s only. Never taken from a form the child can fill in — it comes from the
   * registration record, which is what makes the consent mechanism more than theatre.
   */
  guardian_email TEXT,
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT
);

CREATE INDEX idx_players_email ON players (email);

-- Magic-link tokens. Single use, short lived.
CREATE TABLE auth_tokens (
  token      TEXT PRIMARY KEY,
  player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  -- Set the moment it is redeemed. A token that has been used is dead, so a link
  -- forwarded, cached by a scanner, or left in an inbox cannot be replayed.
  used_at    TEXT
);

CREATE INDEX idx_auth_tokens_player ON auth_tokens (player_id);

-- Sessions. The cookie value IS the token; it is looked up here on every request.
CREATE TABLE sessions (
  token      TEXT PRIMARY KEY,
  player_id  TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE INDEX idx_sessions_player ON sessions (player_id);
