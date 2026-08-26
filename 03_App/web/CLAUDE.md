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

- Read `../../00_Docs/CHAT-AND-SAFETY.md` before touching anything player-facing
- Read `../../00_Docs/DATA-LAYER.md` before touching a store
- `../../04_Legal/README.md` lists the paperwork that must exist before real sign-ups

## Invariants — do not weaken these without a decision in DECISIONS.md

1. **No free text between players, anywhere.** Posts and requests are built from fixed
   menus in `src/lib/play-types.ts`. Free-text chat is deliberately deferred until the
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
7. **Access decisions fail closed.** `stubModeratorAccess()` in `src/lib/session.ts`
   denies by default; it used to return `true`, which made `/moderation` public. Any new
   gate written against the session stub must default to deny.

## Things that are stubs, not finished work

Each one is load-bearing and each one is a launch blocker. Do not build features that
assume they work.

| File | Reality |
|---|---|
| `src/lib/session.ts` | Returns a fixed demo player. No auth exists. |
| `src/lib/notify.ts` | Every notification only `console.info`s. **No email sends.** |
| `src/lib/store.ts`, `play-store.ts`, `guardian-store.ts`, `support-store.ts` | JSON files. No concurrency safety, no encryption at rest, will not survive a redeploy. |
| `src/lib/rate-limit.ts` | In-memory, so per-instance. Move to the DB when deploying. |
| `src/lib/play-seed.ts` | Demo data. Delete once real players exist. |

`/safeguarding` makes public promises that the stubs above do not yet keep. Treat a gap
between that page and the code as a bug in the code *or* the page — never as acceptable.

## Commands

```bash
npm run dev                      # http://localhost:3000
SWC_DEV_MODERATOR=1 npm run dev  # to work on /moderation locally
npm test                         # 104 tests
npx tsc --noEmit
npm run lint
npm run build
```

Tests point the stores at a temp dir via `SWC_DATA_DIR` (`src/lib/test-helpers.ts`), so
running them never touches `.data/`. Keep it that way — a test suite people are afraid to
run is a test suite nobody runs.

## Conventions

- Comments explain *why*, especially for a safeguarding trade-off. The existing code does
  this heavily; match it rather than stripping it.
- Safety-critical logic gets a test that fails without the fix.
- Never commit anything from `.data/`. Never put a real registration in `02_Events/`.
