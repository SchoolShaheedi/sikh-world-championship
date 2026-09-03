#!/usr/bin/env node
/**
 * Fill the LOCAL database with enough invented people to walk the whole thing through.
 *
 * WHY THIS EXISTS. Most of this app cannot be judged from a screenshot. The arrival desk,
 * the external draw, the projector, the moderation queue and the deletion controls are all
 * things that have to be *used*, in order, with plausible data in front of you — and the
 * honest way to get that data is sixty-four real registrations, which on 3 September do not
 * exist and must never be invented in production.
 *
 * STAGES, BECAUSE A FLOW IS A SEQUENCE AND NOT A STATE. Handing you the finished tournament
 * would leave every step that produces it untested. Each stage puts the database where it
 * would genuinely be at one moment in the run-up, and then STOPS, so the next thing that
 * happens is you doing it in the app:
 *
 *   node scripts/seed-local.mjs entries    # entries are open, nothing decided
 *   node scripts/seed-local.mjs places     # ... and a draw has already filled 48 places
 *   node scripts/seed-local.mjs gameday    # ... and the desk has been running an hour
 *   node scripts/seed-local.mjs            # all of the above, plus the extras below
 *   node scripts/seed-local.mjs --clear    # remove every trace of it
 *
 * Later stages include the earlier ones, so one command gets you to any point. `extras` is
 * the orthogonal stuff with no place on that timeline — staff accounts, the moderation
 * queue, the Looking For Game board, a dormant profile.
 *
 * IT CANNOT BE POINTED AT PRODUCTION. The wrangler command it builds always carries
 * --local, `--remote` is refused, and every row it writes is prefixed so --clear finds all
 * of them and nothing else:
 *
 *   players.email      local-*@example.com     (example.com can never receive mail — RFC 2606)
 *   registrations.ref  LOCAL-*
 *   ids                local-*
 *
 * Replaces seed-local-bracket.mjs, which did the same job for eight players and the
 * projector alone.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SLUG = "sikh-fc-27";
const CAPACITY = 64;
const NOW = new Date().toISOString();

/* ------------------------------------------------------------------ arguments */

if (process.argv.includes("--remote")) {
  console.error("No. This script is local-only — that is the point of it.");
  process.exit(1);
}

const STAGES = ["entries", "places", "gameday", "extras"];
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const clear = process.argv.includes("--clear");
const stage = args[0] ?? "extras";

if (!clear && !STAGES.includes(stage)) {
  console.error(`Unknown stage "${stage}". One of: ${STAGES.join(", ")}`);
  process.exit(1);
}
/** Stages are cumulative: asking for `gameday` runs `entries` and `places` first. */
const upTo = STAGES.indexOf(stage);
const wants = (s) => !clear && upTo >= STAGES.indexOf(s);

/* ------------------------------------------------------------------ SQL helpers */

const q = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const insert = (table, row) =>
  `INSERT INTO ${table} (${Object.keys(row).join(", ")}) VALUES (${Object.values(row)
    .map(q)
    .join(", ")});`;

/* ------------------------------------------------------------------ the people */

const FIRST = [
  "Amritpal", "Arjan", "Baljit", "Charanjit", "Daljit", "Ekamjot", "Gagandeep", "Gurleen",
  "Harjot", "Inderpreet", "Jasleen", "Jaspreet", "Kiranjit", "Lakhbir", "Manveer", "Navjot",
  "Onkar", "Parminder", "Prabhjot", "Rajveer", "Ravinder", "Sahibjot", "Simranjit", "Sukhdeep",
  "Tejinder", "Updesh", "Veerpal", "Yuvraj", "Amandeep", "Bhupinder", "Chanpreet", "Deepinder",
  "Eshan", "Fatehjot", "Gurbaksh", "Harpreet", "Ishar", "Jagdeep", "Karanveer", "Lovepreet",
  "Mandeep", "Nirvair", "Pavandeep", "Rupinder", "Satnam", "Tarandeep", "Vikramjit", "Zorawar",
];

/**
 * Ages spread across the whole eligible range, 12 to 25 on the day.
 *
 * Not decoration. Every supervision rule in the app hangs off an age: the guardian block,
 * the "parent stays on site" line, the 16–17 leaving permission, the U18 badge on the desk.
 * Forty-eight identical twenty-year-olds would exercise none of them, which is how the row
 * that matters most on the day is the one nobody ever saw rendered.
 *
 * Birthdays are all in March so the age on 3 October is exactly the age intended — a
 * December birthday would make somebody a year younger than this table claims and quietly
 * put them in a different tier than the comment says.
 */
