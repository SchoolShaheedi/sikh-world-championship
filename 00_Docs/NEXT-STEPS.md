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

- [ ] **Wire the bracket to real registrations.** It renders 64 demo entrants outside
      production and an honest placeholder inside it. The name to show is `publicName()` —
      the player's chosen handle, never the real name.
- [ ] **A viewer view for the TV, driven from the laptop.** Decided 2026-09-01: the big
      screen shows the bracket and nothing else — no admin list, no names beyond the
      handles. Score entry happens on `/admin` on a laptop and the TV follows.
      **Recommendation: poll, do not use websockets.** A `setInterval` fetch every 3–5
      seconds against a read-only endpoint is a few lines, survives the venue wifi
      dropping, and reconnects by doing nothing. Durable Objects would be the websocket
      answer on Workers and it is a lot of machinery for a screen that has to change 63
      times in one day.
- [ ] **Record results in their own table, not by reading `registrations`.** New in round
      46 and easy to miss: registrations are deleted 12 months after the event, so a trophy
      cabinet that derives from them empties itself in October 2027. Results should hold the
      handle and the placing, and nothing else — which is also the only version of a results
      table that is safe to keep indefinitely.
- [ ] **Record a photography objection against a registration.** New in round 47.
      Photography is now a condition of entering, so `photo_consent` is true on every row
      and the only useful list is the opposite one — the people who objected. There is
      nowhere to write that down: it arrives as a support message. Needs a moderator
      toggle on `/admin` → Entries and a "do not film" list for the day. DPIA risk 18, and
      the thing that keeps the wording on the form honest.
- [ ] **Check-in on the day.** The token is issued on selection and `checkIn()` exists;
      there is no scanner UI.
- [ ] **Score entry**, so the bracket advances during the event.
- [ ] **Reminder email** with the venue address and what to bring. **Unblocked in round
      46** — the venue is confirmed, so `event.venue` is real and `detailsConfirmed` is
      true. Day timings can be filled in when they are settled; the address no longer has
      to wait for them.
- [ ] **A real volunteer sign-up form.** `src/app/volunteer/page.tsx` still carries a TODO —
      DBS status, availability and a reference.

## After the event

- [ ] Trophy cabinet populated from real results (`/players` shows a placeholder).
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
