# Open questions for the planning meeting

Decisions the build is waiting on, or that were deferred with reasoning worth revisiting.
Ordered by how much they cost to leave unanswered.

**Event: Sikh FC 27 Championship · Leicester · Saturday 3 October 2026 · 64 places · ages 12–21**
Applications close **26 September**. That is the date everything else runs backwards from.

---

## 1. Blocking — the event cannot run without these

- **Venue address.** Only "Leicester" is confirmed. The site says "venue to be confirmed",
  the applications page cannot tell people where to go, and the selection email promises
  the address in a follow-up. Also decides the capacity question below.

- **Capacity for accompanying adults.** Every 12–15 entrant now brings a parent who stays
  all day. If half of 64 players are in that band the venue needs to seat well over a
  hundred, and langar has to stretch. Does the venue take that?

- **Safeguarding lead and deputy.** `04_Legal/SAFEGUARDING-POLICY.md` has a blank table
  where the named people go. The team said names are not needed publicly — that is fine
  for the website, but the policy, the insurer and the local authority will each expect a
  named person. A deputy is not optional: sometimes the concern is about the lead.

- **Insurance.** Public liability for the day. Worth asking the insurer directly what they
  require of you on supervision ratios, DBS and emergency contacts — their answer may bind
  harder than the law's.

## 2. Decides what gets built next

- **Do we open applications now, or wait?** `04_Legal/DPIA.md` says not yet. Most of what
  it was waiting for is now done — data is stored properly, deletion runs on a schedule,
  guardian emails send, volunteers are DBS checked. It is one flag to flip once the meeting
  says so.

- **Langar and dietary needs — keep asking, or drop?**
  *Recommend keeping.* "Dietary needs" is where allergies get declared, and the answer goes
  to whoever runs the kitchen and to the first aider. Dropping the question does not remove
  the allergy; it removes the warning. If the concern is that langar itself is undecided,
  the cleaner fix is to keep the question and change the wording.

- **Keep the sponsors page?** It currently exists with no sponsors on it, which reads as
  either "nobody wanted to" or "unfinished". Three options: take it down until there is
  something to show, turn it into a "sponsor us" pitch with what a sponsor gets, or leave
  it. **Do we have any sponsors, or anyone close?**

- **Divisions: one bracket, or split 12–17 and 18–21?** Kept as one open bracket for now,
  deliberately. The argument for splitting: this seats unrelated adults and 12-year-olds
  together at a station all day with no parent present, and a 12-year-old drawn against a
  21-year-old is a poor game for both. Worth ten minutes.

- **The guardian age boundary.** The brief said "12–16 parents must remain" and "16–18 can
  have permission", which overlap at 16. Built as 12–15 and 16–17. **Should a 16-year-old
  need a parent on site?** One number changes it.

## 3. Brand and identity

- **Which name is canonical?** Three are in use: the logo says *Sikh World Champion**ships***
  (plural), the site says *Sikh World Championship* (singular), and the domain is
  *sikhchampionships.com* (no "World"). Whichever wins, the other two want redirecting or
  correcting. It affects the logo file, the site copy and the social handles.

- **Legal structure.** Still undecided, and it is load-bearing: charitable objects naming
  the Sikh community are what make "referred applicants drawn first" defensible if anyone
  challenges it. Charity, CIC, or unincorporated association?

- **Referral organisations.** Current list is Shaheedi Bunga, Devanhaar, Basics of Sikhi,
  Sikh Helpline, Uni Sikh Society. Who else? Each one added widens the reach of the
  referred pool.

## 4. Smaller, but decide before the day

- **How long is a registration kept after the event?** The policy says `[12]` months and
  the brackets have never come off, so **nothing deletes it**. A registration holds the
  applicant's name, date of birth, email and mobile — most of them children's. Deciding the
  24-month profile rule made this the biggest remaining gap: deleting a dormant *profile*
  removes the account, not the details behind it. Say a number and it gets built; the code
  is an evening's work once the figure is agreed. **My suggestion: 12 months after the
  event, and 6 years for anything attached to a safeguarding concern.**

- **Sponsor offers for profile holders.** A profile is now advertised as carrying sponsor
  discounts — money off merchandise, pre-orders, offers from Sikh businesses. It is shown
  as "coming" and no offer is live. Has any sponsor actually agreed one? Until one has,
  this is a promise with a date attached to it.

- **Photography.** Consent is opt-in and recorded per applicant, but nothing on the day
  tells a photographer who said no. Wristbands are the usual answer. Who briefs them?

- **Sign-out at the end.** The app records whether a 16–17 may leave unaccompanied. Nothing
  enforces it at the door. Who is on that, and with what list?

- **Prizes and trophies.** Engraving takes weeks and the event is close. One champion, or
  also runner-up, semi-finalists and a medal for everyone who plays?

- **What the day actually looks like.** Start and finish times are set at 09:30–16:30.
  Group stage timings, number of stations, and who referees.

## 5. For the record — already decided, no action needed

- No under-12s. 12–15 accompanied all day. 16–17 with permission. 18+ independent.
- Places by draw: referred first, then everyone else, both random within themselves.
- No messaging between players, at any age.
- Registration is for the platform: a profile is created when someone registers interest,
  not only if they are drawn. Stated rather than opted into. (Changed round 42 — the
  consequence is that we hold an account for every child who ever registered interest,
  which is why the retention policy matters more than it did.)
- The applicant is emailed an acknowledgement, and an under-18's guardian is emailed
  separately saying what was agreed on their behalf and how to stop it.
- No email address published anywhere; everything goes through the support form.
- The safeguarding lead and deputy are the charity's, named in the charity's own policy —
  not duplicated into this project's paperwork or the site.
- **The bracket shows a tournament handle the player chose at registration**, defaulting to
  first name plus last initial. Not the real name, and expressly **not the PSN ID** — a PSN
  ID is a contact route, so projecting one would undo the platform's strongest protection.
  Signed off and built in round 44. The form refuses a handle that is the entrant's own PSN
  ID or contains their surname; everything a machine cannot judge is caught by a moderator
  reading the 64 names on `/admin` before the day. **That read-through is a job somebody has
  to actually do.**
- **A profile that never attended an event is deleted after 24 months of no activity.**
  Signed off and built in round 44, running nightly, with the numbers in a quiet corner of
  `/admin` so a job that stops running is noticed. Moderators, anyone who attended and
  anyone named on a report or a support ticket are exempt.
