# Next steps — the build

**This file is the development backlog and nothing else.** Rewritten in round 46 to hold
only work that is done in this repository, by the person who writes the code.

Anything that needs a meeting, a policy, a signature, a purchase or a person on the floor
lives in `00_Docs/MEETING-QUESTIONS.md`. That was the point of splitting them: a build
backlog with insurance quotes and DBS checks in it is a backlog that stops the build.

Ordered by what it costs to leave undone.

## Now

- [ ] **Do the rehearsal.** Entries are open to the public now, so the form writes for
      everyone — but the test key still matters: it is what shows the **"Fill with test
      data"** button, which completes the whole form as a 13-year-old in one click (both
      email boxes left blank on purpose, so type one you can read). One entry end to end:
      form → guardian email → magic link → `/admin` → draw → offer email → delete the
      entry. The link is in the Keychain as `swc-test-key`; runbook in
      `00_Docs/TESTING-REGISTRATION.md`.
- [ ] **Watch the first real entries.** The form is public as of 1 September and
      applications close on the 26th. Nobody has entered yet, so the first few are the
      real test: check the guardian email arrived, the name on `/admin` reads sensibly,
      and the referral answer is specific.
- [ ] **Rotate the Cloudflare and Resend keys.** Both have been exposed in transcripts on
      disk. The mechanism that caused it is fixed (`00_Docs/SECRETS.md`); the keys
      themselves are still live. `./scripts/secrets-to-keychain.sh`, then
      `python3 scripts/scrub-transcripts.py --write` with this session closed.
- [x] **DMARC is set** — confirmed live 2026-09-01:
      `v=DMARC1; p=none; rua=mailto:media@shaheedibunga.com; fo=1`. Resend's DKIM
      (`resend._domainkey`) and Return-Path (`send.` subdomain, SPF + MX) are in place too,
      so guardian mail aligns on both DKIM and SPF. `p=none` means reports only, nothing is
      rejected yet — leave it there until the aggregate reports show only our own senders,
      then move to `p=quarantine`.

## Before the event — 3 October 2026

- [x] **The bracket is wired to real players, and the TV view is built** (2026-09-02).
      `matches` table, migration 0009. `/admin` → The bracket builds it from whoever has
      places and takes scores; `/events/<slug>/tv` is the big screen, polling every six
      seconds with no header or footer; the public bracket page polls every four. Names
      are read live from `players`, never stored on a match — so a correction on /admin
      reaches the projector, and a deleted account cannot leave a name on a screen.
      **To try it:** `node scripts/seed-local.mjs gameday` puts 48 invented players with
      places in the LOCAL database only, then build the bracket on /admin and watch the TV
      tab. `00_Docs/TESTING-LOCALLY.md` walks the whole flow.
- [x] **Stations on the bracket** — built 2026-09-05. `/admin` → The bracket now has a
      "Working stations" box and a **Call the next matches** button: it fills whatever
      consoles are free, lowest number first, in bracket order, marks those matches live,
      and the number shows on the projector and the public bracket. A finished match frees
      its station on its own, so pressing it again hands that console to the next match.
      There is a select on each playable row for moving one by hand, because a console
      breaks. The count of working stations is typed in on the day rather than stored on
      the event: eight were promised, one has a dead HDMI port, so it is seven, and that
      is discovered at 09:15.
      `[NOT on the slips, and deliberately. The slips are printed the night before and a
      station is decided on the day — a printed station number that has moved is worse
      than none, and it would send a player to a console somebody else is sitting at.]`
- [x] **Results have their own table** — `matches`, added 2026-09-02. Player ids and
      scores, no names and nothing personal, so it is safe to keep indefinitely and the
      trophy cabinet does not empty itself when registrations are purged.
- [x] **Record a photography objection against a registration** — built 2026-09-05.
      A moderator records it from `/admin/entries` → a person → Photography, and the names
      appear as a **Do not photograph** list under the event on `/admin`, for reading out
      before the doors open. Narrowed to people who actually have a place; the entries
      table carries a "no photos" marker on anybody who objected, applicants included.
      Deliberately no field for the reason or the scope — see invariant 20. DPIA risk 18
      is closed; what is left is a person reading the list, which is on the on-the-day
      checklist.