const AGES = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
const dobFor = (i) => {
  const age = AGES[i % AGES.length];
  const day = String((i % 27) + 1).padStart(2, "0");
  return { age, dob: `${2026 - age}-03-${day}` };
};

/** Everyone the `places` stage gives a place to. Read by `orgFor` below. */
const SELECTED = 48;

const ORGS = [
  "Shaheedi Bunga", "Devanhaar", "Basics of Sikhi", "Sikh Helpline", "Uni Sikh Society",
];
const NONE = "Nobody — I found it myself";
const OTHER = "Another organisation";

/**
 * Who referred whom, arranged so BOTH branches of the draw can be seen in the browser.
 *
 * Referred applicants take priority for every place, so normally they all fit and the
 * general pool is the one drawn. The other branch — more referred applicants than places
 * left, so the referred pool is the contested one and the general pool is not drawn at all
 * — only appears when places are scarce. `splitPools()` has unit tests on that boundary,
 * but a branch that can never be reached through the UI is a branch nobody has looked at.
 *
 * So: the first 48 (the ones the `places` stage selects) are a normal mix, and the last 24
 * are mostly referred. After `places` there are 16 places left and 20 referred applicants
 * waiting for them, and locking a list then shows the referred pool being drawn.
 */
const orgFor = (i) => {
  // The last 24 are mostly referred, so after `places` there are more of them than there
  // are places left and the referred pool becomes the contested one.
  if (i >= SELECTED) return i % 6 === 0 ? NONE : ORGS[i % ORGS.length];
  // The first 48 are about a third referred, which leaves a first draw worth watching:
  // enough places taken automatically to show the priority working, and plenty still
  // drawn. Make this much denser and the referred pool swallows the whole event and the
  // first draw is over nothing.
  if (i % 11 === 0) return OTHER;
  if (i % 5 === 0) return ORGS[i % ORGS.length];
  return NONE;
};

const REGIONS = [
  "Leicester", "Birmingham", "Southall", "Wolverhampton", "Coventry", "Slough",
  "Derby", "Nottingham", "Bradford", "Glasgow", "Kent", "Manchester",
];

const AVATARS = [
  "kesri-1", "navy-1", "white-1", "royal-1", "maroon-1", "black-1", "gold-1", "green-1",
  "patka-1", "patka-2", "patka-3", "patka-4", "patka-5", "patka-6", "patka-7", "patka-8",
];

const SKILL = ["First time competing", "Casual player", "Play a lot", "Very competitive"];
const TEAMS = ["Arsenal", "Liverpool", "Man City", "Chelsea", "Barcelona", "Real Madrid", ""];

/**
 * Medical notes on a handful of people, and nothing on the rest.
 *
 * The first aider's job on the day is to read these before the first match. A seed with no
 * medical rows leaves that page looking finished when it has never had anything in it, and
 * a seed with a condition against every name would be nothing like the real distribution.
 */
const MEDICAL = {
  2:  { conditions: ["Asthma"], detail: "Blue inhaler in his bag. Knows how to use it." },
  9:  { conditions: ["Severe allergy (incl. anaphylaxis)"], detail: "Peanuts. Carries two EpiPens — one with him, one with his mum. No langar containing nuts." },
  17: { conditions: ["Epilepsy or seizures"], detail: "Photosensitive. Needs a station away from the flashing screens near the stage." },
  23: { conditions: ["Diabetes"], detail: "Type 1. Will need a break to test and eat, roughly every two hours." },
  31: { conditions: ["Additional needs or learning disability"], detail: "Autistic. Fine with the noise but needs to know what happens next — tell him before his match is called." },
  40: { conditions: ["None"], detail: null },
};
const ACCESS = {
  17: "Please put him at an end station, not in the middle of a row.",
  35: "Wheelchair user. Needs a station he can pull up to and a clear route to the toilets.",
};

const ARRIVED = 31;
/** Of those who arrived, the ones a volunteer has not yet checked a date of birth for. */
const NO_DOB_CHECK = new Set([3, 11, 19, 27]);

const COUNT = 72;

