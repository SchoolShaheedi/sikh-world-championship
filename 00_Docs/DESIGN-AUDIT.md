# Design Audit — against the premium-motion-sites quality bar
Date: 2026-08-21

Audited the actual code, not from memory. Verdict: **the hero is genuinely strong; the
page below it is competent but ordinary.** Everything below the fold currently reads as a
well-built Tailwind site rather than a designed one, and that's where the gap is.

## Passing

- **The hero stops you.** Full-bleed cinematic, oversized tight display type, the cursor
  spotlight reveal, arcs with data callouts. This is the strongest thing on the site.
- **One coherent accent story.** Kesri and gold on near-black, no scatter.
- **A signature motion moment.** The spotlight reveal qualifies; we are not relying on
  fades alone.
- **Real tokens.** Palette, radii and borders all come from one set.
- **Reduced motion.** Handled properly everywhere, not as an afterthought.
- **Micro-detailing, partially.** Hairline borders, pills, and the arc data callouts.

## Failing, in order of how much it costs us

### 1. System fonts — the single biggest gap
`ui-sans-serif, system-ui` for the display face. Weight 900 with tight tracking gets us
most of the way, but a system font is the fastest tell that a page was built rather than
designed. **This is the highest-impact, lowest-effort fix available.**

For an esports championship: **Space Grotesk** or **Archivo (900)** for display,
**Inter** for body, **JetBrains Mono** for micro-labels. Loaded through `next/font` so
there's no layout shift and no render-blocking request.

### 2. No mono micro-labels
Uppercase tracked labels are there, but set in the same font as everything else. Mono for
eyebrows, stat labels and section numbers (`01 — EVENTS`) is one of the strongest craft
signals in this style, and it costs one font weight.

### 3. The background is flat below the hero
Zero grain, zero glow past the hero section. Near-black with nothing in it reads cheap at
large sizes. A ~3% noise overlay plus one or two soft radial washes further down the page
is what gives dark pages their depth.

### 4. Only three sections, all the same rhythm
Hero → featured event card → three-up grid → events grid → footer. Three of those are the
same shape. The page has no change of pace and no closing ask.

Missing blocks that genuinely suit this project:
- **A statement/manifesto line** — one oversized sentence about why this exists. Fits the
  "warm community" tone we chose and gives the eye a rest between grids.
- **A stats band** — mirrors the hero arcs further down.
- **A CTA closer** — the page currently ends on a list and then a footer. It should end
  by asking for the sign-up.

### 5. Hover states are thin
Cards only shift border colour. No lift, no glow, no tilt. The primary button has a shine
sweep and a scale, which is good — nothing else responds.

### 6. Scroll reveals don't stagger
Every `.reveal` uses the same range, so siblings animate as one block. An ~80ms stagger
between cards is the difference between "things appear" and "things are choreographed".

### 7. No glass
`backdrop-filter` is used on the nav and nowhere else. Cards are solid fills. A frosted
treatment on one or two surfaces adds the sheen this style depends on.

## Recommended order

**Tier 1 — biggest gain, least work**
1. Real typeface pairing (Space Grotesk / Inter / JetBrains Mono via `next/font`)
2. Noise + ambient glow layer across the page
3. Stagger the scroll reveals

**Tier 2**
4. Card hover: lift + kesri glow
5. CTA closer section
6. Mono micro-labels with section numbering

**Tier 3**
7. Statement/manifesto section
8. Stats band
9. Glass treatment on selected cards

## Deliberately NOT recommended
The skill lists logo marquees, pricing cards and testimonial blocks. A free community
championship has no logos to parade, nothing to price, and no testimonials until after
event one. Adding them would be cargo-culting the gallery look rather than designing for
this project.

---

# Tier 1 — done (2026-08-21)

### 1. Real typeface pairing
- **Space Grotesk** (display) — headlines, weight 700. Carries far more character at 700
  than system-ui did at 900, which was the whole point.
- **Inter** (body).
- **JetBrains Mono** (micro) — eyebrows, section numbers, stat labels, arc numbers.

Loaded via `next/font/google` as CSS variables. Verified: **three files, 110KB total,
zero external requests** — self-hosted and subsetted, with a size-adjusted fallback, so
there's no layout shift and nothing blocks render on Google's servers.

### 2. Page depth
- **Grain**: an inline SVG `feTurbulence` at 3.5% opacity in `overlay` blend, fixed over
  the whole page. No extra request, scales to any display density.
- **Two ambient washes** (kesri top-right, gold lower-left) at very low opacity so the
  page has a light direction instead of being a flat void below the hero.

Both live on a single `.page-grain` class on `<body>` via `::before` / `::after`.

### 3. Staggered reveals
`.reveal-stagger` offsets each child's `animation-range` slightly, so siblings enter in
sequence rather than as one block — **still zero JavaScript**, still native
`animation-timeline: view()`.

### Also done in the same pass
- Section numbering in mono (`01 — THE ORGANISATION`, `02 — WHAT'S ON`).
- Arc numbers and labels moved to mono with tabular figures, which is what makes them
  read as data callouts rather than just text.

# Tier 2 — done (2026-08-21)

### 4. Card hover: lift + glow
One `.lift` class used by every card (10 on the homepage), so they all behave
identically — consistency is most of what makes hover states feel designed. Lifts 4px,
warms the border, and casts a wide low-opacity kesri bloom. A hard shadow on near-black
reads as a mistake; a coloured bloom reads as light. Also `.link-underline` for text
links, which wipes in rather than appearing.

### 5. CTA closer
The homepage used to end on a list of events and then a footer, which meant it never
asked for the thing it exists to ask for. It now closes with
**"64 places. Free to enter. Take one."** — primary sign-up, a secondary "Volunteer
instead" for people who won't compete, and a mono footnote. The hero bloom is echoed
behind it so the page closes on the note it opened with.

### 6. Mono micro-labels across the site
Section numbering on the homepage (`01 — THE ORGANISATION`, `02 — WHAT'S ON`,
`03 — YOUR PLACE`), and the display face applied to page titles on Events, the event
page, Support, Safeguarding and About, which were still on the old generic heading style.

# Tier 3 — done (2026-08-21)

### 7. Statement section
A deliberate change of pace between two grids: one oversized line, lots of air, no card.
**"Sixty-four players will walk in as strangers. They won't walk out as strangers."**
followed by "That's the point. The trophy is the excuse." Serves the warm/community tone
that was chosen for the brand, and gives the eye somewhere to rest.

### 8. Stats band
Four mono figures — 64 places / 1 open division / 3+ matches each / £0 to enter — as a
hairline-divided band. Echoes the hero arcs further down the page.

### 9. Glass
`.glass` applied only where there is something behind it to blur: the three-up cards
(which sit over the page washes) and the CTA closer panel (which sits over its own bloom).
Deliberately not used everywhere — on a flat near-black ground a frosted panel with
nothing behind it just looks like a slightly lighter box.

The homepage now reads: hero → 01 organisation → 02 why → stats → 03 events → 04 closer.
Six changes of rhythm rather than three identical grids.
