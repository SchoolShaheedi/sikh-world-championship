# Sikh World Championship

Multi-event competition platform for Sikhs. **Sikh FIFA 26 Championship** is event 1.

> This repository covers the whole project — the app, the decision log and the
> design/research docs. `DECISIONS.md` is the running record of what was chosen and why;
> read it before changing anything substantial.

Not to be confused with `3_Sikh_Chess_Championship/` — that is a separate,
standalone project, deliberately not an SWC event.

## Layout

```
DECISIONS.md            the running decision log — read this first
00_Docs/                BRAINSTORM, FEATURE-IDEAS, PLAYER-CARDS,
                        CHAT-AND-SAFETY, ONLINE-PLAY-AND-CHAT
01_Brand/               (empty — logo, palette, typography)
02_Events/              one folder per event; Sikh FIFA 26 Championship
                        has Rules, Marketing, Brackets, Registrations
03_App/
  web/                  the Next.js 16 + Tailwind 4 app
  docs/                 DATA-LAYER.md, NEXT-STEPS.md
04_Legal/               (empty — safeguarding policy, terms, insurance)
05_Partners_Sponsors/   (empty)
```

Empty folders above are deliberate placeholders, not leftovers.

## Running the app

```bash
cd 03_App/web && npm install && npm run dev
```

## Safeguarding

The app holds guardian contacts and children's medical notes. Read
`03_App/docs/DATA-LAYER.md` before touching the data layer, and
`00_Docs/CHAT-AND-SAFETY.md` before touching anything player-facing.