function person(i) {
  const first = FIRST[i % FIRST.length];
  // Alternating rather than chosen per name: this is invented data and guessing which of
  // Singh or Kaur belongs to a first name is a guess with nothing riding on it.
  const last = i % 2 === 0 ? "Singh" : "Kaur";
  const { age, dob } = dobFor(i);
  const suffix = i >= FIRST.length ? ` ${Math.floor(i / FIRST.length) + 1}` : "";
  const fullName = `${first}${suffix} ${last}`;
  return {
    i,
    fullName,
    // What the projector and the slips show. Built the way resolveHandle() builds it:
    // first name plus last initial, never a surname.
    handle: `${first}${suffix} ${last[0]}.`,
    displayName: first,
    age,
    dob,
    band: age < 16 ? "U16" : "16+",
    email: `local-${i}@example.com`,
    mobile: `07700900${String(100 + i).slice(-3)}`,
    region: REGIONS[i % REGIONS.length],
    org: orgFor(i),
    avatar: AVATARS[i % AVATARS.length],
    skill: SKILL[i % SKILL.length],
    team: TEAMS[i % TEAMS.length],
    ownController: i % 4 === 0,
    medical: MEDICAL[i] ?? null,
    access: ACCESS[i] ?? null,
  };
}

const PEOPLE = Array.from({ length: COUNT }, (_, i) => person(i));

/**
 * Three rows that exist to be deleted.
 *
 * The team asked whether test entries and bogus ones can be removed before the draw. They
 * can — /admin → Entries → Show all → Delete — but a control nobody has pressed is a
 * control nobody knows the shape of, so there is something here to press it on: an obvious
 * rehearsal row, a keyboard-mash row, and the same child entered twice from two addresses,
 * which is the one that actually turns up and the one that is hard to spot in a list.
 */
const BOGUS = [
  { fullName: "Test Test", email: "local-900@example.com", note: "rehearsal row" },
  { fullName: "asdfgh asdfgh", email: "local-901@example.com", note: "keyboard mash" },
  {
    fullName: PEOPLE[5].fullName,
    email: "local-902@example.com",
    note: "duplicate of entry LOCAL-005",
  },
];

/* ------------------------------------------------------------------ statements */

const sql = [];

/** Everything this script has ever written, in dependency order. Also the whole of --clear. */
const WIPE = [
  `DELETE FROM matches WHERE event_slug = ${q(SLUG)};`,
  `DELETE FROM draw_ballots WHERE event_slug = ${q(SLUG)};`,
  `DELETE FROM draws WHERE id LIKE 'local-%';`,
  `DELETE FROM game_requests WHERE id LIKE 'local-%';`,
  `DELETE FROM lfg_posts WHERE id LIKE 'local-%';`,
  `DELETE FROM reports WHERE id LIKE 'local-%';`,
  `DELETE FROM support_tickets WHERE id LIKE 'local-%';`,
  `DELETE FROM guardian_approvals WHERE id LIKE 'local-%';`,
  `DELETE FROM staff_grants WHERE id LIKE 'local-%';`,
  `DELETE FROM email_sends WHERE to_email LIKE 'local-%@example.com';`,
  `DELETE FROM registrations WHERE reference LIKE 'LOCAL-%';`,
  `DELETE FROM sessions WHERE player_id LIKE 'local-%';`,
  `DELETE FROM auth_tokens WHERE player_id LIKE 'local-%';`,
  `DELETE FROM players WHERE email LIKE 'local-%@example.com';`,
];
sql.push(...WIPE);

/**
 * The two staff accounts, in every stage.
 *
 * Not part of the timeline — you would grant a volunteer desk access days beforehand — and
 * they are what makes /admin/people testable at all: you cannot try revoking a moderator
 * with only your own account, because the app correctly refuses to let you remove your own
 * moderator role or the last one.
 */
function staff() {
  const base = (id, email, name) => ({
    id,
    email,
    display_name: name,
    age_band: "16+",
    date_of_birth: "1900-01-01",
    created_at: NOW,
  });
  return [
    insert("players", {
      ...base("local-staff-mod", "local-moderator@example.com", "Second Moderator"),
      is_moderator: 1,
    }),
    insert("players", {
      ...base("local-staff-desk", "local-desk@example.com", "Desk Volunteer"),
      is_desk: 1,
      last_seen_at: NOW,
    }),
    insert("players", {
      // Never signed in, so /admin/people shows the amber "has never signed in" warning —
      // which exists because an invitation goes to an address somebody typed.
      ...base("local-staff-new", "local-newdesk@example.com", "Newdesk"),
      is_desk: 1,
    }),
  ];
}
if (!clear) sql.push(...staff());

/* --- STAGE 1: entries -------------------------------------------------------- */

