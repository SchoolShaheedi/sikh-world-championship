-- The details a returning player should not have to type again.
--
-- WHY (2026-09-02, team decision): entering a second event asked for twenty-odd fields
-- that had already been given once. A profile held almost nothing — a first name, an
-- email, a date of birth, a region, an avatar — so everything else was retyped.
--
-- WHAT THIS DOES NOT ADD, and will not:
--   * medical notes, allergies, accessibility — per-event by design, purged 30 days after
--     each event, and a stale allergy shown as already-answered is worse than a blank box
--   * any consent — a consent given for October is not a consent for next March
--
-- THE CONSEQUENCE, HANDLED IN CODE, NOT IGNORED. `purgeRegistrations()` deletes the
-- registration row twelve months after an event, and that row is where the full name, the
-- mobile and the guardian's contact details used to live. Copying them onto a profile that
-- is kept indefinitely would quietly cancel that promise. So the same nightly job clears
-- these five columns for anybody with no registration left — see `purgeStaleProfileContact`
-- in src/lib/retention.ts. The profile survives; the contact details do not outlive the
-- event they were collected for.
ALTER TABLE players ADD COLUMN full_name TEXT;
ALTER TABLE players ADD COLUMN mobile TEXT;
ALTER TABLE players ADD COLUMN guardian_name TEXT;
ALTER TABLE players ADD COLUMN guardian_relation TEXT;
ALTER TABLE players ADD COLUMN guardian_mobile TEXT;
