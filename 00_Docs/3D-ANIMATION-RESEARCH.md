# 3D & Animation — Research
Date: 2026-08-21

## The headline finding
**The single best 3D effect for this site already exists as a solved problem, costs almost
nothing, and lands exactly where the value is: holographic tilt on the player cards.**

Pokémon Cards CSS (simeydotme/pokemon-cards-css, ~19k stars) does precisely the effect
FIFA Ultimate Team cards have — the card tilts in 3D toward your cursor or thumb, and a
holographic foil sweeps across it as it moves. It's built from CSS custom properties driven
by pointer position, layered gradients, `color-dodge` blend mode and an SVG noise grain.
No 3D library, no WebGL, no model files.

Why it matters here more than on most sites: **the player card is the thing kids screenshot
and post.** A card that catches the light when you tilt your phone is materially more
shareable than a flat one. Every other effect below is decoration; this one does a job.

## What's actually changed in browsers (2026)
Worth knowing, because it changes what needs a library:

- **CSS scroll-driven animations are now broadly supported** — Chrome/Edge 115+,
  Safari 18+, Firefox 132+, around 90% global. `animation-timeline: view()` gives you
  scroll reveals and parallax with **zero JavaScript**, running off the main thread.
  This used to need IntersectionObserver or GSAP ScrollTrigger. It no longer does.
- **View Transitions API** gives smooth cross-page morphs natively.
- **GSAP became 100% free in April 2025**, including ScrollTrigger and SplitText, after
  Webflow acquired GreenSock. So the professional animation library now costs nothing —
  it's a bundle-size decision, not a money one.
- **WebGL2 is at ~97%** browser coverage. The constraint isn't support, it's performance.

## The constraint that should drive every decision here
**Your audience is teenagers on phones, at an in-person event, all day.**

That gives three hard limits most sites don't have:
1. **Mixed and often older Android devices.** Three.js is ~170KB gzipped on its own;
   React Three Fiber pushes a real scene past 1MB. Heavy scenes on mid-range mobile mean
   memory crashes, blank canvases, or 15fps.
2. **Battery.** A continuously-rendering WebGL canvas drains a phone fast. On event day
   people need their phones for the bracket, photos and getting home.
3. **The live bracket runs on a projector for six hours.** Animation there is a liability,
   not a feature. It must be boring and reliable.

So the recommendation isn't "no 3D" — it's **3D where it's shareable, plain where it's
functional.**

## Recommendations, by cost

### Tier 1 — CSS only, no library, near-zero bundle cost
1. **Holographic tilt player cards.** The marquee effect. Tilt + foil sweep + shine
   following the pointer or the phone's gyroscope. This is the one I'd do first.
2. **Scroll reveals** with native `animation-timeline: view()` — sections lifting in as
   you scroll. Zero JS.
3. **Depth parallax on the hero** — a few layers moving at different rates. Zero JS.
4. **Micro-interactions**: button press depth, the trophy cabinet items lifting on hover,
   bracket cards flipping when a score lands.
5. **View Transitions** between pages so navigation feels like an app, not a reload.

### Tier 2 — one library, lazy-loaded, worth considering
6. **A real 3D object in the hero** — a rotating trophy, a football, or the SWC shield —
   built in Three.js, loaded only on capable devices, with a static image fallback.
   Budget: ~200KB, deferred, never blocking first paint.
7. **GSAP** for choreographed sequences (a bracket reveal, a champion announcement).
   Free now. Only worth it if the sequence is genuinely complex — CSS covers most of it.

### Tier 3 — I'd advise against, and say so plainly
8. **A full WebGL stadium/arena scene.** Looks incredible in a case study, and it is
   exactly what will crash on a 4-year-old Android at the venue.
9. **Spline embeds.** Fast to author, but heavy at runtime and you don't control the
   output. Fine for a marketing splash, wrong for a site people use at an event.

## Non-negotiables whatever we build
- **`prefers-reduced-motion` is already respected** in globals.css. Every new effect must
  honour it — some people get motion sickness, and for others it's a genuine access need.
- **Never animate the check-in, sign-up or bracket flows.** Those must work on a bad phone
  on bad wifi in a noisy hall.
- **Progressive enhancement**: the site must be fully usable with every effect stripped.
- Test on a real mid-range Android, not just a desktop Chrome window.

## Sources
- Pokémon Cards CSS — https://github.com/simeydotme/pokemon-cards-css
- Live demo — https://poke-holo.simey.me/
- Holographic Trading Card Effect, CSS-Tricks — https://css-tricks.com/holographic-trading-card-effect/
- CSS scroll-driven animations, MDN — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- Scroll-triggered animations, Chrome for Developers — https://developer.chrome.com/blog/scroll-triggered-animations
- GSAP is now completely free, CSS-Tricks — https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/
- Webflow makes GSAP 100% free — https://webflow.com/blog/gsap-becomes-free
- R3F mobile performance 2026 — https://www.krapton.com/blog/boosting-react-three-fiber-mobile-performance-in-2026-a-deep-dive-d6105c
- Three.js vs R3F vs Babylon.js 2026 — https://www.pkgpulse.com/guides/threejs-vs-react-three-fiber-vs-babylonjs-3d-webgl-2026
- Best 3D websites 2026 — https://mdx.so/blog/best-3d-websites-2026-examples