function registrationRow(p, over = {}) {
  const minor = p.age < 18;
  const under16 = p.age < 16;
  return {
    id: `local-r${p.i}`,
    event_slug: SLUG,
    division_id: "open",
    player_id: `local-p${p.i}`,
    status: "applied",
    reference: `LOCAL-${String(p.i).padStart(3, "0")}`,
    check_in_token: null,
    created_at: new Date(Date.now() - (COUNT - p.i) * 3600_000).toISOString(),
    full_name: p.fullName,
    dob: p.dob,
    email: p.email,
    mobile: p.mobile,
    region: p.region,
    referral_org: p.org,
    medical_conditions: p.medical ? JSON.stringify(p.medical.conditions) : null,
    medical: p.medical?.detail ?? null,
    accessibility: p.access,
    emergency_name: minor ? `${p.displayName}'s mum` : "Next of kin",
    emergency_relation: minor ? "Mother" : "Sibling",
    emergency_phone: `07700901${String(100 + p.i).slice(-3)}`,
    guardian_name: minor ? `Guardian of ${p.displayName}` : null,
    guardian_relation: minor ? "Mother" : null,
    guardian_email: minor ? `local-guardian-${p.i}@example.com` : null,
    guardian_mobile: minor ? `07700902${String(100 + p.i).slice(-3)}` : null,
    guardian_consent: minor,
    // Under 16 means a parent stays at the venue all day. 16–17 may leave alone only if
    // their guardian said so, and here every third one did — so the desk's end-of-day list
    // has both answers in it.
    guardian_on_site: under16,
    guardian_independent_consent: !under16 && minor,
    may_leave_unaccompanied: !under16 && minor && p.i % 3 === 0,
    guardian_photo_consent: minor,
    rules_agreed: 1,
    photo_consent: 1,
    avatar_id: p.avatar,
    answers: JSON.stringify({
      skill: p.skill,
      ...(p.team ? { favouriteTeam: p.team } : {}),
      ...(p.ownController ? { ownController: true } : {}),
    }),
    ...over,
  };
}

if (wants("entries")) {
  for (const p of PEOPLE) {
    sql.push(
      insert("players", {
        id: `local-p${p.i}`,
        email: p.email,
        display_name: p.displayName,
        age_band: p.band,
        date_of_birth: p.dob,
        region: p.region,
        avatar_id: p.avatar,
        handle: p.handle,
        full_name: p.fullName,
        mobile: p.mobile,
        guardian_email: p.age < 18 ? `local-guardian-${p.i}@example.com` : null,
        guardian_name: p.age < 18 ? `Guardian of ${p.displayName}` : null,
        guardian_relation: p.age < 18 ? "Mother" : null,
        guardian_mobile: p.age < 18 ? `07700902${String(100 + p.i).slice(-3)}` : null,
        created_at: NOW,
        // Most people never come back after registering. A few have signed in since, which
        // is what the dormancy sweep and the profile page are looking at.
        last_seen_at: p.i % 5 === 0 ? NOW : null,
      }),
      insert("registrations", registrationRow(p)),
    );
  }

  BOGUS.forEach((b, n) => {
    const id = `local-b${n}`;
    sql.push(
      insert("players", {
        id: `local-p${900 + n}`,
        email: b.email,
        display_name: b.fullName.split(" ")[0],
        age_band: "16+",
        date_of_birth: "2005-01-01",
        region: "Leicester",
        handle: `${b.fullName.split(" ")[0]} ${b.fullName.split(" ")[1]?.[0] ?? "X"}.`,
        full_name: b.fullName,
        created_at: NOW,
      }),
      insert("registrations", {
        ...registrationRow({
          ...person(900 + n),
          fullName: b.fullName,
          displayName: b.fullName.split(" ")[0],
          email: b.email,
          // Stated rather than derived. An index-derived date of birth would have said 16
          // while `age` said 21, and a row whose two age fields disagree is a confusing
          // thing to hand somebody who is testing the age rules.
          age: 21,
          dob: "2005-03-01",
          medical: null,
          access: null,
        }),
        id,
        player_id: `local-p${900 + n}`,
        reference: `LOCAL-B${n}`,
        full_name: b.fullName,
        email: b.email,
      }),
    );
  });
}

/* --- STAGE 2: places --------------------------------------------------------- */

