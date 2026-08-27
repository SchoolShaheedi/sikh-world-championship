# Sikh World Championship

Multi-event competition platform for Sikhs. **Sikh FIFA 26 Championship** is event 1.

> This repository covers the whole project — the app, the decision log and the
> design/research docs. `DECISIONS.md` is the running record of what was chosen and why;
> read it before changing anything substantial.

Not to be confused with `3_Sikh_Chess_Championship/` — that is a separate,
standalone project, deliberately not an SWC event.

## Layout

Top-level folders are `NN_Name`, numbered so they sort in the order you meet them.
Everything that is not code is a numbered folder; the code lives in `03_App/`.

```
DECISIONS.md            the running decision log — read this first
00_Docs/                all project documentation (see index below)
01_Brand/               logo masters, palette, typography, avatar artwork
02_Events/              operational paperwork, one folder per event slug
03_App/
  web/                  the Next.js 16 + Tailwind 4 app
04_Legal/               privacy notice, DPIA, safeguarding policy, insurance
05_Partners_Sponsors/   sponsorship deck, partner agreements, sponsor logos
```

Every folder has a `README.md` explaining what belongs in it. The ones outside `03_App/`
are mostly empty so far — each README lists what is still needed, and `04_Legal/` is
currently the largest gap in the project.

### 00_Docs index

| Doc | What it covers |
|---|---|
| `NEXT-STEPS.md` | The live backlog — what is built, what blocks launch |
| `DEPLOYMENT.md` | Cloudflare hosting: what works, what 500s, and why it is not live |
| `DATA-LAYER.md` | Storage design; **read before touching any store** |
| `CHAT-AND-SAFETY.md` | Safeguarding reasoning behind the player-facing features |
| `ONLINE-PLAY-AND-CHAT.md` | The LFG board and why free-text chat is deferred |
| `PLAYER-CARDS.md` | Player card design and the Panj Gun stats |
| `BRAINSTORM.md`, `FEATURE-IDEAS.md` | Early and parked ideas |
| `DESIGN-AUDIT.md`, `HERO-OPTIONS.md`, `3D-ANIMATION-RESEARCH.md` | Design and 3D work |

## Running the app

```bash
cd 03_App/web
npm install
cp .env.example .env.local   # optional — every var has a working default
npm run dev                  # http://localhost:3000
npm test                     # 72 tests
npx tsc --noEmit             # typecheck
```

## Safeguarding

This is the part to get right. The app holds guardian contacts and children's medical
notes, and event 1 is open to ages 8+.

- Read `00_Docs/CHAT-AND-SAFETY.md` before touching anything player-facing
- Read `00_Docs/DATA-LAYER.md` before touching the data layer
- `04_Legal/README.md` lists the paperwork that must exist before real registrations open

Never commit anything from `.data/` — it holds real submissions and is gitignored.
