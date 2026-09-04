# WSC — Decisions Locked (2026-08-19)

1. **Build now: sign-up page only.** Polished one-page site + registration form. The full
   app is built in parallel, not as a blocker on the event.
2. **Platform: PS5 only.** One bracket structure, no cross-play problems.
3. **Event 1: in-person, UK.** Single venue, players attend and compete on-site.
   Worldwide/online expansion comes after.
4. **Tech: mobile-first web app, structured for a native wrap later** (Capacitor).

## What "in-person UK" changes (vs the original online assumption)
Simpler:
- No timezone scheduling, no online match-reporting, no screenshot proof, no dispute system,
  no no-show walkover logic. Admin runs the bracket on-site from a laptop/tablet.
- No cross-play, no lag/rage-quit disputes, no remote cheating. Consoles are yours, set
  identically. Massive reduction in v1 scope.
- Sign-up is really *ticketing + entry*, not matchmaking.

Harder / new:
- **Capacity is finite.** Venue + number of PS5 stations + hours available = a hard cap on
  entrants. Must calculate before opening sign-ups, or you oversell.
- **UK safeguarding is now a real, in-person obligation**, not just an app policy:
  under-18s on site need parent/guardian consent, emergency contact, medical/allergy info,
  and named safeguarding leads (DBS-checked) on the day. Photography/filming consent needed
  if you're streaming or posting content — this is the one people forget.
- Venue insurance / public liability, first aid, food, accessibility.
- Kit logistics: N x PS5 + N x screens + N x controllers + power + network (offline play
  needs no internet, which is a blessing — do NOT rely on venue wifi).

## Throughput maths (fill in once station count is known)
Single elimination, 6-min halves (~15 min per match incl. setup):
- 32 players = 31 matches. On 8 stations = ~4 rounds, ~1.5-2 hrs of play.
- 64 players = 63 matches. On 8 stations = ~2.5-3 hrs.
- Group stage -> knockout is a better *experience* (everyone plays 3 games, nobody drives
  2 hours to lose once in 12 minutes) but roughly doubles match count. Strongly recommended
  for a first event where goodwill matters more than speed.

## Sign-up form — fields to collect (in-person UK version)
Player: full name, DOB (drives age division), gamertag/PSN ID, email, mobile,
city/gurdwara or area, T-shirt size (if giving kit), skill self-rating (for seeding).
If under 18: parent/guardian name, relationship, guardian mobile + email, consent checkbox,
photo/filming consent (separate checkbox), medical conditions / allergies, emergency contact.
All: agree to rules + code of conduct, accessibility needs, dietary needs.

## Next steps
- [ ] Lock date, venue, capacity, entry fee (see QUESTIONS round 2)
- [ ] Build landing + sign-up page
- [ ] Write tournament rules + code of conduct
- [ ] Safeguarding & photo-consent policy
- [ ] Sponsor one-pager

---

# Round 2 Decisions (2026-08-19)
5. **~64 players, 12-16 PS5 stations.**
6. **Date + venue: locked** (details to be supplied — going straight onto the page).
7. **Free entry.** No payment processing, no refunds, no cash-prize/minor complications.
   Costs covered by sponsors/donations. Sign-up = a confirmed place, capped at 64.
8. **Registrations land in a Google Sheet.** Volunteers can sort, filter and print it for
   the day. (Structured so it exports cleanly into the real database later.)

## Run-of-day maths — 64 players, 14 stations, 6-min halves
Assume 15 min per match slot (12 min play + swap/setup).

**Format: 16 groups of 4 -> top 2 advance -> knockout of 32.** Everyone plays at least 3
matches, so nobody travels in and gets knocked out in 12 minutes. This matters more than
speed at a first community event.

- Group stage: 16 groups x 6 matches = 96 matches. 96 / 14 stations = 7 waves = **~105 min**
- Knockout: R32 (16) + R16 (8) + QF (4) + SF (2) + Final (1) = 31 matches, run as
  sequential rounds = **~90 min** (final can have longer halves, on a big screen)
- **Total play time: ~3 hrs 15 min.**

Full day shape:
  09:30 doors / registration desk / controller check
  10:30 opening + Ardas + rules briefing
  11:00 group stage
  12:45 langar / break (groups posted, knockout seeded)
  13:30 knockout rounds
  15:00 semis + final on main screen, commentary
  16:00 prizes, photos, close

Buffer built in. If it runs hot, cut to 4-min halves in the group stage.

## Hard cap logic for the form
64 confirmed places + a waitlist that keeps collecting. Waitlist is essential —
free events have a 20-30% no-show rate, so expect to promote 10-15 people from it.
Consider over-registering to ~75 and managing on the door.

## Age divisions (proposal — needs sign-off)
With 64 places, splitting into too many divisions leaves thin brackets. Options:
- **A. One open bracket, everyone mixed.** Simplest. But a 10-year-old vs a 22-year-old is
  a bad experience for both.
- **B. Two divisions: U16 (32 places) and 16+ (32 places).** Two champions, two trophies,
  runs as two parallel halves of the room. **Recommended.**
- **C. Three: U13 / U14-17 / 18+.** Fairest, but ~21 players each is a thin bracket.

---

# Round 3 Decisions (2026-08-21)
9. **Age divisions: two — U16 and 16+.** 32 places each, two champions, two trophies.
10. **The org hosts many event types for Sikhs; this is one event under it.**
    Event 1 = "Sikh FIFA 26 Championship". Platform must be multi-event from day one:
    any future event (chess, kabaddi, gatka, quiz, athletics, other games) gets its own
    page and sign-up form without a rebuild.
11. **Chat feature required**: players can ask other Sikh players to join and play with them.
12. Event details (date, venue, prizes, contact, logo) supplied later — page is built with
    clearly-marked placeholders so everything else can ship now.

## !! OPEN: brand name discrepancy
First message: "**World** Sikh Championship". Round 3: "**Sikh World** Championship".
These are different names, different domains, different logos. Needs settling before any
design, domain purchase, or social handle registration. Folder is currently
"World Sikh Championship" — trivial to rename either way.

## Multi-event architecture (locked in from the start)
The site is an **org site with an events section**, not a FIFA site:
  / .................... org homepage: who we are, what we do, upcoming + past events
  /events .............. all events, filtered by upcoming / past
  /events/[slug] ....... one event page: hero, details, rules, prizes, sign-up
  /events/[slug]/signup  the registration form for that event
  /players ............. (phase 2) find players, LFG board
  /chat ................ (phase 2) messages
  /account ............. profile, my events, my registrations

An event is data, not code. Adding "Sikh Chess Championship 2027" = one new record:
  Event(slug, title, sport/game, format, date, venue, capacity, status,
        hero_image, rules_md, prizes_md, divisions[], custom_form_fields[])
`custom_form_fields` is the key bit — a FIFA event asks for PSN ID, a chess event asks for
an ECF/FIDE rating, a kabaddi event asks for weight and position. Same form engine, different
questions, no code change.

---

# Round 4 Decisions (2026-08-21)
13. **Brand name settled: "Sikh World Championship" (SWC).** Folder renamed.
    Event 1 = "Sikh FIFA 26 Championship".
    -> Secure sikhworldchampionship.com + @sikhworldchampionship on IG/TikTok/YouTube
       before announcing anything publicly. Do this this week; names get taken.
14. **Chat: open free-text chat for all ages.** Owner's decision, made with the
    safeguarding trade-offs on the table (see CHAT-AND-SAFETY.md).
    This makes the following NOT optional extras but core build items, because they are
    what makes open chat operable at all:
      - report + block on every profile and conversation
      - message retention so reports can be investigated
      - at least two named moderators with a real 24h response commitment
      - a published moderation + safeguarding policy page
      - contact-detail filtering (phone numbers, addresses, links)
      - guardian email captured at sign-up for every under-18 account
    Practical consequence to plan for: this is the configuration app stores scrutinise
    hardest, so the native wrap (phase 3) will need that policy page to already exist.
    Web app is unaffected.
15. **Account required from the start.** Everyone who registers creates an SWC profile.
    Means the player network has real users from day one instead of an empty room.
    Cost: some friction at sign-up — so the account creation must be *part of* the
    registration flow, not a separate step before it. One form, account created at the end.
16. **Confirmed features: player cards, QR check-in + auto-promoting waitlist,
    cross-event trophy cabinet.** Live bracket page: still open.

---

# Round 5 Decisions (2026-08-21)
17. **Chat: free-text chat for 16+ only.** (Supersedes decision 14.) Under-16 accounts do
    not get free-text messaging. Revisit later with guardian opt-in if wanted.
    Still required, even at 16+: report + block everywhere, message retention,
    named moderators, published moderation policy, contact-detail filtering.
    Under-16s still get the LFG board + preset quick messages, so they can still find
    people to play with — they just can't free-type at strangers.
18. **Player cards: photo is OPTIONAL.** Player either uploads a real photo OR picks from a
    set of provided avatars. Default is avatar, not photo.
    This is the right call for three reasons: it removes photo-consent friction for every
    under-18 sign-up, it means nobody is excluded because they don't want their face online
    (a real concern for some families), and it makes every card look good even when someone
    uploads a blurry selfie.
    -> Need a set of ~12-16 avatars designed. Suggest: Sikh-coded illustrated characters
       (different dastaar colours/styles, patka for younger players, male and female,
       a few with football kit) rather than generic stock avatars. These become part of the
       brand and get reused across every future event.
19. **Waitlist + QR check-in: both in.**
20. **Trophy cabinet: in, with tiered awards.**
21. **Live bracket: explained, decision pending.**

## Award tiers (digital, shown on the profile/trophy cabinet)
Winner .............. large gold trophy
Runner-up ........... silver trophy
Semi-finalist ....... bronze trophy
Participant ......... small badge/medal — everyone who turns up and plays gets one
Per division, so U16 and 16+ each have their own full set.
Optional extras worth having: "Golden Boot" (most goals), "Clean Sheet" (fewest conceded),
"Fair Play" (voted by volunteers) — cheap to award, and they give more kids something to
take home than just the one winner.

NOTE: the above is the *digital* cabinet. Physical trophies on the day are a separate
purchase — confirm whether the same tiering applies (big cup for winner, smaller for
runner-up/semis, medal for all participants) so it can be ordered and budgeted.

---

# Round 6 Decisions (2026-08-21)
22. **Player cards rebuilt FIFA-Ultimate-Team style**, with six stats = Panj Gun +
    Chardi Kala (SAT / DYA / SNT / NIM / PYR / CHK). Card tiers bronze / silver / gold,
    plus a special champion card. See PLAYER-CARDS.md.
23. **Avatars expanded to 20** — dastaar, patka and chunni options, five skin tones,
    four beard styles (full / short / moustache / none). Redrawn: flat-topped angular
    dastaar with a front nok (the first pass read as a beanie), and less googly eyes.
24. **Surnames are dropped from the card.** Cards get shared publicly; a full name plus
    a region plus a school-age face is more identifying information than a child should
    be posting. First name only.
25. OPEN: whether numeric virtue scores are acceptable — see PLAYER-CARDS.md.

---

# Round 7 Decisions (2026-08-21)
26. **Numeric virtue stats REMOVED.** Replaced with **one Quality per card, drawn from a
    library of 32** (Sat, Santokh, Dharam, Sidak, Pyaar, Daya, Shanti, Sant Sipahi,
    Nirbhau, Seva, Khima, Insaaf, ... — see `src/data/qualities.ts`).
    Deterministic per player, equal probability, no rarity tiers.
    This closes decision 25's open question: a drawn quality doesn't score anyone's
    character the way a 0–99 virtue rating did.
27. **Avatars reverted to the previous 16-item format** (8 dastaar, 8 patka).
    User is producing real avatar artwork.
28. **Avatar system is now image-first**: each entry has an `image` field; drop files into
    `public/avatars/` and set the filename. Drawn SVG remains as the fallback so a missing
    file never leaves a hole in a card. Export spec in `public/avatars/README.md`.
29. NOTE: the 16-item set has no chunni/dupatta option, so there is currently nothing a
    girl would pick. Flagged in the artwork README — worth covering in the new artwork,
    along with a range of skin tones and beard styles.

---

# Round 8 Decisions (2026-08-21) — Online play
30. **LFG board only. No chat in v1.** Structured posts + structured requests, no free
    typing at strangers. Chat is deferred, not cancelled.
31. **16+ only. Under-16s get no online connection yet.**
    CONSEQUENCE TO BE AWARE OF: this defers the founding use case — "Sikh kids find online
    Sikh players to play with". The under-16s are the group the project was started for and
    they are now excluded from the online side until a later phase. That is a defensible
    call (it removes the entire minors-online-with-strangers risk surface while the platform
    is young), but it should be a conscious staging decision, not a quiet drop.
    Route back in, when ready: event-verified connections — a U16 who attended an SWC event
    and was checked in by a volunteer can connect with other event-verified U16s. Real-world
    verification, and it makes events the on-ramp rather than a stranger board.
32. **Moderation: a small volunteer team on a rota.** So the build includes a proper
    moderation queue — assignment, status, audit trail — not just an inbox.
33. **No ladder or season yet.** Results logging and ladders come later.

## Risk to plan for: the empty-board problem
With 16+ only, the pool at launch is roughly the 32 players in the 16+ division. A board
with four posts on it looks dead, and people who see a dead board do not come back.

Mitigation, and it costs nothing: **seed the board at the event itself.** Before players
leave on the day, prompt every 16+ attendee to put up one post. Walk them through it at
the desk if needed. Forty posts on day one is a living board; four is a graveyard.
Put it in the run-of-day plan, right before prizes.

---

# Round 9 Decisions (2026-08-21) — U16 board access + Support
34. **Under-16s CAN now use the board.** (Supersedes decision 31.) Kept safe by four
    protections that only work together — no single one is sufficient:
    a. **Strict age-band segregation.** U16 and 16+ are two separate pools that never
       intersect. Enforced in the data layer at two points (the board query AND request
       creation), not in the UI. An adult account cannot see, request, or be requested by
       an under-16 at all. This is the load-bearing protection: it removes adult-to-child
       contact rather than trying to police it.
    b. **Guardian consent to use the board at all.** Under-16s see an explanation and a
       "email my parent or guardian" route, not a locked door. Guardian can revoke.
    c. **Guardian notified on every connection.** When an under-16 swaps gamertags, their
       guardian is emailed who with, from where, what game, when. Transparency rather than
       blocking — a guardian who can see what's happening can step in early.
    d. **No free text anywhere.** Posts and requests are built from fixed menus.
    Plus the event-verified badge ("Met at an event") as a visible trust signal.
35. **Support section at /support.** Six categories; safety and player reports are marked
    urgent and jump the moderation queue.
    **Deliberately usable WITHOUT an account and WITHOUT a name.** The most important
    message this system will ever get is a worried parent who has never logged in —
    making them register first would lose exactly the report we most need.
    Emergency numbers (999 / NSPCC / Childline) sit above the form, because if someone is
    in real danger a support form is the wrong tool and we should say so.
36. **Urgent tickets surface in /moderation**, above in-app reports, flagged when they
    come from a guardian. One queue, not an inbox nobody remembers to check.

---

# Round 10 (2026-08-21) — Guardian approval + test suite
37. **Guardian approval flow built.** Token link, no account needed for the guardian.
    Approve / decline / revoke / reinstate, full history shown to the guardian.
    Pending requests expire after 30 days; SETTLED records never expire, because a
    guardian must keep a permanent way back in to revoke.
    Re-asking replaces a pending request rather than stacking them, so an impatient child
    can't flood a parent's inbox with live links.
    The guardian's email comes from the ACCOUNT (captured at event registration), never
    from a form the child fills in — otherwise the whole mechanism is theatre.
38. **Test suite added** (vitest, 72 tests). Concentrated on the safety-critical logic:
    age segregation, gamertag privacy, blocking, guardian approval and revocation,
    capacity and waitlist, moderation ordering, bracket seeding, quality distribution.

## !! A real bug the tests caught
Registration references used 2 random bytes with no uniqueness check — 65,536 possible
values. That gives a **~2.6% chance of two players sharing a reference within a single
64-player event**, rising as events accumulate.

It mattered because the reference WAS also the check-in token. A duplicate meant two
players sharing a credential, and check-in would have marked the wrong person present.

Fixed by separating the two concepts:
- **Reference** — short, human-readable, uniqueness-checked against existing rows, and
  drawn from an alphabet with no confusable characters (no O/0, no I/1/L) because
  volunteers read these aloud at a check-in desk.
- **Check-in token** — a long random credential, never printed on a public list.

This is exactly the class of bug that would have surfaced as "two kids arguing at the
desk about who's already checked in" on the day, and been impossible to diagnose.

## Known limitation, stated plainly
A determined 13-year-old can put their own email in the guardian field. **No email-based
consent system solves this.** What reduces it here: the guardian's email is collected at
event registration, where a volunteer is present and a guardian phone number is captured
too, so the address can be checked against a real person.
-> Worth considering: require event attendance before under-16 board access, so every
   under-16 guardian email has been seen by a volunteer.

---