if (wants("places")) {
  /**
   * A draw that has already happened, recorded the way a real one is.
   *
   * `seed` is 'external' and `winners` holds a paste, because that is the method the team
   * chose — so the draw history on /admin renders the branch that will actually be used
   * rather than the seeded one.
   */
  const drawn = PEOPLE.slice(0, SELECTED);
  sql.push(
    insert("draws", {
      id: "local-draw-1",
      event_slug: SLUG,
      ran_at: new Date(Date.now() - 72 * 3600_000).toISOString(),
      seed: "external",
      places: SELECTED,
      applicants: COUNT + BOGUS.length,
      referred_taken: drawn.filter((p) => p.org !== NONE).length,
      general_taken: drawn.filter((p) => p.org === NONE).length,
      note: "Seeded locally by scripts/seed-local.mjs — not a real draw",
      method: "external",
      service: "random.org (invented)",
      winners: drawn.map((p) => p.i + 1).join(", "),
      ballot_list: "local-list-1",
      drawn_pool: "general",
    }),
  );
  for (const p of drawn) {
    sql.push(
      `UPDATE registrations SET status = 'selected',
         decided_at = ${q(new Date(Date.now() - 72 * 3600_000).toISOString())},
         draw_id = 'local-draw-1',
         check_in_token = ${q(`local-token-${p.i}`)}
       WHERE id = ${q(`local-r${p.i}`)};`,
    );
  }
}

/* --- STAGE 3: gameday -------------------------------------------------------- */

if (wants("gameday")) {
  /**
   * The desk an hour in. Deliberately does NOT build the bracket.
   *
   * Building it is one click on /admin and it is one of the things that needs testing, so
   * a seed that had already done it would take the step away. It also stays out of the
   * seeding logic entirely: the bracket's shape comes from `generateKnockout()` and byes
   * are resolved before anything is stored, and a second implementation of that in SQL
   * here would be a copy free to drift from the one that runs on the day.
   */
  for (const p of PEOPLE.slice(0, ARRIVED)) {
    const at = new Date(Date.now() - (ARRIVED - p.i) * 60_000).toISOString();
    sql.push(
      `UPDATE registrations SET status = 'checked-in', checked_in_at = ${q(at)},
         checked_in_by = 'local-staff-desk'
       WHERE id = ${q(`local-r${p.i}`)};`,
      `UPDATE players SET event_verified = 1 WHERE id = ${q(`local-p${p.i}`)};`,
    );
    // Everybody except a handful, so the desk's "No date of birth" filter has rows in it
    // and the safeguarding lead has somebody to decide about.
    if (!NO_DOB_CHECK.has(p.i)) {
      sql.push(
        `UPDATE registrations SET dob_verified_at = ${q(at)},
           dob_verified_by = 'local-staff-desk' WHERE id = ${q(`local-r${p.i}`)};`,
      );
    }
  }
}

/* --- STAGE 4: extras --------------------------------------------------------- */

