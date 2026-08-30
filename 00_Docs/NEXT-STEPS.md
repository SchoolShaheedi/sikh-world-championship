# Next steps

Rewritten in round 42. The previous version described a product from round ~20 — JSON
stores, a session stub, an unlaunched chat-adjacent board, `sikhworldchampionship.com` —
almost none of which is still true. A backlog nobody trusts is worse than no backlog.

Ordered by what it costs to leave undone.

## Blockers before registration can be switched on

`SWC_REGISTRATION_OPEN` is off in production. Each of these is a reason why.

- [ ] **Name the safeguarding lead and deputy** — `04_Legal/SAFEGUARDING-POLICY.md` has
      the policy and no people in it. This is the single largest gap.
- [ ] **DBS checks for anyone supervising** — volunteers are already checked; confirm the
      list covers everyone who will be on the floor on 3 October.
- [ ] **Sign off the DPIA** (`04_Legal/DPIA.md`) with the profile-first change from round
      42 reflected: an account now exists for everyone who registers interest, including
      children who are never selected.
- [ ] **Set the DMARC record** — `_dmarc` TXT, `v=DMARC1; p=none;
      rua=mailto:media@shaheedibunga.com; fo=1`. Without it the guardian notification is
      much more likely to be filed as spam, and a safeguarding email in a junk folder is
      worse than one never promised. Needs Zone → DNS → Edit on the API token.
- [ ] **Send yourself the full flow end to end on production** — register interest with a
      real address, confirm both emails arrive and read correctly on a phone.

## Blocked on a decision, not on code

See `00_Docs/MEETING-QUESTIONS.md` — venue address, adult capacity, insurance, the
divisions split, the guardian age boundary at 16, which spelling of the name is canonical,
legal structure, sponsors, and what name to show on a public bracket for a 12-year-old.

## Build — before the event on 3 October 2026

- [ ] **Wire the bracket to real registrations.** It renders demo entrants outside
      production and an honest placeholder inside it (round 42). Needs the name-display
      decision above first.
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
