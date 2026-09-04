@AGENTS.md

# Sikh World Championship — working notes

Read `../../DECISIONS.md` before changing anything substantial. It is the running record
of what was chosen and why, by round. `../../00_Docs/NEXT-STEPS.md` is the live backlog.

## What this is

A multi-event competition platform. **An event is data, not code**: adding one means
adding `src/data/events/<slug>.ts` and registering it in `src/data/events/index.ts` —
homepage, events list, event page, interest form and bracket all pick it up. Never
special-case an event in a component.

**Registration is for the PLATFORM, not for one event** (round 42). A person creates one
profile and then registers interest in each event. The routes follow that shape:

| Route | What it is |
|---|---|
| `/join` | The front door. Explains what a profile is, then hands off to an event. |
| `/events/<slug>/register-interest` | The form. Creates the profile *and* records interest. |
| `/signin` | Magic link, for anyone who already has a profile. |
| `/profile` | Their own record. |
| `/admin` | Counts, the draw, and running the bracket. Moderators only. |
| `/events/<slug>/tv` | The big screen in the hall. No chrome, polls, not indexed. |
| `/moderation` | Reports and the support queue. Moderators only. |

`/events/<slug>/signup` is a permanent redirect to `register-interest`; it was the URL
until round 42 and is in things already shared.

## This app holds children's data

Event 1 is open to ages 12–21. The stores hold guardian contact details and children's
medical notes. That single fact drives most of the rules below.

- Read `../../00_Docs/DATA-LAYER.md` before touching a store
- `../../04_Legal/README.md` lists the paperwork that must exist before real sign-ups

## Invariants — do not weaken these without a decision in DECISIONS.md

1. **No free text or messaging between players, anywhere.** The only free-text fields in
   the app are the support form and a report's `detail`, and both go to moderators only —
   never to another player.
2. **Age-band segregation is enforced in the data layer, not the UI.** U16 and 16+ are
   separate pools. Checked in `boardFor()` *and* again in `createRequest()`, because a
   request is the moment two people actually connect.
3. **A guardian email never comes from a form a child can fill in.** It comes from the
   registration record.
4. **An under-18 registering means their guardian is emailed**, at submission, saying what
   was agreed on their behalf and how to stop it. `src/lib/interest.ts`. It is the only
   check that a real adult knows — everything else on that form was typed by whoever was
   at the keyboard.
5. **The UI is not a security boundary.** Every server action re-checks the gate. Values
   arriving from a client are only accepted if they appear in our own lists — see
   `pick()` in `src/app/play/actions.ts` and `src/lib/registration-schema.ts`.
6. **Access decisions fail closed.** `currentPlayer()` returns `SessionPlayer | null`;
   there is no fallback viewer. It once returned a fixed player who was also a moderator,
   which made `/moderation` readable by anyone. Nothing may invent a viewer again.
   **TWO ROLES since 2026-09-03.** `is_moderator` grants everything; `is_desk` grants the
   arrival desk and nothing else. Read `canWorkDesk` (or `hasDeskAccess()`) on a desk gate
   and `isModerator` everywhere else — never `isDesk` alone, because a moderator never has
   that flag set.
   **The "no button anywhere" rule is now NARROWED, not dropped.** Both roles are grantable
   from `/admin/people` by an existing moderator. A deliberate weakening (DECISIONS.md
   round 53) with compensating controls: the desk no longer *needs* the big grant, which
   was the actual problem; every grant and revocation goes to `staff_grants` with the
   actor's email; a moderator cannot revoke their own moderator role, and the last
   moderator cannot be revoked at all; and the page states what each role can see instead
   of hiding it in help text. `scripts/grant-moderator.mjs` remains, for the first
   moderator and for a lock-out.
7. **Nothing invented is ever rendered in production.** `showDemoData()` in
   `src/lib/features.ts` has no environment-variable override, deliberately: a bracket of
   plausible invented names is not a broken page, it is a convincing lie on a projector.
8. **A PlayStation ID is not collected at all** (2026-09-01), and was never public before
   that. It is a *contact route*, not a label: search one and you can message a child. The
   bracket, the projector and the player card show the tournament handle from
   `src/lib/handle.ts` via `publicName()` — never the full name. The handle is still
   refused if it contains the entrant's surname, in the browser and again in
   `validateRegistration`. `checkHandle` also refuses a PSN ID when one is passed; nothing
   passes one now, and that arm is kept rather than deleted because opening the Looking
   For Game board would need IDs again.