if (wants("extras")) {
  // The grant history on /admin/people, so the audit list is not empty.
  const grants = [
    { id: "local-g1", target: "local-desk@example.com", role: "desk", granted: 1, note: "On the door" },
    { id: "local-g2", target: "local-newdesk@example.com", role: "desk", granted: 1, note: null },
    { id: "local-g3", target: "local-moderator@example.com", role: "moderator", granted: 1, note: "Safeguarding deputy" },
    { id: "local-g4", target: "local-exvolunteer@example.com", role: "desk", granted: 0, note: "Cannot make the day" },
  ];
  grants.forEach((g, n) =>
    sql.push(
      insert("staff_grants", {
        id: g.id,
        at: new Date(Date.now() - (grants.length - n) * 86_400_000).toISOString(),
        actor_id: "local-staff-mod",
        actor_email: "local-moderator@example.com",
        target_email: g.target,
        role: g.role,
        granted: g.granted,
        note: g.note,
      }),
    ),
  );

  /**
   * The moderation queue. Two safeguarding items and three ordinary ones.
   *
   * The urgent-first ordering, the "assigned to" column and the resolution box are all
   * invisible on an empty queue, and this is the one screen where the cost of a control
   * nobody has used is measured in a child rather than a rendering bug.
   */
  const tickets = [
    {
      id: "local-t1", reference: "SUP-LOCAL1", category: "safety", urgent: 1,
      subject: "Worried about a coach's messages",
      message: "My son has been getting messages from someone who says he is helping organise the tournament, asking him to add him on PlayStation. I do not think this person is anything to do with you. I have screenshots.",
      name: "A parent", email: "local-guardian-9@example.com",
      player_id: null, from_guardian: 1, status: "new",
    },
    {
      id: "local-t2", reference: "SUP-LOCAL2", category: "player", urgent: 1,
      subject: "Another player was abusive in a game",
      message: "Someone I played online was saying really nasty things about my turban. Same person is entered for October.",
      name: "Harjot", email: "local-8@example.com",
      player_id: "local-p8", from_guardian: 0, status: "in-progress",
    },
    {
      id: "local-t3", reference: "SUP-LOCAL3", category: "event", urgent: 0,
      subject: "Is there parking at the venue",
      message: "Driving from Bradford with two of them, is there parking and what time can we arrive?",
      name: "Bhupinder", email: "local-29@example.com",
      player_id: "local-p29", from_guardian: 1, status: "resolved",
    },
    {
      id: "local-t4", reference: "SUP-LOCAL4", category: "account", urgent: 0,
      subject: "Please delete my daughter's account",
      message: "She has changed her mind about coming and I would like everything you hold about her removed.",
      name: "A parent", email: "local-guardian-23@example.com",
      player_id: "local-p23", from_guardian: 1, status: "new",
    },
    {
      id: "local-t5", reference: "SUP-LOCAL5", category: "other", urgent: 0,
      subject: "We do not want him photographed",
      // The photography objection has no field of its own — it arrives as a message, and
      // the list of who objected has to be carried to the photographers by hand. DPIA 18.
      message: "We are fine with him playing but we do not want him in any photographs or on the live stream. Please make sure whoever is filming knows.",
      name: "A parent", email: "local-guardian-17@example.com",
      player_id: "local-p17", from_guardian: 1, status: "new",
    },
  ];
  for (const t of tickets) {
    sql.push(
      insert("support_tickets", {
        ...t,
        created_at: new Date(Date.now() - (Number(t.id.slice(-1)) + 1) * 7200_000).toISOString(),
        assigned_to: t.status === "new" ? null : "local-moderator@example.com",
        handled_at: t.status === "resolved" ? NOW : null,
        resolution: t.status === "resolved" ? "Answered by email — parking is free on site." : null,
      }),
    );
  }

  sql.push(
    insert("reports", {
      id: "local-rep1",
      reporter_id: "local-p8",
      target_player_id: "local-p14",
      target_display_name: "Manveer",
      context: "profile",
      reason: "Asking for personal information",
      detail: "Kept asking how old I am and what school I go to.",
      status: "open",
      created_at: new Date(Date.now() - 5400_000).toISOString(),
      assigned_to: null,
      handled_at: null,
      resolution: null,
    }),
    insert("reports", {
      id: "local-rep2",
      reporter_id: "local-p20",
      target_player_id: "local-p33",
      target_display_name: "Deepinder",
      context: "post",
      reason: "Someone under 16 using the board",
      detail: "His post says he is 15 but he is in the adult list.",
      status: "actioned",
      created_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      assigned_to: "local-moderator@example.com",
      handled_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      resolution: "Age band corrected from the registration record. Post removed.",
    }),
  );

  /**
   * A guardian approval waiting to be decided, so /guardian/<token> can be opened.
   *
   * The token is fixed and obvious rather than random: the whole page is reachable only by
   * holding one, and a value you can read off this script is the only way to open it
   * locally without going through a mailbox that does not exist.
   */
  sql.push(
    insert("guardian_approvals", {
      id: "local-ga1",
      player_id: "local-p1",
      child_display_name: "Arjan",
      guardian_email: "local-guardian-1@example.com",
      token: "local-guardian-token",
      status: "pending",
      created_at: NOW,
      responded_at: null,
      expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      history: "[]",
    }),
  );

  /**
   * The Looking For Game board. Two pools, kept apart.
   *
   * `SWC_BOARD_OPEN` is unset locally, which means ON (features.ts defaults to on outside
   * production), so /play renders. Both age bands are seeded because the segregation is
   * the feature: an under-16 must never see an adult's post, and a board with only one
   * band in it cannot show whether that holds.
   */
  const posts = [
    { id: "local-lfg1", p: 40, band: "16+", game: "EA FC 26", platform: "PS5", intensity: "Competitive" },
    { id: "local-lfg2", p: 44, band: "16+", game: "EA FC 26", platform: "PC", intensity: "Just for fun" },
    { id: "local-lfg3", p: 0,  band: "U16", game: "EA FC 26", platform: "PS5", intensity: "Just for fun" },
    { id: "local-lfg4", p: 14, band: "U16", game: "Rocket League", platform: "Switch", intensity: "Either" },
  ];
  for (const post of posts) {
    const p = PEOPLE[post.p];
    sql.push(
      insert("lfg_posts", {
        id: post.id,
        player_id: `local-p${p.i}`,
        age_band: post.band,
        event_verified: 1,
        display_name: p.displayName,
        avatar_id: p.avatar,
        region: p.region,
        game: post.game,
        platform: post.platform,
        windows: JSON.stringify(["Weekday evenings", "Saturday daytime"]),
        intensity: post.intensity,
        note: "Looking for regular games",
        created_at: NOW,
        expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        status: "open",
      }),
    );
  }
  sql.push(
    insert("game_requests", {
      id: "local-req1",
      post_id: "local-lfg1",
      from_player_id: "local-p44",
      from_display_name: PEOPLE[44].displayName,
      from_region: PEOPLE[44].region,
      to_player_id: "local-p40",
      from_guardian_email: null,
      proposed_window: "Weekday evenings",
      note: "Up for a rematch any time",
      status: "pending",
      created_at: NOW,
      responded_at: null,
      // Released only when a request is accepted, and only to those two players.
      from_gamertag: "local-gamertag-44",
      to_gamertag: "local-gamertag-40",
    }),
  );

  /**
   * A profile with no entry and no activity, for the dormant sweep on /admin.
   *
   * Dated two years back so it is actually due. The sweep is manual now — profiles are
   * kept indefinitely by decision (2026-09-01) — so this is the row that proves the button
   * does something, and the only way to see it do it without waiting two years.
   */
  const old = new Date(Date.now() - 800 * 86_400_000).toISOString();
  sql.push(
    insert("players", {
      id: "local-dormant",
      email: "local-dormant@example.com",
      display_name: "Nirvair",
      age_band: "16+",
      date_of_birth: "2002-06-01",
      region: "Slough",
      handle: "Nirvair S.",
      created_at: old,
      last_seen_at: old,
    }),
  );
}

