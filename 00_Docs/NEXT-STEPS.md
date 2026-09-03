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
      **To try it:** `node scripts/seed-local-bracket.mjs` puts eight invented players in
      the LOCAL database only, then build the bracket on /admin and watch the TV tab.
- [ ] **Stations on the bracket.** The `matches` table has a `station` column and nothing
      sets it. "Report to your station within 5 minutes of being called" is rule 9, and
      the screen is where somebody would read which station. Small, and the difference
      between a bracket and a running order.
- [x] **Results have their own table** — `matches`, added 2026-09-02. Player ids and
      scores, no names and nothing personal, so it is safe to keep indefinitely and the
      trophy cabinet does not empty itself when registrations are purged.
- [ ] **Record a photography objection against a registration.** New in round 47.
      Photography is now a condition of entering, so `photo_consent` is true on every row
      and the only useful list is the opposite one — the people who objected. There is
      nowhere to write that down: it arrives as a support message. Needs a moderator
      toggle on `/admin` → Entries and a "do not film" list for the day. DPIA risk 18, and
      the thing that keeps the wording on the form honest.
- [x] **Check-in on the day** — built 2026-09-03. `/admin/checkin/slips` prints one slip
      per player (public name, reference, QR code, 18 to an A4 sheet); `/admin/checkin` is
      the desk: camera decodes with jsQR, and the same page carries a name-and-reference
      list that does exactly the same thing for a slip that will not scan or a player who
      never picked one up. Five outcomes are named rather than collapsed into worked/didn't,
      and `already` carries the time of the first scan. Migration 0012 records when somebody
      arrived and which volunteer said so. Undo is on the list, because scanning the wrong
      slip off a table is a silent mistake.
      `[LEFT: stations on the slip. A slip could also say which console to go to, which
      would replace a volunteer pointing — but the draw and the station allocation are not
      the same decision and the slips get printed the night before.]`
- [ ] **Reminder email** with the venue address and what to bring. **Unblocked in round
      46** — the venue is confirmed, so `event.venue` is real and `detailsConfirmed` is
      true. Day timings can be filled in when they are settled; the address no longer has
      to wait for them.
- [ ] **Grant moderator to whoever is on the desk.** Check-in is behind the moderator gate
      by design — a printed QR is not a secret, so the authority has to be the volunteer's
      session. That means every person checking people in needs a moderator account, and
      moderator is a database grant with no button:
      `node scripts/grant-moderator.mjs them@example.com "Their Name"`. Two or three
      accounts, done before the day, or there is one laptop and one queue. Note it grants
      access to safeguarding reports and applicants' details too, so it is a real decision
      about a real person and not an ops step.
- [ ] **A real volunteer sign-up form.** `src/app/volunteer/page.tsx` still carries a TODO —
      DBS status, availability and a reference.

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