- [x] **Check-in on the day** — built 2026-09-03. `/admin/checkin/slips` prints one slip
      per player (public name, reference, QR code, 18 to an A4 sheet); `/admin/checkin` is
      the desk: camera decodes with jsQR, and the same page carries a name-and-reference
      list that does exactly the same thing for a slip that will not scan or a player who
      never picked one up. Five outcomes are named rather than collapsed into worked/didn't,
      and `already` carries the time of the first scan. Migration 0012 records when somebody
      arrived and which volunteer said so. Undo is on the list, because scanning the wrong
      slip off a table is a silent mistake.
      `[SETTLED 2026-09-05: stations are on the bracket and NOT on the slip — see the
      stations item above for why.]`
- [x] **Reminder email** with the venue address and what to bring — built 2026-09-05.
      `/admin` → The reminder email, which says how many have a place and how many have
      already had it. Everybody with a place gets one; an under-18's guardian gets a
      separate one with the collection rule on it. It is the only email that carries the
      street address. Idempotent on the entry reference, so pressing it again after
      backfilling drop-outs emails only the new people. Deliberately a button and not a
      cron job: a schedule cannot be told the hall changed. **Nothing is sent under
      `npm run dev`** — the whole text is printed in the terminal instead, which is the
      only way to read the wording without emailing a child.
- [x] **Give the desk volunteers access** — solved properly 2026-09-03 rather than by
      handing out moderator. There are now two roles: `desk` (the arrival desk and nothing
      else) and `moderator` (everything). Add people on `/admin/people` — any email
      address, an account is created if they have never been here, and they sign in with a
      link. Do it before the day, and check the page does not flag them "never signed in".
      `[DECIDE: how many people should hold FULL moderator. The technical control is now a
      button an existing moderator can press, so the real control is who you give it to.]`
- [x] **A real volunteer sign-up form** — built 2026-09-05. `/volunteer` ends in a form
      instead of a link to the support form, so an offer of help is no longer a paragraph
      of prose somebody has to classify. It asks the three things that decide anything —
      which jobs, when they can be there, and whether they hold a current enhanced DBS
      (yes / no / not sure, and **never a certificate number**) — plus one person who will
      vouch for them. `/admin/volunteers` is the queue, and it names the roles nobody
      confirmed has taken, which is the actual gap in a rota of fifteen.
      `[OWED BACK: how long a volunteer record is kept. Nothing deletes one — no duration
      has been decided, so no purge is written (invariant 21). It is on the meeting list,
      and the page says so where a moderator can see it.]`

## After the event

- [ ] Trophy cabinet populated from real results (`/players` shows a placeholder). The
      results now exist and survive: `matches` holds player ids and scores, profiles are
      kept indefinitely, and only the registration is deleted at twelve months. So the
      cabinet reads `matches` joined to `players` — never `registrations`, which is the
      trap it was in the backlog to avoid.
- [ ] Sponsor offers for profile holders — described as "coming" on `/join` and `/profile`
      (`src/data/profile-benefits.ts`); nothing goes live until a sponsor has agreed one.
- [ ] Move rate limiting into D1. `src/lib/rate-limit.ts` is in-memory, so it is
      per-instance and resets on deploy.
- [ ] Delete `src/lib/play-seed.ts` if the board is ever launched with real players.

## The flag is open

`SWC_REGISTRATION_OPEN` was set on 2026-09-01, after the meeting reported the safeguarding
lead and deputy named, the DBS list confirmed, insurance covered by the venue and the DPIA
signed off. **Real children can enter from any browser now.** That changes what a mistake
in this repository costs: a bad deploy is no longer a broken preview, it is a form a parent
is filling in.

One thing is owed back to that decision and is not a code task: **it is not written down**
anywhere in `04_Legal/DPIA.md` — no names, no signature, no date. See
`MEETING-QUESTIONS.md` item 2.

`SWC_BOARD_OPEN` is still off and its own decision has not been taken. It also depends on
a PlayStation ID, which is no longer collected — so opening it means asking for one again.

## Deliberately not being done

- **Peer-to-peer messaging of any kind.** Removed, and staying removed.
- **The Looking For Game board.** Built and switched off (`SWC_BOARD_OPEN`). Launching it
  needs the guardian approval flow, a staffed moderation rota, and a decision nobody has
  taken.
- **Under-16 board access.**

## Adding a second event

1. Create `src/data/events/your-event.ts` exporting a `ChampionshipEvent`
2. Add it to the array in `src/data/events/index.ts`

That is it — homepage, events list, event page, interest form, footer and bracket all read
from there. Event-specific questions go in that event's `formFields`. Anyone with a profile
registers interest without filling in their details again.
