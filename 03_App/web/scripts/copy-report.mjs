/**
 * Build the copy desk — one page listing every public-facing string on the site, each
 * with a box to edit it in, and an export that names the file and key for every change.
 *
 *   node scripts/copy-report.mjs [outfile]      default: copy-desk.html in this folder
 *
 * WHY A GENERATOR AND NOT A HAND-WRITTEN PAGE: the point of the page is that it is
 * exhaustive, and a hand-written list stops being exhaustive the first time somebody adds
 * a sentence. This reads `src/copy/en.json` and the typed data modules, so a string that
 * exists in the app cannot be missing from the page.
 *
 * WHAT IS NOT ON IT, deliberately: /admin, /moderation and the arrival desk (staff-only,
 * not public), and the transactional emails in src/lib/email-templates.ts — those are
 * templates with HTML and plain-text arms that have to stay in step, so editing them
 * through a text box would break them. They are listed as a pointer at the end instead.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDataCopy } from "./copy-data.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(HERE, "..");

const en = JSON.parse(readFileSync(path.join(WEB, "src/copy/en.json"), "utf8"));
const DATA = await loadDataCopy();

/** Warnings raised while building, shown on the page so it cannot go quietly stale. */
const problems = [];

/* ------------------------------------------------------------------ entries */

const EN = "src/copy/en.json";

/** An entry backed by a key in en.json. */
function j(group, key, meta = {}) {
  const value = en[group]?.[key];
  if (value === undefined) {
    problems.push(`en.json has no ${group}.${key} — the report asked for it.`);
    return null;
  }
  return { id: `${EN}#${group}.${key}`, file: EN, path: `${group}.${key}`, value, ...meta };
}

/** Every remaining key in a group, so nothing can be forgotten by omission. */
function restOf(group, taken, meta = {}) {
  return Object.keys(en[group] ?? {})
    .filter((k) => !taken.includes(k))
    .map((k) => j(group, k, meta));
}

/**
 * An entry backed by a literal in a source file rather than a JSON key.
 *
 * `match` is the exact current text. Applying a change means replacing that literal in
 * that file — so the literal is checked against the file here, and a mismatch is a
 * problem on the page rather than a silent no-op later.
 */
const fileCache = new Map();
function lit(file, value, meta = {}) {
  if (!fileCache.has(file)) fileCache.set(file, readFileSync(path.join(WEB, file), "utf8"));
  const src = fileCache.get(file);
  const probe = value.length > 60 ? value.slice(0, 60) : value;
  if (!src.includes(probe)) problems.push(`${file} no longer contains: “${probe}”`);
  return { id: `${file}#${hash(value)}`, file, match: value, value, ...meta };
}

function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

/** A data-module entry, addressed by a JS path we can apply mechanically. */
function d(file, dpath, value, meta = {}) {
  return { id: `${file}#${dpath}`, file, path: dpath, value, ...meta };
}

const LEGAL = "Load-bearing wording — 04_Legal covers this. Change the words, not the promise.";
const SAFE = "Safeguarding copy. The claim has to stay true of what the app actually does.";

const EV = DATA.EVENTS[0];
const evFile = `src/data/events/${EV.slug}.ts`;

