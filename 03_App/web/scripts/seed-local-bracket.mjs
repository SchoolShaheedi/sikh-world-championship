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
    statements.push(
      `INSERT INTO players (id, email, display_name, age_band, date_of_birth, region, handle, created_at)
       VALUES ('${pid}', 'local-${i}@example.com', '${first}', '16+', '2006-05-02', 'Leicester', '${handle}', '${NOW}');`,
      `INSERT INTO registrations
         (id, event_slug, division_id, player_id, status, reference, created_at,
          full_name, dob, email, mobile, region, referral_org)
       VALUES ('local-r${i}', '${SLUG}', 'open', '${pid}', 'selected', 'LOCAL-${i}', '${NOW}',
               '${handle} Player', '2006-05-02', 'local-${i}@example.com', '07700900123',
               'Leicester', 'Nobody — I found it myself');`,
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

Next:
  npm run dev                                   (or npm run cf:preview)
  open http://localhost:3000/admin              -> The bracket -> "Build the bracket"
  open http://localhost:3000/events/${SLUG}/tv   -> the big screen, polling

Enter a score on /admin and watch the TV tab change within a few seconds.
/admin needs a moderator: node scripts/grant-moderator.mjs you@example.com "Name"`);
}
