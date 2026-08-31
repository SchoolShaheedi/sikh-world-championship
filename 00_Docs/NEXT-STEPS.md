# Next steps — the build

**This file is the development backlog and nothing else.** Rewritten in round 46 to hold
only work that is done in this repository, by the person who writes the code.

Anything that needs a meeting, a policy, a signature, a purchase or a person on the floor
lives in `00_Docs/MEETING-QUESTIONS.md`. That was the point of splitting them: a build
backlog with insurance quotes and DBS checks in it is a backlog that stops the build.

Ordered by what it costs to leave undone.

## Now

- [ ] **Do the rehearsal.** `/testing?key=…` opens real registration for one browser while
      the public form stays closed. One entry end to end: form → guardian email → magic
      link → `/admin` → draw → offer email → delete the entry. Roughly half an hour, and it
      will find things. The link is in the Keychain as `swc-test-key`; runbook in
      `00_Docs/TESTING-REGISTRATION.md`.
- [ ] **Rotate the Cloudflare and Resend keys.** Both have been exposed in transcripts on
      disk. The mechanism that caused it is fixed (`00_Docs/SECRETS.md`); the keys
      themselves are still live. `./scripts/secrets-to-keychain.sh`, then
      `python3 scripts/scrub-transcripts.py --write` with this session closed.
- [ ] **Set the DMARC record** — `_dmarc` TXT, `v=DMARC1; p=none;
      rua=mailto:media@shaheedibunga.com; fo=1`. Without it the guardian notification is
      much more likely to be filed as spam, and a safeguarding email in a junk folder is
      worse than one never promised. Needs Zone → DNS → Edit on the API token, which the
      current one does not have.

## Before the event — 3 October 2026

- [ ] **Wire the bracket to real registrations.** It renders demo entrants outside
      production and an honest placeholder inside it. The name to show is `publicName()` —
      the player's chosen handle, never the real name and never the PSN ID.
- [ ] **Record results in their own table, not by reading `registrations`.** New in round
      46 and easy to miss: registrations are deleted 12 months after the event, so a trophy
      cabinet that derives from them empties itself in October 2027. Results should hold the
      handle and the placing, and nothing else — which is also the only version of a results
      table that is safe to keep indefinitely.
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

## One flag, held by other people

`SWC_REGISTRATION_OPEN` is off in production and opening it is a **safeguarding decision,
not a technical one**. Everything the code owed is built: data is stored properly, the
guardian notice sends, deletion runs nightly, an erasure request is a button, and a
registration now has an end date. What is left is in `MEETING-QUESTIONS.md` — the named
safeguarding lead and deputy, the DBS list for the day, insurance, and signing the DPIA.

Nothing above is blocked on that flag. The rehearsal path exists precisely so it is not.

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
