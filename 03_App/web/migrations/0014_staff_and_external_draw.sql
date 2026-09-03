-- Two things, both about who is allowed to do what.
--
-- ============================================================================
-- 1. A SECOND, SMALLER ROLE: `is_desk`
-- ============================================================================
--
-- WHY (2026-09-03): `is_moderator` is one flag that grants everything — safeguarding
-- disclosures, every applicant's name, date of birth, mobile and guardian contact, the
-- draw, and account deletion. It has deliberately had no button in the app since round 24
-- because granting all of that is a decision somebody should make once, on purpose.
--
-- Then check-in shipped and needed two or three volunteers on a door. Under one flag,
-- staffing the desk means handing out the keys to the safeguarding queue. The answer is
-- not to weaken the moderator grant; it is to stop the desk needing it.
--
-- `is_desk` grants the arrival desk and nothing else: /admin/checkin, the slips, and the
-- actions behind them. No /admin, no /moderation, no draw, no deletion. A moderator is
-- implicitly desk staff, so the flag is only ever set on somebody who is NOT a moderator.
--
-- This is what makes a grant button safe. Desk access is now a small enough thing to hand
-- out from a page; moderator remains large, and the page treats the two differently.
ALTER TABLE players ADD COLUMN is_desk INTEGER NOT NULL DEFAULT 0;

-- Who granted what, to whom, and when.
--
-- Access grants are now clickable, so they need the same treatment as deletions in
-- `retention_runs`: "somebody made them a moderator" is not an answer. The actor's email
-- is stored rather than only their id, because the useful version of this record is the
-- one that still reads as a sentence after the account has gone.
--
-- Holds the emails of STAFF acting in an official capacity, never a child's. Retention is
-- in 04_Legal/RETENTION-POLICY.md: "who had access to children's data on 3 October 2026"
-- is exactly the question a later investigation asks, so it is kept long, not purged with
-- the event.
CREATE TABLE staff_grants (
  id           TEXT PRIMARY KEY,
  at           TEXT NOT NULL,
  actor_id     TEXT NOT NULL,
  actor_email  TEXT NOT NULL,
  target_email TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('moderator','desk')),
  -- 1 = granted, 0 = revoked. Revocations matter more than grants.
  granted      INTEGER NOT NULL,
  note         TEXT
);
CREATE INDEX idx_staff_grants_at ON staff_grants(at DESC);

-- ============================================================================
-- 2. THE NUMBERED LIST FOR A THIRD-PARTY DRAW: `draw_ballots`
-- ============================================================================
--
-- WHY (2026-09-03, team decision): places are to be drawn by an outside random service so
-- the draw can be witnessed rather than trusted. `src/lib/draw.ts` still exists and is
-- still honest — every seeded draw is recomputable — but "you can recompute it from a
-- seed" convinces a developer and not a hall.
--
-- HOW IT STAYS AUDITABLE, which is the whole point. A number is only meaningful if the
-- mapping from number to person was fixed BEFORE the draw. So the list is LOCKED first:
-- one row per applicant, numbered within its pool, with the moderator and the moment
-- recorded. The draw then happens somewhere else, and the winning numbers are pasted back
-- against a mapping that cannot have moved.
--
-- NO PERSONAL DATA LEAVES US, AND NONE IS IN HERE. The third-party service is given the
-- numbers 1..N and nothing else — no names, no ages, no references. That means no
-- processor agreement, no children's names in somebody else's logs, and a picker that
-- could not favour a name if it wanted to. This table holds registration ids only, the
-- same rule as `matches`.
--
-- `auto` is for the referred pool. Referred applicants take priority for all places, so
-- while there is room they get one with no draw at all — which also means AT MOST ONE POOL
-- IS EVER PARTLY FILLED, and therefore there is only ever one numbered list to hand over.
CREATE TABLE draw_ballots (
  list_id         TEXT NOT NULL,
  event_slug      TEXT NOT NULL,
  pool            TEXT NOT NULL CHECK (pool IN ('referred','general')),
  -- 1-based within the pool. This is the number given to the draw service.
  number          INTEGER NOT NULL,
  registration_id TEXT NOT NULL,
  -- 1 when this applicant gets a place without being drawn (referred, room available).
  auto            INTEGER NOT NULL DEFAULT 0,
  locked_at       TEXT NOT NULL,
  locked_by       TEXT NOT NULL,
  PRIMARY KEY (list_id, pool, number)
);
CREATE INDEX idx_draw_ballots_event ON draw_ballots(event_slug, list_id);

-- The evidence for a draw run somewhere else.
--
-- `seed` stays NOT NULL and holds 'external' for these, because a seed is meaningless when
-- we did not generate the randomness. What replaces it is `winners`: the pasted result,
-- stored VERBATIM, unparsed. A tidied copy of the numbers would be our interpretation of
-- the evidence rather than the evidence.
ALTER TABLE draws ADD COLUMN method TEXT;      -- 'seeded' (or NULL, historic) | 'external'
ALTER TABLE draws ADD COLUMN service TEXT;     -- what the moderator typed, e.g. random.org
ALTER TABLE draws ADD COLUMN winners TEXT;     -- exactly what came back, as pasted
ALTER TABLE draws ADD COLUMN ballot_list TEXT; -- the list_id the numbers refer to
ALTER TABLE draws ADD COLUMN drawn_pool TEXT;  -- which pool the numbers were for
