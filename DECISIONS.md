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