const sections = [
  {
    id: "sitewide", title: "Site-wide", route: "Header, footer, share card",
    entries: [
      ...restOf("nav", []).map((e) => ({ ...e, where: "Header" })),
      ...restOf("footer", []).map((e) => ({ ...e, where: "Footer" })),
      d("src/data/org.ts", "ORG.name", DATA.ORG.name, { where: "Everywhere" }),
      d("src/data/org.ts", "ORG.short", DATA.ORG.short, { where: "Share card, page titles" }),
      d("src/data/org.ts", "ORG.tagline", DATA.ORG.tagline, { where: "Hero eyebrow, footer, share card" }),
      d("src/data/org.ts", "ORG.intro", DATA.ORG.intro, { where: "Hero paragraph, meta description" }),
      d("src/data/org.ts", "ORG.socials.instagram", DATA.ORG.socials.instagram, { where: "Footer link" }),
      ...restOf("og", []).map((e) => ({ ...e, where: "Share card" })),
      ...restOf("status", []).map((e) => ({ ...e, where: "Event status badge" })),
      ...restOf("common", []).map((e) => ({ ...e, where: "Shared labels and fallbacks" })),
    ],
  },
  {
    id: "home", title: "Home", route: "/",
    entries: restOf("home", []),
  },
  {
    id: "events", title: "Events list", route: "/events",
    entries: restOf("events", []),
  },
  {
    id: "event", title: "Event page", route: "/events/sikh-fc-27",
    entries: [
      d(evFile, "title", EV.title, { where: "Page heading, everywhere the event is named" }),
      d(evFile, "shortTitle", EV.shortTitle, { where: "Player card" }),
      d(evFile, "tagline", EV.tagline, { where: "Event card on the home and events pages" }),
      d(evFile, "description", EV.description, { where: "Event page intro, home featured strip", multiline: true }),
      d(evFile, "times", EV.times, { where: "“When” fact card" }),
      d(evFile, "venue.name", EV.venue.name, { where: "“Where” fact card, home featured strip" }),
      ...EV.venue.addressLines.map((l, i) =>
        d(evFile, `venue.addressLines[${i}]`, l, {
          where: i === EV.venue.addressLines.length - 1
            ? "Address line — the LAST line is read as the town, and the guardian email says “in <town>”"
            : "Address line",
        })),
      d(evFile, "venue.postcode", EV.venue.postcode, { where: "Address" }),
      ...EV.divisions.map((dv, i) =>
        d(evFile, `divisions[${i}].name`, dv.name, { where: "Division heading, player card" })),
      ...restOf("event", []),
      ...EV.rules.map((r, i) =>
        d(evFile, `rules[${i}]`, r, {
          where: `Rule ${i + 1} — event page`, multiline: true,
          note: /date of birth/i.test(r) ? "Checked at the door for every player. The accepted documents are listed separately below." : undefined,
        })),
      ...EV.prizes.map((p, i) => d(evFile, `prizes[${i}]`, p, { where: "Prizes list" })),
      ...EV.awardTiers.map((a, i) =>
        d(evFile, `awardTiers[${i}].label`, a.label, { where: "Trophy cabinet, player card" })),
    ],
  },
  {
    id: "register", title: "Register interest", route: "/events/sikh-fc-27/register-interest",
    entries: restOf("registerInterest", []).map((e) => ({
      ...e,
      note: /notAPlace/.test(e.path) ? LEGAL : e.note,
      multiline: (e.value ?? "").length > 90,
    })),
  },
  {
    id: "form", title: "The sign-up form", route: "The form itself",
    entries: [
      ...restOf("signupForm", []).map((e) => ({
        ...e,
        note: /^signupForm\.terms/.test(e.path) ? LEGAL : e.note,
        multiline: (e.value ?? "").length > 90,
      })),
      ...EV.formFields.flatMap((f, i) => [
        d(evFile, `formFields[${i}].label`, f.label, { where: `Event question ${i + 1}` }),
        f.help ? d(evFile, `formFields[${i}].help`, f.help, { where: `Event question ${i + 1} — hint`, multiline: true }) : null,
        f.placeholder ? d(evFile, `formFields[${i}].placeholder`, f.placeholder, { where: `Event question ${i + 1} — placeholder` }) : null,
        ...(f.options ?? []).map((o, k) =>
          d(evFile, `formFields[${i}].options[${k}]`, o, { where: `Event question ${i + 1} — option` })),
      ]),
      ...DATA.MEDICAL_CONDITIONS.map((c, i) =>
        d("src/lib/guardian-rules.ts", `MEDICAL_CONDITIONS[${i}]`, c, {
          where: "Medical tick-list",
          note: i === DATA.MEDICAL_CONDITIONS.length - 1
            ? "These are permitted values, not just labels — the server validates against this exact list. Renaming one invalidates saved answers."
            : undefined,
        })),
      d("src/lib/guardian-rules.ts", 'TIER_EXPLANATION["on-site"]', DATA.TIER_EXPLANATION["on-site"], { where: "Guardian section, under-16s", note: SAFE, multiline: true }),
      d("src/lib/guardian-rules.ts", "TIER_EXPLANATION.independent", DATA.TIER_EXPLANATION.independent, { where: "Guardian section, 16–17s", note: SAFE, multiline: true }),
      ...DATA.REFERRAL_ORGS.map((o, i) =>
        d("src/data/referral-orgs.ts", `REFERRAL_ORGS[${i}]`, o, { where: "“How did you hear about this?”" })),
      d("src/data/referral-orgs.ts", "REFERRAL_OTHER", DATA.REFERRAL_OTHER, { where: "“How did you hear about this?”" }),
      d("src/data/referral-orgs.ts", "REFERRAL_NONE", DATA.REFERRAL_NONE, { where: "“How did you hear about this?”" }),
      ...restOf("fieldLabels", []).map((e) => ({ ...e, where: "Named in a validation error" })),
    ],
  },
  {
    id: "idcheck", title: "Proof of age at the door", route: "Form, both emails and the arrival desk",
    note: "One source of truth: the sign-up form, the confirmation email, the guardian email and the desk all read these.",
    entries: [
      d("src/data/id-check.ts", "ID_REQUIREMENT", DATA.ID_REQUIREMENT, { multiline: true, note: SAFE }),
      d("src/data/id-check.ts", "ID_PHOTO_ALLOWED", DATA.ID_PHOTO_ALLOWED, { multiline: true }),
      d("src/data/id-check.ts", "ID_WE_KEEP_NOTHING", DATA.ID_WE_KEEP_NOTHING, { multiline: true, note: LEGAL }),
      ...DATA.ID_ACCEPTED.map((a, i) =>
        d("src/data/id-check.ts", `ID_ACCEPTED[${i}]`, a, { where: "Accepted documents" })),
      ...DATA.ID_NO_DOCUMENT_RULE.map((a, i) =>
        d("src/data/id-check.ts", `ID_NO_DOCUMENT_RULE[${i}]`, a, { where: "Desk guidance when somebody arrives with nothing", multiline: true })),
    ],
  },
  {
    id: "bracket", title: "Live bracket and big screen", route: "/events/sikh-fc-27/bracket · /tv",
    entries: [
      ...restOf("bracket", []),
      ...restOf("tv", []),
      lit("src/lib/bracket.ts", "Final", { where: "Round heading" }),
      lit("src/lib/bracket.ts", "Semi-finals", { where: "Round heading" }),
      lit("src/lib/bracket.ts", "Quarter-finals", { where: "Round heading" }),
      lit("src/lib/bracket.ts", "Round of ", { where: "Round heading — followed by the number of players" }),
    ],
  },
  {
    id: "join", title: "Create a profile", route: "/join",
    entries: [
      ...restOf("join", []).map((e) => ({ ...e, multiline: (e.value ?? "").length > 90 })),
      ...DATA.PROFILE_BENEFITS.flatMap((b, i) => [
        d("src/data/profile-benefits.ts", `PROFILE_BENEFITS[${i}].title`, b.title, { where: "/join and /profile" }),
        d("src/data/profile-benefits.ts", `PROFILE_BENEFITS[${i}].detail`, b.detail, {
          where: "/join and /profile", multiline: true,
          note: "Must be true of what a profile holder can do today. A benefit that is not live is marked “coming”.",
        }),
      ]),
    ],
  },
  {
    id: "profile", title: "Your profile", route: "/profile",
    entries: restOf("profile", []).map((e) => ({
      ...e,
      note: /visibility/.test(e.path) ? SAFE : e.note,
      multiline: (e.value ?? "").length > 90,
    })),
  },
  {
    id: "signin", title: "Sign in", route: "/signin",
    entries: restOf("signin", []).map((e) => ({ ...e, multiline: (e.value ?? "").length > 90 })),
  },
  {
    id: "players", title: "Players", route: "/players",
    entries: [
      ...restOf("players", []),
      ...DATA.AVATARS.map((a, i) =>
        d("src/data/avatars.ts", `AVATARS[${i}].label`, a.label, { where: "Avatar name on the profile" })),
    ],
  },
  {
    id: "qualities", title: "The 32 Qualities", route: "Player card and profile",
    note: "One is drawn for each player and printed on their card. Gurmukhi and the romanised name sit on the card face; the meaning is written for a 12-year-old and shown on the profile.",
    collapsed: true,
    entries: DATA.QUALITIES.flatMap((q, i) => [
      d("src/data/qualities.ts", `QUALITIES[${i}].name`, q.name, { where: `${q.gurmukhi} — card face` }),
      d("src/data/qualities.ts", `QUALITIES[${i}].english`, q.english, { where: `${q.name} — card face` }),
      d("src/data/qualities.ts", `QUALITIES[${i}].meaning`, q.meaning, { where: `${q.name} — profile`, multiline: true }),
    ]),
  },
  {
    id: "sponsors", title: "Sponsors", route: "/sponsors",
    entries: [
      ...restOf("sponsors", []).map((e) => ({ ...e, multiline: (e.value ?? "").length > 90 })),
      ...DATA.SPONSORS.flatMap((s, i) => [
        d("src/data/sponsors.ts", `SPONSORS[${i}].name`, s.name, { where: "Sponsor card" }),
        d("src/data/sponsors.ts", `SPONSORS[${i}].blurb`, s.blurb, { where: "Sponsor card", multiline: true }),
        s.offer ? d("src/data/sponsors.ts", `SPONSORS[${i}].offer.detail`, s.offer.detail, {
          where: "Sponsor card and /join",
          note: "Has to be redeemable today. A code that does not work is worse for the sponsor than no mention.",
        }) : null,
      ]),
    ],
  },
  {
    id: "volunteer", title: "Volunteer", route: "/volunteer",
    note: "The roles moved out of en.json in round 57 — a role id is a permitted value the sign-up form is validated against, so the words live in a typed module like the support categories do.",
    entries: [
      ...restOf("volunteer", []).map((e) => ({
        ...e,
        multiline: (e.value ?? "").length > 90,
      })),
      ...DATA.VOLUNTEER_ROLES.flatMap((r, i) => [
        d("src/lib/volunteer-types.ts", `VOLUNTEER_ROLES[${i}].name`, r.name, { where: `Role ${i + 1}` }),
        ...(r.detail
          ? [d("src/lib/volunteer-types.ts", `VOLUNTEER_ROLES[${i}].detail`, r.detail, { where: `Role ${i + 1} — hint`, multiline: true })]
          : []),
      ]),
      ...DATA.VOLUNTEER_AVAILABILITY.flatMap((a, i) => [
        d("src/lib/volunteer-types.ts", `VOLUNTEER_AVAILABILITY[${i}].label`, a.label, { where: "When can you be there?" }),
        d("src/lib/volunteer-types.ts", `VOLUNTEER_AVAILABILITY[${i}].help`, a.help, { where: "When can you be there? — hint" }),
      ]),
      ...DATA.VOLUNTEER_DBS.map((x, i) =>
        d("src/lib/volunteer-types.ts", `VOLUNTEER_DBS[${i}].label`, x.label, {
          where: "DBS answers",
          note: "Three answers and no fourth. \"Not sure\" is the true answer for most people, and a form that forces a guess gets a wrong yes.",
        })),
    ],
  },
  {
    id: "support", title: "Contact us", route: "/support",
    entries: [
      ...restOf("support", []).map((e) => ({
        ...e,
        note: /emergency|footnote/.test(e.path) ? SAFE : e.note,
        multiline: (e.value ?? "").length > 90,
      })),
      ...DATA.SUPPORT_CATEGORIES.flatMap((c, i) => [
        d("src/lib/support-types.ts", `SUPPORT_CATEGORIES[${i}].label`, c.label, { where: `Category ${i + 1}${c.urgent ? " (priority)" : ""}` }),
        d("src/lib/support-types.ts", `SUPPORT_CATEGORIES[${i}].help`, c.help, { where: `Category ${i + 1} — hint`, multiline: true }),
      ]),
    ],
  },
  {
    id: "guardian", title: "Guardian permission", route: "/guardian/<token>",
    note: "The page a parent lands on from the permission email. Not indexed.",
    entries: [
      ...restOf("guardian", []).map((e) => ({ ...e, multiline: (e.value ?? "").length > 90 })),
      ...DATA.GUARDIAN_TERMS.map((t, i) =>
        d("src/lib/guardian-types.ts", `GUARDIAN_TERMS[${i}]`, t, {
          where: "What you're agreeing to", multiline: true,
          note: "Shown verbatim on the page and in the email, and quoted in the safeguarding policy. All three have to agree.",
        })),
    ],
  },
  {
    id: "play", title: "Find a game", route: "/play",
    note: "Built but switched off, and hidden from the header. Everything here is live copy the moment the board opens.",
    collapsed: true,
    entries: [
      ...restOf("play", []).map((e) => ({
        ...e,
        note: /safety|u16Notice|needsGuardian|closedHow/.test(e.path) ? SAFE : e.note,
        multiline: (e.value ?? "").length > 90,
      })),
      ...DATA.GAMES.map((g, i) => d("src/lib/play-types.ts", `GAMES[${i}]`, g, { where: "Game menu" })),
      ...DATA.PLATFORMS.map((g, i) => d("src/lib/play-types.ts", `PLATFORMS[${i}]`, g, { where: "Platform menu" })),
      ...DATA.WINDOWS.map((g, i) => d("src/lib/play-types.ts", `WINDOWS[${i}]`, g, { where: "Availability menu" })),
      ...DATA.INTENSITY.map((g, i) => d("src/lib/play-types.ts", `INTENSITY[${i}]`, g, { where: "“How do you play?”" })),
      ...DATA.PRESET_NOTES.map((g, i) => d("src/lib/play-types.ts", `PRESET_NOTES[${i}]`, g, {
        where: "The only thing a player can “say”",
        note: i === 0 ? "A fixed menu is what keeps the board safe without a moderator reading it. Adding free text here is a safeguarding change, not a copy change." : undefined,
      })),
      ...DATA.REPORT_REASONS.map((g, i) => d("src/lib/play-types.ts", `REPORT_REASONS[${i}]`, g, { where: "Report a player" })),
    ],
  },
  {
    id: "validation", title: "Validation messages", route: "Shown when a form is rejected",
    note: "What somebody reads when the sign-up form refuses their answer. Every one is a literal in its file rather than a JSON key, so an export names the file and the exact text to replace.",
    collapsed: true,
    entries: [
      ...[
        "This is required", "We need a phone number", "That doesn't look like a phone number",
        "Use digits, spaces, + and - only", "We need an email address", "Check the email address",
        "Date of birth must be YYYY-MM-DD", "Not a real date", "Date of birth is in the future",
        "Check the year of birth", "Give us a name we can call in an emergency",
        "How do you know them? Partner, brother, friend…", "We need the parent or guardian's name",
        "Are you their mother, father, carer…?",
        "A parent or guardian must give permission for an under-18 to enter",
        "A parent or guardian must stay at the venue for a player under 16",
        "A parent or guardian must give permission for a 16 or 17-year-old to come on their own",
        "Please confirm your child will tell us about any dietary needs on the day",
        "We need the player's full name", "You need to agree to the rules and code of conduct",
        "Let us know how you heard about this", "Which university's Sikh Society?",
        "Which organisation referred you?",
        "That date of birth is in the future — check the year.",
        "Some details need checking.", "That submission contained fields we don't recognise.",
      ].map((m) => lit("src/lib/registration-schema.ts", m, { where: "Form validation" })),
      ...restOf("api", []).map((e) => ({ ...e, where: "Submitting while entries are closed", multiline: true })),
      lit("src/lib/handle.ts", "Letters, numbers, spaces, full stops, hyphens and underscores only.", { where: "Public name check" }),
      lit("src/lib/handle.ts", "Leave your surname out — public names on SWC are a first name or a nickname, ", { where: "Public name check", multiline: true }),
      lit("src/lib/handle.ts", "Please don't use your PSN ID here — this name goes on a screen everyone can see, ", { where: "Public name check", multiline: true }),
    ],
  },
];

