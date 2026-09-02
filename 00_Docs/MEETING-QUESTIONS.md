# Open questions — after the 2026-09-01 meeting

**Everything that is not code lives here.** `00_Docs/NEXT-STEPS.md` is the development
backlog and holds none of it.

The 21 questions in the previous version were answered at the planning meeting on
**1 September 2026**. What follows is the short list of what is genuinely still open, then
the record of what was decided. Nothing here blocks the build.

**Event: Sikh FC 27 Championship · Leicester · Saturday 3 October 2026 · 64 places · ages 12–25**
Applications close **26 September**. Entries are **open to the public** as of 1 September.

---

## Still open

1. **Write the safeguarding decision into `04_Legal/DPIA.md`.** The lead and deputy are
   named, the DBS list is confirmed, insurance is covered by the venue and the assessment
   is signed off — and none of that is written in the file. Entries were opened on the
   strength of it. **A safeguarding decision that exists only as a memory of a meeting is
   the first thing an insurer, an inspector or an upset parent will ask to see.**

2. **Who owns the profile clean-up, and when do they do it?** Profiles are now kept
   indefinitely and cleared by hand — one button on `/admin`, with a count of what is due.
   That is a fine position as long as somebody actually presses it. It needs a name and a
   date in a diary, not a policy.

3. **Who does each job on the day?** The list is at the top of `/admin` so it is read on
   the morning rather than found in a document: the door at the end for under-16s, the
   photographers' briefing, reading the 64 public names, getting the medical notes to the
   first aider, deleting test entries. Each needs a name against it.

4. **The WhatsApp community — is it happening?** The plan is a community whose joining link
   goes out by email. Until it is decided, nothing on the site says anything about
   messaging, and it should stay that way: **email is the only channel we promise.**

5. **Sponsors: who else do we ask?** Vismaad Creatives is in and live on the site. The
   pitch and the six questions a business needs to answer are on `/sponsors`; enquiries
   arrive in `/moderation` under "I'd like to sponsor an event".

6. **The day's running order.** Timings were discussed and 09:30–16:30 is on the site. When
   the round-by-round order is fixed it goes on the reminder email and the day sheet, not
   on the website.

---

## Decided at the meeting — for the record

**The event**

- **Straight knockout**, not groups. 64 players, six rounds, win and you go through.
- **Spare consoles for friendly matches all day**, so losing in round one does not mean
  going home. This is on the event page and in the rules, deliberately: it is the answer
  to the one real objection to a straight knockout.
- **Three prizes**: PlayStation 5 for the champion, EA Sports FC 27 for the runner-up, a
  PS5 controller for third. The Golden Boot, Clean Sheet, Fair Play and participation
  medals are gone.
- **Ages 12 to 25**, extended 2026-09-02 from 12–21. One open bracket, not split by age —
  so the widest possible draw is a 12-year-old against a 25-year-old. The supervision
  tiers do not stretch with it: 12–15 accompanied, 16–17 with permission, 18+ independent,
  because that is where childhood stops. **The divisions question is now the largest open
  design decision on the event and it has been declined twice** — worth ten minutes at the
  next meeting rather than a third round of the same note.
- **12–15 accompanied all day. 16 and 17 may attend alone with their guardian's
  permission. 18+ independent.**
- **Venue: GNG FC — Riverside Football Ground**, 51 Braunstone Lane East, Braunstone Town,
  Leicester LE3 2FD. Ample space for accompanying adults, and langar will stretch.
- **Insurance** is covered by the venue.

**Entries**

- **Open to the public**, from 1 September. `SWC_REGISTRATION_OPEN` is set.
- Places by draw: referred applicants first, then everyone else, random within each group.
- **Registering interest is not a place**, said before the form, in the confirmation email
  and on the success screen.
- **Everyone who registers gets an email immediately**, and an under-18's guardian gets a
  separate one saying what was agreed on their behalf.

**What we stopped asking for**

- **PlayStation IDs.** Not collected at all any more. The consoles are ours and the
  matches are played in the room, so it was never needed — and an ID is a way of
  contacting a child off-platform. This is the single biggest reduction in what the project
  holds about children.
- **Dietary needs.** No list is kept. A 12–15's parent is at the venue all day; an 18+ is
  an adult; a **16 or 17-year-old's guardian ticks that the player will say so on the
  day**. Anything a first aider needs still goes in the medical box.

**Data and paperwork**

- **Photography is a condition of entering, not a choice.** Stated on the form, in the
  confirmation email, and in full in the guardian's email. Objecting is free, reasonless,
  and changes nothing about a place. It is not called "consent" anywhere, because it is
  not one — DPIA risk 18.
- **No WhatsApp messaging is promised anywhere.** Withdrawn a day after it was added.
- **Profiles are kept until deleted by hand.** The nightly sweep is off. DPIA risk 17, and
  item 3 above is what makes it defensible.
- **A registration is deleted 12 months after the event**, automatically. Anyone named on
  a report or a safety ticket is exempt — those run six years.
- **Erasure on request** is a button on `/admin`, and every deletion is recorded.
- The safeguarding lead and deputy are the charity's, named in the charity's own policy.

**Brand and structure**

- **Canonical name: Sikh World Championships** — plural, everywhere the name is written
  out. The domain keeps the short form on purpose, so the URL stays small.
- **Legal structure: a charity.**
- **Referral organisations**: Shaheedi Bunga, Devanhaar, Basics of Sikhi, Sikh Helpline,
  Uni Sikh Society. Choosing "Uni Sikh Society" now asks **which university**, and
  "Another organisation" asks **which one** — otherwise the outreach that worked is
  invisible.
- **First sponsor: Vismaad Creatives** — day-exclusive SWC merch at
  vismaadcreatives.com/swc, live on `/sponsors` and on the profile benefits list.

**Built on 2026-09-02**

- **The big screen.** `/events/sikh-fc-27/tv` — open it on the laptop plugged into the
  television, full screen, and leave it. No navigation, no footer, nothing clickable. It
  asks the server for the bracket every six seconds; the public bracket page does the same
  every four, so somebody at home sees a result seconds after the room does.
- **Score entry on `/admin`.** Matches that can be played are at the top with the boxes
  open; everything else is folded away. A score typed wrong is fixed by typing the right
  one — the rounds after it recompute, rather than leaving the loser standing.
- **Polling, not websockets**, deliberately: it survives the venue wifi dropping and
  recovers by doing nothing.

**Simplified away**

- **The About page** is gone, and its link with it. A first event does not need a mission
  statement it has to keep true.
- **"Your player card" is gone from the sign-up form** (2026-09-02) — the handle box and
  the avatar picker both. The name on the bracket is now first name plus last initial,
  derived, and the avatar is the default. This removes an entire class of problem: nobody
  types the string that goes on a projector, so an insult or somebody else's name cannot
  arrive that way. The cost is that two players called Tegh Singh both read "Tegh S." —
  a moderator fixes that on `/admin` → Names on the screen, which is the same list that
  was already going to be read before the day.
- **The support page is cut back to one box** and renamed "Contact us". It was asked to go
  entirely; what stopped that is that it is the only route for an erasure request, for the
  "this was not agreed with me" button in every guardian email, and for a photography
  objection — and no email address is published anywhere. **If it should still go, the
  replacement is a published address**, which is a decision to take on purpose.
- **Instagram** is in the footer: instagram.com/sikhworldchampionships.
