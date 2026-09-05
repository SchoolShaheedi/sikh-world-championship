-- Two things that were being carried by hand: who does not want to be photographed, and
-- who offered to help. Both arrived as support messages, which is a filing cabinet made
-- of somebody's memory of reading their inbox.

-- 1. A PHOTOGRAPHY OBJECTION, RECORDED AGAINST THE ENTRY.
--
-- WHY (DPIA risk 18). Photography is a CONDITION of entering, decided by the team in
-- round 47 — so `photo_consent` is true on every row and the useful list is the opposite
-- one: the people who told us not to. Until now that arrived as a support ticket, and the
-- "brief the photographers" job on /admin said in as many words that the list "has to be
-- carried by hand". A do-not-film list held in one person's head is the control failing
-- quietly on the one day it is needed.
--
-- WHAT THESE HOLD: that an objection was recorded, when, and which moderator recorded it.
--
-- WHAT THERE IS DELIBERATELY NO COLUMN FOR: the reason, or the scope ("not on Instagram",
-- "not their face"). Two arguments, and they point the same way. A reason is a free-text
-- note about a child, written by a volunteer, living in a table with no retention rule of
-- its own — and it would be read by whoever is holding a camera. And a scope a
-- photographer has to interpret at a distance of twenty metres is not a control; the
-- honest instruction is "do not photograph this person", which is what a list of names
-- says. Anything more nuanced stays in the support ticket it arrived in, where a
-- moderator answers it in words.
--
-- NOT A REPLACEMENT FOR `photo_consent`, which stays exactly as it is: it records what
-- the person was told when they entered. An objection is what happened afterwards, and
-- overwriting the first with the second would lose the fact that the condition was stated.
--
-- RETENTION: with the registration, deleted 12 months after the event by
-- `purgeRegistrations()`. No clock of its own — it is a fact about one event's entry.
ALTER TABLE registrations ADD COLUMN photo_objected_at TEXT;
ALTER TABLE registrations ADD COLUMN photo_objected_by TEXT;

-- 2. VOLUNTEERS.
--
-- WHY A TABLE. /volunteer listed the seven jobs and then sent people to the support form,
-- so an offer of help arrived as a paragraph of prose that a moderator had to read,
-- classify and remember. A 64-player event needs about fifteen people on the floor and
-- every one of them works with children: the three things that decide whether somebody
-- can be given a job — are they DBS checked, can they give the whole day, and does
-- anybody vouch for them — were exactly the three things the form did not ask.
--
-- THIS IS ADULTS' DATA, AND IT IS NEW. Everything else in this database is about a child
-- or the adult responsible for one. These are volunteers, and two rows here are worth
-- naming out loud:
--
--   * `over_18` — a declaration, not a check. Under-18s are not signed up as volunteers
--     for an event for under-18s; the form states it and this column records that they
--     said so.
--   * `referee_*` — the details of a THIRD PARTY who has not visited this site and has
--     not agreed to anything. That is the most intrusive thing on the form and it is the
--     reason the form says, in the box itself, to tell them first. Minimum viable: a
--     name, how they know the person, and ONE way to reach them. No address, no
--     organisation, no second referee.
--
-- WHAT THERE IS DELIBERATELY NO COLUMN FOR: a DBS certificate number, its issue date, or
-- anything about what a check found. `dbs` holds one of three words — yes, no, not sure —
-- because the only decision it feeds is "do we need to arrange one". A certificate number
-- is criminal-records-adjacent data that we would be storing for no purpose we can name,
-- and the moment it is in a column somebody will treat this table as the DBS register. It
-- is not. The paper register lives with the safeguarding lead.
--
-- RETENTION: NOT SET, deliberately, and this is not an oversight. Invariant 9 — a
-- duration is decided by the team before the code that enforces it is written, and no
-- figure for volunteer records exists yet in 04_Legal/RETENTION-POLICY.md. So nothing
-- deletes these automatically, /admin/volunteers says so on the page, and a moderator can
-- delete a row at any time. The proposed rule is in the policy in brackets, waiting on the
-- decision, exactly as the dormant-profile rule was. Do not add an automatic purge here
-- until the brackets come off.
CREATE TABLE IF NOT EXISTS volunteers (
  id             TEXT PRIMARY KEY,
  -- Short and human, quoted back in the acknowledgement email so a follow-up has a handle.
  reference      TEXT NOT NULL UNIQUE,
  event_slug     TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  email          TEXT NOT NULL,
  mobile         TEXT NOT NULL,
  -- JSON array of role ids from src/lib/volunteer-types.ts. Ids, not labels: the label is
  -- copy and will be reworded, and a stored label is a copy change that silently rewrites
  -- history.
  roles          TEXT NOT NULL,
  availability   TEXT NOT NULL CHECK (availability IN ('all-day', 'morning', 'afternoon')),
  dbs            TEXT NOT NULL CHECK (dbs IN ('yes', 'no', 'not-sure')),
  over_18        INTEGER NOT NULL DEFAULT 0,
  referee_name     TEXT NOT NULL,
  referee_relation TEXT NOT NULL,
  referee_contact  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'accepted', 'declined')),
  created_at     TEXT NOT NULL,
  decided_at     TEXT,
  -- A moderator's player id, the same shape as `checked_in_by`. Never a name.
  decided_by     TEXT
);

CREATE INDEX IF NOT EXISTS idx_volunteers_event
  ON volunteers (event_slug, status, created_at);
