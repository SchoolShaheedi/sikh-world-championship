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
| `/admin` | Counts and the draw. Moderators only. |
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
   Moderator is a database grant — `scripts/grant-moderator.mjs`, or `setModerator()` in
   `src/lib/players.ts` — with no button anywhere in the app.
7. **Nothing invented is ever rendered in production.** `showDemoData()` in
   `src/lib/features.ts` has no environment-variable override, deliberately: a bracket of
   plausible invented names is not a broken page, it is a convincing lie on a projector.
8. **A PlayStation ID is never public, and never goes on a screen.** It is a *contact
   route*, not a label: search one and you can message a child. The bracket, the projector
   and the player card show the tournament handle from `src/lib/handle.ts` via
   `publicName()` — never `gamertag`, and never the full name. The handle is refused if it
   equals the entrant's own PSN ID or contains their surname, in the browser and again in
   `validateRegistration`.
9. **A retention duration is decided before the code that enforces it is written.** Every
   rule in `src/lib/retention.ts` matches a figure in `04_Legal/RETENTION-POLICY.md` with
   the brackets taken off. A purge running to a guessed number is worse than no purge —
   which is why the registration rule is still unbuilt (DPIA risk 14).
10. **One place knows every table keyed to a player.** `ACCOUNT` deletion goes through
    `deleteAccount()` in `src/lib/account-delete.ts` — the retention job and the admin
    delete button both use it, and they differ only in `deleteRegistrations`. Adding a
    table that stores a player id means adding a line to that cascade. Every deletion,
    manual ones included, is recorded in `retention_runs`: "did you delete it?" is the one
    question a subject access request always asks.
11. **User-supplied text is escaped before it reaches email HTML.** `esc()` in
    `src/lib/email-templates.ts`. A "name" containing an anchor tag would otherwise put an
    attacker's link inside a safeguarding email sent from our verified domain to a parent.
12. **No secret is ever a literal in a file in this tree.** API keys live in the macOS
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

## Storage is Cloudflare D1

Schema in `migrations/`, access layer in `src/lib/db.ts`. Read `../../00_Docs/DATA-LAYER.md`
before touching one.

- Add a column with a new numbered file in `migrations/`, then
  `npx wrangler d1 migrations apply swc-production --local` (and `--remote` to deploy it).
- Medical, dietary and accessibility live in their **own columns**, not in the `answers`
  JSON, so `purgeMedical()` can delete them while keeping the registration — that is what
  makes `04_Legal/RETENTION-POLICY.md` enforceable. Do not move them into `answers`.
- Only event-specific answers (`psnId`, `skill`) belong in the `answers` column.
- Widening a `CHECK` constraint means rebuilding the table — SQLite cannot alter one in
  place. See `migrations/0006_handles_and_dormancy.sql`, which carries the existing rows
  over because `retention_runs` is the evidence that deletions happened.

## Feature flags

`src/lib/features.ts`. `SWC_REGISTRATION_OPEN` and `SWC_BOARD_OPEN` default **off in
production, on in development**. Turning registration on **for the public** is a
**safeguarding decision**, not a technical one — read `04_Legal/DPIA.md` first.
`SWC_REGISTRATION_DEMO` renders the real form and skips only the write, for showing
people the flow.

**Three states, not two.** Ask `registrationLive()` from `src/lib/testing-access.ts`, never
`registrationOpen()`, at any gate:

| State | Who | What happens on submit |
|---|---|---|
| open | everyone | real write, real emails |
| tester | a browser holding the `SWC_TEST_KEY` cookie | real write, real emails |
| demo | everyone else, when `SWC_REGISTRATION_DEMO` | validates, writes nothing |

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
npm test                         # 257 tests
npx tsc --noEmit
npm run lint
npm run build
npm run cf:preview               # run the built Worker in workerd — catches what
                                 # `next dev` cannot, e.g. anything touching node:fs
npm run cf:deploy
node scripts/grant-moderator.mjs you@example.com "Name" --remote
npx wrangler secret put SWC_TEST_KEY   # then open /testing?key=… to test for real
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
