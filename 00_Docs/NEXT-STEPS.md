# Next steps

Rewritten in round 42. The previous version described a product from round ~20 — JSON
stores, a session stub, an unlaunched chat-adjacent board, `sikhworldchampionship.com` —
almost none of which is still true. A backlog nobody trusts is worse than no backlog.

Ordered by what it costs to leave undone.

## Rehearsing the real thing (round 45 — available now)

`/testing?key=…` opens real registration for one browser while the public form stays
closed, so the whole path can be tested before any of the blockers below are cleared. The
link is in the Keychain as `swc-test-key`. See `00_Docs/TESTING-REGISTRATION.md`.

- [ ] **Do the rehearsal.** One entry end to end: form → guardian email → magic link →
      `/admin` → draw → offer email → delete the entry. Roughly half an hour, and it will
      find things. Nothing below is a blocker on doing it.
- [ ] **Rotate the Cloudflare and Resend keys.** Both have been exposed in transcripts on
      disk twice. The mechanism that caused it is fixed (`00_Docs/SECRETS.md`); the keys
      themselves are still live.

## Blockers before registration can be switched on

`SWC_REGISTRATION_OPEN` is off in production. Each of these is a reason why.

- [ ] **Confirm the charity's named safeguarding lead and deputy cover SWC events** —
      including the online platform, and that both know they are on call for 3 October
      2026. The names themselves live in the charity's own policy, not in this repo
      (round 43); `04_Legal/SAFEGUARDING-POLICY.md` says so and lists what is still owed.
- [ ] **Confirm the DBS-checked list covers everyone on the floor** on the day, including
      anyone added late.
- [ ] **Decide how long a registration is kept after the event, then build the purge.**
      DPIA risk 14, added in round 44 and now the biggest storage-limitation gap here. The
      policy says `[12]` months and the brackets never came off, so **nothing deletes a
      registration** — an applicant's name, date of birth, email and mobile are held with no
      end date. Blocked on the number, not the code: a purge running to an unconfirmed
      duration is worse than none.
- [ ] **Sign the DPIA** (`04_Legal/DPIA.md`). It has never been signed. Risk 13 (a profile
      with no event behind it) was closed in round 44 at 24 months of no activity, enforced
      and visible on `/admin`. Risk 14 above is what remains.
- [ ] **Set the DMARC record** — `_dmarc` TXT, `v=DMARC1; p=none;
      rua=mailto:media@shaheedibunga.com; fo=1`. Without it the guardian notification is
      much more likely to be filed as spam, and a safeguarding email in a junk folder is
      worse than one never promised. Needs Zone → DNS → Edit on the API token.
- [ ] **Send yourself the full flow end to end on production** — register interest with a
      real address, confirm both emails arrive and read correctly on a phone.

## Blocked on a decision, not on code

See `00_Docs/MEETING-QUESTIONS.md` — venue address, adult capacity, insurance, the
divisions split, the guardian age boundary at 16, which spelling of the name is canonical,
legal structure, sponsors, and how long a registration is kept after the event.

Settled in round 44: **the bracket shows a tournament handle the player chose**, not the
real name and not the PSN ID, and **a profile that never attended is deleted after 24
months of no activity**.

## Build — before the event on 3 October 2026

- [ ] **Wire the bracket to real registrations.** It renders demo entrants outside
      production and an honest placeholder inside it (round 42). **Unblocked in round 44** —
      the name to show is `publicName()`, the player's chosen handle. Nothing else stands in
      the way.
- [ ] **Read through the public names before the day.** `/admin` lists every name that will
      appear, with an inline correction. The refusals at sign-up catch only a player's own
      PSN ID and their surname; an insult or somebody else's name needs a person. 64 rows,
      once, and it is a job on the rota rather than a piece of code.
- [ ] **Check-in on the day** — the token is issued on selection and `checkIn()` exists;
      there is no scanner UI.
- [ ] **Score entry**, so the bracket advances during the event.
- [ ] **Reminder email** with venue and what to bring, once the venue is confirmed.

## Build — after the event

- [ ] Trophy cabinet populated from real results (`/players` shows a placeholder).
- [ ] Sponsor offers for profile holders — the benefit is described as "coming" on `/join`
      and `/profile` (`src/data/profile-benefits.ts`); nothing is live until a sponsor has
      actually agreed one.
- [ ] Move rate limiting into D1. `src/lib/rate-limit.ts` is in-memory, so it is
      per-instance and resets on deploy.
- [ ] Delete `src/lib/play-seed.ts` if the board is ever launched with real players.

## Deliberately not being done

- **Peer-to-peer messaging of any kind.** Removed, and staying removed.
- **The Looking For Game board.** Built and switched off (`SWC_BOARD_OPEN`). Launching it
  needs the guardian approval flow, a staffed moderation rota, and a decision that has not
  been taken.
- **Under-16 board access.**

## Adding a second event

1. Create `src/data/events/your-event.ts` exporting a `ChampionshipEvent`
2. Add it to the array in `src/data/events/index.ts`

That is it — homepage, events list, event page, interest form, footer and bracket all read
from there. Event-specific questions go in that event's `formFields`. Anyone with a profile
registers interest without filling in their details again.
