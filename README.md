# Sikh World Championship — web app

Mobile-first Next.js app. Multi-event by design: an event is data, not code.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Structure

```
src/data/org.ts            Brand config — name, contacts, socials, safeguarding leads
src/data/events/           One file per event. Add a file, add it to index.ts, done.
src/data/avatars.ts        Player card avatar definitions
src/lib/types.ts           Domain model — read this first
src/lib/bracket.ts         Seeding, bracket generation, advancing winners
src/lib/store.ts           Registration storage (DEV ONLY — see docs/DATA-LAYER.md)
src/components/            Logo, Avatar, PlayerCard, TrophyCabinet, BracketView, SignupForm
src/app/                   Routes
```

## Routes

| Route | What it is |
|---|---|
| `/` | Organisation homepage |
| `/events` | All events, upcoming and past |
| `/events/[slug]` | Event details, rules, prizes |
| `/events/[slug]/signup` | Registration form |
| `/events/[slug]/bracket` | Live bracket (demo data for now) |
| `/players` | Player card + trophy cabinet preview |
| `/safeguarding` | Safety policy — parents read this before signing kids up |
| `/about`, `/sponsors`, `/volunteer` | Org pages |

## Things worth knowing

- **Division is derived from date of birth**, never chosen. Nobody can enter the wrong
  age group.
- **The guardian section appears automatically** when the DOB makes the player under 18.
- **Capacity is enforced per division** (32 each). Overflow goes to a waitlist with a
  queue position; `promoteFromWaitlist()` moves people up when someone withdraws.
- **Photos are optional.** Avatars are the default, drawn as SVG — no image assets.
- **Storage is a JSON file right now.** Read `docs/DATA-LAYER.md` before going live.