9. **A retention duration is decided before the code that enforces it is written**, and
   only the team decides it. Every rule in `src/lib/retention.ts` matches a figure in
   `04_Legal/RETENTION-POLICY.md` with the brackets taken off. What runs automatically:
   medical fields at 30 days, check-in tokens the day after, and the whole registration at
   **12 months from the event date**. What does NOT: **profiles are kept indefinitely**
   (2026-09-01) — `DORMANT_PROFILE_AUTO_PURGE = false`, and the same code now runs only
   from a moderator's button on `/admin`. Do not switch that back on; it is a decision, not
   an oversight, and there are tests asserting the nightly job leaves profiles alone.
10. **One place knows every table keyed to a player.** `ACCOUNT` deletion goes through
    `deleteAccount()` in `src/lib/account-delete.ts` — the retention job and the admin
    delete button both use it, and they differ only in `deleteRegistrations`. Adding a
    table that stores a player id means adding a line to that cascade. Every deletion,
    manual ones included, is recorded in `retention_runs`: "did you delete it?" is the one
    question a subject access request always asks.
11. **User-supplied text is escaped before it reaches email HTML.** `esc()` in
    `src/lib/email-templates.ts`. A "name" containing an anchor tag would otherwise put an
    attacker's link inside a safeguarding email sent from our verified domain to a parent.