/* ------------------------------------------------------------------ run it */

const file = join(tmpdir(), `swc-seed-${process.pid}.sql`);
writeFileSync(file, sql.join("\n"));
try {
  execFileSync(
    "npx",
    [
      "wrangler", "d1", "execute", "swc-production",
      // Never removable. See the header.
      "--local",
      "--file", file,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
} finally {
  unlinkSync(file);
}

/* ------------------------------------------------------------------ what to do next */

/**
 * Is there an account that is not one of ours to sign in as?
 *
 * Asked because of the exact way this goes wrong. `/signin` deliberately says the same
 * thing whether or not an address is known — otherwise it becomes a way to find out which
 * children have accounts here — so typing an address with no account produces a cheerful
 * "check your inbox" and no email, no error and nothing in the log. On a laptop that is
 * indistinguishable from a broken mailer, and the answer is simply that nobody has run
 * grant-moderator yet. Better to say so before it is a puzzle.
 */
function hasOwnAccount() {
  try {
    const out = execFileSync(
      "npx",
      [
        "wrangler", "d1", "execute", "swc-production", "--local", "--json",
        "--command",
        "SELECT COUNT(*) AS n FROM players WHERE email NOT LIKE 'local-%@example.com'",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return JSON.parse(out)[0].results[0].n > 0;
  } catch {
    // Never let a check about convenience turn into a failed seed.
    return true;
  }
}

if (clear) {
  console.log("Cleared every seeded row: people, entries, staff, queue, board, bracket.");
  process.exit(0);
}

/** Mirrors `bracketSize()` in src/lib/bracket.ts — only to print the right number here. */
const bracketSize = (n) => {
  let size = 1;
  while (size < n) size *= 2;
  return Math.max(size, 2);
};

const remaining = COUNT - SELECTED;
const referredWaiting = PEOPLE.slice(SELECTED).filter((p) => p.org !== NONE).length;

const NEXT = {
  entries: `
ENTRIES ARE OPEN, NOTHING DECIDED — ${COUNT + BOGUS.length} people are waiting.

  /admin                    Entries -> Show all: the whole interested list
                            Three rows are meant to be deleted. Type the reference to
                            confirm:  LOCAL-B0  LOCAL-B1  LOCAL-B2  (the third is a
                            duplicate of ${PEOPLE[5].fullName}, entry LOCAL-005)
                            DELETE THEM BEFORE YOU LOCK THE LIST. Deleting after the lock
                            is allowed but leaves a hole in the numbering, and the panel
                            will tell you to lock a new one.

  /admin                    Draw with an outside service -> Lock the list
                            Then: ask random.org for that many numbers in that range,
                            paste them back, read the preview, commit.
                            Try pasting a NUMBERED list ("1. 5" / "2. 8") — it is refused
                            and tells you why.

  /admin                    Names on the screen is EMPTY at this stage, and correctly so:
                            it lists the people who have a place, and nobody does yet.`,

  places: `
A DRAW HAS RUN — ${SELECTED} of ${CAPACITY} places filled, ${remaining} still waiting.

  /admin/checkin/slips      ${SELECTED} slips, 18 to a sheet. Print, or just hold the
                            SCREEN up to the laptop's own camera.
  /admin/checkin            Start the camera and scan one. Then scan the same one again —
                            it says "already checked in" and gives the time of the FIRST
                            scan, which is the distinction the desk is built around.
                            Scan any other QR code you own: "not one of our passes".
                            Then check somebody in by name, record a date of birth, undo.

  /admin                    Names on the screen: ${SELECTED} public names to read before the
                            doors open — first name plus last initial, built from the
                            registration rather than typed by anybody. Correct one and it
                            reaches the projector and the slips.

  /admin                    Lock a list again. ${remaining} seeded entrants are still waiting
                            for ${CAPACITY - SELECTED} places and ${referredWaiting} of them are referred, so this
                            time there are MORE referred applicants than places: the
                            referred pool becomes the one drawn and the general pool is not
                            drawn at all. That is the other branch of the split, and the
                            only way to see it in a browser.`,

  gameday: `
THE DESK HAS BEEN RUNNING AN HOUR — ${ARRIVED} of ${SELECTED} have arrived.

  /admin/checkin            The counter, and four filters. ${NO_DOB_CHECK.size} people arrived
                            with no date of birth checked — they have their own filter,
                            and the safeguarding lead decides about them, not the door.
  /admin                    The bracket -> "Build the bracket". It is built from everyone
                            with a PLACE, not from everyone who has arrived — ${SELECTED}, not ${ARRIVED}.
                            ${SELECTED} is not a power of two: you get a ${bracketSize(SELECTED)}-slot bracket and
                            ${bracketSize(SELECTED) - SELECTED} byes, resolved before anything is stored. That is the
                            answer to "can we start without 64".
  /events/${SLUG}/tv   The big screen. Enter a score on /admin and watch it move.
                            Enter a WRONG score, then correct it: the whole board is
                            recomputed, so the right player ends up in the next round.`,

  extras: `
EVERYTHING ELSE.

  /admin/people             Three staff accounts. One is a second moderator, so you can
                            try revoking one without the app stopping you for being the
                            last. One has never signed in and is flagged amber.
                            Sign in as local-desk@example.com to see the desk-only role:
                            /admin and /moderation refuse it, /admin/checkin does not.
  /moderation               Five tickets and two reports. Two are safeguarding and sort
                            first. One is an erasure request. One is a photography
                            objection — the thing with no field of its own, which has to
                            be carried to the photographers by hand.
  /play                     Four posts across both age bands, and one pending request.
                            Sign in as a U16 and an adult in turn: neither sees the other.
  /guardian/local-guardian-token
                            A guardian's approval page, waiting to be decided.
  /admin                    Retention -> the dormant sweep has one profile to find.
  /players  /profile        Player cards, and somebody's own record.`,
};

console.log(`
Seeded the LOCAL database only — stage "${stage}".
`);

if (!hasOwnAccount()) {
  console.log(`  ┌────────────────────────────────────────────────────────────────────────┐
  │  YOU HAVE NO ACCOUNT YET, so /signin will do nothing.                  │
  │                                                                        │
  │    node scripts/grant-moderator.mjs you@example.com "Your Name"        │
  │                                                                        │
  │  The sign-in form says the same thing whether or not an address is     │
  │  known — that is deliberate, so it cannot be used to find out which    │
  │  children have accounts — so an unknown address looks exactly like a   │
  │  broken mailer. Run that first and the puzzle does not happen.         │
  └────────────────────────────────────────────────────────────────────────┘
`);
}
for (const s of STAGES.slice(0, upTo + 1)) console.log(NEXT[s]);
console.log(`
SIGNING IN
  node scripts/grant-moderator.mjs you@example.com "Your Name"
  npm run dev    ->   http://localhost:3000/signin

  No email is sent locally (no RESEND_API_KEY). The magic link is printed in the terminal
  running the dev server, along with the full text of every email that would have gone out
  — which is the only place the wording of an offer or a guardian notice can be read
  without sending one.

  The camera needs HTTPS or localhost. http://<your-ip>:3000 from a phone will not get
  one; use the laptop's own camera, or npm run cf:preview on localhost.

WHEN YOU ARE DONE
  node scripts/seed-local.mjs --clear

  Then start again at any stage. Nothing here can reach production: the wrangler command
  always carries --local, and --remote is refused.
`);
