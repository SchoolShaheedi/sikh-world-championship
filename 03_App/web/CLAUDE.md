@AGENTS.md

# Sikh World Championship — working notes

Read `../../DECISIONS.md` before changing anything substantial. It is the running record
of what was chosen and why, by round. `../../00_Docs/NEXT-STEPS.md` is the live backlog.

## What this is

A multi-event competition platform. **An event is data, not code**: adding one means
adding `src/data/events/<slug>.ts` and registering it in `src/data/events/index.ts` —
homepage, events list, event page, sign-up form and bracket all pick it up. Never
special-case an event in a component.

## This app holds children's data

Event 1 is open to ages 8+. The stores hold guardian contact details and children's
medical notes. That single fact drives most of the rules below.

- Read `../../00_Docs/DATA-LAYER.md` before touching a store
- `../../04_Legal/README.md` lists the paperwork that must exist before real sign-ups

## Invariants — do not weaken these without a decision in DECISIONS.md

1. **No free text or messaging between players, anywhere.** Posts and requests are built from fixed
   moderation rota is staffed. The only free-text fields in the app are the support form
   and a report's `detail`, and both go to moderators only — never to another player.
2. **Age-band segregation is enforced in the data layer, not the UI.** U16 and 16+ are
   separate pools. Checked in `boardFor()` *and* again in `createRequest()`, because a
   request is the moment two people actually connect.
3. **Both guardians are notified on every connection.** Accepting a request exchanges
   gamertags in both directions, so both children's guardians are told. Locked by
   `src/app/play/guardian-notification.test.ts`.
4. **Gamertags are released only on an accepted request**, to those two players. They are
   the one piece of data that lets someone make contact outside the platform.
5. **A guardian email never comes from a form a child can fill in.** It comes from the
   registration record.
6. **The UI is not a security boundary.** Every server action re-checks the gate. Values
   arriving from a client are only accepted if they appear in our own lists — see
   `pick()` in `src/app/play/actions.ts` and `src/lib/registration-schema.ts`.
7. **Access decisions fail closed.** `currentPlayer()` returns `SessionPlayer | null`;
   there is no fallback viewer. It once returned a fixed player who was also a moderator,
   which made `/moderation` readable by anyone. Nothing may invent a viewer again.
   Moderator is a database grant — `setModerator()` in `src/lib/players.ts` — with no
   button anywhere in the app.

## Things that are stubs, not finished work

Each one is load-bearing and each one is a launch blocker. Do not build features that
assume they work.

| File | Reality |
|---|---|
| `src/lib/session.ts` | Returns a fixed demo player. No auth exists. |
| `src/lib/notify.ts` | Every notification only `console.info`s. **No email sends.** |
| `src/lib/rate-limit.ts` | In-memory, so per-instance. Move it into D1 before relying on it. |
| `src/lib/play-seed.ts` | Demo data. Delete once real players exist. |

`/safeguarding` makes public promises that the stubs above do not yet keep. Treat a gap
between that page and the code as a bug in the code *or* the page — never as acceptable.

## Storage is Cloudflare D1

The stores were JSON files until round 30; they are now D1. Schema in `migrations/`,
access layer in `src/lib/db.ts`. Read `../../00_Docs/DATA-LAYER.md` before touching one.

- Add a column with a new numbered file in `migrations/`, then
  `npx wrangler d1 migrations apply swc-production --local` (and `--remote` to deploy it).
- Medical, dietary and accessibility live in their **own columns**, not in the `answers`
  JSON, so `purgeMedical()` can delete them while keeping the registration — that is what
  makes `04_Legal/RETENTION-POLICY.md` enforceable. Do not move them into `answers`.
- Only event-specific answers (`psnId`, `skill`) belong in the `answers` column.

## Two feature flags gate the player-facing features

`src/lib/features.ts`. Both default **off in production, on in development**.
`SWC_REGISTRATION_OPEN` and `SWC_BOARD_OPEN`. Turning registration on is a **safeguarding
decision**, not a technical one — read `04_Legal/DPIA.md` first. `SWC_REGISTRATION_DEMO`
renders the real form and skips only the write, for showing people the flow.

## Commands

```bash
npm run dev                      # http://localhost:3000
npm test                         # 125 tests
npx tsc --noEmit
npm run lint
npm run build
npm run cf:preview               # run the built Worker in workerd — catches what
                                 # `next dev` cannot, e.g. anything touching node:fs
npm run cf:deploy
```

Tests run against an in-memory SQLite database with the real migrations applied
(`src/lib/test-helpers.ts`), so they never touch real data and never need workerd. Keep it
that way — a test suite people are afraid to run is a test suite nobody runs.

**`next dev` is not the deploy target.** Workers has no filesystem: `node:fs` works
locally and fails or silently returns nothing in production. That cost us the site logo
once (round 30). Anything filesystem-shaped must be resolved at build time — see
`scripts/brand-manifest.mjs`.

## Conventions

- Comments explain *why*, especially for a safeguarding trade-off. The existing code does
  this heavily; match it rather than stripping it.
- Safety-critical logic gets a test that fails without the fix.
- Never commit a real registration — not to `02_Events/`, not anywhere.
