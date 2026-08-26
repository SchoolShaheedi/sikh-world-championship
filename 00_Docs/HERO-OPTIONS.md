# Hero Directions & Background Video
Date: 2026-08-21

## The problem to settle first: what goes IN the video

**Generic esports stock footage will contain no visibly Sikh people.**

A hero video for the Sikh World Championship where nobody in it looks Sikh is an own-goal,
and it's the kind of thing that's obvious the moment someone points it out. Stock libraries
have thousands of clips of gamers with headsets; almost none feature a dastaar.

That single fact shapes everything below. There are three honest ways round it:

1. **Don't show people at all** — abstract, procedural, or object-focused. Zero risk.
2. **Shoot your own** — unmistakably yours, but you have no footage yet, because FIFA 26
   is event one. This is the plan for event two onward, not for launch.
3. **Use stock and accept it's generic** — cheapest, and it will look like stock.

My recommendation is (1) now and (2) from the next event. Put a videographer on the day
with a shot list, and the site is transformed for every event after this one.

## The practical constraints on background video
- A usable hero loop is **2–8MB**. Most of your audience is on a phone, sometimes on 4G
  at a venue. That is a real cost for decoration.
- Autoplay needs `muted`, `playsinline` and a **poster image** — and iOS Low Power Mode
  refuses to autoplay at all, so the poster must look finished on its own.
- `prefers-reduced-motion` must pause it.
- It must never delay the headline or the sign-up button.

None of these are blockers. They just mean video has to earn its weight.

## Hero directions

### A. Statement (what's live now)
Huge stacked type, gradient flare word, 3D trophy beneath, ambient bloom.
Fast, on-brand, no media dependency.
*Best if:* you want to ship and move on.

### B. Card fan  ← my pick
The holographic player cards, fanned out like a hand of FIFA cards, tilting together as
you move the pointer or the phone. The headline sits over them.
*Why:* it uses the best asset the project already has, it's unique to you rather than
borrowed from any other site, and it advertises the thing kids actually want — their own
card. Nobody else's hero looks like this.
*Cost:* moderate. The tilt engine is already built.

### C. Full-bleed video with dark scrim
Video fills the hero, a gradient scrim keeps type legible, everything else sits on top.
*Best if:* you have footage worth showing full-screen. Right now you don't.

### D. Split: type left, media right
Headline and CTA on the left, a framed video or 3D object on the right.
More conventional, reads well on desktop, weaker on mobile where it stacks.

### E. Kinetic type, no imagery
Words swap in sequence — "For the players. For the panth. For the trophy." Pure type,
zero media weight, very striking on a near-black ground.
*Best if:* you want maximum impact for minimum bytes.

## Background video ideas, if we go that way

**Abstract / no people — safe, on-brand, licensable today**
- Slow gold ink or smoke curling through black
- Light streaks / bokeh sweeping past, kesri and gold
- Dark particle field drifting, faint depth
- Stadium floodlights flaring through haze
- Slow-motion gold dust or embers rising

**Object-focused — no faces, still concrete**
- Controller close-ups, hands only, backlit
- A trophy rotating on black
- Screens glowing in a dark hall, shot wide
- Console power lights, cables, kit being set up

**Your own footage — the shot list for FIFA 26 day**
Give this to whoever films it:
- Wide of the hall as the group stage starts, all stations lit
- Over-the-shoulder of a player, screen glowing on their face
- Hands on a controller, tight, shallow depth of field
- A row of players from behind — dastaars and patkas along a line of screens
- Reaction shots: a goal celebrated, a head in hands
- Langar being served, people eating together
- The trophy handover, and the winner lifting it
- Ardas / opening moment, wide and respectful
That footage is irreplaceable and no library on earth has it.

## Where licensed stock can come from
All permit commercial use with no attribution required (still check each individual clip,
since footage with recognisable people, brands or artwork can carry extra restrictions):
- Pexels — pexels.com/videos
- Pixabay — pixabay.com/videos
- Mixkit — mixkit.co/free-stock-video
- Coverr — coverr.co

## The option with no licensing, no bytes and no risk
A **procedural background** — a shader or canvas animation rendered live in the browser.
This is what motionsites.ai is actually selling; most "animated backgrounds" there are
generated, not filmed. It costs a few KB instead of several MB, scales to any screen,
never pixelates, respects reduced-motion trivially, and there is no licence to worry about.
We already have Three.js loaded for the trophy, so the marginal cost is close to nothing.

Ideas: drifting ember field, slow aurora wash in kesri and gold, a subtle grid receding
into the dark, soft godrays behind the type.

---

# Round 2 — decisions and hero subject brainstorm
Date: 2026-08-21

**Decided:** licensed stock background sourced by me · no people in the background ·
warm/community tone · no card fan, no trophy.

**The two answers fit together:** an *illustrated* Sikh gamer can be the centrepiece while
the *background footage* stays abstract and person-free. The concern was only ever about
stock footage of strangers standing in for your community.

## Hero subject — the options

### 1. Illustrated Sikh gamer  ← strongest for the brief
A character in the same art direction as the avatars: dastaar or patka, headset over the
top, controller in hand, warm rim light. Big, centred, hero-scale.

**Why it wins on this brief specifically:** it is the only option that says *Sikh* and
*gaming* in the same image. Everything else says one or the other. It's warm because it's
a person rather than an object, it can't date, it costs nothing in licensing, and it
extends the avatar work already built rather than starting a new visual thread.
**Cost:** the most drawing work of any option here — this needs to be genuinely good, not
a scaled-up avatar. Either I build it as detailed SVG, or you commission an illustrator.

### 2. PlayStation controller, 3D
Rotating slowly, gold and kesri lighting, on the near-black ground. We already have
Three.js loaded, so the marginal cost is small.

**⚠ Worth knowing before we commit:** the DualSense controller's shape is Sony's
trade dress. A recognisable replica as the hero image of a branded championship is a
different thing from a photo of one in an article — and you're not affiliated with Sony.
The safe version is a **generic controller silhouette** — the universal two-grip, D-pad,
twin-stick shape that reads instantly as "controller" without copying any one product.
I'd build that, not a DualSense.

### 3. The SWC emblem in 3D
The shield mark rendered in metal, turning slowly. Pure brand-building.
**The problem:** the current logo is my placeholder. Building a hero around a mark you
haven't settled is backwards — this becomes a good option *after* the real logo exists.

### 4. Hands on a controller
Object-focused, no face, still human. Warmer than a bare object.
Weaker than option 1: hands alone don't say Sikh, so it lands in the same generic place
as stock footage.

### 5. Controller + dastaar motif
A single graphic device fusing the two — e.g. a controller whose grips carry a kesri
wrap pattern, or a headset band drawn as a dastaar line. Highest risk, highest reward:
if it lands it becomes your logo. If it misses it looks like a gimmick.

## Background footage — candidates found (all Pexels, commercial use, no attribution)
Warm, abstract, no people:
- Golden Bokeh Background with Sparkling Lights — pexels.com/video/…-35728942/
- Warm Yellow Bokeh Abstract Light Video — …-31616248/
- A Photo of Orange Lights in the Dark — …-20349691/
- Golden Light Reflections on Water — …-36016990/
- Gold Bubble Abstract in Warm Tones — …-36016991/
- Blurred Lights / Blurry Night Lights — …-6866291/ / …-6866292/

Each will need: trimming to a short seamless loop, compressing hard (target under 2MB),
a poster frame that looks finished on its own, `muted`/`playsinline`/`loop`, and a
`prefers-reduced-motion` pause. iOS Low Power Mode refuses to autoplay at all, so the
poster is not optional.