12. **A condition of entry is stated, never disguised as a choice.** Photography is a
    condition of registering (round 47, the team's instruction). That is theirs to decide;
    how it is presented is not. There is no tick box that cannot be unticked, no
    pre-checked box, and no wording calling it consent — the form states it, the
    confirmation email states it, the guardian email states it in full before the day, and
    each statement names the way out. `validateRegistration()` sets `photoConsent` itself
    rather than trusting a client, so an omitted field cannot quietly become a refusal on
    the photographers' list. DPIA risk 18. **Nothing on the site promises messaging of any
    kind** — WhatsApp event news was added in round 47 and withdrawn the next day; email is
    the only channel, and adding another means the privacy notice and both emails change
    with it.
13. **A printed check-in code is an identifier, not a credential to trust.** The slips lie
    face-up on a table and anyone in the hall can photograph one, so possession must never
    be sufficient to mark a child present. Every check-in goes through
    `src/app/admin/checkin/actions.ts`, which re-checks the moderator gate: the authority
    is the volunteer's session, the token only says which row to write. There is
    deliberately **no public check-in route and no self-service scanner** — that shape
    moves the authority onto the thing lying on the table. A second use reports the time of
    the first rather than succeeding again, and the nightly job blanks every token the day
    after the event. What a slip may carry is what the projector already shows: the public
    name and the reference, never a surname, a date of birth, a phone number or an email.
14. **`next dev` prints email, it does not send it.** `src/lib/email.ts`. The Resend key is
    loaded from the Keychain by `.envrc`, so a laptop reaches the live account — which meant
    a rehearsal either got a 422 (Resend rejects `@example.com`) or, with a real address,
    put an actual guardian notice in an actual inbox from our verified domain about a child
    who does not exist. Held on `NODE_ENV === "development"` specifically, because vitest
    runs as `test` and the suite asserts the real send path against a mocked fetch;
    `SWC_EMAIL_DEV_SEND=true` is the way out. Every held email is still recorded as
    **failed** — only a 200 from Resend records `sent`, and "we chose not to send it" is
    not delivered. The body is printed off production only: a child's details are in that
    text.
15. **A URL in an email comes from the request, and the Host header is trusted only when
    it is localhost.** `src/lib/site-url.ts`. Three places used to build this string
    themselves and two were wrong in opposite directions: the sign-in link fell back to the
    production domain, so a link generated on a laptop pointed at a site where the token
    does not exist; the guardian approval link fell back to `http://localhost:3000`, which
    would have put a localhost link in a parent's email the day the board was switched on.
    Deriving it from the request is the only thing that is right in every environment, and
    the localhost-only trust rule is what stops a supplied Host header turning a sign-in
    email into a token handed to whoever sent the header. The session cookie's `Secure`
    flag comes from the same resolved base, so signing in works over plain http locally and
    can never be weakened in production. Do not add a fourth place that builds it by hand.
    **Inside a Worker there is no host to read** — `Host` is a forbidden header name in the
    fetch spec — so under `cf:preview` this resolves to the production constant and a
    sign-in link generated there points at the live site. Production is unaffected, since
    the constant is the right answer there. Test sign-in with `npm run dev`.
16. **No secret is ever a literal in a file in this tree.** API keys live in the macOS
    Keychain and are loaded by `.envrc.local`, which contains lookups and no values —
    `scripts/secrets-to-keychain.sh` writes it. Two leaks came from that file being read
    aloud into a transcript; git was never involved. `.claude/hooks/deny-secret-reads.py`
    refuses the commands that would print one.

## The registration lifecycle

```
register interest ──> profile created + application recorded ──> emails out
        │                    (src/lib/interest.ts)
        │
        └──> draw (src/lib/draw.ts, referred pool first) ──> selected / not selected
                     │
                     └──> confirmSelection() issues the check-in token (src/lib/selection.ts)
```

A check-in token is the credential that marks someone present, so it is issued **only** on
selection, never at submission.

## The arrival desk

Sixty-four people, most of them children, over about forty minutes at one door.

```
confirmSelection() issues check_in_token
        │
        ├──> /admin/checkin/slips   one slip per player: public name, reference, QR code
        │                           printed, cut, laid out on a table in first-name order
        │
        └──> /admin/checkin         camera decodes (jsQR) ──> scanPass() ──> checkInByScan()
                                    manual list          ──> checkInManually() ──> checkInByReference()
                                                             both land in the same mark()
                                             │
                                             └──> markDobSeen() ──> setDobVerified()
                                                  separate step, never a gate
```

* `src/lib/qr.ts` **encodes** (qrcode-generator, server-side SVG); jsQR **decodes** in the
  browser. `qr.test.ts` encodes with ours and decodes with theirs — two independent
  implementations agreeing is the only test that would catch a Reed–Solomon mistake, and a
  code that does not scan is only discoverable at a door with a queue behind it.
* The payload is `SWC1:<token>`. The prefix exists so the desk can say "that is not one of
  our passes" (somebody's loyalty card) separately from "that pass is not on today's list"
  (escalate) — two situations needing two different actions.
* **Every outcome is named**: `checked-in`, `already`, `not-eligible`, `wrong-event`,
  `not-a-pass`, `unknown`. `already` carries the time of the first scan, because a double
  scan a second later and a slip somebody else used half an hour ago are indistinguishable
  without it, and only one of them means a child is unaccounted for.
* **The manual list is not a fallback bolted on.** It shares `mark()`, so it writes the
  same audit row. A fallback that records less becomes the normal route and takes the
  record with it.
* Every action returns the **whole roster**, so the "31 of 64 arrived" counter is a fact
  rather than one tab's opinion — which matters as soon as two volunteers use two devices.
* `checkInRoster()` **never returns a token**: it feeds a client component whose props are
  serialised into a page left open on a desk all day. `checkInSlips()` is the only thing
  that reads tokens, and only the print page calls it.
* **Proof of date of birth is required of every player** (2026-09-03) and is a *separate*
  one-tap step, never a gate. `checked_in_at` and `dob_verified_at` are different columns
  because who is in the building must be right even while the ID question is not — a
  register that refuses to admit somebody standing in the hall is simply wrong. There is a
  test asserting a check-in succeeds with nothing verified. `src/data/id-check.ts` is the
  single source of truth for the accepted documents and for `ID_NO_DOCUMENT_RULE` (nobody
  is turned away by a volunteer; the safeguarding lead decides), and the form, the event
  page, both emails and the desk all read it.
* **Nothing about the document is stored, ever.** Not its type, its number, an image, or the
  date read off it — only that a moderator saw one, when, and which moderator.
  `migrations/0013_dob_verified.sql` states it and `check-in.test.ts` walks
  `PRAGMA table_info(registrations)` asserting no such column exists. "Passport" against a
  child's name is a nationality signal with no use here. Adding any of it needs a DPIA
  amendment, not a migration.
* No contact details on the desk list, deliberately. A guardian's mobile is exactly what
  you want if a child arrives alone and exactly what should not be on a screen facing a
  queue. `under18` and a one-line `leaving` note are decision support with no contact route
  attached.

## Storage is Cloudflare D1

Schema in `migrations/`, access layer in `src/lib/db.ts`. Read `../../00_Docs/DATA-LAYER.md`
before touching one.

- Add a column with a new numbered file in `migrations/`, then
  `npx wrangler d1 migrations apply swc-production --local` (and `--remote` to deploy it).
- Medical and accessibility live in their **own columns**, not in the `answers` JSON, so
  `purgeMedical()` can delete them while keeping the registration — that is what makes
  `04_Legal/RETENTION-POLICY.md` enforceable. Do not move them into `answers`. (`dietary`
  is one of those columns and is no longer collected; the purge still clears it, which is
  what you want for rows written before 2026-09-01.)
- **A profile holds the reusable contact details** (migration 0010): full name, mobile,
  and for an under-18 the guardian's name, relationship, email and mobile — so a second
  event is a confirmation rather than a retype. Written ONLY from a validated registration,
  never from an editable page, which is what keeps invariant 3 true. And bounded on the day
  they were added: `purgeStaleProfileContact()` clears all six once the person has no
  registration left. **Do not add a field to `players` that the registration purge deletes
  without giving it a rule in that function** — an unbounded copy of a purgeable field
  cancels the purge.
- Three clocks run on one registration row and they are deliberately different lengths:
  the check-in token goes the day after the event, the medical fields at 30 days, and the
  **row itself at 12 months** (`purgeRegistrations()`). Anything you add to this table
  inherits the 12-month clock unless you give it a column and a rule of its own.
- Only event-specific answers (`skill`, `favouriteTeam`) belong in the `answers` column.
- **`matches` holds the live bracket and NO names** (migration 0009). Player ids, scores
  and shape only; the handles on the projector are read from `players` at render time by
  `storedBracket()`. That is what makes a moderator's name correction reach the screen and
  what makes a deleted account leave nothing behind — `deleteAccount()` nulls the ids and
  keeps the row, because a quarter-final is a record of the competition rather than a
  record about a person.
- Widening a `CHECK` constraint means rebuilding the table — SQLite cannot alter one in
  place. See `migrations/0006_handles_and_dormancy.sql`, which carries the existing rows
  over because `retention_runs` is the evidence that deletions happened.

## The live bracket

`matches` in D1, `src/lib/match-store.ts`, `/admin` → The bracket to build it and enter
scores, `/events/<slug>/tv` on the television.

**Polling, not websockets** (decided 2026-09-01). `LiveBracket` fetches
`/api/events/<slug>/bracket` every four seconds (six on the TV) and re-renders only when
the `version` differs. Three things that are load-bearing rather than incidental:

- **`version` is a hash of what is rendered**, matches *and* names — not a timestamp. The
  first attempt used `max(updated_at)`, which missed two changes in the same millisecond
  and missed name corrections entirely, because names are not stored on a match.
- **A failed poll leaves the last good bracket on the screen** and says it is
  reconnecting. A hall staring at a spinner is worse than a hall staring at a bracket that
  is thirty seconds old.
- **A corrected score recomputes the whole board** through `advanceWinners`, rather than
  writing the winner into the next match. A score typed wrong and fixed two minutes later
  is the thing that will actually happen.

To see it working without real registrations: `node scripts/seed-local.mjs gameday`
(local database only, refuses `--remote`). The bracket is built from everyone with a
**place**, needs only two of them, and rounds the field up to the next power of two with
byes resolved before anything is stored — so an event that is not full still plays.

## Two ways to run the draw

Both are honest and neither replaces the other.

| | `src/lib/draw.ts` | `src/lib/external-draw.ts` |
|---|---|---|
| How | seeded Fisher–Yates, here and now | numbers handed to an outside service |
| Proof | the seed is stored; recompute it | the locked mapping + the pasted result |
| Convinces | a developer | a hall |
| Use for | backfilling three drop-outs on a Tuesday | the draw people watch |

**The order of the external one IS the audit.** Lock the numbering → draw elsewhere → paste
the numbers back. A number is meaningful only because the mapping from number to person was
recorded *before* the draw; numbers resolved against a mapping invented afterwards are
indistinguishable from picking the winners by hand. `lockBallot()` therefore cannot be
skipped, and `draws.ballot_list` ties each result to the exact list it was drawn from.

* **The service is given integers and nothing else.** No names, no ages, no references — so
  no processor agreement, no children's names in somebody else's logs, and a picker that
  could not favour a name if it wanted to. `draw_ballots` holds registration ids only, the
  same rule as `matches`.
* **There is only ever ONE list to hand over.** Referred applicants take priority for every
  place, so at most one pool is ever partly filled: either they fit and the general pool is
  drawn, or they do not and the general pool is not drawn at all. `splitPools()` is pure and
  tested on that boundary. Building for two lists would have been building for a case that
  cannot occur.
* **`draws.winners` holds the paste verbatim**, whitespace and commentary included. A tidied
  copy would be our reading of the evidence rather than the evidence. `seed` is the literal
  string `external`, because we did not generate the randomness.
* **`parseWinners()` is forgiving about format and unforgiving about content.** A numbered
  list ("1. 5 / 2. 8") hands us the positions as winners too — caught by arithmetic, since k
  winners always yield 2k numbers, and the message names that cause. Stripping ordinals by
  pattern was rejected: it means guessing which digits were meant, and guessing wrong gives
  a place to the wrong child.
* **A drawn number whose applicant withdrew since the lock is SKIPPED and reported.** Left
  unhandled, a place goes to somebody not coming while a real applicant misses out silently.
* **A locked list never shrinks.** Deleting an entry that is in one is allowed — that is how
  a test row or a bogus one goes, and an erasure request cannot be made to wait for a draw —
  but the numbering does not close up. `Ballot.size` is the count as locked and is what the
  range handed to the service comes from; `entries.length` is the survivors and using it
  put the highest-numbered applicant beyond the range, silently, with no way to draw them.
  Both queries are `LEFT JOIN` for the same reason: under an inner join a deleted row simply
  vanished, and a drawn number that resolved to nobody was passed over without a word.
  `removedSinceLock` says it out loud and the panel asks for a new list.

## Feature flags

`src/lib/features.ts`. **`SWC_REGISTRATION_OPEN` is set to `"true"` in `wrangler.jsonc`
as of 2026-09-01: entries are open to the public and the form writes real children's
records.** That was a safeguarding decision taken at a meeting, not a technical one — read
`04_Legal/DPIA.md` before touching it. `SWC_BOARD_OPEN` is still off and its decision has
not been taken. `SWC_REGISTRATION_DEMO` renders the real form and skips only the write; it
is no longer set anywhere, because it is ignored while entries are open and leaving it set
would imply the form does not save.

**Three states, not two.** Ask `registrationLive()` from `src/lib/testing-access.ts`, never
`registrationOpen()`, at any gate:

| State | Who | What happens on submit |
|---|---|---|
| open | everyone | real write, real emails |
| tester | a browser holding the `SWC_TEST_KEY` cookie | real write, real emails |
| demo | everyone else, when `SWC_REGISTRATION_DEMO` | validates, writes nothing |

The tester state now also carries the **one-click "Fill with test data" button** on the
sign-up form, which completes the whole thing as a 13-year-old (the longest path: guardian
block, on-site supervision, guardian email) and leaves both email boxes blank so a real
inbox gets used. It is gated on `isTester()`, never on `registrationLive()` — with entries
open, that would show it to the public, and a button that types a fake child into a real
form is a fast way to get a fake child into a real draw.

The tester state exists because nothing after the form — the D1 write, the guardian email,
the magic link, the draw, the check-in token — can be tested without a real submission,
and opening the public form to get one is not a risk worth taking for a rehearsal. Set the
key with `npx wrangler secret put SWC_TEST_KEY` (a secret, never a var in
`wrangler.jsonc` — that file is committed and this repo is public), then open
`/testing?key=…` once. `/testing?key=clear` closes it; the cookie expires after 8 hours.

A page in the tester state says so, louder than the demo banner: in demo mode a mistake
saves nothing, in tester mode it saves a real child's details to the live database.

## Commands

```bash
npm run dev                      # http://localhost:3000
npm test                         # 423 tests
node scripts/seed-local.mjs      # 75 invented people, local database only. Stages:
                                 #   entries | places | gameday | (default: everything)
                                 # --clear removes every trace. Refuses --remote.
                                 # ../../00_Docs/TESTING-LOCALLY.md is the walkthrough.
npx tsc --noEmit
npm run lint
npm run build
npm run cf:preview               # run the built Worker in workerd — catches what
                                 # `next dev` cannot, e.g. anything touching node:fs
npm run cf:deploy
node scripts/grant-moderator.mjs you@example.com "Name" --remote
npx wrangler secret put SWC_TEST_KEY   # then open /testing?key=… to test for real

# From a shell direnv has not hooked (an agent's, a script's), the API token is absent and
# wrangler fails with "account is not valid or is not authorized". Not a permissions
# problem — prefix the command instead of exporting anything:
direnv exec ../.. npx wrangler d1 migrations apply swc-production --remote
```

Tests run against an in-memory SQLite database with the real migrations applied
(`src/lib/test-helpers.ts`), so they never touch real data and never need workerd. Keep it
that way — a test suite people are afraid to run is a test suite nobody runs.

**`next dev` is not the deploy target.** Workers has no filesystem: `node:fs` works
locally and fails or silently returns nothing in production. That cost us the site logo
once (round 30). Anything filesystem-shaped must be resolved at build time — see
`scripts/brand-manifest.mjs`.

**Delete `.next` before a deploy that removed or renamed a route.** A stale
`.next/dev/types` referencing a deleted page fails the build quietly and ships the old
route (round 40, `/safeguarding`; round 42, `/events/[slug]/signup`).

## Conventions

- Comments explain *why*, especially for a safeguarding trade-off. The existing code does
  this heavily; match it rather than stripping it.
- Safety-critical logic gets a test that fails without the fix.
- Never commit a real registration — not to `02_Events/`, not anywhere.
