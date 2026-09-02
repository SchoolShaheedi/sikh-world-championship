-- The live bracket.
--
-- Why a table and not a computed value: the bracket is the one thing in this project that
-- has to survive a page reload, a laptop going to sleep and a phone re-joining the venue
-- wifi, in front of a hall of people. It is generated once from the selected players and
-- then only ever updated a score at a time.
--
-- Deliberately holds NO personal data beyond a player id. The names on the screen are
-- read live from `players.handle` at render time, so a moderator correcting a name on
-- /admin changes what the projector shows without touching this table — and so a deleted
-- account cannot leave its name behind in a match row.
CREATE TABLE IF NOT EXISTS matches (
  id            TEXT PRIMARY KEY,
  event_slug    TEXT NOT NULL,
  division_id   TEXT NOT NULL,
  round         INTEGER NOT NULL,
  position      INTEGER NOT NULL,
  -- Player ids, or NULL for an empty slot or a bye. Not a foreign key on purpose: an
  -- erasure request deletes the player, and the match it was part of is a record of the
  -- competition rather than a record about the person. `deleteAccount()` nulls these.
  home_id       TEXT,
  away_id       TEXT,
  home_score    INTEGER,
  away_score    INTEGER,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'live', 'complete')),
  station       INTEGER,
  -- The match this winner feeds into. NULL for the final.
  feeds_into    TEXT,
  updated_at    TEXT NOT NULL
);

-- The read the TV does every few seconds: one event, in bracket order.
CREATE INDEX IF NOT EXISTS idx_matches_event
  ON matches (event_slug, division_id, round, position);