/* ------------------------------------------------------------------- render */

const clean = (list) => list.filter(Boolean);
for (const s of sections) s.entries = clean(s.entries);

const total = sections.reduce((n, s) => n + s.entries.length, 0);
const byFile = {};
for (const s of sections) for (const e of s.entries) byFile[e.file] = (byFile[e.file] ?? 0) + 1;

const payload = {
  generatedAt: new Date().toISOString(),
  total,
  byFile,
  problems,
  sections: sections.map((s) => ({
    id: s.id, title: s.title, route: s.route, note: s.note ?? null,
    collapsed: !!s.collapsed,
    entries: s.entries.map((e) => ({
      id: e.id, file: e.file, path: e.path ?? null, match: e.match ?? null,
      label: e.path ? e.path.split(".").slice(-1)[0].replace(/\[\d+\]$/, "") : "text",
      key: e.path ?? `“${(e.match ?? "").slice(0, 40)}”`,
      where: e.where ?? null, note: e.note ?? null,
      multiline: e.multiline ?? (e.value ?? "").length > 90,
      value: e.value,
    })),
  })),
};

const OUT = process.argv[2] ?? path.join(HERE, "..", "copy-desk.html");
writeFileSync(OUT, page(payload));
console.log(`copy desk → ${OUT}`);
console.log(`${total} strings across ${sections.length} sections`);
for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
if (problems.length) { console.log("\nPROBLEMS:"); for (const p of problems) console.log("  ! " + p); }

function page(data) {
  return readFileSync(path.join(HERE, "copy-desk.template.html"), "utf8")
    .replace("/*__DATA__*/null", JSON.stringify(data));
}
