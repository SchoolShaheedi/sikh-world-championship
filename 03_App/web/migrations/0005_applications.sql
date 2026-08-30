-- Registration becomes an APPLICATION.
--
-- Filling in the form no longer secures a place. Applicants are checked for eligibility
-- and safeguarding, then places are drawn — referred applicants first, the rest at random.
-- A profile is created only on selection, not on submission.
--
-- Two things this changes that are easy to miss:
--
--  * There is no waitlist any more. A waitlist position ("you are number 7") also leaked
--    how many people had applied, which the owner asked not to reveal. Both problems
--    disappear with the concept.
--  * `check_in_token` is issued on SELECTION, not on submission. It is the credential that
--    marks someone present; handing it to everyone who fills in a form would make it
--    meaningless.
--
-- SQLite cannot alter a CHECK constraint, so the table is rebuilt. Existing rows are
-- carried over with 'confirmed' mapped to 'selected' — there are none in production, but a
-- migration that silently drops data is not one worth writing.

ALTER TABLE registrations RENAME TO registrations_old;

CREATE TABLE registrations (
  id                  TEXT PRIMARY KEY,
  event_slug          TEXT NOT NULL,
  division_id         TEXT NOT NULL,
  -- Null until selected: an applicant has no account yet.
  player_id           TEXT,
  status              TEXT NOT NULL CHECK (status IN
                        ('applied','selected','not-selected','withdrawn','checked-in')),
  reference           TEXT NOT NULL UNIQUE,
  check_in_token      TEXT,
  created_at          TEXT NOT NULL,
  -- When the draw decided this application, and which draw it was.
  decided_at          TEXT,
  draw_id             TEXT,

  full_name           TEXT NOT NULL,
  dob                 TEXT NOT NULL,
  email               TEXT NOT NULL,
  mobile              TEXT NOT NULL,
  region              TEXT,

  /**
   * Referral source. NOT a religion field — see src/data/referral-orgs.ts. Used for draw
   * order and nothing else.
   */
  referral_org        TEXT,

  medical_conditions  TEXT,
  medical             TEXT,
  dietary             TEXT,
  accessibility       TEXT,
  medical_purged_at   TEXT,

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
  photo_consent       INTEGER NOT NULL DEFAULT 0,
  avatar_id           TEXT,
  answers             TEXT NOT NULL DEFAULT '{}'
);

INSERT INTO registrations (
  id, event_slug, division_id, player_id, status, reference, check_in_token, created_at,
  full_name, dob, email, mobile, region,
  medical_conditions, medical, dietary, accessibility, medical_purged_at,
  emergency_name, emergency_relation, emergency_phone,
  guardian_name, guardian_relation, guardian_email, guardian_mobile,
  guardian_consent, guardian_on_site, guardian_drop_off,
  guardian_independent_consent, may_leave_unaccompanied, guardian_distance,
  guardian_photo_consent, rules_agreed, photo_consent, avatar_id, answers
)
SELECT
  id, event_slug, division_id, player_id,
  CASE status
    WHEN 'confirmed'  THEN 'selected'
    WHEN 'waitlisted' THEN 'applied'
    ELSE status
  END,
  reference, check_in_token, created_at,
  full_name, dob, email, mobile, region,
  medical_conditions, medical, dietary, accessibility, medical_purged_at,
  emergency_name, emergency_relation, emergency_phone,
  guardian_name, guardian_relation, guardian_email, guardian_mobile,
  guardian_consent, guardian_on_site, guardian_drop_off,
  guardian_independent_consent, may_leave_unaccompanied, guardian_distance,
  guardian_photo_consent, rules_agreed, photo_consent, avatar_id, answers
FROM registrations_old;

DROP TABLE registrations_old;

CREATE INDEX idx_registrations_event_status ON registrations (event_slug, status);
CREATE INDEX idx_registrations_player ON registrations (player_id);
CREATE INDEX idx_registrations_referral ON registrations (event_slug, referral_org);

-- Every draw, recorded. A selection process people cannot inspect is one they will not
-- trust — and "how were places decided?" is a question a community event must be able to
-- answer months later.
CREATE TABLE draws (
  id             TEXT PRIMARY KEY,
  event_slug     TEXT NOT NULL,
  ran_at         TEXT NOT NULL,
  -- The random seed used, so the same draw can be recomputed and shown to be honest.
  seed           TEXT NOT NULL,
  places         INTEGER NOT NULL,
  applicants     INTEGER NOT NULL,
  referred_taken INTEGER NOT NULL,
  general_taken  INTEGER NOT NULL,
  note           TEXT
);