# Round 11 (2026-08-21) — One division
39. **Single open division. All ages in one bracket, one champion.**
    (Supersedes decision 9 and 17's two-division split.)
    - 64 places in one pool instead of 32 + 32.
    - One champion, one champion's trophy. Runner-up, semi-finalist and competitor
      awards unchanged, but there is now one set of them rather than two.
    - Minimum age set to **8** — a judgement call, and the only number here that is one.
      Change `minAge` in `src/data/events/sikh-fifa-26.ts` to move it; the sign-up form
      and the API both read it.

## What this changes on the day
Simpler to run: one bracket on one screen, no parallel halves of the room, no juggling
two sets of groups. The run-of-day maths is unchanged — 16 groups of 4 into a knockout of
32 was always the shape; it's just one pool now instead of two.

## The trade-off, stated once
An 8-year-old can now be drawn against an adult. Seeding on the self-rated skill question
at sign-up softens the group stage, but it cannot prevent it in the knockouts.
Two things worth doing because of it:
- Take the skill self-rating seriously when seeding. It is now the only thing standing
  between a child and a heavy defeat in round one.
- Consider a "best young player" award. With one bracket, no young player will win the
  main trophy, and an under-14 who plays well deserves to take something home.

## NOT changed: the Find a game board
The board still keeps under-16s and 16+ in completely separate pools. That is a
SAFEGUARDING boundary, not a tournament division, and merging the event's divisions has
no bearing on it. `Division.minAge/maxAge` and the board's `AgeBand` are now clearly
documented as different concepts in `src/lib/types.ts` so they don't get conflated later.

## Bug fixed while making this change
The registration API validated that a division existed but never checked the entrant's
AGE against it — only the form did, and a form is not a security boundary. A direct API
call could register a 3-year-old. Age is now re-checked server-side against the
division's bounds, and an unparseable date of birth is rejected.

---

# Round 12 (2026-08-21) — 3D & animation
40. **CSS-driven 3D depth throughout, plus ONE real 3D object in the homepage hero**
    (lazy-loaded, static fallback on weak devices). No full WebGL scene — see
    `00_Docs/3D-ANIMATION-RESEARCH.md` for why that would fail on venue phones.
41. **Effects everywhere EXCEPT the event-day flows.** Sign-up, check-in and the live
    bracket stay deliberately plain. Those run on bad phones, on bad wifi, in a noisy
    hall, and on a projector for six hours. Animation there is a liability.
42. **Visual reference: EA FC / FIFA Ultimate Team.** Glossy foil, card-pack energy,
    punchy reveals.
43. **Gyroscope tilt: yes.** The player card responds to the phone's motion, like a real
    foil card in your hand. iOS needs an explicit permission prompt, so it degrades to
    touch/pointer tilt if declined — and must never look broken when it does.

---

# Round 13 (2026-08-21) — 3D trophy hero
44. **The hero 3D object is a trophy**, built procedurally in Three.js — chosen over a
    football or the shield because it ties to the championship framing and reads at any
    size. Lives in the homepage hero, ordered AFTER the headline and sign-up button on
    mobile: the trophy is atmosphere, the button is the job.
45. Three.js is **178KB gzipped in its own lazy chunk**, loaded on idle, never part of
    first paint. Skipped entirely on reduced-motion, data-saver, <4GB RAM, <4 cores, or
    no WebGL2. An SVG trophy renders first and always; the 3D fades in over it.
    See `00_Docs/3D-ANIMATION-RESEARCH.md` for the full build notes.

---

# Round 14 (2026-08-21) — Design overhaul + hidden sections
46. **"Find a game" and "Players" removed from navigation.** HIDDEN, NOT DELETED — the
    routes, the LFG board, the guardian approval flow, the moderation queue and all their
    tests still exist and still build. Restoring them is two lines in
    `src/components/SiteChrome.tsx` (nav array + footer link). A dangling link to
    `/players` on the event page was replaced with plain text so nothing points at a
    hidden section.
47. **Visual language rebuilt after motionsites.ai.** What was taken, and why each thing:
    - **Neutral near-black ground** (#0B0B0C) replacing the navy gradient. Counter-
      intuitively this makes kesri read *hotter*, because there is no competing blue
      behind it.
    - **Huge stacked uppercase display type** — weight 900, line-height 0.86 (tighter
      than the font size, so lines stack into a solid block), letter-spacing -0.035em to
      stop that block looking gappy.
    - **Gradient "flare" on one emphasis word**, with a soft drop-shadow bloom.
    - **Pills everywhere** — badges, chips, buttons — and 20px radius on cards.
    - **Hairline borders instead of shadows.** On a flat near-black ground there is no
      light source, so a 1px edge does more for depth than a shadow ever will.
    - **Ambient bloom** behind the hero, two overlapping washes so the light has a
      direction rather than sitting as a flat disc.
48. **Scroll reveals added** using native `animation-timeline: view()` — no JavaScript,
    no IntersectionObserver, guarded by `@supports` and `prefers-reduced-motion` so
    content can never end up stuck invisible.

## Bug introduced and fixed in the same pass
The first `.pill` class set `display: inline-flex`. Because that CSS is unlayered and
Tailwind's utilities live in a layer, `.pill` beat `hidden` / `sm:flex` — and the mobile
Menu button appeared on desktop. `.pill` is now shape-only (radius + white-space) and
layout is set in the markup.
**General rule for this codebase: custom classes in globals.css must never set `display`,
`position` or spacing that Tailwind utilities are expected to control.**

---

# Round 15 (2026-08-21) — Hero image
49. **Hero image is a drop-in.** Put any image in
    `03_App/web/public/hero/` and it becomes the hero automatically — no config to edit.
    Detection is a server-side directory read (`src/lib/hero-image.ts`), so there is
    nothing to remember and nothing to forget.
    While the folder is empty the 3D trophy stays, so the site is never broken mid-work.
    Verified both directions: image present → rendered and served; image removed →
    trophy returns.
50. Hero subject still open — see `00_Docs/HERO-OPTIONS.md`. Owner is supplying the image.
    Alt text still needs writing once we know what the image shows; it matters for screen
    readers and for anyone whose connection drops the image.

---

# Round 16 (2026-08-21) — Hero images
51. **Hero uses the three supplied images as a three-beat story** — standing → playing →
    winning — crossfading every 4.2s in a framed column beside the headline.
    Wired in `src/data/hero-media.ts`, one entry per image with its own alt text and crop
    anchor (the sources are square, 3:2 and 5:4, so each needs a different
    `object-position` or heads get cropped).
52. **Full-bleed was tried first and rejected.** The whole point of these images is that
    the player is visibly Sikh — and a scrim heavy enough to keep the headline readable
    also buried his face. Giving the image its own column does both jobs. Worth
    remembering if anyone proposes full-bleed again.
53. **Hard line breaks removed from the headline.** In the narrower column they produced
    orphans ("COMPETITION / THAT"). `text-wrap: balance` handles it at any width.
54. Drop-in auto-detection (`lib/hero-image.ts`) was **removed** now that real images
    exist — explicit entries are better here because each image needs its own alt text
    and crop anchor, which a directory scan cannot supply.

## Performance — measured, not assumed
The sources are 1.8–2MB PNGs. Nobody downloads them at that size:
- Real browsers get **48KB WebP** at 1080px (vs 372KB as PNG) — an 87% reduction.
- Only slide one loads eagerly; slides two and three are lazy and join the rotation
  once decoded, so a slow connection still gets a working hero.
- Blur placeholders come free from the static imports, so there's no layout shift.
**If the images are ever replaced, there is no need to compress them first.**

## Accessibility
- Every slide has real alt text describing what it shows — these carry the meaning of
  the hero, and plenty of people never see them.
- Only the visible slide is described; announcing three alternating descriptions of the
  same region would be noise.
- The rotation does not start at all under `prefers-reduced-motion`.

## Note for future debugging
The preview pane reports `document.visibilityState === "hidden"`, which makes it decode
images at 1/8 scale, freeze CSS transitions and return blank screenshots. It is also the
source of the phantom "Hydration failed" warning. **None of these are application bugs.**
Verify through the server (curl the optimiser, read the DOM) rather than trusting a
screenshot of a scrolled or lazily-loaded region.

---

# Round 17 (2026-08-21) — Cinematic hero
55. **Cyberpunk-style hero effects adapted to SWC**, not copied wholesale. Taken from the
    brief: parallax grid, Ken Burns push-in, cursor spotlight reveal between two images,
    fading stat arcs with stroke-draw/pop/pulse, staggered `hero-rise` copy, shine sweep
    on the CTA, full reduced-motion resets.
    NOT taken: their navbar (we have our own), their red cyberpunk palette (we have a
    brand), their JetBrains-Mono-everywhere typography (it would erase our display type),
    and their placeholder copy.
56. **The spotlight reveal uses TWO of the three hero images** — mid-match as the base,
    lifting the trophy as the reveal. Moving the cursor literally uncovers the win. The
    third image (standing) is now unused in the hero; keep it for an About or Players
    section.
57. **Stat arcs read from event data**, not hardcoded: 64 PLACES / 3+ MATCHES EACH /
    £0 TO ENTER. They can't drift out of date, and all three are genuine selling points.
58. **Full-bleed works here where it failed before** (round 16) because the copy sits
    bottom-left rather than centred. The scrim can be weighted to the bottom-left corner
    and leave the player's face clear on the right.

## Departure from the brief, and why
The reference implementation redraws a canvas each frame, calls `toDataURL()`, and assigns
the base64 result as `mask-image`. That works, but it serialises the entire canvas to a
PNG string ~60 times a second and forces the browser to re-parse and re-upload a fresh
image every frame — comfortably the most expensive thing on the page, and rough on a
mid-range phone.

**Replaced with a CSS `radial-gradient` mask driven by two custom properties.** Identical
visual, animates on the compositor, and costs essentially nothing. The rAF loop only
writes two CSS variables; React never re-renders on mouse move.

Also: the whole effect is skipped on coarse pointers. There is no cursor to follow on a
phone, and running a rAF loop for an effect nobody can see is pure battery cost.

## Two bugs found and fixed during the build
- **Arcs were invisible.** The scrim layers sit at z-40 and the arc container had no
  explicit z-index, so it painted underneath them.
- **Longest arc label was clipped.** Text at x≈387 ran past the 380-wide viewBox;
  widened to 480 so the labels have room to the right of the arcs.

---

# Round 18 (2026-08-21) — Design audit, Tier 1
59. **Typography: Space Grotesk (display) / Inter (body) / JetBrains Mono (micro).**
    Replaces system fonts, which were the single biggest "built not designed" tell.
    Via `next/font`, self-hosted, 110KB for all three, zero external requests.
    NOTE: Space Grotesk maxes at weight 700, so `.display-xl` moved from 900 to 700 —
    it reads heavier than the old system 900 because the face has actual character.
60. **Page depth**: inline-SVG grain at 3.5% + two very soft ambient washes, fixed
    across the whole page. Flat near-black reads cheap at large sizes.
61. **Staggered scroll reveals** via per-child `animation-range` offsets — still no
    JavaScript.
62. **Mono section numbering** (`01 — THE ORGANISATION`) and mono arc numbers with
    tabular figures.
63. Deliberately NOT added, despite the skill listing them: logo marquee, pricing cards,
    testimonials. A free community championship has no logos to parade, nothing to price,
    and no testimonials until after event one.

---

# Round 19 (2026-08-21) — Tier 2 + brand asset slots
64. **`.lift` hover** on every card — 4px rise, warmed border, wide kesri bloom.
    One class so all cards behave identically. `.link-underline` for text links.
65. **CTA closer added.** The homepage previously ended on a list then a footer and never
    asked for the sign-up. Now closes with "64 places. Free to enter. Take one."
66. **Mono section numbering + display headings** rolled out across the inner pages.
67. **Brand asset drop-ins** — `public/brand/`:
    - `logo.svg` (or .png) → header, footer, player cards, favicon source
    - `logo-mark.svg` → optional simplified version for the 22px nav
    - `logo-3d.glb` → animated 3D logo, currently placed at the top of the CTA closer
    Detection is a server-side file check (`src/lib/brand-assets.ts`); until each file
    exists the placeholder shield mark renders, so nothing breaks mid-design.
68. **3D logo loader built** (`Logo3D.tsx` + `logo3d-scene.ts`), same protections as the
    trophy: lazy chunk, idle load, capability gate, pauses off-screen, disposes on unmount,
    2D mark underneath throughout.
    It **auto-normalises the model** — centres on origin, scales longest axis to 2 units —
    because most exports arrive off-origin or at millimetre scale.

---

# Round 20 (2026-08-21) — Tier 3 + logo assets
69. **Statement section** ("Sixty-four players will walk in as strangers…"), **stats band**
    (64 / 1 / 3+ / £0 in mono), **glass** on the three-up cards and CTA closer.
    Homepage rhythm is now: hero → 01 organisation → 02 why → stats → 03 events → 04 closer.
70. Glass is applied ONLY over blooms/washes. On flat near-black a frosted panel with
    nothing behind it is just a lighter box.

## Logo assets — received and wired
Supplied: `swc-logo-3d.glb` (1.67MB) and `swc-logo-texture.png` (1536×1024, 1.6MB).
Detection was broadened to scan the folder rather than demand exact filenames.

**The 3D logo works.** Verified: chunk loads, GLTFLoader resolves, GLB returns 200, the
scene builds and the canvas goes live. It sits at the top of the CTA closer.

**The 2D artwork is a wide LOCKUP, not a square mark**, so it needed its own component.
`BrandLockup` renders it at natural 3:2 aspect through next/image (1.6MB source →
**22.6KB WebP**). `<Logo>` still renders a square box and is right for a compact mark —
squeezing a 3:2 lockup into a 34px square makes it an unreadable smudge, which is exactly
what happened before this was split out.

### Still needed
- **A square `logo-mark.svg`** for the 22px nav. `findLogoMark()` deliberately does NOT
  fall back to the lockup — better a clean placeholder than the real logo rendered badly.
- **The wordmark says "CHAMPIONSHIPS" (plural)**; the site, the docs and the domain all
  use "Sikh World Championship" (singular). One of them should change.
- **The GLB is 1.67MB, nearly all of it the embedded 1.6MB PNG texture.** Re-encoding
  that texture to WebP or JPEG inside the GLB would cut it to roughly 150–250KB with no
  visible difference at logo scale.

## Bug caught during this round
`BrandLockup` was written with `quality={80}`. **Next 16 restricts the image optimiser to
the qualities listed in `next.config` (default `[75]` only)** — deliberately, so it can't
be abused as a general image service. Anything else returns a 400, and it would have
shipped as a broken footer logo because it fails at runtime, not build time.
All four `quality=` usages in the codebase are now 75.

---

# Round 21 (2026-08-21) — Logo compression, nav logo, motion fix
71. **GLB compressed 1.6MB → 144KB (11x).** Nearly all the weight was a full-size PNG
    embedded in the model. Re-encoded the texture as a 1024px JPEG and repointed the
    build script (glTF supports image/jpeg natively; the artwork has no transparency, so
    nothing is lost). Verified the rebuilt model still loads and renders.
72. **Real logo now in the header.** The supplied artwork is a stacked lockup, so a
    cropped emblem (`logo-mark.png` — arch + SWC + Nishan Sahib) goes in the nav at 40px
    with the wordmark text beside it. Routed through next/image: 212KB source →
    **2.7KB WebP**. The full lockup stays in the footer where it has room.
73. **The 3D logo no longer spins.**
    WHY IT LOOKED WRONG: the model is a thin textured plane — a flat card. Rotating it
    360° turned it edge-on (vanishing to a hairline) and then showed a blank back face.
    Replaced with a bounded sway of about ±18° on Y and ±6° on X, on two different
    periods so it never reads as a metronome, plus pointer parallax. The face now stays
    toward the viewer and the light simply travels across it.
    **General rule: flat or low-relief geometry must never be given a full rotation.**

## Outstanding on the artwork
- **No transparent version.** The background is baked in. Fine on the site's near-black
  ground; unusable on print, light surfaces, or a white social avatar. This is the single
  most useful thing to add next.
- **"CHAMPIONSHIPS" (plural) in the wordmark** vs singular everywhere else.

---

# Round 22 (2026-08-26) — GitHub
74. **Repo: https://github.com/SchoolShaheedi/sikh-world-championship — PUBLIC.**
    101 files pushed, working tree clean. Verified nothing from `.data/`, `.env*` or
    `*.pem` went up, and a scan found no keys or personal data in tracked files.
75. **Collaborator: `taranjs` (Taranjeet Singh) — ADMIN, invitation pending.**
    GitHub could not resolve `taranjs@gmail.com` because their email is private, and
    `SchoolShaheedi` is a personal account (not an org) so the API requires a username
    rather than an email. Username confirmed by the owner before granting access.

## The duplicate repo — resolved except for one manual step
`Bapinder/sikh-world-championship` (public) held the 21 August version.
Verified before touching anything: its HEAD `f850e6e` **is an ancestor of our history**,
it has one branch, and zero issues, PRs, forks or stars — so nothing there is unique.

**It could not be deleted from here.** This machine is authenticated as `SchoolShaheedi`,
which has `push` but not `admin` on that repo, and the token lacks the `delete_repo`
scope. Deleting another account's repository is not something to work around.

-> Whoever owns the Bapinder account must do it:
   https://github.com/Bapinder/sikh-world-championship/settings  → bottom of the page.
   Archiving instead of deleting is the safer option if there is any doubt.

The local remote pointing at it is kept as `bapinder-old` so nothing pushes there by
accident. Remove it with `git remote remove bapinder-old` once the repo is gone.

## Live at the moment this was published
The safeguarding page names "TBC" as the safeguarding lead and the contact address is
`TBC@sikhworldchampionship.com`. Raised before publishing; owner chose public anyway,
which is a reasonable call for a code repo. It stops being reasonable the moment the site
itself is deployed, because that page is what parents read.


---

# Round 23 (2026-08-26) — Repo root moved, collaborators
76. **Git root moved from `03_App/web` up to the project root.** DECISIONS.md and
    `00_Docs/` are now inside the repository — collaborators previously got the code with
    none of the reasoning. Git recorded 99 renames at 100% similarity, so history is
    intact. 114 files on GitHub.
    `03_App/web/.gitignore` still governs that subtree: git resolves leading-slash
    patterns relative to the .gitignore that declares them, so `/node_modules` there
    still means `03_App/web/node_modules`.
77. **Collaborators (both admin, invitations pending): `taranjs`, `Bapinder`.**
78. Verified after the move: types clean, 72 tests passing from the new root.

## Worth knowing now that the docs are public
`00_Docs/` and DECISIONS.md contain the honest engineering record, including the stated
limitation that a determined under-16 could enter their own address in the guardian email
field. That is true of any email-based consent system and is not a secret worth keeping —
but it is now publicly readable, which is a deliberate consequence of a public repo
rather than an oversight.


---

# Round 24 (2026-08-26) — Structure standardised, safeguarding audit

79. **Numbered folder scheme kept, and made real.** The root README documented
    `01_Brand/`, `02_Events/`, `04_Legal/`, `05_Partners_Sponsors/` as "deliberate
    placeholders" — but git does not track empty directories, so nobody who cloned the
    repo ever saw them. Each now has a `README.md` stating what belongs in it, which
    both makes the folder exist and documents the convention (`NN_Name`).
80. **The two docs directories are now one.** `03_App/docs/` merged into `00_Docs/`
    (git recorded both as renames). There was no rule for which doc went where.
81. **Create-next-app leftovers removed** — `file.svg`, `globe.svg`, `next.svg`,
    `vercel.svg`, `window.svg`, none referenced anywhere.
82. **CI added** (`.github/workflows/ci.yml`): typecheck, lint, test, build, plus a job
    that fails if a `.data/` file, an `.env` file or a key is ever tracked. 104 tests
    existed and nothing ran them on a push.
83. **`.env.example` added**, with a `!.env.example` exception in `.gitignore` so the
    template commits while real env files stay ignored. Every variable has a working
    default — the app still runs with no `.env.local` at all.
84. **`CLAUDE.md` now carries real project guidance** instead of only importing the
    Next.js-generated `AGENTS.md`. It lists the seven invariants and the five stubs.

## Safeguarding audit — what was found

85. **`/moderation` was readable by anyone.** The page gate (`if (!me.isModerator)`) was
    correct; `session.ts` returned `isModerator: true` unconditionally, so the gate never
    fired. Verified by fetching the page unauthenticated and reading back a planted
    support ticket: the safeguarding disclosure, the parent's name and their email
    address all rendered. Next was also building it as a **static** page, so with a real
    session one visitor's queue could have been baked into HTML and served to the next
    person.
    Fixed two ways: `stubModeratorAccess()` now denies by default (opt in locally with
    `SWC_DEV_MODERATOR=1`, refused outright when `NODE_ENV=production`), and the page is
    `force-dynamic`. Re-tested: the planted ticket is gone and the page renders
    "Moderators only". **A stub that fails open is a breach waiting for a deploy — any
    new gate written against the session stub must default to deny.**
86. **Only one of the two guardians was notified on a connection.** `answerRequest`
    notified the *accepting* player's guardian only. Age segregation means both players
    are in the same band, so if one is under 16 both are — and accepting a request
    exchanges gamertags in *both* directions. Every connection a child initiated left
    that child's own guardian unaware, which is the likelier direction for a child to
    make contact.
    Fixed by storing `fromGuardianEmail` on the request when it is sent — the same
    reasoning as the existing `fromRegion` field, since the accepter's session is the
    only one on hand at acceptance. Locked by
    `src/app/play/guardian-notification.test.ts`, which fails on the old behaviour.
87. **An under-18 could register with no guardian on record.** The endpoint required only
    `fullName`, `dob`, `email`, `mobile`. Verified: a POST for a 10-year-old with no
    guardian name, email or consent returned `200 confirmed`. That is a child at a
    physical event with no consenting adult recorded, and it also breaks the board
    consent flow, which takes the guardian email from the registration.
88. **Arbitrary keys were persisted next to children's medical notes.** `answers` was the
    raw request body, spread in unvalidated. Verified by injecting a key and reading it
    back out of the store.
    87 and 88 are both fixed by `src/lib/registration-schema.ts` (zod), which closes the
    long-standing "TODO: full schema validation before launch". Guardian block required
    when the registrant is under 18, consents must be truthfully given, event-specific
    fields validated against their own `formFields` definition, unknown keys rejected
    rather than stripped, free text length-capped, email normalised, and a mistyped
    future year explained rather than answered with the age limit. 25 tests.
    A note for anyone extending it: the browser form keeps all fields in one state object
    and submits `""` for anything untouched, so optional fields must treat `""` as
    absent. Requiring `min(1)` on them broke the real form the first time this went in.
89. **Rate limits added** where their absence was a safeguarding problem rather than an
    abuse problem: guardian approval emails (3/hour per child — a child clicking "ask
    again" repeatedly makes SWC look like the harasser) and support tickets (10/10min per
    IP — the urgent queue is where a disclosure lands, and a queue buried under generated
    tickets is one where a real report goes unread). Both limits are deliberately loose:
    turning away a genuine reporter is the worse failure. In-memory, so per-instance —
    must move to the database when this deploys.

## !! OPEN — the site tells parents things that are not true

Not fixed, because this is public safeguarding copy and it is the owner's call.
`/safeguarding` is the page a parent reads before deciding, and it currently states:

- "Free-text chat is for players aged 16 and over." **There is no chat.** It is
  deliberately deferred until the moderation rota is staffed and proven. Meanwhile
  `/play` tells the same parent "There's no chat and no typing", and the guardian consent
  screen says the same. The safeguarding page is the one that is wrong.
- "Messages are retained so that reports can actually be investigated." There are no
  messages, and no retention policy exists — `04_Legal/` is empty.
- "Report and block are on every profile and every conversation." There are no
  conversations.

`/players` also markets "Chat (16+) — full messaging ... with real moderators behind it"
and "Quick messages". Both sit under a "coming after FIFA 26" heading, which softens it,
but together they commit SWC publicly to shipping open messaging.

A published promise the software does not keep is both a safeguarding failure and a
legal exposure. The fix is a wording decision, not a code change.

## Still blocking, unchanged by this round

`src/lib/notify.ts` still only logs, so the guardian notification promised on
`/safeguarding` does not actually send — under-16 board access must not be switched on
for real players until it does. `src/lib/session.ts` is still a stub. The stores are
still JSON files holding unencrypted medical notes. `04_Legal/` is still empty, and that
is the largest gap in the project: privacy notice, DPIA, retention policy and DBS checks
are legal requirements before real registrations open, not later work.

## Registration form — reviewed and extended

A full form already existed; this was a review, not a build. Field set confirmed with the
owner, and the guiding principle is data minimisation: home address, postcode, school,
year group and gender are still **not** collected, and shouldn't be. Every field held is
one that has to be justified in the DPIA, protected, and deleted on request.

90. **Guardian presence is tiered by age, not blanket.** The owner's first instinct was a
    parent present for every under-18. Rejected as disproportionate at the top end: it
    would have meant planning the venue for ~110 people rather than 64 (which matters,
    since the venue is still TBC), it is out of step with what 16–17s already do
    independently, and it quietly excludes families who cannot spare an adult for a whole
    Saturday — working against the point of the event. So the requirement sits where the
    risk actually is:
      8–11 ..... guardian stays on site for the whole event
      12–15 .... dropped off and collected, guardian contactable, distance recorded,
                 may not leave unaccompanied
      16–17 .... may attend and leave independently, guardian consent on record
    `src/lib/guardian-rules.ts` is the single source of truth; the form and the server
    validator both read it, so the questions asked and the questions enforced cannot
    drift apart. 12 tests.
91. **Photo consent for under-18s is now the guardian's to give**, as a separate tick from
    entry consent. A child cannot agree to their own image being used. Optional either
    way — decision 18 made the photo optional for this reason, so refusing must never
    block a place.
92. **Medical is a structured tick-list plus a free-text detail box.** A volunteer can
    scan it in an emergency instead of reading prose, "None" becomes an explicit answer
    rather than a blank nobody can interpret, and structured data is far easier to
    retention-manage than free text.
93. **Medical questions moved out of the under-18 section and are now asked of everyone**
    (still optional). An adult with epilepsy or a severe allergy needs the first aider to
    know as much as a child does, and dietary allergies were already collected from
    everyone — asking only minors was inconsistent.
94. **Emergency contacts for over-18s: not collected.** Owner's decision. Worth checking
    against whatever the public liability insurer requires; the fields exist in the schema
    as optional, so making them required later is a one-line change.

### Two bugs found while wiring this up

95. **The form submitted `avatarId`, which the new strict schema rejected.** Caught by
    replaying the browser's exact payload rather than a hand-written one. `avatarId` is
    now validated against the real avatar list — an unknown id would render a broken
    player card, and `getAvatar()` falls back silently, so a bad value would never have
    surfaced as an error anywhere else.
96. **The form never checked the response status.** `setResult(await res.json())` ran
    regardless, so a 400 rendered the *success* screen and told the registrant they were
    "number undefined in the queue" while all 64 places were still free. Pre-existing, but
    strict validation makes rejection a normal path, so it had to be handled: field-level
    errors are now listed under human-readable labels with "nothing has been submitted
    yet". Related: required consents were reporting zod's "Invalid input" instead of the
    sentence written for them, because a union rejects `undefined` before `.refine()`
    runs. These messages go in front of a parent, so they now coerce first and the written
    message always wins.

### Open, and deliberately not changed

Adult medical data is optional and self-declared. If the retention policy in `04_Legal/`
sets a shorter life for medical fields than for the rest of a registration — which it
probably should — the store will need to delete those fields independently rather than
expiring the whole record.


---

# Round 25 (2026-08-26) — Chat off for everyone, legal drafts, emergency contacts

97. **No chat, for anyone, at any age. Indefinitely.** Supersedes decision 14 (open chat,
    all ages) and decision 17 (free-text chat, 16+). Owner's call, and it makes the
    platform easier to defend: with no free-text channel between players there is nothing
    to moderate, nothing to filter, nothing to retain and nothing to breach. The LFG board
    already worked entirely from fixed menus, so no feature was removed — only the promise
    of one.
98. **`/safeguarding` rewritten to be true.** It had claimed free-text chat for 16+,
    retained messages, "report and block on every conversation", and that messages were
    filtered for phone numbers and links. **None of that existed** — there was no chat, no
    messages, and no filtering was ever written. A parent deciding whether to let their
    child sign up was reading a description of a different product. The page now describes
    what the code does and nothing else, and carries a comment saying every line must stay
    true.
    Two further claims that were also false and are now corrected: account deletion is a
    request handled by a person, not an automated "deletion actually deletes"; and the
    DBS-checked leads and first aider are written as commitments for an event that has not
    happened yet, rather than as present fact.
99. **`/players` no longer markets "Chat (16+)" or "Quick messages".** Neither existed.
    They sat under a "coming after FIFA 26" heading, which softened it, but together they
    committed SWC publicly to shipping open messaging. Replaced with an accurate
    description of the fixed-menu board.
100. Removed the unused `chatEnabled` flag from `PlayerProfile`, and corrected the comment
     in `org.ts` calling the moderators "moderators for the 16+ chat".
101. **Emergency contact required for every participant.** Reverses decision 94 (round 24),
     where the owner chose to skip it for adults. For an adult that is three new required
     fields (name, relationship, phone). **For an under-18 it is the guardian block, which
     is already required and already holds a name, relationship and phone — so a child is
     not asked twice.** Duplicating a child's guardian into a second set of fields would
     mean holding the same personal data in two places for no gain.
102. **Every validation message is now written for a person.** zod's defaults were reaching
     parents as "Invalid input: expected string, received undefined". Required consents had
     the same problem for a different reason — a union rejects `undefined` before
     `.refine()` runs, so the sentence written for the field never fired.

## Legal — seven drafts written, all needing review

103. `04_Legal/` now holds `DPIA.md`, `SAFEGUARDING-POLICY.md`, `PRIVACY-NOTICE.md`,
     `RETENTION-POLICY.md`, `CODE-OF-CONDUCT.md`, `PHOTOGRAPHY-CONSENT.md` and
     `TERMS-OF-USE.md`, all version 0.1. Written by working backwards from what the code
     actually collects, so the field tables, retention targets and risk register describe
     this project rather than a generic template. **Drafts, not advice** — they need a read
     by someone qualified in UK data protection, and the safeguarding policy needs a
     safeguarding-qualified read.
104. **The DPIA's conclusion is "do not open real registrations yet."** Four unmitigated
     risks, each individually blocking: guardian notifications do not send; children's
     medical notes sit in unencrypted files; nothing is ever deleted; DBS checks not
     started. Plus the moderation rota needing real names rather than "TBC".
105. **The retention policy exposed a gap in the store.** Medical notes should be deleted
     ~30 days after an event while the registration itself is kept ~12 months — but the
     store can only delete whole records, so a field-level purge is currently impossible.
     That is the highest-priority data-layer change after the database migration itself.
106. **Two things the sign-up form promises that do not exist yet:** the "I've read the code
     of conduct" tick points at no document (now drafted, still needs linking), and the
     guardian photo-consent wording promises "our photographers are told", which depends on
     a wristband-and-briefing process nobody has built. Either build it or soften the
     wording — do not publish a promise the event day cannot keep.

## Note on publishing these

The repository is public, so the drafts and the DPIA's honest risk register are publicly
readable. That is consistent with how this log already documents the project's limitations,
and the ICO is explicitly more forgiving of a documented known risk than an undocumented
one — but it is a conscious choice, not an oversight. If the owner would rather they were
private, the folder can move to shared storage; no code depends on it.


---

# Round 26 (2026-08-27) — Cloudflare hosting: groundwork done, deploy blocked

107. **Hosting target: Cloudflare, via the OpenNext adapter** (`@opennextjs/cloudflare`).
     A Next app of this shape deploys as a Worker with static assets rather than as a
     classic Pages project. Config committed: `wrangler.jsonc`, `open-next.config.ts`, and
     `cf:build` / `cf:preview` / `cf:deploy` scripts. `nodejs_compat` is required.
108. **Next bumped 16.3.1 → 16.3.3.** The adapter's peer range is
     `>=15.5.24 <16 || >=16.3.3`, which excludes 16.3.1 exactly. `esbuild` added too — the
     adapter needs it at build time and does not declare it. Build, typecheck, lint and all
     121 tests pass on 16.3.3.
109. **The Cloudflare build succeeds and the site runs — but every form returns 500.**
     Tested in `workerd` via `npm run cf:preview`, which is the real runtime, not a
     simulation.
     Working: every marketing and informational page, including the 3D hero.
     Failing: `POST /api/events/[slug]/register`, `/play`, and every server action.
     ```
     Error: operation not permitted
         at Module.mkdirSync (node-internal:internal_fs_sync:277:17)
     ```
     **Cloudflare Workers has no writable filesystem.** All four stores read and write
     JSON files through `node:fs`. No compat flag fixes this; it is the constraint the
     stores' own header comments have warned about since round 1 — *"a JSON file does not
     survive a redeploy on most hosts"* — arriving.
     `/moderation` returns 200 only because it denies access before touching a store: the
     round 24 deny-by-default fix working, not the page working.
110. **Supabase remains the database decision, and it survives this.** The Supabase client
     is HTTP-based and runs on Workers, so choosing Cloudflare for hosting does not force
     Cloudflare D1. D1 would work but would contradict a recorded decision and tie the data
     layer to one host. **Finishing the Supabase migration is the single thing standing
     between this and a working deployment** — and it is already the top item on
     `NEXT-STEPS.md` and clears DPIA risk #4, so none of it is hosting-specific work.
111. **NOT DEPLOYED, on two counts.**
     - **Wrong account.** This machine's wrangler is authenticated as
       `vismaadcreatives@gmail.com`. The intended account is `media@shaheedibunga.com`.
       Deploying to the wrong Cloudflare account means wrong billing, wrong domain and wrong
       access controls. `wrangler login` needs an interactive browser session, so the owner
       has to do it.
     - **`04_Legal/DPIA.md` says do not open real registrations.** Written one day earlier,
       and nothing has changed since. Publishing a working sign-up form for an event open to
       8-year-olds, before guardian emails send and before data is stored securely, would
       contradict the project's own impact assessment. **Deploying is a technical step;
       going live is a safeguarding decision**, and it is not one to take as a side effect
       of wanting a URL.
112. **The safe interim option, if a shareable URL is the actual need:** deploy behind
     Cloudflare Access (email-gated, free tier), with `X-Robots-Tag: noindex`, and the
     sign-up route disabled or visibly marked as a preview. That gives collaborators,
     sponsors and the venue something to look at without opening a children's-data form to
     the internet.

Full detail, including the verified route-by-route results and the deploy commands, is in
`00_Docs/DEPLOYMENT.md`.


---

# Round 27 (2026-08-27) — Cloudflare account pinned per project

113. **Logged in as `media@shaheedibunga.com`** (account `c1b50ea317dc2bbd5fdff7d6d9a3e8d9`),
     with workers, pages and d1 write scopes — everything a deploy needs.
114. **`wrangler login` is global, and that is a hazard here.** It writes one credential
     file for the whole machine, so logging in for this project silently repointed every
     other Cloudflare project in the workspace. There are **at least four different
     Cloudflare accounts** across those projects.
115. **Account pinned via direnv** in a repo-root `.envrc`:
     `export CLOUDFLARE_ACCOUNT_ID=c1b50ea317dc2bbd5fdff7d6d9a3e8d9`.
     A wrangler command run from this directory now either targets the right account or
     fails loudly — verified by pinning a bogus id and getting
     `Authentication error [code: 10000]`. Confirmed the variable is exported throughout the
     project including `03_App/web/`, and unset outside it.
     An account ID is an identifier rather than a credential — Cloudflare's own docs put it
     in committed config — so `.envrc` is safe in a public repo. `.envrc.local` and
     `.direnv/` are gitignored.
116. **Optional full isolation via `CLOUDFLARE_API_TOKEN`** in a gitignored `.envrc.local`
     (see `.envrc.local.example`). Wrangler prefers the token over the OAuth session on
     every code path, including when invoked indirectly by the OpenNext adapter, so it makes
     this project independent of whatever the global login happens to be.
117. **Rejected `XDG_CONFIG_HOME` for this**, despite it working. It does give wrangler a
     genuinely isolated per-project credential store on macOS — tested — but it also
     redirects every other XDG-respecting tool in the directory, `gh` included, which would
     lose its authentication. A scoped token achieves the same thing without the collateral
     damage.

## !! Worth checking — the global login change affects other projects

The login for this project repointed the machine's wrangler credentials. Account IDs found
pinned elsewhere in the workspace:

| Project | account_id |
|---|---|
| `vismaad-creatives/api` | `34c4babf…` (the account previously logged in) |
| `gurbani-overlay` | `2ee39d01…` |
| `365gurbaniwords/signage/signage-worker` | `2ee39d01…` |
| `MySanthiya` | `102027d5…` |
| **`Patel-Brothers`** | **none pinned** |

The pinned ones will now fail loudly rather than deploy wrongly, which is the correct
outcome. **`Patel-Brothers` pins nothing**, so a deploy from it would go to whichever
account is logged in — currently `media@shaheedibunga.com`. That is the accident this round
exists to prevent, and it is worth fixing there too.


---

# Round 28 (2026-08-28) — Deployed, with registration switched off

118. **Live at https://sikh-world-championship.shaheedibunga.workers.dev** on the
     `media@shaheedibunga.com` account. All 14 routes return 200. `shaheedibunga` was
     registered as the account's workers.dev subdomain — the account had none, and wrangler
     could not auto-claim one.
119. **Feature flags added (`src/lib/features.ts`): registration and the LFG board are OFF
     in production, ON in development.** Deploying with them on would have put a form on the
     public internet that 500s on submit — after asking for a child's medical details.
     Two independent reasons, and **the safeguarding one outlives the technical one**:
     fixing the database does not make it correct to open registrations. That is a
     deliberate decision, and the flag is now where it gets recorded.
     With the flags off the sign-up page renders **no form fields at all**, so nothing can
     be typed or submitted, and the API returns 503 with a plain-English reason instead of
     a 500. The board explains what it will do and why it is not on.
120. **The sign-up page is `force-dynamic`.** Prerendering it baked "entries are closed"
     into the HTML at build time — verified — so flipping the flag later would have opened
     the API while the page still said closed. A page and an endpoint disagreeing about a
     safeguarding gate is how a form quietly starts accepting children's data behind a
     notice saying it does not.
121. Also fixed a copy contradiction the flag exposed: the page still said "Sign up now to
     hold your place" directly above the closed notice.
122. **`sikhchampionships.com` is NOT attached.** Registered at Namecheap on 2026-08-26 and
     still on Namecheap nameservers; the Cloudflare account has no zones. Workers custom
     domains require the zone on Cloudflare, and there is no CNAME-only shortcut. The
     wrangler token has `zone (read)` but not zone-create, so adding the zone is a dashboard
     action — steps in `00_Docs/DEPLOYMENT.md`.
123. **Domain name discrepancy, unresolved:** this is `sikhchampionships.com`, while
     `NEXT-STEPS.md` says to register `sikhworldchampionship.com`, and the brand is "Sikh
     World Championship" (round 4, decision 13). Decide which is canonical and redirect the
     other. Two live unlinked domains is worse than either alone.

## Patel-Brothers (separate repo, committed locally, not pushed)

124. That project pins no `account_id`, so a deploy would have gone to whichever account was
     logged in — which, after this round's login, was the wrong one. `bin/cf-guard` now
     refuses any Cloudflare-reaching command unless `CLOUDFLARE_ACCOUNT_ID` is set, and
     `deploy`, `db:create` and `db:migrate:remote` run it first. Local dev is untouched.
     The account id was deliberately **not** guessed — it could not be determined from this
     machine, and a wrong pin would swap a silent misdeploy for a confusing auth error.
     Blocked is better than wrong.


---

# Round 29 (2026-08-28) — Demo mode, and Cloudflare D1 replaces Supabase

125. **Demo mode for the planning team** (`SWC_REGISTRATION_DEMO`, set in `wrangler.jsonc`).
     The sign-up form renders and validates **for real** — schema, guardian age tiers,
     unknown-key rejection, consent checks all run — and only the write is skipped. So the
     team walks the actual form, not a mockup.
     Labelled in three places, because a form that looks like it worked is exactly how
     someone leaves believing their child has a place: a dashed banner above the form, the
     submit button reading "Submit (preview — saves nothing)", and a confirmation screen
     that says plainly no place was held and nothing was stored. Reference is `DEMO-ONLY`.
     Ignored entirely when `SWC_REGISTRATION_OPEN` is true, so it cannot mask a real
     opening.
126. **Supabase dropped. Cloudflare D1 is the database.** Supersedes the Supabase decision
     in `DATA-LAYER.md` and `NEXT-STEPS.md`, which predates choosing Cloudflare for hosting.
     Reasons: one vendor, one bill, one dashboard and one access-control surface for a
     volunteer-run org; D1 sits next to the Worker instead of across an HTTP hop; the
     existing token already has `d1:write`; and **Patel-Brothers already runs D1**, so it is
     not a new thing to learn.
     What we give up, stated honestly: Postgres row-level security, which is real
     defence-in-depth for children's data — but this app is entirely server-rendered with no
     client-direct queries, so the app-layer checks (already written and tested) carry that
     weight. And Supabase Auth, which is a genuine gap; Cloudflare has no consumer auth
     product. Auth is a separate decision for when accounts are actually built.
     Neither choice affects email: a transactional provider is needed either way.


---

# Round 30 (2026-08-28) — D1 migration done

127. **All four stores now run on Cloudflare D1.** `store.ts`, `play-store.ts`,
     `guardian-store.ts`, `support-store.ts`. Every exported signature is unchanged, so no
     caller moved and no test file needed rewriting except two that reached into the JSON
     on purpose. Database `swc-production` (`1954aed5-…`), migrations in
     `03_App/web/migrations/`, served from **LHR** — UK data residency, which matters for
     children's data.
128. **Verified on the real Workers runtime:** a registration that returned 500 an hour
     earlier now writes and returns a reference. The row lands with core fields, guardian
     tier fields and medical details in their own columns, and only event-specific answers
     (`psnId`, `skill`) in JSON.
129. **The retention gap is closed.** `purgeMedical(eventSlug)` deletes the
     special-category fields and keeps the registration — the operation the JSON store
     could not perform, and the reason `04_Legal/RETENTION-POLICY.md` was unenforceable.
     It is idempotent so a daily job can run safely, and scoped per event.
     `clearCheckInTokens()` does the same for the QR credential. Tests cover both, plus
     the case where a cleared token must not let `""` check anyone in.
     **DPIA risk #4 (children's data not stored securely) and #8 (nothing is ever deleted)
     are now addressable** — #8 still needs the scheduled job that calls these.
130. **Tests stay in-process.** D1 is SQLite, and the query surface the stores use is four
     methods wide, so tests run against `node:sqlite` through the same interface rather
     than booting workerd per file. 125 tests in ~250ms. A test suite people are afraid to
     run is one nobody runs, and a five-second boot per file would have undone that.
131. **The database now enforces three things application code used to.** `reference` is
     UNIQUE, so the reference-collision bug from round 10 becomes a failed insert rather
     than two players sharing a reference at the desk. `guardian_approvals.player_id` is
     UNIQUE, so re-asking cannot stack links in a parent's inbox. `blocks` has a composite
     primary key, so a duplicate block is impossible by construction.

## A bug this uncovered: the logo was missing on the live site

132. `brand-assets.ts` scanned `public/brand/` with `node:fs` on every render. That worked
     locally and **silently returned null on Workers**, which has no filesystem — so the
     deployed site had no logo anywhere, with no error to notice. Confirmed by reading
     `logoSrc":null` off the live pages while the local build produced
     `/brand/logo-mark.png`.
     Fixed by resolving the folder once at build time (`scripts/brand-manifest.mjs`, run by
     `prebuild` and by `cf:build`, since the OpenNext build does not fire npm's prebuild
     hook). Dropping a sensibly-named file into `public/brand/` still works; the detection
     just happens at build rather than per render.

## Outstanding

133. **Wrangler is logged out** — the OAuth credential file disappeared mid-session and
     `wrangler whoami` reports not authenticated, so the last redeploy failed. The live
     Worker is the build containing the D1 stores and the logo fix (confirmed: the logo now
     renders on dynamic pages). Re-run `wrangler login`, or better, set a project-scoped
     `CLOUDFLARE_API_TOKEN` in `.envrc.local` — an API token does not expire out from under
     a session the way the OAuth one just did.
134. Still open, unchanged: guardian notification emails do not send, no scheduled job calls
     the purge functions, DBS checks not started, and `sikhchampionships.com` is not
     attached.


---

# Round 31 (2026-08-28) — Custom domain, not a Worker route

135. **`sikhchampionships.com` returned `DNS_PROBE_FINISHED_NXDOMAIN`.** Nameservers were
     correctly on Cloudflare (`phil`/`zita.ns.cloudflare.com`), but the zone had **no
     A/AAAA record at all** — `dig` returned `NOERROR, ANSWER: 0` for both the apex and
     `www`. The registrar's parking records had been deleted (correctly) and nothing
     replaced them.
136. **A Workers Route was the wrong tool.** A route only matches requests that already
     reach Cloudflare; it does **not** create a DNS record, so adding one to an empty zone
     changes nothing a browser can see. Routes are for putting a Worker in front of an
     existing origin on particular paths. Here the Worker *is* the origin.
     **Custom Domains** create the DNS record and the certificate, and are now declared in
     `wrangler.jsonc` so a deploy attaches them rather than relying on dashboard state.


---

# Round 32 (2026-08-29) — Live on the domain; canonical host settled

137. **Live at https://sikhchampionships.com**, D1 bound, logo rendering. Custom domains
     declared in `wrangler.jsonc` so a deploy attaches them.
138. **"Always Use HTTPS" enabled** via the API. The certificate had been valid all along —
     the problem was narrower than it looked: `http://` returned 200 instead of redirecting,
     so typing the bare domain left you on HTTP and the browser said "Not Secure".
139. **Canonical host: the apex, `sikhchampionships.com`.** Both hosts were serving the
     site, which is duplicate content — search engines guess which is authoritative, links
     and shares split between the two, and anything host-scoped (cookies, analytics, an
     eventual login session) silently forks in half.
     Apex over www because the name goes on posters, flyers and social bios for a community
     event, and the shortest thing a person can be told to type wins. Cloudflare handles
     apex records, so the old technical argument for www does not apply.
     Implemented as a Next redirect in `next.config.ts` rather than a Cloudflare Redirect
     Rule, so it is version-controlled and reviewable rather than dashboard state nobody
     remembers setting. (The API token also lacks Rulesets edit.)
     **Bug caught while verifying:** `source: "/:path*"` leaves the literal `:path*` in the
     destination when it matches the bare root, so `www.sikhchampionships.com` redirected to
     `https://sikhchampionships.com/:path*`. Sub-paths were fine; only the root was broken.
     Fixed with a separate rule for `/` plus `/:path+` for the rest.
140. **Resend configured and verified**, EU-West-1 (Ireland) — the right region for UK
     children's data. DKIM present, `send.` subdomain carrying SPF and the bounce MX.
     **Still missing: a DMARC record.** Without it guardian notifications are far more
     likely to be filed as spam, and a safeguarding email that silently lands in junk is
     worse than one never promised.

## Credential hygiene

141. Both API keys (Cloudflare and Resend) were surfaced in full in a chat transcript.
     Nothing went wrong, but a live credential to an account holding children's data should
     not persist after being logged somewhere it was not meant to be. Rotate both.
142. The `RESEND_API_KEY` line in `.envrc.local` was missing `export`, so it was never
     reaching any process. The Cloudflare token line had also been left commented out.
     Both fixed — worth knowing as a pattern: a value present in the file is not the same
     as a value in the environment.


---

# Round 33 (2026-08-29) — Retention job; DMARC still blocked

143. **Scheduled retention worker built and deployed** — `swc-retention`, daily at
     `15 3 * * *`. Deletes medical fields 30 days after an event, clears check-in tokens
     after 1 day, and writes an audit row for every action.
     **DPIA risk #8 ("data kept indefinitely") is now closed in code.**
144. **Deliberately a separate worker from the website.** It deletes children's data, so it
     should be deployable, rollback-able and reviewable on its own: a mistake there cannot
     take the site down, and a bad site deploy cannot silently stop the deletions. It also
     avoids wrapping OpenNext's generated worker to bolt on a `scheduled` handler, which
     would couple us to generated output. The logic itself is shared with the app
     (`applyRetention()` and the stores), so the two cannot drift.
145. **It refuses to act on an undated event, loudly.** `sikh-fifa-26` has `date: null`, so
     every run currently logs
     `SKIPPED sikh-fifa-26 — No event date set, so nothing can be measured from.`
     Guessing would mean either destroying a child's medical details before the first aider
     had read them, or holding them long past the policy. Neither is acceptable, so the job
     says so instead of assuming. **It starts working the day a date is set.**
146. **Everything is anchored to the EVENT date, never to row creation or "now".** A
     registration's medical notes exist for the event; the clock starts when the event
     happens. Tested with two events whose rows were written at the same moment — only the
     past one is purged.
147. **The audit table holds no personal data**, so it never needs purging itself. There is
     a test asserting that no name, email, phone or medical string can leak into it.
148. **Verified end to end**, not just unit tested: with a temporary event date 60 days
     back, a real run against a real D1 left `medical`, `medical_conditions` and
     `check_in_token` all NULL, `medical_purged_at` stamped, the registration's reference
     and name intact, and two audit rows written. The temporary date was reverted and the
     remote database confirmed untouched (0 registrations, 0 runs).
     A gotcha worth recording: **each wrangler config keeps its own local D1 state**, so
     the retention worker sees an empty database locally unless run with
     `--persist-to ../../.wrangler/state`.

## Still blocked on access

149. **DMARC is still not set.** The rotated API token reports `active` and can see the
     zone, but both DNS read and write return `Authentication error` — so
     Zone → DNS → Edit did not land on this token, most likely because the rotation created
     a fresh one without it. The record to add by hand:
     `_dmarc` TXT → `v=DMARC1; p=none; rua=mailto:media@shaheedibunga.com; fo=1`
     Without it, guardian notifications are far more likely to be filed as spam — and a
     safeguarding email that silently lands in junk is worse than one never promised.
150. Mail sender confirmed as `no-reply@sikhchampionships.com`.


---

# Round 34 (2026-08-29) — Guardian emails send; share image

151. **`notify.ts` sends real email, via Resend.** The stub that only logged is gone, and
     with it the gap between what /safeguarding promised and what the code did.
     `no-reply@sikhchampionships.com`, domain verified, EU-West-1.
152. **Every send is recorded in `email_sends`** — the standing TODO: "record that it was
     sent so we can prove the notification happened if a guardian ever asks". A
     safeguarding promise you cannot evidence is one you cannot defend.
     The table stores kind, recipient, subject, status, provider id, error and attempt
     count — **never the message body**. The kind and context show what was sent; keeping
     rendered text would copy a child's name into another table for no gain.
153. **Sending never throws at the caller.** An email failure must not roll back the thing
     that triggered it: a guardian approval that succeeded but reported an error would
     leave the child locked out for a reason nobody can see.
154. **Failed sends are surfaced at the top of /moderation**, above the report queue,
     because a guardian notification that did not send is a safeguarding incident rather
     than an ops detail — the connection happened and the one person who should know does
     not. Nobody reports this, and nobody will.
155. **A missing API key records a failure rather than a silent success.** That is exactly
     how the old stub hid the fact that nothing sent.
156. **Idempotent by event, not by time.** A re-render or double submit cannot email a
     parent twice — but a FAILED send stays retryable, or a notification lost to a blip
     would be lost forever.
157. **Two notifications still cannot send, and say so.** `notifyRequestReceived` and
     `notifyChildOfDecision` take a `playerId`, and there is no accounts system to look an
     address up in. They record the attempt as a failure reading "no email address on
     record — player accounts do not exist yet", so it appears in the moderation queue
     instead of vanishing. They start working when accounts do.
158. **Open Graph image added.** Shares previously rendered a grey triangle: there was no
     `og:image`, and no `metadataBase`, without which Next emits a relative image URL that
     every scraper ignores. Generated with `next/og` rather than a static file so the
     wordmark and tagline stay in step with `org.ts` — which matters while the
     Championship/Championships naming is still unsettled. Verified rendering in workerd
     before deploying, then live: a real 1200×630 PNG.
     It does **not** use the new logo, because the full lockup has not been saved to
     `public/brand/logo.png` yet. Once it is, it can be composited in.
159. **`robots: { index: false }`** while entries are closed and the safeguarding leads are
     unnamed. There is nothing here worth indexing yet, and a search result pointing at a
     page naming "TBC" as the safeguarding contact is worse than no search result.


---

# Round 35 (2026-08-29) — Player accounts

160. **Passwordless sign-in, hand-rolled, D1-backed.** Deliberately against the usual
     "never roll your own auth", so the reasoning is in
     `migrations/0004_accounts.sql`: there are no passwords to store or leak; a session is
     a 256-bit random bearer token looked up in a table rather than a signed cookie, so
     there is no signature scheme to get wrong and revocation is a DELETE; and the
     decisive reason — **under-16 accounts are guardian-linked, and no off-the-shelf
     library models that.** Adopting one would mean fighting its user model on exactly the
     part that matters most. Revisit if OAuth, MFA or passwords are ever needed.
161. **Security properties are asserted, not assumed** — 14 tests. Single-use tokens
     (a link forwarded, cached by a mail scanner or left in an inbox cannot be replayed),
     15-minute expiry, requesting a new link kills the old one, an unknown address gets an
     identical response to a known one so the form cannot enumerate who has an account, and
     signing out deletes the session server-side rather than only clearing the cookie.
162. **The account is created during registration**, per decision 15 — one form, account at
     the end. The guardian email comes from that record and nowhere else, which is what
     keeps the consent mechanism from being theatre.
163. **`upsertPlayer` never changes age band or moderator status on a later registration.**
     Age band is a safeguarding boundary and moderator is an access grant; neither may move
     as a side effect of filling in a sign-up form. Both are tested.
164. **Age band is stored, not derived.** Computing it from date of birth on every read
     would mean a child's sixteenth birthday silently moved them into the adult pool,
     including into conversations already in progress. Moving band should be deliberate.
165. **`currentPlayer()` now returns `SessionPlayer | null` and fails closed.** The compiler
     found all 21 call sites, which is exactly why everything read through that one
     function. The stub used to return a fixed player who was also a moderator — the bug
     behind round 24's public moderation queue. Nothing may invent a viewer again.
166. **Two bugs found by testing in the real runtime, not in unit tests:**
     - Redeeming a link 500'd, because Next only permits setting cookies from a Route
       Handler or Server Action, never during a page render. Converted to a route handler.
     - `rate-limit.test.ts` was **flaky, failing about one run in three**: it used a 1ms
       window, so the window could elapse between the two calls asserting refusal. Found by
       running the suite repeatedly rather than shrugging at a single red run. Rewritten
       with fake timers; 10 consecutive clean runs.
167. Sign-in lives in the footer, not the header: it is for the few people who already have
     an account, and the header's single call to action should stay on entering an event.

## Noted, not changed

168. `public/brand/logo.png` is **1.36 MB**, and it is in the footer of every page. That is
     a real cost on mobile data for the community this is aimed at. It wants resizing to
     roughly 600px wide — but it is a brand asset, so that is the owner's call rather than
     something to do quietly.


---

# Round 36 (2026-08-29) — Brand assets optimised

169. **Every page was loading 1.57 MB of logo.** `logo.png` was 1.36 MB in the footer and
     `logo-mark.png` 210 KB in the header — the mark drawn at about 22px. On mobile data,
     for the community this is aimed at, that is a real cost and the first thing a visitor
     pays before seeing anything.
170. **Now WebP, resized to what is actually drawn.** The footer lockup renders at 210px, so
     640px gives 3x for retina with headroom; the header mark renders small, so 160px is
     generous.
     `logo.png` 1327 KB → `logo.webp` **34 KB**. `logo-mark.png` 210 KB → `logo-mark.webp`
     **5 KB**. Checked visually at quality 88 before shipping — the gold gradients and the
     nishan sahib survive it cleanly.
171. **Masters moved to `01_Brand/`**, which is what that folder is for: the authored
     originals live there, only optimised copies are served. `swc-logo-texture.png` (1.6 MB)
     was sitting in `public/` as a master and being served publicly for no reason — the GLB
     uses the JPEG. Shipped brand weight is now **336 KB total, from about 2 MB**, and most
     of the remainder is the 3D model.
172. `public/brand/README.md` carries a note to check the weight before adding another PNG,
     since this is the kind of thing that creeps back.


---

# Round 38 (2026-08-30) — Registration becomes an application

173. **Filling in the form no longer secures a place.** Applicants are checked for
     eligibility and safeguarding, then places are drawn. Statuses are now
     `applied → selected | not-selected`, plus `withdrawn` and `checked-in`.
174. **A profile is created only on SELECTION, not on submission** — and it is no longer a
     checkbox. `accountConsent` is gone; the form states plainly that a profile will be
     created if they get a place. Offering a choice that does not exist was the wrong
     shape. **This moves the lawful basis from consent to contract**, which the privacy
     notice needs to reflect.
175. **The check-in token is issued on selection too.** It is the credential that marks
     someone present; handing it to everyone who filled in a form made it meaningless.
176. **There is no waitlist any more.** A queue position ("you are number 7") also revealed
     how many people had applied, which the owner asked not to expose. The concept and the
     leak went together. References were already random — 6 characters from a 31-character
     alphabet — so they never leaked volume.
177. **The draw is two pools, not "random".** Referred applicants are drawn first, the rest
     after; each pool shuffled independently. Described accurately because a published
     policy saying "random" when it is weighted is the sort of inaccuracy that gets
     challenged.
     **Safeguarding survives randomisation**: only applicants who already passed
     eligibility are in the pools at all.
178. **Every draw is recorded with its seed and can be recomputed.** Fisher–Yates driven by
     a SHA-256 keystream, with rejection sampling rather than modulo — a plain modulo biases
     towards low indexes, which is exactly the quiet unfairness to avoid. There is a test
     asserting no positional bias over 600 draws. "How were places decided?" is a question
     a community event must be able to answer months later.
179. **`runDraw` supports a dry run and backfilling.** Places already taken are subtracted,
     so it can be re-run for drop-outs without displacing anyone.
180. **Undrawn applicants stay `applied` until `closeDraw` runs.** Marking someone rejected
     before you have told them is a state nobody can explain if they ring up.
181. **The referral field is not a religion field**, and `src/data/referral-orgs.ts` says so
     at length. "Another organisation" and "Nobody" are first-class options, it is stored
     as a referral source only, and nothing infers anything from it. A list of Sikh
     organisations makes the answer a proxy for religion — special category data by
     inference — so this needs privacy-notice coverage saying it is used for draw order and
     nothing else.
182. Applications close **2026-09-26**, a week before the event, configurable in the event
     file.

## Copy that changed

183. "Sign up" → "Register interest" throughout. The confirmation screen no longer says
     "You're in": it says "Application received", explains there are more applications than
     places, and that we will email either way. The person reading it is often a parent.
184. The "not selected" email is written with more care than the acceptance. It goes to a
     young person who put their details in and did not get a place, and the difference
     between "you were not chosen" and "there were more applications than places, and it
     was a draw" is the difference between feeling judged and understanding what happened.


---

# Round 39 (2026-08-30) — Supervision tiers tightened

185. **New policy, superseding round 24's tiering:**
     - **no under-12s** (already the case: the division floor is 12)
     - **12–15** — a parent or guardian stays at the venue for the whole event
     - **16–17** — may attend alone, if their guardian permits it
     - **18+** — no guardian involvement
186. **The "dropped off and collected" tier is gone entirely**, along with the
     how-far-away-will-you-be question. Under-16s are no longer left at the venue without
     their own adult. Removed from the rules module, the validator, the form and the store
     rather than left as dead safeguarding code, which is worse than none.
187. **!! The boundary at 16 is an assumption.** The brief said "12–16 parents must remain"
     and "16–18 parents can give permission", which overlap at 16. It is implemented as
     12–15 and 16–17, matching the U16 / 16+ split the rest of the app already uses.
     `GUARDIAN_PRESENCE_UNTIL` is one number — change it if 16-year-olds should need a
     parent on site. Four tests pin the boundary down so any change is deliberate,
     including that a 15-year-old cannot substitute independent-attendance permission for
     the on-site promise.
188. **Operational consequence worth planning for:** every 12–15 entrant now brings an
     adult into the building. If a good share of 64 players are in that band, the venue
     needs to seat well over a hundred people, and langar has to stretch. That is a
     capacity question for the Leicester venue, not just a policy one.


---

# Round 40 (2026-08-30) — Removals

189. **`/safeguarding` deleted**, at the owner's decision. The case against was put twice:
     the sign-up form linked to it, it is an app-store requirement for the planned native
     wrap, venues and insurers ask for it, and deleting the page removes the evidence of
     meeting the obligation rather than the obligation. A six-line replacement stating only
     what is true was offered and declined. Recorded here so the reasoning is not lost.
     Every link to it is gone — nav, footer, sign-up form, support page, guardian approval
     page and the board — so nothing points at a 404.
     **The obligation stands.** `04_Legal/SAFEGUARDING-POLICY.md` still exists and still
     needs its named people; it is now the only place the policy lives.
190. **No email address anywhere on the site.** `ORG.email` is gone rather than corrected —
     it still read `TBC@sikhworldchampionship.com`, the wrong domain. Every "contact us"
     now goes to `/support`, which is better than an address for this audience: it reaches
     a moderator queue with assignment and an audit trail, it works without an account or a
     name, and it puts nothing on a public page to be scraped. The safeguarding contact
     block went with it.
191. **Supabase references removed** outside the decision log. It was still named in
     `DATA-LAYER.md`, `BRAINSTORM.md`, `NEXT-STEPS.md`, `DEPLOYMENT.md`, the privacy notice
     and a comment in `db.ts`, three rounds after D1 replaced it.
192. **Chat references removed.** `00_Docs/CHAT-AND-SAFETY.md` and
     `00_Docs/ONLINE-PLAY-AND-CHAT.md` deleted; the remaining copy says "messaging" where
     it needs to describe the absence of one. Kept deliberately, in three places, is the
     statement that there is **no messaging between players** — in the guardian consent
     terms, on the board, and in the DPIA. Those are not references to a feature; they are
     the assurance itself, and deleting them would weaken a real protection. Say so if they
     should go too.
193. `DECISIONS.md` is untouched by all of this. Superseded entries are the point of a
     decision log, and rounds 25 and 29 already say what they supersede.

## Not removed, and why

194. The demo data flagged in the round-40 audit — `play-seed.ts`, `demoTrophies` on
     `/players`, `demoEntrants` on the bracket — is still there. It was on the list and the
     owner did not call it, so it stays until they do. It matters most for the bracket,
     which will show 64 invented players on a projector at a real event if nobody replaces
     it.


---

# Round 41 (2026-08-30) — Support page, socials, admin panel

195. **Support page rewritten.** Its FAQ described a product we do not run: blocking people
     on a board that is switched off, a waitlist that no longer exists, and account deletion
     "that actually deletes" when deletion is a person editing records by hand. Six answers
     now, every one true today, and the page carries a comment saying they must stay that way.
196. **Socials: Instagram only.** `https://www.instagram.com/sikhworldchampionships/`, added
     to the footer. TikTok and YouTube removed rather than left as "TBC" — a dead social
     link is worse than none, it sends someone to nothing and looks abandoned. Note the
     handle is `sikhworldchampionships`, plural, which is a fourth spelling of the name.
197. **Admin panel built** at `/admin`: application counts, how many of those waiting were
     referred, the draw, and a full draw history showing the seed each one used.
198. **Preview is separated from commit**, deliberately. Committing creates accounts and
     emails sixty-odd people, several of them children. Preview shows the exact outcome and
     changes nothing; commit then asks for confirmation, because emails cannot be recalled.
     Telling the unselected is a third, separate action — backfilling drop-outs is easier
     before it runs.
199. **Moderator is a database grant with no button anywhere.** `setModerator()` in
     `players.ts` documents it, and the actual grant is a `wrangler d1 execute`. Moderators
     read safeguarding disclosures, applicants' names and guardians' contact details, and
     run the draw; that is a decision someone makes once, on purpose, not something
     clickable by whoever already has access.
200. **`SWC_DEV_MODERATOR` was dead config** and is gone from `.env.example` and `CLAUDE.md`.
     It drove the old session stub, which real auth replaced in round 35 — so for several
     rounds the documentation described a switch that did nothing. Found by trying to use it.
201. `confirmSelection` is now tested (9 tests): the account it creates, the age band derived
     from date of birth, that an adult gets no guardian attached, that the check-in token is
     issued only here, and that running it twice creates no second account, sends no second
     email, and **keeps the existing check-in token** — otherwise a re-run to backfill
     drop-outs would invalidate a QR code already sent to someone.
202. `00_Docs/MEETING-QUESTIONS.md` written — the open decisions, ordered by what they cost
     to leave unanswered.

## Recommendation recorded: do not drop dietary needs

203. The brief asked whether to remove langar and dietary preferences. **Recommend keeping
     the dietary question.** It is where allergies get declared, and the answer goes to
     whoever runs the kitchen and to the first aider. Removing the question does not remove
     the allergy; it removes the warning. If the uncertainty is about langar itself, the
     cleaner fix is to keep the question and change its wording. Left in place and raised in
     the meeting questions rather than decided here.

# Round 42 (2026-08-31) — Registration is for the platform

## The problem, in the owner's words

> "registration is for the platform, which includes register interest for the first event.
> next time user with existing profile will just need to register interest for the next
> event. url doesn't seem to reflect that if you see what I mean."

It did not. The site had one call to action, `/events/sikh-fc-27/signup`, which said this
is how you enter *this event*. Everything about the information architecture said the
event was the product. It is not — the platform is, and FC 27 is the first thing on it.

Same with the footer, which linked straight to the FC 27 bracket under the label "Live
bracket". With one event that reads fine. With two it is wrong, and it was already wrong
in the sense that most people clicking it wanted the event, not a knockout diagram.

## What changed

| Was | Is |
|---|---|
| `/events/:slug/signup` | `/events/:slug/register-interest` (old URL 301s) |
| Header CTA → the FC 27 form | Header CTA → `/join` |
| Footer: All events, Sikh FC 27, **Live bracket**, Volunteer | Footer: All events, **every upcoming event by name**, Volunteer |
| Nothing at the platform level | `/join` — what a profile is, then pick an event |

The footer now maps over `upcomingEvents()`, so a second event appears there by adding its
data file. Nothing needs editing to keep it right, which is the point.

## The real change: a profile now exists from registration, not from selection

Round 38 was explicit that an account is created **on selection**, reasoning that filling
in a form does not make you a player and that minting accounts for everyone would mean
holding records for people who never got in. That was correct while a profile did nothing
for anyone who was not drawn.

It stopped being correct here:

> "profile users will have access to sponsor discounts like 10% off or preorder game
> merchandise, or other sikh businesses sponsors discounts etc."

A benefit only 64 people can have is not a platform. And a person who registered interest,
was not drawn, and is wanted back for the next event is exactly who a profile is for.

So `src/lib/interest.ts` now creates the profile, records the application against it, and
sends the emails — one function, one place, mirroring `selection.ts`.

**The check-in token did not move.** It is the credential that marks someone present and
there is no place to attend yet, so it is still issued only on selection.

### The cost, stated plainly

We now hold an account for **everyone who ever registered interest, including children who
were never selected and never attended**. That is more children's data, held longer, than
before this change. It is defensible — they asked for a profile and it does something for
them — but it is defensible only while `04_Legal/RETENTION-POLICY.md` is actually enforced.
The DPIA needs re-signing with this in it. Recorded here rather than discovered later.

## Acknowledgement emails — a launch blocker that had been sitting as a TODO

The register endpoint carried this since round 38:

```
// TODO before launch: email an acknowledgement, and copy the guardian in for under-18s
```

Nothing was sent. Someone filled in twenty fields including their child's medical details,
saw a screen, and then silence with no way to tell whether it arrived. For a parent that
reads as a scam, and it is the first impression the project makes.

Two templates now go out at submission:

- **`interestReceived`** to the applicant. Leads with the reference and, in a highlighted
  block, *this is not a place yet* — the last chance to say so before someone tells their
  child they are going.
- **`guardianInterestNotice`** to the guardian of anyone under 18. This is the important
  one. It states what was agreed on their behalf, what supervision their child's age tier
  requires, and gives a button that says **"This was not agreed with me"**. Everything else
  on the form was typed by whoever was at the keyboard, and a child can type a parent's
  name and tick a box. This email is the only thing that puts that claim in front of the
  adult it was made about while there is still time to say no.

Sent even when the guardian address matches the applicant's, because the case it guards
against is precisely the one where a child controls both.

Neither can lose an application: `sendEmail` records failures instead of throwing, and
there is a test asserting the registration survives a 500 from the provider.

## Found while writing those templates: user text goes into email HTML unescaped

Every template interpolated names, gamertags and regions straight into HTML. A person
registering as `<a href="...">Click here</a>` would have had their link delivered inside a
safeguarding email, from our own verified domain, to a parent — a better phishing position
than an attacker could build on their own. `esc()` added and applied to every user-supplied
value in the file.

## Invented data no longer renders in production

`showDemoData()`, and deliberately **not** using the `flag()` helper: there is no
environment variable that can turn it on. The bracket's thirty-two invented Sikh names are
indistinguishable from a real draw. On 3 October the hall would have been looking at a
screen full of people who do not exist, and before then anyone visiting the page would look
for their own name. Same for the demo trophy cabinet on `/players`.

The bracket is **not** wired to real registrations, because that needs a decision first
about what name to put on a public screen for a 12-year-old. It is in
`00_Docs/MEETING-QUESTIONS.md`.

## Also removed

- The "Find players — coming after FC 27" section on `/players`, which advertised the
  board to the public. The board is switched off and launching it has not been decided;
  round 40 removed chat references and this was one that survived because the page is not
  in the navigation.
- The "Find a game is switched off for you" line on `/profile` for under-16s. Telling a
  child a feature nobody can reach is switched off invites them to ask a parent to switch
  on something that is not there.

## Admin access

`scripts/grant-moderator.mjs` creates a staff account and grants it. There was no way for
the owner to reach `/admin` at all: accounts only came into existence through selection, so
nobody had one. Still a database grant with no button — a moderator reads safeguarding
disclosures, applicants' names and guardians' contacts, and runs the draw.

No revoke script, on purpose. Removing access is urgent and belongs in a one-line UPDATE
you can read, not a script whose behaviour you have to trust.

## Docs rewritten rather than patched

`03_App/web/CLAUDE.md` and `00_Docs/NEXT-STEPS.md` both described a product from around
round 20 — JSON stores, a session stub returning a fixed moderator, `notify.ts` that only
logs, ages 8+, a domain that was never bought. All of it long since untrue. A backlog
nobody trusts is worse than no backlog.

# Round 43 (2026-08-31) — The volunteer dead end, and four legal docs that had drifted

## "Volunteer with us" led nowhere

It was the only call to action on `/volunteer` and it pointed at a support form with no
volunteering option, so anyone who came to help had to file it under "Something else".
Added the category and deep-linked it: `/support?about=volunteer` arrives with it selected.
Validated against the real category list on both sides, so a hand-typed query string falls
back to the safeguarding category rather than leaving nothing chosen.

Still a stopgap. A real volunteer form needs DBS status, availability and a reference, none
of which belong in a general support message.

## Lead and deputy names are the charity's, and are not duplicated here

The owner's correction, and the better argument: a second copy of a name in a second policy
is a copy that goes out of date, and the one people reach for in an incident is whichever
they happen to have. `SAFEGUARDING-POLICY.md` now points at the charity's policy and lists
what this project owes instead — confirmation that those people cover SWC events and the
platform.

## "DPIA re-signed" was wrong, and checking it found worse

The DPIA has **never been signed**. It is a draft with `[NAME]` in the sign-off table, so
there is no ceremony to repeat. A DPIA *is* mandatory here — UK GDPR Art. 35, children's
data including health data at scale — but for the whole project, not for the round 42
change.

Checking it found that four legal documents contradicted the code. These are the documents
handed to a parent or a regulator:

| Document | Said | True since |
|---|---|---|
| SAFEGUARDING-POLICY | ages 8–11 on site, 12–15 drop-off | round 39 |
| TERMS-OF-USE | places "allocated in order", waitlist | round 38 — a random draw |
| DPIA | Sikh FIFA 26, ages 8+, board in scope | FC 27, 12–21, board off |
| PRIVACY-NOTICE | the old supervision tiers | round 39 |

The DPIA risk table was also overstating risk in the other direction — it still described
unencrypted JSON files, no authentication, nothing ever deleted, and a `notify.ts` that
only logged. All four had been built.

# Round 44 (2026-08-31) — What goes on the projector, and when a profile is deleted

Two owner decisions, both acted on in full.

## The bracket shows a tournament handle, not a name and not a PSN ID

`src/lib/handle.ts`. A third string, chosen at registration, defaulting to first name plus
last initial.

The suggestion had been to use the PSN ID. The argument against, which the owner accepted:
**a PSN ID is an address, not a label.** Anyone in the hall, or anyone reading the bracket
from home, can search it on PlayStation and send a friend request to a twelve-year-old. It
is also the single field this platform protects hardest — released only to two players who
have both agreed to a game — so projecting it undoes the strongest protection here in one
step. And they routinely contain a real name or a birth year (`harman_singh_2013`).

The real full name was the other candidate and fails the policy promise that no public
surface shows a surname.

**Two refusals are enforced, because a rule nobody enforces drifts:**

- a handle equal to the entrant's own PSN ID
- a handle containing their surname, matched on word boundaries so "Singh" is caught in
  "Singh_FC" and "Singer" is not caught for someone named Sing

Both run in the browser and again in `validateRegistration`, from the same function, so the
two cannot disagree. `resolveHandle()` is the last line: if a submission made outside the
form still carries a bad handle, it falls back to the default rather than letting a PSN ID
reach a screen.

**What the checks cannot do, and the control that covers it.** An insult, a phone number,
somebody else's name, an Instagram handle — none of those are machine-detectable. So
`/admin` lists every public name for an event's selected players with an inline correction,
and the safeguarding policy now says a moderator reads that list before the day. Sixty-four
rows, once. A control with no screen is a control nobody performs.

Deliberately **not** unique. Two players called Amrit S. is a scoreboard question, not a
safeguarding one, and enforcing uniqueness pushes people towards distinguishing themselves
with a birth year.

## A profile that never attended an event is deleted after 24 months of no activity

Approved, with the condition that it be visible in the admin panel. `purgeDormantProfiles()`
in `src/lib/retention.ts`, on the same nightly cron as the medical purge, recorded in
`retention_runs` under the scope `(platform)` — the one retention rule with no event behind
it, which is precisely why it needed deciding.

**Activity is the latest of** account creation, last sign-in, and last registration of
interest. All three, because any one alone gets it wrong: `created_at` alone deletes
somebody who signs in monthly, and `last_seen_at` alone deletes somebody who registered
last week without signing in again. `last_seen_at` was a column nothing ever wrote; it is
now written on magic-link redemption and on registration, both already writes. Deliberately
not written by `currentPlayer()` — that runs while rendering, on nearly every request, and a
page view should not be a database write.

**Four exemptions:** moderators (deleting one silently removes access to the safeguarding
queue), anyone who attended, anyone named on a report as reporter *or* subject, and anyone
named on a support ticket. The last two because safeguarding records are kept six years and
a record whose subject has been deleted cannot be acted on — destroying it early is the
classic safeguarding failure.

The cascade across sessions, sign-in tokens, guardian approvals, board posts, game requests
and blocks is written out explicitly rather than left to `ON DELETE CASCADE`: only two of
those tables declare it, SQLite does not enforce foreign keys unless asked, and the
consequence of getting it wrong is an orphaned row holding a child's display name that no
future deletion request would ever find.

**The registration is unlinked, not deleted.** It has its own period, measured from the
event, and it is the record of who applied.

## The quiet corner, and what it admits

`/admin` gains a retention section at the bottom: profiles, in scope, due in the next 90
days, deleted to date, last run, and the last eight runs. `dueWithin90Days` is the useful
one — it is the only figure that is ever non-zero on a healthy system, so it is what lets
somebody notice the rule is about to delete accounts before it does. A non-zero "due now"
prints a warning, because it means the nightly job has stopped.

It also states plainly that deleting a profile does not delete the registration behind it.

## Which surfaced the bigger gap: DPIA risk 14

Deciding the profile duration made it obvious that **nothing deletes a registration at
all.** The policy says 12 months after the event; the brackets have never come off, so it
was never built. That means the name, date of birth, email and mobile of every applicant —
most of them children — are held with no end date. It is now the largest
storage-limitation gap in the project and it is blocked on a number, not on code: a purge
running to an unconfirmed duration is worse than no purge. Added to the DPIA as risk 14 and
to the meeting questions.


---

# Round 45 — Stopping the leak, and a way to rehearse an entry for real

Two asks, one about a repeated failure and one about being blocked: *"how to avoid cf and
resend keys getting leaked again.. I can't keep on doing this"*, and *"just get me the
quickest path to the full registration version for testing.. provided I can delete specific
test accounts from admin after ensuring everything works"*.

## The keys: the file was the vulnerability, not git

Both leaks had the same shape. The token and the API key were literal strings in
`.envrc.local`; something read the file; the contents landed in a transcript on disk.
`.envrc.local` was gitignored throughout and was never committed. **Rotating twice fixed
nothing, because the mechanism was untouched** — which is exactly why it happened again.

So the fix is not "be more careful". It is to make the file worthless:

1. **The values moved to the macOS Keychain.** `.envrc.local` is now two `security`
   lookups and no values, written by `scripts/secrets-to-keychain.sh` (hidden input,
   nothing echoed). Reading the file yields nothing.
2. **The printing commands are refused.** `.claude/hooks/deny-secret-reads.py`, a
   PreToolUse hook, blocks reading `.envrc.local`, dumping the environment, calling
   `security find-generic-password`, reading a transcript, or expanding a secret variable
   into a command line. **Deny, not ask.** A prompt is a decision taken in a hurry by
   whoever happens to be watching, and the whole failure mode was that nobody was watching
   closely.
3. **Production secrets stay in Cloudflare**, set by pipe so the value never appears in a
   command line or a shell history.

`00_Docs/SECRETS.md` is the record. Rotation is still owed — a mechanism that stops the
next leak does nothing about the two keys already in transcripts on disk — and
`scripts/scrub-transcripts.py` redacts the dead strings afterwards.

## Registration testing: three states, not two

The blockage was real and it was ours. Production had exactly two settings, and neither
could rehearse an entry:

- `SWC_REGISTRATION_DEMO` runs every check and skips the write, so it tests nothing that
  happens *after* the submit button — not the D1 write, the guardian email, the magic link,
  the draw or the check-in token.
- `SWC_REGISTRATION_OPEN` tests all of it and simultaneously invites the public to enter
  children into an event whose date, venue, insurance and DBS checks are unsettled.

Third state: **a key in a cookie.** `/testing?key=…` opens real registration for one
browser on the live deployment; everyone else still gets the closed form. The cookie holds
the key itself rather than a flag, so it cannot be forged by typing `swc_tester=1`;
comparison is constant-time; an unset or wrong key both 404, so there is nothing to iterate
against; the key must be at least 24 characters, so a typo like `SWC_TEST_KEY=true` cannot
become a working password. Every gate now asks `registrationLive()` — "can THIS browser
submit" — because `registrationOpen()` answers a different question and a page asking the
wrong one shows a closed notice above a working form.

The tester banner is louder than the demo banner, deliberately. In demo mode a mistake
saves nothing; in tester mode it saves a real child's details to the live database.

## Deleting an entry: asked for as cleanup, kept as an obligation

`/admin` gains **Entries**, with a delete button. It removes the profile, the entry and
everything attached to both.

Two things about it are deliberate. It is **shut by default and asks for the reference to be
typed**, not for an OK click — this is the most destructive control in the app and it sits
on the same page as the draw; typing `SWC-MBH-VEE` is an act, clicking OK is a reflex. And
it **refuses** a moderator, or anyone named on a report or a support ticket, out loud rather
than quietly: a safeguarding record about someone who has been deleted cannot be acted on,
which is a legitimate refusal under Art. 17(3).

It was asked for as a way to clear up after a rehearsal. It stays because **UK GDPR Art. 17
applies whether or not the code exists** — before this, honouring an erasure request meant
hand-writing SQL against production, at speed, while a parent was on the phone.

Deletion is now **one** function, `deleteAccount()` in `src/lib/account-delete.ts`, shared
with the retention job. The two callers differ in exactly one flag: retention keeps the
registration and unlinks it, the admin button deletes it. That difference is tested in both
directions, because the wrong one either leaves a child's name behind or starts destroying
the record of who applied. Every deletion — manual included — writes to `retention_runs`
(migration 0007 widens the CHECK), because "did you delete it?" is the one question a
subject access request always asks.

## On "too many legal questions"

Fair, and worth answering plainly: most of what is still open is not legal paperwork, it is
event logistics that the paperwork keeps asking for — the venue address, the day timings,
who is on the floor. The DPIA is one signature. The one genuinely open legal question is
how long an entry is kept after the event (risk 14), and that is a number, not a process.

Nothing in this round required a lawyer. It required a delete button.

# Round 46 — the venue, a number, and a backlog that stops asking about insurance

## The venue is real

**GNG FC — Riverside Football Ground, 51 Braunstone Lane East, Braunstone Town, Leicester
LE3 2FD.** In `src/data/events/sikh-fc-27.ts`, so the whole site picked it up at once, and
`detailsConfirmed` flips to `true` — which is what takes down "date and venue are being
finalised" on the event page and above the sign-up form. The event page's *Where* card now
carries the full postal address rather than a postcode, because that card is where somebody
works out how they are getting there.

Day timings are unchanged at 09:30–16:30 and the running order underneath them is still
open. It is no longer holding anything up: the reminder email was blocked on the address,
not on the schedule.

One bug was caught on the way in, one commit before it would have mattered. The guardian
notification and the events list both read `venue.addressLines[0]` to fill in "on Saturday
3 October in ___". That was correct only while the venue was a placeholder holding a single
line, `["Leicester"]`. With a real address in the array, the email to a parent would have
read **"in 51 Braunstone Lane East"**. Both now call `venueLocality()`, which reads the
*last* line, and the helpers have tests. A parent gets a town; only the website gets a
street.

## Twelve months

The last duration in `04_Legal/RETENTION-POLICY.md` that was still in brackets, and the
largest storage-limitation gap in the project (DPIA risk 14). Until today **nothing deleted
a registration**: the medical fields went at 30 days and the check-in token the day after,
but the applicant's name, date of birth, email and mobile — most of them children's — were
held with no end date.

`purgeRegistrations()` deletes the whole row 12 months after the event date, on the nightly
cron, recorded in `retention_runs` (migration 0008). A whole row, not a field purge: the row
*is* the personal data, and the numbers worth keeping for planning the next event are
aggregates, not 64 children's contact details.

The exemption is the one every other rule in the file already applies: **a registration
whose applicant is named on a report, or on a safety support ticket, is kept.** Those
records run six years, and a safeguarding concern about somebody whose details have been
erased cannot be investigated. An ordinary support ticket — "I couldn't sign in" — does not
exempt anything, and there is a test that says so, because treating every ticket as a
safeguarding record would quietly switch the rule off for anyone who ever emailed us.

Two consequences worth writing down rather than discovering:

- **A trophy cabinet must not read from `registrations`.** Results need their own table
  holding the handle and the placing and nothing else, or the cabinet empties itself in
  October 2027. In the backlog.
- **A profile that attended an event still has no end date.** The 24-month dormancy rule
  exempts attendees, because when it was written there was no event-anchored rule to hand
  them to. There is one now, but it deletes the registration and not the profile behind it.
  That is DPIA risk 17, and the fix needs no new figure — stop treating attendance as a
  permanent exemption and let the same 24 months run from the event. Flagged, not built: a
  retention duration is decided before the code that enforces it is written, and that rule
  has not stopped being right just because the change is small.

## The backlog stops asking about insurance

`00_Docs/NEXT-STEPS.md` is now the development backlog and nothing else. Everything that
needs a meeting, a policy, a signature, a purchase or a person on the floor moved to
`00_Docs/MEETING-QUESTIONS.md` — the safeguarding lead and deputy, the DBS list, insurance,
signing the DPIA, the sign-out procedure, and who reads the 64 public names before the day.

This was asked for, and it is right on its own terms. A build backlog with DBS checks in it
reads as though the build is blocked on them, and it is not: everything the code owed for
those decisions is finished. What was one list of twenty things, most of them somebody
else's, is now a short list that can be worked through and a longer one that goes to a
meeting. The one item that genuinely sits on both is `SWC_REGISTRATION_OPEN`, and it is
recorded as a safeguarding decision rather than a technical one — which is why the test key
from round 45 exists at all.

# Round 47 — the format was wrong, and two choices became conditions

Team feedback, relayed 2026-09-01. Four copy corrections and two questions. Two of the
corrections are ordinary; two of them change what a person is agreeing to, and those are
written up here at length because a decision that reduces what a child controls should be
harder to find later than one that does not.

## Straight knockout

The site said "group stage into knockouts, so everyone plays at least three matches". It
is a straight knockout. That sentence was on the homepage, in the event description, in
two rules, on the bracket page and in the terms; it is gone from all of them, `format` is
now `single-elimination`, and the demo bracket renders 64 entrants over six rounds instead
of 32 over five — the layout that will actually be on the projector.

Worth recording rather than quietly fixing: **32 of the 64 now play one match and are
finished**, some of them twelve years old, brought by a parent who took the day off. The
old copy was wrong, but the thing it promised was a good thing. If there is ever a spare
station and a volunteer, a plate competition is the cheapest way to buy that back. Noted
in `MEETING-QUESTIONS.md`, not built.

The self-rating question stays, and its help text changed. It used to promise "so
first-round matches aren't lopsided", which was true of a group draw and is the opposite
of true in a seeded knockout, where the first round is 1 v 64 by design. It now says the
strongest players will not all meet in round one, which is what seeding actually does.

## The divisions paragraph

Removed on request. "Everyone plays in the same bracket. The group stage seeds on how you
rate yourself at sign-up" was two sentences of explanation nobody asked for, and the first
half was already said by the heading above it.

## Photography stopped being a choice

Asked for directly: by registering interest you are agreeing to have pictures and video
taken of you. Both tick boxes are gone — the adult's, and the guardian's on behalf of a
child. `validateRegistration()` now records agreement for every submission, and the form
states it above the submit button instead of asking.

This is the team's call to make and it is made. What is not optional is how it is
described, so:

- **It is no longer consent, and nothing in the paperwork calls it that.** Consent has to
  be freely given, and agreement you cannot decline while still entering is not. The
  lawful basis is legitimate interests with a right to object, and
  `04_Legal/PHOTOGRAPHY-CONSENT.md`, the privacy notice and the DPIA now say exactly that.
- **It is stated three times, not buried once**: on the form, in the applicant's
  confirmation email, and in full in the email the guardian receives before the day —
  which is the one that matters, because the form was filled in by whoever was at the
  keyboard.
- **Objecting is free, reasonless, and changes nothing about a place.** Every statement of
  it names the way out.
- The value is written as `true` rather than dropped, because the day still needs a list
  and an objection needs a row to flip. Recording "agreed" for everyone and nothing at all
  for the objectors would leave no way to tell an objection from an unanswered question.

**The gap, stated plainly: nothing in the app can record an objection.** When photography
was opt-in, the app produced the "do not film" list for free. Now that list is whoever
sent a support message, remembered by a person. That is a small piece of work and it is in
the build backlog as DPIA risk 18. Until it exists, the form's promise that "our
photographers are told" is kept by a human being, not by the system.

## WhatsApp

Also asked for: say that registering means being sent WhatsApp messages about future
events. Said, on the form and in both emails.

Two judgement calls were made rather than asked about, because both are the safe default
and neither is reversible in the wrong direction:

1. **An under-18 is never messaged directly.** The messages go to the parent or guardian's
   number, which is already on the form. Sending event marketing to a twelve-year-old's
   phone is a safeguarding question nobody has asked, and it is also below WhatsApp's own
   minimum age.
2. **The scope is stated narrowly** — our own events, a few times a year, nobody else's
   advertising — because an unbounded promise is the one that gets complained about.

This is a new purpose for a number collected to reach someone on the day, which is the
kind of change that gets flagged rather than done quietly. It is DPIA risk 19. The privacy
notice used to say "we do not advertise to you"; that sentence was no longer true and has
been rewritten rather than left standing.

**Nothing sends WhatsApp messages today.** That is the only reason there is no problem
yet: there is no list, no sender and no opt-out store. The day someone exports a column of
mobile numbers, the opt-out has to exist first. It is in the build backlog.

## "Will the person who registers get an email reply?"

Yes, and they always have — `interestReceived()` goes out at submission with a reference,
saying in capitals that this is not a place yet and that we will email either way after
the draw. An under-18's guardian gets a separate one at the same time. Both now also carry
the photography and WhatsApp statements. The question is answered on the page too: the
register-interest page says, before the form rather than after it, that a confirmation
email arrives on submission and another after the draw.

## "Make it clear they are registering interest"

The strongest version of this was already in place — the success screen refuses to say
"You're in", and the acknowledgement email leads with "THIS IS NOT A PLACE YET". What was
missing was everything before the form. Both homepage buttons said "Enter FC 27", the
homepage promised "two minutes to apply", and the first thing a registrant read about the
draw was the confirmation email. The buttons now say "Register interest", the homepage
says what the draw is, the form page states it in a panel above the first field, and the
success heading reads "Interest registered" rather than "Application received".

# Round 48 — the meeting, and a much smaller form

Twenty-one open questions went to the planning meeting on 2026-09-01 and came back
answered. Most of the answers make the project smaller, which is what was asked for: this
is a first event run by volunteers, and the instruction was to choose the simplest way out
of anything that could be simplified.

## Entries are open

`SWC_REGISTRATION_OPEN` is set. The four things `04_Legal/DPIA.md` said had to exist first
were reported settled: a named safeguarding lead and deputy, a DBS list for the day,
insurance (the venue's), and sign-off on the assessment.

**None of it is written down.** The DPIA has no names, no signature and no date, and the
form is open on the strength of a conversation. That is now the first item in
MEETING-QUESTIONS and the first outstanding item in the DPIA, because it is the one thing
an insurer, a local authority or an upset parent will ask to see, and "it was agreed at a
meeting" is not an answer anybody accepts.

What changes for the work: a bad deploy is no longer a broken preview. It is a form a
parent is filling in.

## Two questions stopped being asked

**PlayStation IDs are not collected at all.** The consoles are ours and every match is
played in the room, so an ID was never needed to run the day — it was on the form because
the form was written before that was obvious. A PSN ID is also a contact route: hold one
for a 12-year-old and you hold a way for a stranger to reach them. Three rounds of this
project were spent making sure an ID never reached a projector; not having one is strictly
better than protecting one. `gamertag` stays as a column, null for everyone, because the
Looking For Game board would need IDs again and that is a decision with consequences
rather than a switch.

**The dietary list is gone.** I argued for keeping it — it is where an allergy gets
declared, and dropping the question does not remove the allergy. The answer was better
than my argument: a 12–15 has a parent in the building all day, an 18+ is an adult, and
langar is served by people who can be asked at the counter. So the question went, and the
one age group it left uncovered got a required tick instead: **a 16 or 17-year-old's
guardian confirms the player will say so on the day.** The first-aider box is still there
and still free text, which is where a serious allergy belonged in the first place.

Both are recorded as reductions in the DPIA. It is the first round in this project's
history where the honest summary is "we hold less about children than we did".

## Photography stayed a condition; WhatsApp did not last a day

Photography was confirmed: everyone agrees by entering, keep it simple. The wording was
already in place from round 47 and it is unchanged.

The WhatsApp messaging added in round 47 came straight back out. The plan is a community
whose joining link is emailed — an invitation somebody accepts, not messages we send
unasked — and it is not settled. So every mention of messaging was removed from the form,
both emails, the privacy notice and the terms, and DPIA risk 19 is withdrawn with its
original assessment kept underneath. **Email is the only channel the site promises.**

The withdrawn assessment is kept deliberately: the risk returns the moment somebody
exports a column of mobile numbers for any purpose at all, and it should be re-read then
rather than re-derived from scratch.

## Profiles are kept forever, and that is the weakest thing here

The open question was how long a profile survives its owner attending an event. The answer
went the other way: keep all of them, delete by hand when needed. So the nightly dormancy
sweep — built in round 44, running for three rounds — is switched off
(`DORMANT_PROFILE_AUTO_PURGE = false`), and no profile now has an end date.

This is theirs to decide and it is decided. What it costs is worth stating plainly, because
it reverses the only automatic protection on that store: under UK GDPR Art. 5(1)(e) the
whole storage-limitation position for profiles is now "somebody will clean up", which holds
exactly as long as somebody does.

What makes it defensible rather than merely convenient:

- A profile is the least sensitive store — first name, chosen handle, email, date of birth,
  region, avatar. No health data, no guardian contact, no mobile, nothing public but the
  handle.
- The registration behind it still goes automatically at twelve months, and that is the row
  holding the full name, the mobile and the guardian's details.
- Erasure on request is a button and is honoured properly. That is now the main protection
  rather than a backstop.
- The clean-up is one click. `/admin` counts what could be cleared and clears it, using the
  same code and the same exemptions the nightly job used — so the manual sweep can never be
  more aggressive than the automatic one was.

The code was switched off behind a constant rather than deleted, and there are now tests
asserting the nightly job leaves profiles alone. A deletion rule that comes back by
accident would look exactly like the feature working.

**It needs a named owner and a date in a diary.** Not a policy — a name.

## Straight knockout, and the thing that makes it bearable

Three prizes: PS5, EA Sports FC 27, a controller. The Golden Boot, Clean Sheet, Fair Play
award and participation medals are gone — every extra award is another thing to buy,
engrave, judge and hand out on a day that already has 64 players in it.

And the answer to the objection I raised last round: **spare consoles are set up for
friendly matches all day.** That is on the event page and in the rules, not buried, because
it is what a parent of a twelve-year-old needs to read before entering them into something
half the field loses in one game.

## One thing I did not do

The rules were edited by hand to say **"ages 12 to 25"**. The division the form enforces,
the site copy, the privacy notice and the DPIA all say 12 to 21, so a 22-year-old would
have been invited by the rules and refused by the form. It is left at 21 and raised as a
question.

If 25 is meant it is one number and a copy sweep. But it also seats unrelated 25-year-olds
at a station with 12-year-olds for a whole day, in a single open bracket, with no parent
present for the older half — which is the divisions question from round 37 with a wider
gap. That is a safeguarding decision, and a decision does not become a copy fix by
arriving inside a string.

## Simplified away

The About page is gone. The support page is one box and called "Contact us".

The support page was asked to go entirely, and it is the one instruction here I did not
carry out. Three promises already made in writing point at it and nowhere else: "tell us
and we will delete everything we hold about you" (Art. 17), the **This was not agreed with
me** button in every guardian email, and "if you would rather not be filmed, tell us". No
email address is published anywhere on the site — that was a deliberate decision in round
40, on the grounds that a form is better than an address for a service used by children.
Remove the form with no address to replace it and a parent has no way to reach anybody.

So it was cut to the bone instead: the eight-question FAQ is gone, the heading is "Contact
us", and what is left is the 999/NSPCC panel and one box. If it should still go, the
replacement is a published email address, and that is a decision to take on purpose rather
than a side effect of tidying up.

## Sponsors

Vismaad Creatives is in — 10% off with code `SWC26`, live on `/sponsors` and on the profile
benefits list, which stops being a promise about the future for the first time.

Enquiries reuse the machinery that already exists: a new "I'd like to sponsor an event"
category on the contact form, landing in `/moderation` with the rest of the queue. No new
table, no new form, no new admin screen — the simplest thing that answers the question.
The six things a business needs to tell us are listed on the page, so a first reply is
useful rather than a round trip.

## Rehearsals in one click

The rehearsal kept being the next thing on the list and never the thing that got done,
because it means typing twenty-odd fields to find out whether an email arrives. There is
now a **Fill with test data** button on the form: one click completes it as a 13-year-old —
the longest path, so it exercises the guardian block and the guardian email — and leaves
both email boxes blank on purpose, because a rehearsal is only worth doing if the mail
lands somewhere a person can read it.

It is gated on holding the test key, never on the form being live. With entries open,
gating it on "can this browser submit" would show a fake-child button to the public.

# Round 49 — the age range, a shorter form, and the screen in the hall

## Twelve to twenty-five

The rules edit from yesterday was meant. The division is now `minAge: 12, maxAge: 25`, and
that line is the one the form enforces — every other mention of the range in the app and
the paperwork now agrees with it.

The consequence is recorded rather than assumed away: a single open bracket 12–25 means the
widest possible draw is a twelve-year-old against a twenty-five-year-old, sitting at the
same station for a match, with no parent of the older player present because there is no
reason for one. The supervision tiers were deliberately NOT stretched to match — they stop
at 18, because that is where childhood stops, and a 25-year-old is simply an adult entrant.

The divisions question has now been declined twice, with the gap wider each time. It is
noted in MEETING-QUESTIONS as the largest open design decision on the event rather than
raised again as a note nobody asked for.

## The player card fieldset is gone

Asked for, and it turns out to be the best safeguarding change of the week by accident.

The fieldset held two things: a free-text box for the name that goes on the projector, and
an avatar picker. Removing it means the handle is now always derived — first name plus last
initial — and the avatar is always the default.

What that removes is the entire category of problem the handle box created. The form could
refuse a surname and (once) a PSN ID; it could never refuse an insult, a phone number or
somebody else's name, which is why a moderator reading 64 rows before the day was a job on
the rota. Derived names cannot contain any of it. The name review is still worth doing, but
for a different and much smaller reason: two players called Tegh Singh now both read
"Tegh S.", and `/admin` → Names on the screen is where that gets fixed.

`checkHandle`'s PSN-ID arm is kept rather than deleted. Nothing passes an ID to it now, but
opening the Looking For Game board would mean collecting them again, and the check should
be waiting when that happens rather than needing to be rediscovered.

## Where the messages are

They were never on `/admin`. Everything sent through the contact form has always gone to
`/moderation` — questions, safety concerns, sponsor enquiries, erasure requests, in one
queue with claim and assignment. Two pages, two jobs: `/admin` runs the competition,
`/moderation` reads what people sent.

The honest read is that this was a discoverability failure rather than a missing feature,
so `/admin` now says where they are, in one line, at the top.

## Why a second event asks for everything again

Because a profile holds almost nothing, on purpose: a first name, an email, a date of
birth, a region, an avatar. Not the full name, not the mobile, and nothing at all about a
guardian — a guardian's details come from the registration record every time, which is
invariant 3 and the entire reason the guardian notification means anything.

So the answer is partly "it should not" and partly "it must". The date of birth is now
prefilled, which was the obviously silly one. The full name and mobile are asked again
because we do not keep them. The guardian block is asked again because carrying it over
would mean trusting a stored copy of a claim about an adult, and the medical answers and
every consent are asked again because they are per-event by design — a consent given for
October is not a consent for next March, and a stale allergy shown as already-answered is
worse than an empty box.

Nobody has a profile yet, so this only bites from event two onward. Worth writing down now
while the reasoning is fresh.

## The big screen

`matches` in D1 (migration 0009), `src/lib/match-store.ts`, built from whoever has places,
scores entered on `/admin`, and `/events/<slug>/tv` on the television.

**Polling, at four seconds on the web page and six on the television.** Websockets on
Workers means Durable Objects, a connection to keep alive and a reconnection path to get
right; the things that actually go wrong in a hall are the wifi dropping for ten seconds
and a laptop lid closing, and polling survives both by doing nothing special.

Four decisions inside it that are load-bearing rather than incidental:

- **No names are stored on a match.** Player ids and scores only; handles are read live
  from `players`. That is what lets a moderator correct a name and have the projector
  follow, and what makes a deletion complete — there is no name in the bracket table to
  come back. `deleteAccount()` nulls the ids and keeps the row, because a quarter-final is
  a record of the competition rather than a record about a person, and deleting it would
  put a hole in the middle of a bracket other people are also in.
- **The version is a hash of what is rendered, not a timestamp.** The first attempt used
  `max(updated_at)` and a test caught two bugs in it: two changes inside the same
  millisecond produced the same version, and — worse — a name correction changed nothing
  the television could notice, because names are not on the match rows. The projector
  would have gone on showing the name that needed correcting.
- **A failed poll keeps the last good bracket on the screen** and says it is reconnecting.
  A hall staring at a spinner is worse than a hall staring at a bracket half a minute old.
- **A corrected score recomputes the whole board** through `advanceWinners`, rather than
  writing the winner forward. A score entered wrongly and fixed two minutes later is the
  thing that will actually happen, and writing forward would leave the loser standing in
  the next round — a failure that does not announce itself until a final between two people
  who lost.

The trophy cabinet is now unblocked and safe: it reads `matches` joined to `players`, both
of which outlive the twelve-month registration purge. Reading `registrations` was the trap
this was in the backlog to avoid.

`node scripts/seed-local-bracket.mjs` puts eight invented players with places in the local
database so the screen can be watched updating. It refuses `--remote`, always passes
`--local` to wrangler, and prefixes every row it writes so `--clear` removes exactly what
it made and nothing else. *(Superseded in round 54 by `scripts/seed-local.mjs`, which
covers the whole flow rather than the bracket alone.)*

---

# Round 50 (2026-09-02) — the sponsor discount is gone, and a licensed range replaces it

## The 10% is dropped

`SWC26` and "10% off with code" are withdrawn. There is no discount code, and the
`/sponsors` page and the profile benefits list no longer offer one.

What replaced it is not nothing, and is a better fit for what a sponsor listing is meant
to give a player: **access to an event-exclusive range that does not exist anywhere else.**
A percentage off a catalogue anyone can already buy is a weaker offer than a shirt that
only exists because this championship does, and it needs no code, no expiry date, and no
one checking whether the code still works — which is the failure mode round 48 was
worried about ("a discount code that does not work is worse for the sponsor than no
mention at all").

## Vismaad Creatives is licensed to make SWC merchandise

Live at **https://www.vismaadcreatives.com/swc/**, in SWC's own palette and type rather
than the shop's, backed by an `swc-fc-27` product collection. `src/data/sponsors.ts`
points at it.

**13% of net receipts on that range comes back to the championship.** Terms are written
out in `todo-swc-licensed-merch.md` in the Vismaad repo — the royalty base is defined
there precisely (line items only, discounts apportioned, shipping and refunds excluded)
because "13% of sales" is the kind of phrase that starts an argument a year later.

**The royalty is the sponsorship.** Vismaad is both our first sponsor and our first
licensee, and both entities belong to the same person. There is no separate sponsorship
fee and the licence is not payment for the `/sponsors` listing. Two labels on one flow of
money is how somebody later concludes two payments were owed, so it is stated once, here.

## Merchandise is not entry, and must never look like it

Entry is free, there is no payment anywhere in registration, and event 1 seats
twelve-year-olds. So:

- **Nothing on the sign-up path links to merchandise.** Not the form, not the
  confirmation email, not the guardian email. The link runs the other way only.
- The merch page states, in its footer, that merchandise is not entry to the event and
  that entry is arranged only here. There is a test in the Vismaad repo asserting that
  sentence stays on the page.
- Vismaad is solely responsible for orders, payment, delivery and returns. We take no
  money, hold no stock, and are not a party to anybody's order.

A paid page a parent could mistake for a paid entry route is the one way this range could
damage the event. That is a safeguarding line, not a commercial one, and it is why the
disclaimer is a test rather than a good intention.

# Round 50 — a mailbox that bounces, a page nobody could find, and a profile worth having

## "Reply to this email" was a lie

The footer of every email said "Questions, or think you got this by mistake? Reply to this
email or visit …". Mail is sent from `no-reply@sikhchampionships.com`, which has no mailbox
behind it — so a parent who replied to a safeguarding notice got a bounce saying our server
was misconfigured. Of all the people to send an unintelligible error to, somebody trying to
say "this wasn't agreed with me" is the worst.

Two halves to the fix, and only one of them is code.

**In the app, now:** every email says, in the footer, that the address does not receive
email and points at the contact form instead. The plain-text version is appended in
`sendEmail` rather than in each template, because a footer that eight templates have to
remember is a footer that goes missing from the one email that needed it. And `sendEmail`
now sends a `Reply-To` when `MAIL_REPLY_TO` is set, because some people will reply to the
address in their mail client regardless of what the footer says. Unset means no header at
all, which is the honest state — better to advertise nothing than a second address that
also bounces.

**In DNS, theirs:** the bounce text itself is written by the receiving mail server, not by
us, so it cannot be authored from here. Making it accurate means making the rejection
accurate, and the cheapest way to do that is to stop rejecting: a forwarding alias at the
registrar so mail to that address lands in a real inbox. Recommended in the reply rather
than done, because it decides whether there is an inbox somebody has to watch.

## Everything for the day, in one row

Messages were being looked for on `/admin` and have always lived on `/moderation`. The
narrow fix is a sentence; the real problem is bigger than one page, because on 3 October
somebody will be hunting for a URL while a hall waits.

So `/admin` now opens with a row of links: messages and reports, the big screen, the public
bracket, the event page. No new functionality — it is the difference between knowing the
app and having to remember it under pressure. The two that open on the television or a
projector open in a new tab, so the admin page they were working in is still there behind.

## A profile worth having

The question was "why does the profile not hold the details, where do they go?" — and the
answer was that they went onto the registration row and the profile held almost nothing: a
first name, an email, a date of birth, a region, an avatar. Entering a second event meant
retyping twenty-odd fields, which is indefensible for a platform whose whole pitch is
"make it once".

The profile now also holds the full name, the mobile, and for an under-18 the guardian's
name, relationship, email and mobile. Written only from a validated registration and never
from an editable page, which is what keeps invariant 3 worth anything — a guardian's
details still originate from a registration record every single time.

**What is still asked every event, and why it is not laziness:**

- **Medical, allergies, accessibility.** Purged 30 days after each event, they genuinely
  change, and a stale allergy displayed as already-answered is worse than an empty box.
- **Every consent.** A consent given for October is not a consent for next March. The
  guardian is emailed again each time, so the claim is re-made rather than inherited.
- **The event's own questions.** That is the point of asking them.

So a returning player confirms a filled-in form, answers the event questions, ticks the
consents, and is done. Not a single checkbox, but close, and the difference is made of
things that should not be inherited.

### The consequence, handled the same day

Those six fields are exactly what `purgeRegistrations()` deletes twelve months after an
event. Profiles are kept indefinitely as of yesterday. Copying purgeable fields onto an
unbounded row would have quietly cancelled the twelve-month rule — the registration would
go and a copy of a child's name, their mobile and their parent's contact details would sit
on a profile with no end date, while the privacy notice went on promising deletion.

`purgeStaleProfileContact()` clears all six once the person has no registration left. It is
keyed on "no registration left" rather than a date of its own, deliberately: it needs no
second number, it can never drift out of step with the twelve-month rule, and it follows it
automatically in the same nightly run. Somebody who enters an event every year keeps their
convenience. Somebody who entered once in 2026 has a first name and a trophy cabinet by
late 2027 and nothing else.

Migration 0011 widens the audit CHECK for the new action, so the clear is recorded like
every other deletion. Six tests, including one that runs the whole nightly job across the
twelve-month boundary and asserts the contact details are there before it and gone after.

**A rule for anything added to `players` from now on**, written into CLAUDE.md: if the
registration purge deletes a field, a copy of it on the profile needs its own rule in that
function. Otherwise the copy outlives the original and the purge is decoration.

## Round 51 — 2026-09-03 — Sixty-four people through one door

**The ask:** sign participants up on arrival with a QR code per selected player, printed
all at once from admin and laid on a table so each person picks up their own, scanned by a
camera page on the site, with a manual fallback if scanning fails.

Built as asked. The interesting part is what was already there and what was not.

### Most of it already existed, and the missing half was the important half

`check_in_token` has been on `registrations` since migration 0005, issued at selection
because a credential that marks somebody present must not exist before there is a place to
attend. There was a `checkIn(token)` in `store.ts` that flipped the status. Nothing called
it. What was missing was not the write — it was everything that makes the write safe to do
at a door.

`checkIn()` returned the registration or `null`, which collapsed five situations into
worked and didn't. A desk needs five sentences, and it needs them in the two seconds
somebody is standing in front of it:

| | what it means at the door |
|---|---|
| `checked-in` | green, send them through |
| `already` | **with the time of the first scan** |
| `not-eligible` | on the list but withdrawn — a real person with a real problem, not a broken scan |
| `wrong-event` | a valid pass for another event, true the moment there is a second one |
| `not-a-pass` | somebody's loyalty card. Nothing is wrong, try again |
| `unknown` | one of ours, not on today's list. Escalate |

The `already` timestamp is the one that earns its migration. A slip scanned twice in a
second is noise and happens constantly. A slip somebody else used half an hour ago is the
only real attack on a paper pass, and it is also how a child ends up unaccounted for while
the register says they are inside. **Without a time on it those two are indistinguishable.**
So migration 0012 adds `checked_in_at` and `checked_in_by` — the second because a register
of children in a building is a safeguarding record, and if it turns out to be wrong the
useful question is who was on the desk. It holds a moderator's player id, not a name.

The old `checkIn()` was deleted rather than left alongside. Two ways to mark a child
present is one too many when one of them records neither the time nor the person.

### The security model, which is the whole design

A printed QR code sits face-up on a table and anyone in the hall can photograph one.
**Possession must therefore never be sufficient to mark somebody present.** Every check-in
goes through `src/app/admin/checkin/actions.ts`, which re-checks the moderator gate: the
authority is the volunteer's session, and the token only says which row to write to.

That is why there is **no public check-in route and no self-service scanner**. The
attractive version — a child scans their own slip on their own phone — is precisely the
version where somebody else can scan it too. It is now invariant 13.

The cost is real and is on the backlog: everyone on the desk needs a moderator account, and
moderator is a database grant with no button. Two or three, granted before the day.

### The QR code: a library, and a test that would actually catch a mistake

A QR encoder is Reed–Solomon error correction, eight mask patterns and a BCH format code —
three places where a bug produces something that looks perfect and does not scan, first
discoverable at a door with a queue behind it. So `qrcode-generator` encodes (no
dependencies, no I/O, runs on Workers) and `jsqr` decodes in the browser.

The SVG is ours: one `<path>` in integer module coordinates, because this is printed and a
fractional coordinate is how a code comes out of a printer grey.

`qr.test.ts` **encodes with ours and decodes with theirs** — 100 random tokens, plus every
base64url character. Two independent implementations agreeing on the bits is a far stronger
statement than any assertion about our own output, and it is the only test that would have
caught an error-correction mistake. A second test parses the rendered `<path>` back into a
grid and compares it to the matrix, because the path is the one step the round-trip does not
cover and a mirrored coordinate would have left everything else passing.

Verified end to end against the workerd preview: all eight QR codes were pulled out of the
HTML the server actually sent and decoded back to their tokens.

### Payload: `SWC1:<token>`

Five characters, and they buy the difference between "that is not one of our passes" and
"that pass is not on today's list". Those need different things done about them and a
volunteer should not have to guess which one they are looking at. Versioned because the day
the payload changes, the old slips are already in a box.

### The manual list is not a fallback

It shares `mark()` with the scanner, so it writes the identical audit row. A slip that will
not scan, a camera that will not start and a player who left their slip at home are three
routine events, not edge cases — and **a fallback that records less than the happy path
becomes the normal route and takes the record with it.**

It is on the same page, always visible, never behind a tab. A page that has to be navigated
while a queue waits is a page that gets abandoned for a paper list.

### What is on a slip, and the privacy call

Public name — first name and last initial — plus the reference. **No surname, no date of
birth, no phone number, no email, nothing medical.** These lie face-up on a table in a
public hall, so a slip may reveal no more than the projector already shows the same room.
`checkInSlips()` is the only code that builds one and a test asserts the surname and the
mobile are absent.

Deliberately not the full name, even though "Amritpal S." is harder to find on a table than
"Amritpal Singh" when two people share a first name — the reference disambiguates, and it
is in the selection email. The slip reads `publicName()` like the bracket and the player
card do; a special case here is how they start disagreeing about what somebody is called.

**No contact details on the desk list either.** A guardian's mobile is exactly what you want
if a child arrives alone and exactly what should not be on a screen facing a queue for forty
minutes next to that child's name. What is there instead is `under18` and one line about
what was agreed on leaving — decision support with no contact route attached. One line to
add if the team wants the number; left out until they say so.

### It carries the exit permission to the door

DPIA risk 2 said the app records who may leave unaccompanied and nothing brings it to the
door. Now every name shows a `U18` badge and one of "Must be collected by an adult",
"Adult staying on site" or "May leave on their own" — and the same line appears on the big
card the instant somebody is scanned in, so it is read at arrival rather than looked up at
half past four. The exit itself still needs a person standing there. The app can tell them;
it cannot stand there.

### Small things that matter more than they look

- **Every action returns the whole roster.** "31 of 64 arrived" is then a fact rather than
  one tab's opinion, which matters the moment two volunteers work two devices.
- **`checkInRoster()` never returns a token.** It feeds a client component and props are
  serialised into a page left open on a desk all day; sixty-four live credentials in that
  HTML would be a self-inflicted wound.
- **The same code is ignored for four seconds.** The decode loop runs ten times a second and
  a slip is held up for two, so without this one arrival fires twenty writes.
- **It beeps.** The volunteer is looking at the person, not the screen.
- **The camera is off until asked.** A page that grabs the camera on load gets its
  permission prompt dismissed by whoever opened it to look at something else, and then the
  camera is blocked for the day.
- **Undo, on the list.** Scanning the wrong slip is a silent mistake: the register says a
  child is inside who is standing in the car park. It does not clear the attended badge —
  that would strip one legitimately earned at an earlier event, which is the worse risk.
- **Slips print for people already checked in**, so a reprint at half ten does not drop
  everybody inside.
- **Anybody with no token is skipped, not printed blank.** A blank slip looks like it should
  work, so somebody holds it to a camera and waits. The desk page says how many and why.

### Two documents that were quietly out of date

- The on-the-day checklist said the public name is "a handle the player chose". The handle
  box was removed on 2 September; nobody types that string any more. Rewritten to what is
  left, which is smaller but not nothing — a child can still type something into the *name*
  field that should not be on a projector or on a card on a table.
- The privacy notice promised "your check-in code" by email and said you choose your bracket
  name. Neither is true. Both fixed, and a row added for the attendance record.

### Also

The selection email now says what happens on arrival: nothing to bring, nothing to print,
your name is on a card on a table by the door, and if you cannot find it just give your
name. One paragraph that removes a conversation from every one of sixty-four arrivals.

The local seed script now issues check-in tokens and a spread of ages and exit permissions,
because eight identical twenty-year-olds would have exercised neither the U18 badge nor the
leaving line — which is how the row that matters most on the day is the one nobody ever saw
rendered.

**DPIA risk 20** is new and is the honest one: sixty-four printed cards with children's
names and live codes on a table in a public hall. The alternatives were judged worse — every
phone or email route degrades into a volunteer typing names, which is slower and puts more on
a screen for longer. The mitigations are in code where they can be (gate, timestamped
re-use, tokens blanked the night after) and in ink where they cannot: keep the pile face-up
on one table with somebody beside it, and bin the leftovers. `RETENTION-POLICY.md` now lists
printed slips as a store with a destruction time, which is the first physical one it has had.

357 tests (was 318).

## Round 52 — 2026-09-03 — Proof of date of birth, and the door it must not close

**The team's decision:** every player must bring identification showing their date of
birth to check in.

I pushed back once before building, on the grounds that most twelve- to fifteen-year-olds
in this country hold no photo ID at all, and it was reaffirmed as a must. So it is built,
and the exclusion risk is written into the DPIA as accepted rather than mitigated away
(risk 21) because that is what it is.

### The "with DOB" part changed what this is

The first framing was ID to collect a badge, which is identity verification — and identity
verification of a thirteen-year-old by a volunteer who has never met them is not
achievable, with or without a document. **Date of birth is a different and much more
defensible aim: it is age.** One open bracket runs 12 to 25, every supervision tier hangs
off the date of birth, and until now that date was whatever was typed into a form by
whoever was at the keyboard. A wrong year is not a clerical error — it puts a
twenty-seven-year-old in a children's bracket, or lets a fifteen-year-old leave alone on a
permission written for a sixteen-year-old. That is worth checking.

### The barrier, and the four things that manage it

What actually shows a date of birth? Not a school card (name and photo, almost never a
DOB). Not a library card, not a bank card. For a twelve-year-old it means a **passport or a
birth certificate** — documents that live in a drawer and that no parent wants a child
carrying across Leicester. Left alone, this excludes exactly the families the event exists
to reach, and the discovery point is a volunteer refusing a child at a door with a parent
standing there.

1. **A photo on a phone counts.** This is the single line that makes the requirement
   survivable — a parent photographs the passport page at home and the document never
   leaves the house. It is stated everywhere the requirement is stated, never separately.
2. **The accepted list is enumerated, not left as "any ID".** `src/data/id-check.ts` is one
   source of truth read by the form, the event page, the confirmation email, the guardian
   email, the selection email and the desk. It is ordered by how likely a twelve-year-old
   is to have one, so it starts with a birth certificate and an NHS card rather than a
   driving licence. "Any ID" said vaguely becomes an argument about a library card with a
   queue behind it; the answer at the door should be reading, not deciding.
3. **`ID_NO_DOCUMENT_RULE`, in code.** Nobody is turned away by a volunteer. Check them in
   as normal, leave the row marked unchecked, and the **safeguarding lead** decides before
   they play — not the person on the door. It matters most for anyone near the 12 or 25 line
   and for a 16–17-year-old due to leave on their own. A requirement with no written answer
   for the exception is a requirement enforced by whoever is most confident at the time.
4. **It is said at registration**, not only in the selection email, so a family knows before
   they invest in applying rather than after they have been drawn.

### It must never gate the door

`checked_in_at` and `dob_verified_at` are separate columns and neither waits for the other.

Who is in the building is a safeguarding fact and has to be right even while the ID
question is unresolved — **a register that refuses to admit somebody standing in the hall
is not a cautious register, it is a wrong one.** So a scan checks them in and the ID prompt
appears *beside* the result as a one-tap step, with "they have not got anything" expanding
to the rule. There is a test asserting a check-in succeeds with nothing verified, and
another asserting the two counts are reported separately. The desk shows "31 of 64 arrived
· 28 dates of birth checked · 3 here without one" and has a filter for that last list,
which is what the lead works through.

It can also be recorded **before** the scan, because a parent usually has the passport out
while the volunteer is still finding the slip and asking them twice is a small rudeness
that adds up sixty-four times.

### What is recorded: a timestamp, a moderator id, and nothing else

No document type, no number, no image, and **not the date read off it**. That last one is
the least obvious and the most important: we already hold the date they registered with, so
a second copy from a different source would only create a discrepancy to adjudicate — and
if the two disagree that is a conversation, not a column.

Migration 0013 says all of this in its header, and `check-in.test.ts` walks
`PRAGMA table_info(registrations)` asserting no column matches `document|id_type|id_number|
passport|id_image`. A structural test rather than a comment, because the failure it guards
is a well-meaning future migration adding `id_type` — at which point "passport" sits
against a child's name as a nationality signal we have no use for, and the promise made in
four places quietly becomes a lie.

### An unrelated improvement that fell out of it

The slips are no longer laid out on a table for people to help themselves. A volunteer
holds them in name order and hands each one over, because the date of birth has to be
looked at anyway and the two are one conversation rather than two.

That is also **strictly better than the ID check at the thing the ID check was originally
asked for.** The handover is a check against our own list; the wrong person cannot pick up
a slip that a volunteer is holding. DPIA risk 20 drops from Low–Medium to Low as a result.

### Also

Moderator granted to `media@shaheedibunga.com` in production for testing. Worth recording
that check-in being behind the moderator gate has a staffing cost: everybody on the desk
needs an account, moderator is a database grant with no button, and it also grants
safeguarding reports and applicants' details. Two or three accounts, decided on purpose,
before the day.

365 tests (was 357).

## Round 53 — 2026-09-03 — A draw people can watch, and two roles instead of one

Three asks: see the interested list and draw it with an outside service; let a moderator
add new people from the app; and — the question that shaped the rest — **is admin the same
as moderator?**

### Yes, and that was the actual problem

One flag, `is_moderator`, gating `/admin`, `/moderation`, the draw, entry deletion, every
applicant's name, date of birth, mobile and guardian contact, and every safeguarding
report. There is no separate admin and never was.

It had no button in the app, deliberately, since round 24. Then check-in shipped and needed
two or three volunteers on a door — and **under one flag, staffing a door meant handing out
the safeguarding queue.** That is a much worse outcome than a grant button, and it is what
made the question urgent rather than convenient.

So the answer was not to make the big grant easier. It was to stop the desk needing it:

| | what it gets |
|---|---|
| `desk` | The arrival desk. Check people in, print slips, record a date of birth was seen. Nothing else — no admin page, no messages, no draw, no deletion. |
| `moderator` | All of that, plus every applicant's contact details, safeguarding reports and messages, the draw, and deletion. |

`is_desk` is never set on a moderator, who already has more — which means every desk gate
has to check both flags, and reading half of it would lock the person running the event out
of their own door. So there is one function, `hasDeskAccess()`, surfaced on the session as
`canWorkDesk`, and gates read that rather than either flag.

Verified against the deployed bundle rather than assumed: signed in as desk staff, `/admin`,
`/admin/people` and `/moderation` all refuse; `/admin/checkin` and the slips both allow.

### Narrowing invariant 6 rather than dropping it

Both roles are now grantable from `/admin/people`. That is a real weakening of a control
that existed for a good reason, so it is written down as one, with what compensates for it:

* **The desk no longer needs the big grant.** This is the actual mitigation. The rest is
  fencing around a button that should now rarely be used.
* Only an existing moderator can grant. Checked in the page, in the action, and again in
  `staff.ts` — the action gate stops a non-moderator reaching the function, the function
  gate stops it ever being called with a non-moderator actor from anywhere else.
* **Two routes to the same lock-out, both closed.** A moderator cannot revoke their own
  moderator role, and the last moderator cannot be revoked at all. Without the second, two
  moderators revoking each other ends with the survivor succeeding into an empty room, and
  the only way back is a database console somebody may not have on the day.
* Revoking clears **both** flags. "Remove their access" must not quietly leave them holding
  some.
* Granting `desk` to somebody who is already a moderator is **refused**, not applied: it
  would be a downgrade dressed as a grant, and whoever clicked it almost certainly meant to
  remove the moderator role instead.
* An account holding either grant **cannot be deleted** until it is revoked, so the audit
  trail can never point at somebody who no longer exists.
* Desk accounts are **exempt from the dormancy sweep**. A volunteer granted access in
  September who never signs in until 3 October looks exactly like a dormant profile to
  every clause in that rule.
* The page flags **"has never signed in"**. The invitation is a magic link to an address a
  moderator typed; a typo produces an account that can never be used, and the morning of the
  event is a bad time to find out.

The audit table found a bug of its own. `ORDER BY at DESC` alone left two same-millisecond
rows in an undefined order — and for this table the two orders mean **opposite things**:
"granted, then revoked" and "revoked, then granted" describe different states of somebody's
access. `rowid DESC` as a tiebreaker is insertion order, which is the truth. Same class of
bug as the bracket version hash in round 49.

### The draw, run somewhere else

The seeded draw is honest — every result recomputes from its stored seed — but "you can
recompute it from a seed" is an argument that convinces a developer and not a hall. Both
are kept, and the DrawPanel now says which is for what, so the new one does not look like a
replacement: seeded for backfilling three drop-outs on a Tuesday, external for the draw
people watch.

**The order is the audit, and the code enforces it.** Lock the numbering → draw elsewhere →
paste the numbers back. A number means something only because the mapping from number to
person was recorded *before* the draw. Numbers resolved against a mapping invented
afterwards are indistinguishable from picking the winners by hand, so `lockBallot()` cannot
be skipped and `draws.ballot_list` ties every result to the exact list it came from.

**The service is given integers.** No names, no ages, no references. That is worth being
explicit about because it answers the obvious objection to using an outside site at all: no
processor to appoint, no transfer to assess, nothing of a child's in somebody else's logs —
and a picker that has never seen a name cannot favour one, which is a fairness property the
internal draw could never quite claim. `draw_ballots` holds registration ids only, the same
rule as `matches`, with a test asserting no name, email, mobile or date of birth is in it.

**There is only ever ONE list to hand over**, which is the insight that made this small.
Referred applicants take priority for every place, so at most one pool is ever *partly*
filled: either they all fit and the general pool is drawn, or they do not and the general
pool is not drawn at all. Never both. `splitPools()` is a pure function tested on that
boundary, and building for two lists would have been building for a case that cannot occur.

The page writes out the instruction — "Ask for 27 numbers between 1 and 145, with no
repeats" — because somebody doing this in front of an audience should be reading a sentence,
not working out which box on random.org is which.

### Two traps closed

**A numbered list.** A service returning "1. 5 / 2. 8 / 3. 12" hands us the list positions
as winners too, and 1, 2 and 3 are perfectly valid entry numbers — there is nothing in the
digits themselves that says which is which. Stripping ordinals by pattern was the obvious
fix and is the wrong one: it means guessing which digits the moderator meant, and guessing
wrong here **gives a place to the wrong child.** Arithmetic catches it instead and cannot be
fooled — k winners in a numbered list always yield 2k numbers, and 2k > k always trips the
count check. My own test found this; what was missing was never safety, it was a useful
sentence, so the over-count error now names this cause.

**A withdrawal between the lock and the paste.** Their number can still come up, at which
point a place goes to somebody who is not coming and a real applicant misses out with
nobody noticing. Skipped, reported by name and status, and the freed places stay open.

`draws.winners` holds the paste **verbatim**, whitespace and commentary included, and `seed`
is the literal string `external`. A tidied copy of the numbers would be our reading of the
evidence rather than the evidence, and there is no seed to store because we did not generate
the randomness.

### Also

DPIA risks 22 (third-party draw — Low, because nothing personal is transferred) and 23
(moderator became grantable — Medium, and the honest residual is *who gets given it*). Both
name what they still need. `staff_grants` is in the retention policy at six years with an
explicit note that no code enforces that yet, rather than a cron nobody asked for.

405 tests (was 365).

---

## Round 54 — 2026-09-04 — Dummy data everywhere, and a hole in a locked list

Three questions, and the third was the real ask: *can we delete test or bogus entries
before drawing; can we start the tournament without 64 players; and can I have dummy data
everywhere so I can test the whole flow with no feature left manually untested.* Plus two
answers owed from round 53: **two to three people hold full moderator**, and the draw
service is **still not chosen**.

### Deleting entries: yes, and asking the question found a bug

`/admin` → Entries → Show all → Delete has been there since round 45, and it works on an
applicant as well as anyone else. Deleting *before* the draw list is locked was already
clean — the row is simply not in the list.

Deleting *after* the lock was quietly broken, and it is the case that will actually happen:
a bogus entry spotted late, or an erasure request that cannot be made to wait for a draw.
Both ballot queries used an inner join, so a deleted row **vanished from the list** and took
the size of the list with it. Three consequences, none of them visible:

* The range handed to the draw service came from `entries.length`, which drops by one per
  deletion. On a list of 40, one deletion makes the instruction *"numbers between 1 and
  39"* — and number 40 belongs to a real applicant who can now never be drawn.
* In the other direction, a service already asked for 1–40 returns 40, and the paste is
  refused as "not a number on the list" about the one number that unarguably was.
* A drawn number whose entry had been deleted fell through `if (!row) continue` and was
  passed over **in silence** — no skip, no warning, a place quietly unfilled and nothing
  anywhere saying why. A withdrawal was reported; a deletion was not.

Fixed by making the list's own size a stored fact rather than a derived one. `Ballot.size`
is the count as locked and is what the range comes from; `removedSinceLock` says how many
rows have lost their person. Both queries are `LEFT JOIN` now, so a deleted row still
arrives and lands in `skipped` with the only thing left to report about it — its number.

**The numbering deliberately does not close up.** Renumbering after a service has been given
a range is how numbers stop meaning what the room was told they mean, so a deletion leaves a
hole, the panel says so in plain words, and it asks for a new list. The numbered mapping is
now rendered over 1..size rather than over the survivors, with *entry deleted* in the gap —
a list that skipped the row would read as though the numbering had closed up.

Five tests, four of which fail on the old join. The one that pins the shape:
`expect(ballot.entries.map(e => e.number)).toEqual([1, 2, 4, 5, 6])`.

### Starting without 64: already true, and now demonstrable

No code needed. `bracketSize()` rounds the field up to the next power of two and
`generateKnockout()` inserts byes, which `advanceWinners()` resolves *before* anything is
stored — so the first round on the screen is already correct for a field that is not a power
of two. `generateBracket()` asks only for two players with places. The seeded 48 gives a
64-slot bracket with 16 byes, which is the answer rendered rather than asserted.

Worth stating because the obvious guess is the other way round: the bracket is built from
everyone with a **place**, not from everyone who has arrived.

### The seed: stages, because a flow is a sequence and not a state

`scripts/seed-local-bracket.mjs` (eight players, the projector alone) is replaced by
`scripts/seed-local.mjs` — 75 invented people and every feature switched on.

The design decision that matters: **handing over the finished tournament would leave every
step that produces it untested.** So each stage puts the database where it would genuinely
be at one moment in the run-up and then stops, and the next thing that happens is the user
doing it in the app:

| Stage | Where it leaves you | What you then do |
|---|---|---|
| `entries` | 75 waiting, nothing decided | delete the bogus rows, lock a list, draw it |
| `places` | a draw has filled 48 of 64 | print slips, run the desk |
| `gameday` | 31 have arrived, 4 with no DOB checked | build the bracket, run the TV |
| `extras` | staff, queue, board, a dormant profile | the rest |

Later stages include the earlier ones, so one command reaches any point. Deliberate
omissions: it does **not** build the bracket (one click, and it is one of the things needing
testing — and a second copy of `generateKnockout()` in SQL would be free to drift from the
one that runs on the day), and it does not run the draw at the `entries` stage.

Things put there on purpose rather than as filler:

* **Ages across the whole 12–25 range**, birthdays all in March so the age on 3 October is
  exactly the age intended. Every supervision rule hangs off an age; 48 identical
  twenty-year-olds would exercise none of them, which is how the row that matters most on
  the day is the one nobody ever saw rendered.
* **Three rows that exist to be deleted** — a rehearsal row, keyboard mash, and the same
  child entered twice from two addresses, which is the one that actually turns up and the
  one that is hard to spot in a list.
* **A referral mix arranged so both branches of the pool split are reachable in a browser.**
  36 of the 75 are referred, so the first draw is 28 places among 39; after `places` there
  are 16 places left and 22 referred applicants, so the *referred* pool becomes the
  contested one and the general pool is not drawn at all. `splitPools()` had unit tests on
  that boundary already, but a branch that cannot be reached through the UI is a branch
  nobody has looked at.
* **Medical notes on six people and nothing on the rest.** A seed with none leaves the first
  aider's page looking finished when it has never had anything in it; a condition against
  every name is nothing like the real distribution.
* **A photography objection as a support message**, because that is the shape it really
  arrives in — DPIA 18's open gap, seen rather than described.
* **Three staff accounts**, one a second moderator, so revocation can be tried without the
  app correctly refusing to remove the last one.

Safety: `--local` is hard-coded into the wrangler call, `--remote` is refused, every row is
prefixed (`local-*` ids, `LOCAL-*` references, `local-*@example.com` addresses) so `--clear`
finds all of it and nothing else, and `example.com` can never receive mail (RFC 2606), so a
stray send cannot reach a person. The SQL goes through a temp file rather than `--command`,
because 150 inserts on a command line is a limit waiting to be hit.

### Email bodies are now readable locally

The one feature that genuinely could not be tested locally. `sendEmail` records a failure
when there is no API key — correctly, and that stays: an email that looks sent and was not
is the bug the whole function is shaped around. But `email_sends` keeps the kind, recipient
and subject and **not the body**, so the wording of an offer or a guardian notice could only
be read in production, which for a safeguarding email to a parent is the wrong place to read
it first. It now prints subject and text to the console when `NODE_ENV !== "production"` —
guarded on that rather than on a flag, because a real child's details are in that text and
the one environment where it must never reach a log is the one that has them. It also means
the magic link is in the dev-server terminal, which is what makes local sign-in possible at
all.

### `00_Docs/TESTING-LOCALLY.md`

The checklist that makes "no feature manually untested" a thing you can check rather than a
hope: every feature, in the order it happens on the day, with the row to try it on and what
to expect — including the four things local testing **cannot** cover (a real email
arriving, the public state of the form, workerd, and load).

410 tests (was 405).

### Addendum, same day — the magic link did not arrive, for two reasons

Reported straight back: sign-in produced nothing in the terminal but
`sendSignInLink({}) in 57ms`. Two independent causes, and a third bug found next to them.

**1. There was no account.** `requestSignInLink()` returns silently when the address is
unknown — deliberately, because telling the caller otherwise turns the form into a way to
find out which children have accounts here. Locally that silence has no upside and a real
cost: it is indistinguishable from a broken mailer, and the answer was simply that
`grant-moderator.mjs` had not been run. It now prints `no account for <address>` and the
command to fix it, off production only — that line names an address somebody typed, and the
one environment where it must never reach a log is the one where the address probably
belongs to a child. `scripts/seed-local.mjs` also checks and says so in a box before
anything else.

**2. The link would have pointed at production anyway.** Three places built the base URL by
hand and two were wrong, in opposite directions:

* `signin/actions.ts` and `signin/[token]/route.ts` fell back to the production domain, so a
  link generated on a laptop pointed at a site where the token does not exist.
* `play/guardian-actions.ts` fell back to `http://localhost:3000` — which means **the
  guardian approval email would have carried a localhost link in production**. Unreachable
  today only because the board is switched off. It would have shipped the day it was
  switched on.

Neither default is right, because the answer is not a constant: it depends on where the
request came from. `src/lib/site-url.ts` derives it, with one rule — **the Host header is
trusted only when it is localhost.** That rule is the security of it: a Host header is
supplied by whoever made the request, so trusting it generally would let somebody send a
header and receive a sign-in link pointing at their own domain, with the token in it. Six
tests, including the near-misses that a sloppier check would let through
(`localhost.evil.example`, `127.0.0.1.evil.example`).

The session cookie's `Secure` flag now comes from the same resolved base rather than being
hard-coded true. A Secure cookie over plain http is refused by some browsers, and the
symptom is signing in successfully and landing back on the sign-in page. It cannot be
weakened in production, because there the base is the constant and always https.

**Measured, not assumed: a Worker cannot read the Host header at all** — it is a forbidden
header name in the fetch spec. Under `cf:preview` the base therefore resolves to the
production constant even for a request to localhost, which is the safe answer and is
correct in production, but makes `cf:preview` the wrong place to test signing in. Written
down in the helper, in CLAUDE.md and in the walkthrough rather than left as a surprise.

Verified end to end rather than by inspection: `GET /signin/<token>` on `next dev` returns
`Location: http://localhost:3000/profile` with no `Secure` on the cookie; the same request
with `Host: evil.example` returns `https://sikhchampionships.com/profile`.

420 tests (was 410).

### Second addendum — the key was there all along, and that was the problem

The account existed and the base URL was right, and it still did not work:

```
[email] sign-in-link -> you@example.com: Resend returned 422:
  "Invalid `to` field. Please use our testing email address instead of domains like
   `example.com`."
```

Both of yesterday's fixes assumed the local case was **no key**. It is not. `.envrc` loads
`RESEND_API_KEY` from the Keychain, so a laptop reaches the live Resend account, and the
print-the-body branch — guarded on the key being absent — never ran. Two ways that is
wrong, and the 422 is the milder one:

* A seeded address is `@example.com`, which Resend rejects outright. So the link was never
  printed *and* never delivered, and the failure read as a bug in this app.
* With a **real** address in the form, a rehearsal on a laptop would have put actual email
  in an actual inbox — a guardian notice about a child who does not exist, sent from our
  verified domain. That is the one worth fixing.

So `next dev` no longer sends. It prints. Held on `NODE_ENV === "development"`
specifically, not `!== "production"`, because vitest runs as `test` and the suite asserts
the real send path against a mocked fetch — a test that stops exercising the code it is
about is worse than no test. `SWC_EMAIL_DEV_SEND=true` sends for real, for anyone who means
it, and there is a test for that arm too.

**Still recorded as a failed send**, deliberately. Only a 200 from Resend records `sent`,
and "we chose not to send it" is not delivered. An email that looks sent and was not is the
bug this module has always been shaped around, and a convenience for developers is not a
reason to put the first crack in it. The local moderation queue therefore shows these as
failed, which is exactly what happened.

Delivery is still tested the way `00_Docs/TESTING-REGISTRATION.md` describes: once, on the
deployed site, with a real address. That is not what a laptop is for.

Verified end to end through the real function, the real database and the real email layer:
an unknown address logs `no account for …` and sends nothing; a known one logs the whole
email with `http://localhost:3000/signin/<token>`, calls Resend zero times, and following
that link redirects to `/profile` with a session that reaches `/admin`.

423 tests (was 420).

---

## Round 55 — 2026-09-04 — Slips that print, names that differ, and a record you can read

Three reports. One was a bug, one was a decision, one was a feature that should have existed
since the form did.

### The slips printed blank

Reported with a screenshot: the preview said "3 pages" and showed nothing. Three pages is
the *right* number for 48 slips at 18 to a sheet, so the layout was correct and the ink was
missing.

Diagnosed by printing the page to a PDF headlessly and looking at it, which produced a
perfect sheet — twice, with and without hydration. So the page is right and the difference
is the viewer. The screenshot shows the sheet rendering **dark**, and it is declared white:
that only happens when something outside the stylesheet is overriding author colours, and
there are three such things on an ordinary laptop — Chrome's auto-dark mode, macOS
"Increase contrast", Windows High Contrast. Under any of them, black ink becomes near-white,
and near-white ink on white paper is a blank sheet.

The fix is to make the sheet immune rather than to guess which one it was:

* `color-scheme: light` — opts the region out of auto-dark inversion.
* `forced-color-adjust: none` on the sheet, the slips and the QR itself — high-contrast
  modes *replace* author colours, and a code repainted in a system palette has no quiet zone.
* `print-color-adjust: exact` — stops the browser "optimising" colour, which is also what
  drops the white ground under a code when Background graphics is off.
* **A stated colour on every text element.** `color` on `.sheet` alone reached the names by
  INHERITANCE, and inheritance loses to any direct rule from anywhere — a global stylesheet,
  an extension, a user stylesheet. This was the actual hole.

Found while looking: the names wrapped **mid-word** — "Amandee p S." on a slip a volunteer
reads off a table. 13pt bold does not fit the 28mm the text column has once the code has
taken its 30mm. Now 11.5pt with `word-break: normal`, so breaks land at the space. Verified
by rasterising the PDF and reading it.

A code that scans on screen and prints blank is discovered at a door with a queue behind
it, so this page is worth being paranoid about.

### Two people called Aman S.

A public name is a first name plus a last initial, and Sikh surnames are overwhelmingly
Singh and Kaur — so the initial does almost no work and common first names collide as a
matter of course, not as an edge case. Untreated, the hall is told "Aman S. to station
three" and two people stand up.

**Decided 2026-09-04 by the team: a number suffix.** "Aman S. (1)" and "Aman S. (2)".

The city was the other candidate and is genuinely more useful to a spectator — it was
rejected because a child's town on a projector and on paper lying on a table is a new
identifying field, bought to solve a display problem. More of the surname was rejected
because it distinguishes nothing in the common case.

Two implementation choices worth recording:

* **Every member of a clash is numbered, including the first.** Leaving one bare would give
  its holder no reason to suspect there is another, and an unnumbered name beside a numbered
  one reads as the real entrant beside an afterthought.
* **The number is keyed on the registration reference, not on position.** Numbering by
  position in a query result changes when somebody withdraws, and then the slip in a child's
  hand stops matching the projector — which is worse than ambiguous, because it is wrong.
  There is a test that withdraws an unrelated person and asserts nobody's number moved.

`uniquePublicNames()` is used by the slips, the desk list and the bracket, so the three
cannot disagree. It distinguishes the SCREEN, not the person: two identically named rows at
the desk still need the reference and the date-of-birth conversation.

### Everything collected and nothing readable

Referring organisation, city, self-rating, favourite team, whether they are bringing a
controller — all of it went into a form, into a column, and nowhere else. The entries list
gave a name, an email and a status, which is enough to delete a row and not enough to
understand a field of seventy-five people. There was no way to answer "is the outreach
working" or "who is travelling furthest".

`/admin/entries` now answers both with counts and no names, and links to a page per person.
The age groups are the ones the day turns on rather than demographic bands: 12–15 means a
parent stays, 16–17 means a leaving permission to check.

**Masked by default, and masked on the server.** Contact routes, the date of birth and
everything medical are hidden until a moderator presses a button. This grants nobody
anything — a moderator could always read all of it — it stops a child's mobile number being
on screen while somebody projects /admin or shares a call. It is only worth something
because the value is genuinely absent: hiding with CSS leaves it in the page source, so
`entryDetail()` never returns an unmasked personal field and `entryContact()` is a separate
gated call. A test asserts none of the real values appears in the serialised page data, and
it was verified against the rendered page as well.

Masks are **fixed-width**, changed mid-round: the first version used one bullet per hidden
character, and "R•••••••• K•••" narrows a Sikh first name to a short list. Two values of
different lengths now mask to the same string.

**The reveal is deliberately not audited.** It needs a table, and a table of "which
moderator read which child's medical notes" needs its own retention rule and its own answer
to a subject access request. Worth building when there is a rota; not for two or three named
people who can already see everything. DPIA risk 24 records that as a decision rather than
an omission.

The seed gained a deliberate name clash, because without one the numbering could not be seen
locally — the only collision in the data was the bogus duplicate row the instructions tell
you to delete.

449 tests (was 423).

---

## Round 56 — 2026-09-04 — A document instead of a page, an age nobody has to work out, and four numbers that add up

Three reports in one round: the slips still would not print, the two date-of-birth buttons
were indistinguishable, and the numbers on `/admin` did not add up. The last one was a real
bug that nobody had noticed in three rounds of looking at that panel.

### The slips: stop defending the page, remove the page

Round 55 hardened the print CSS against Chrome auto-dark mode, forced colours and inherited
text colour. It did not work, and the honest reading of that is that I was guessing.

So this round measured instead. I fetched the **real** page, as a signed-in desk volunteer,
through `next dev`, and printed it headlessly: three sheets, 48 slips, every code present,
correct. Then again with `--force-dark-mode` and Chrome's `WebContentsForceDark` feature
enabled: byte-for-byte identical output. Then a fixture reproducing the app shell — the
`page-grain` fixed pseudo-elements, the flex `body` with `min-height: 100dvh`, the sticky
header: also correct. **The page was never wrong, and I could not reproduce the failure**,
which is the point at which adding a fourth layer of defensive CSS is not engineering.

The dependency is what had to go. `/admin/checkin/slips` is now a **route handler** returning
a complete HTML document built by `src/lib/slips-document.ts` — doctype, one stylesheet, the
slips, nothing else. No root layout, no site header or footer, no Tailwind preflight, no
near-black theme, no `next/font`, no client JavaScript. 126KB where the page was 313KB.

That closes the whole class rather than the instance. It is also *simpler* than what it
replaced: the measurements here are millimetres on A4 and Tailwind's scale is rem against a
screen, so the page could never use the framework it was inheriting and carried its own
plain CSS anyway. And it is the first version of this that can be **tested** — the document
is a string, so there are now 15 assertions about it, most of them about what is *not* in
it: no `page-grain`, no `min-h-dvh`, no `sticky`, no `_next/static`, no `<script`.

Two things learnt that are worth keeping:

- **`color-scheme: light` belongs on `:root`, not on a region.** Chrome's auto-dark-mode
  decides per *document*. Declaring it on the white sheet opted a white box out of nothing.
- **The residual cause is an extension**, and nothing in a stylesheet beats `!important`
  from Dark Reader. So the page says so on itself: *if the preview is blank, print from a
  private window, where extensions are off.* That is the one instruction a volunteer can
  act on at 9am on 3 October, and it is on the sheet rather than in a document.

Verified the way it should have been the first time: rasterised the printed PDF at 300dpi and
**decoded the QR codes back out of it** with the same jsQR the camera uses. Six distinct
codes read off page one, each matching the token of the person whose name is beside it. The
chain from D1 to paper to decoder is now checked end to end, not assumed.

### The desk was making a volunteer do arithmetic

The two buttons read `DOB seen` and `✓ DOB`, which are not an action and a state — they are
two labels for the same idea, one of which happens to be clickable. Now `Confirm date of
birth` (a verb) and `✓ Date of birth confirmed` (a fact), with the same vocabulary on the
counter, the filter tab and the result card.

The deeper problem was underneath it. **The desk exists to compare a document against what
we hold, and it was only being shown half of the comparison** — a badge reading "U18". A
volunteer holding a passport that said "14 March 2009" had to subtract two dates, standing
up, with a queue, to know whether our record was right. A control that requires arithmetic
under time pressure is a control that gets nodded through, which is worse than none because
it looks present.

Every row now reads `Born March 2009 · 17 on the day`.

**The day of the month is deliberately not shown**, and not returned either. Month and year
catch a wrong *year*, which is the entire purpose of the check — a twenty-seven-year-old in a
children's bracket, a fifteen-year-old on a sixteen-year-old's permission to leave alone. The
day would only catch a typo, and it is the part of a date of birth worth having to somebody
impersonating a child. `checkInRoster()` returns `bornLabel` and `ageOnDay`, never `dob`, and
a test asserts the full date appears nowhere in what the roster serialises — the desk is a
client component, so anything returned sits in the page source.

The age is the age **on the day of the event**, not today. Somebody born five days after 3
October reads `17 on the day` and keeps the U18 badge, which is the answer that matters.

And the copy says **read theirs before you read ours**. A volunteer who recites the month
first has asked a leading question and verified nothing.

This is a real expansion of what a volunteer sees, so it is written down: DPIA risk 25, and
the privacy notice corrected — it had said in as many words that the desk sees no date of
birth, and leaving that standing would have been the worst outcome of the three.

### Four numbers that did not add up

Reported as confusion about the seed data; it was a bug. The tile said **Selected** and
counted `status = 'selected'` alone, so everybody who had already checked in silently
dropped out of it — while `placesLeft` immediately below was computed from selected **and**
checked-in, correctly. On a seeded database that produced *17 selected, 64 places, 16 left*.

Nothing was wrong with the draw or the data. The tile was lying, and the honest reading of it
("we have barely filled a quarter of the field") is wrong in the direction that matters.

The tile now counts everyone **with a place** and splits it — `48` over `15 to arrive · 33
arrived`. Each of the four carries a line saying what it counts, because "selected" and "not
selected" are *draw outcomes and not attendance*, and that is not guessable from a two-word
label by somebody opening the page for the first time on the morning of an event. The totals
are stated underneath, so the arithmetic is on the page instead of in somebody's head. "Not
selected" says it stays at zero until the emails are sent, which is why it was zero.

467 tests (was 449).