---

# Build log

## Done — holographic tilt player cards (2026-08-21)
`src/components/HoloCard.tsx` + the `.holo-*` block in `globals.css`.
Pointer, touch and device-tilt all drive the same four CSS custom properties
(`--rx --ry --mx --my`); layered gradients with `overlay` and `color-dodge` do the rest
in the compositor. About 2KB, no library, no WebGL.

`TiltToggle` handles the gyroscope. iOS requires a user gesture before releasing motion
data, so it's a button; Android grants it silently. Declining leaves touch tilt working
and never looks broken.

### Two things worth remembering
**The first pass was far too strong.** Foil at 0.55 opacity swamped the card — the name
was unreadable and bronze, silver and gold were indistinguishable. Now 0.18 (0.14 on
touch devices). Real foil is a sheen you catch at an angle, not a coat of paint. If it's
ever being retuned: go lower than feels right.

**Reading `window` during render breaks hydration.** The support check was originally a
lazy `useState` initialiser, which made the server render the "unsupported" branch and
the client render the button. Moved into the click handler.

### A hydration warning that is NOT a bug
Dev mode logs "Hydration failed" on every page. Investigated: the rendered application
tree is byte-identical (96/96 nodes) and the only difference is three `<script>` tags
Turbopack's HMR client appends to `<body>`. Verified against a production build on port
3100 — zero console errors. Don't chase it.

## Done — 3D trophy hero (2026-08-21)
`src/components/TrophyHero.tsx` (gate + fallback) and `src/components/trophy-scene.ts`
(the Three.js scene). Chosen over a football or the shield: it ties to the championship
framing and reads instantly at small sizes.

**Built procedurally, not from a model file.** Lathe profiles for the cup and stem, a
torus each side for the handles, cylinders for the base. No glTF to download, nothing to
404, and the code is smaller than the model would have been.

**Metal needs something to reflect.** With no environment map a metallic material renders
black. Rather than pull in an HDR file or RoomEnvironment, the scene paints a 64×256
gradient on a canvas and uses it as an equirectangular environment — sky, a warm kesri
band so the gold picks up the brand, and a dark floor. A few KB for believable reflections.

### Measured
- Three.js lands in its **own lazy chunk: 178KB gzipped**, separate from the 638KB of app
  chunks. It is never part of first paint.
- Loaded on `requestIdleCallback`, so it waits until the browser has nothing better to do.

### The protections, all verified working
- **Capability gate** (`shouldRender3D`): skips 3D on reduced-motion, data-saver,
  <4GB RAM, <4 cores, or no WebGL2. Deliberately conservative — a static trophy is a fine
  outcome, a crashed tab is not.
- **The SVG fallback renders first and always.** The 3D fades in over it. If anything
  fails the page still looks finished — that is the whole design, and for a lot of
  visitors the SVG *is* the version.
- **The render loop pauses off-screen and in background tabs.** Confirmed accidentally:
  during testing the canvas stayed blank, and the cause turned out to be
  `document.visibilityState === "hidden"` in the preview pane. The battery logic was
  working exactly as intended.
- **Explicit disposal** of geometries, materials, textures and the renderer on unmount.
  WebGL contexts are not garbage collected like plain objects; leaking one per navigation
  will eventually crash a phone.
- DPR capped at 1.5 on phones, 2 elsewhere. This is the single biggest mobile lever —
  a 3x device would otherwise render nine times the pixels.
- `powerPreference: "low-power"` so it never wakes a discrete GPU.

### Lesson worth keeping
The original `.catch()` swallowed scene failures silently, which meant a broken scene
looked identical to a device that had been correctly filtered out — and cost time to
diagnose. It now logs in development.

## Done — design overhaul after motionsites.ai (2026-08-21)
Neutral near-black ground, huge stacked uppercase display type (900 weight, 0.86
line-height, -0.035em tracking), gradient flare word, pills everywhere, hairline card
edges, ambient bloom. See DECISIONS.md round 14.

Scroll reveals shipped with native `animation-timeline: view()` — no JS, no
IntersectionObserver, `@supports`-guarded so content can never be stuck invisible.

## Next, in order
- [ ] Hero depth parallax
- [ ] Micro-interactions: button depth, trophy hover lift
- [ ] View Transitions between pages
- [ ] TEST ON A REAL MID-RANGE ANDROID before any of this is called done
