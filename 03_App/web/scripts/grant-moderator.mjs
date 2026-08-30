#!/usr/bin/env node
/**
 * Create a staff account and make it a moderator.
 *
 * Moderator is a database grant with no button anywhere in the app (see the invariants in
 * CLAUDE.md). A moderator can read safeguarding disclosures, applicants' names and
 * guardians' contact details, and run the draw — so it is a decision taken once, on
 * purpose, by someone with database access, not something clickable by whoever is already
 * signed in.
 *
 *   node scripts/grant-moderator.mjs you@example.com "Your Name"          # local D1
 *   node scripts/grant-moderator.mjs you@example.com "Your Name" --remote # production
 *
 * There is no matching revoke script on purpose: removing access is urgent and should be
 * done with a one-line UPDATE you can see, not a script whose behaviour you have to trust.
 *   npx wrangler d1 execute swc-production --remote \
 *     --command "UPDATE players SET is_moderator = 0 WHERE email = '...'"
 */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const [emailArg, nameArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const remote = process.argv.includes("--remote");

if (!emailArg) {
  console.error("Usage: node scripts/grant-moderator.mjs <email> [name] [--remote]");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const name = (nameArg || email.split("@")[0]).trim();

// A staff account is not a player. The band is 16+ because a moderator is an adult by
// definition, and the date of birth column is NOT NULL but meaningless here — the
// obviously-fake value is better than a plausible one nobody can distinguish from real.
const sql = `
INSERT INTO players (id, email, display_name, age_band, date_of_birth, is_moderator, created_at)
VALUES ('${randomUUID()}', '${email.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}',
        '16+', '1900-01-01', 1, '${new Date().toISOString()}')
ON CONFLICT(email) DO UPDATE SET is_moderator = 1;
`.trim();

execFileSync(
  "npx",
  [
    "wrangler",
    "d1",
    "execute",
    "swc-production",
    remote ? "--remote" : "--local",
    "--command",
    sql,
  ],
  { stdio: "inherit" },
);

console.log(
  `\n${email} is now a moderator${remote ? " in production" : " locally"}.\n` +
    `Sign in at ${remote ? "https://sikhchampionships.com" : "http://localhost:3000"}/signin ` +
    `with that address — you'll be emailed a link.`,
);
