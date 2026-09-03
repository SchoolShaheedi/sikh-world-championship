#!/usr/bin/env node
/**
 * Put a playable bracket in the LOCAL database, so the big screen can be looked at.
 *
 * WHY THIS EXISTS: the television view and the score-entry panel are the two pieces of
 * this app that cannot be judged from a screenshot — they have to be watched updating. But
 * they need players with places, and getting those honestly means running the draw over
 * real registrations. On 2 September there are none, and inventing them in production is
 * exactly what the demo-data rule forbids.
 *
 * So: eight invented players, in the local D1 only.
 *
 *   node scripts/seed-local-bracket.mjs          # seed
 *   node scripts/seed-local-bracket.mjs --clear  # remove every trace of it
 *
 * It refuses to run against production, and it cannot be talked into it: the wrangler
 * command it builds always carries --local, and every row it writes is prefixed `local-`
 * so --clear can find all of them and nothing else.
 */
import { execFileSync } from "node:child_process";

const NAMES = [
  "Jagdeep S.", "Arjan K.", "Simran K.", "Harman S.",
  "Gurdeep S.", "Manveer S.", "Ravi S.", "Baljit K.",
];

/**
 * A mix of ages and exit permissions, so the arrival desk can be looked at properly.
 *
 * Not decoration. The desk shows a U18 badge and a line saying what was agreed about a
 * child leaving, and eight identical twenty-year-olds would have exercised neither — which
 * is how the row that matters most on the day is the one nobody ever saw rendered.
 */
const PROFILES = [
  { dob: "2006-05-02", onSite: 0, alone: 0 }, // adult
  { dob: "2013-05-02", onSite: 1, alone: 0 }, // 13, parent staying
  { dob: "2013-11-20", onSite: 0, alone: 0 }, // 12, must be collected
  { dob: "2009-02-14", onSite: 0, alone: 1 }, // 17, may leave alone
  { dob: "2006-05-02", onSite: 0, alone: 0 },
  { dob: "2010-08-01", onSite: 0, alone: 0 }, // 16, must be collected
  { dob: "2006-05-02", onSite: 0, alone: 0 },
  { dob: "2011-01-09", onSite: 1, alone: 0 }, // 15, parent staying
];
const SLUG = "sikh-fc-27";
const NOW = new Date().toISOString();

if (process.argv.includes("--remote")) {
  console.error("No. This script is local-only — that is the point of it.");
  process.exit(1);
}

const clear = process.argv.includes("--clear");

const wipe = [
  `DELETE FROM matches WHERE event_slug = '${SLUG}';`,
  `DELETE FROM registrations WHERE reference LIKE 'LOCAL-%';`,
  `DELETE FROM players WHERE email LIKE 'local-%@example.com';`,
];

const statements = [...wipe];

if (!clear) {
  NAMES.forEach((handle, i) => {
    const pid = `local-p${i}`;
    const first = handle.split(" ")[0];
    const { dob, onSite, alone } = PROFILES[i];
    const band = Number(dob.slice(0, 4)) > 2010 ? "U16" : "16+";
    statements.push(
      `INSERT INTO players (id, email, display_name, age_band, date_of_birth, region, handle, created_at)
       VALUES ('${pid}', 'local-${i}@example.com', '${first}', '${band}', '${dob}', 'Leicester', '${handle}', '${NOW}');`,
      /**
       * A check-in token, because otherwise there is nothing to print and nothing to scan.
       * Fixed and obvious rather than random: `local-token-3` in a QR code on a local
       * machine is a string somebody can read off the screen and type into the manual box
       * to compare the two paths, and it can never be mistaken for one issued for real.
       */
      `INSERT INTO registrations
         (id, event_slug, division_id, player_id, status, reference, check_in_token, created_at,
          full_name, dob, email, mobile, region, referral_org,
          guardian_on_site, may_leave_unaccompanied)
       VALUES ('local-r${i}', '${SLUG}', 'open', '${pid}', 'selected', 'LOCAL-${i}',
               'local-token-${i}', '${NOW}',
               '${handle} Player', '${dob}', 'local-${i}@example.com', '07700900123',
               'Leicester', 'Nobody — I found it myself', ${onSite}, ${alone});`,
    );
  });
}

execFileSync(
  "npx",
  [
    "wrangler", "d1", "execute", "swc-production",
    // Never removable. See the header.
    "--local",
    "--command", statements.join(" "),
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);

if (clear) {
  console.log("Cleared the local bracket, its eight players and their entries.");
} else {
  console.log(`Seeded ${NAMES.length} players with places, in the LOCAL database only.

/admin needs a moderator: node scripts/grant-moderator.mjs you@example.com "Name"
Then: npm run dev   (or npm run cf:preview)

THE BIG SCREEN
  http://localhost:3000/admin                     -> The bracket -> "Build the bracket"
  http://localhost:3000/events/${SLUG}/tv    -> polling; enter a score and watch it change

THE ARRIVAL DESK
  http://localhost:3000/admin/checkin/slips       -> 8 slips; print, or just hold the
                                                     SCREEN up to the laptop camera
  http://localhost:3000/admin/checkin             -> "Start the camera", scan one

  Scan the same slip twice: the second time says "already checked in" with the time of the
  first, which is the distinction the desk is built around. Scan any other QR code you have
  and it says it is not one of ours. Then check somebody in by name, and undo it.

  The camera needs HTTPS or localhost — http://<your-ip>:3000 from a phone will not get one.
  Use npm run cf:preview and localhost, or hold the printed slips to the laptop's own camera.`);
}
