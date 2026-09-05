# Data Protection Impact Assessment — DRAFT

> **STATUS: DRAFT FOR REVIEW.** A DPIA is **mandatory** here, not optional: we process
> children's personal data, including health data, at scale for a public event. The ICO
> expects this completed *before* processing starts — i.e. before the first real
> registration, not after.
>
> This draft does the part a developer can do honestly: describe what the system actually
> does, and name the risks truthfully including the ones that reflect badly on us. The
> scoring and sign-off need `[NAME]`.

## 1. Who is doing this and when

- Controller: Sikh World Championship
- Assessment owner: `[NAME]`
- Date started: `[DATE]` · Date of sign-off: `[DATE]`
- Consulted: `[safeguarding lead]`, `[venue]`, `[insurer]`, `[a parent or two — the ICO
  encourages consulting the people affected, and it will improve the answers]`

## 2. What we are doing

Running an in-person esports competition (Sikh FC 27 Championship, 64 players, ages 12–25,
Leicester, Saturday 3 October 2026) with an accompanying website that handles platform
registration, expressions of interest in each event, a random draw for places, check-in and
a live bracket. An online "Looking For Game" board for finding practice partners is built
but switched off and is not in scope for this assessment.

**Data subjects:** children aged 12–17, adults 18–25, parents and guardians,
volunteers.

**Volume:** 64 players for event 1, of whom a substantial share will be children, plus
their guardians. Larger for later events.

**Processing:** collection at registration, storage, a random draw for places, display of a
limited public subset (a self-chosen tournament handle, avatar, region, age band), email notification to the
applicant and to an under-18's guardian, moderation of reports, and deletion per
`RETENTION-POLICY.md`.

**A profile is created for everyone who registers interest** — not only for those drawn.
Changed deliberately in round 42 because registration is for the platform rather than for a
single event, and a profile carries benefits (a saved identity so the next event is one
step, a trophy cabinet, sponsor offers) that a person who was not drawn is still entitled
to. The consequence for this assessment is that we hold an account for children who never
attended an event, which makes `RETENTION-POLICY.md` load-bearing rather than
precautionary. The duration was decided in round 44 — **24 months of no activity** — and is
enforced in code. See risks 13, 14 and 17.

**Special category data:** health — medical conditions, allergies and accessibility needs.
(The dietary question was dropped on 2026-09-01; the column is still purged on any older
row.)

**The live bracket** (added 2026-09-02) is a new store and deliberately a thin one: match
shape, player ids and scores. **No names are stored in it** — the handles shown on the
television are read from `players` at render time, which is what lets a moderator correct a
name and what makes a deletion complete. `deleteAccount()` nulls the ids and keeps the row,
because a quarter-final result is a record of the competition rather than a record about a
person. The endpoint the television polls is public and returns exactly what the public
bracket page already shows.

## 3. Why we need to do it

To run the competition at all: to check eligibility, seed a fair bracket, keep children
safe on the day, feed people without poisoning anyone, and give a first aider the
information they need before an incident rather than during one.

## 4. Necessity and proportionality

**What we deliberately do NOT collect,** having considered it: home address, postcode,
school, year group, gender, ethnicity, photographs of the player as a profile default
(avatars are the default), or an exact age shown publicly.

**And what we stopped collecting** on 2026-09-01, having decided it was never needed: the
PlayStation ID (the consoles are ours and the matches are played in the room — and an ID is
a contact route for a child) and the dietary list (a parent is present for every under-16;
anything a first aider needs is in the medical field). On 2026-09-02 the chosen-handle box
and the avatar picker went too: the public name is now derived from the first name plus an
initial, so a twelve-year-old no longer types the string that goes on a projector.

**Data minimisation decisions already taken and recorded in DECISIONS.md:**

- Player photo is optional; the default is an illustrated avatar (round 5, decision 18)
- Region, never a postcode
- Age band shown publicly, never date of birth
- Guardian presence tiered by age rather than blanket, so we do not demand a parent's
  whole Saturday where the risk does not justify it (round 24)
- Emergency contact not duplicated for under-18s — the guardian record serves it (round 25)
- **No messaging at all** (round 25), which removes an entire category of processing: there are
  no private messages between users, so there is nothing to filter, retain, or breach
- **The public bracket shows a handle, not the real name** (round 44). Since 2026-09-02 it
  is not typed by anybody: the handle is derived as a first name plus a last initial, which
  removes the whole category of risk that the free-text box created — an insult, a phone
  number or somebody else's name reaching a projector. A moderator can still correct one
  on `/admin`, and should, because two players called Tegh Singh now both read "Tegh S."
  No PlayStation ID is collected at all any more, so there is nothing to leak: an ID is a
  *contact route*, and search one and you can send a friend request to a twelve-year-old

**Lawful bases:** contract for the registration itself; explicit consent for health data;
legitimate interests for safeguarding measures; legal obligation where safeguarding law
applies. See `PRIVACY-NOTICE.md`.

## 5. Risks

Scored **likelihood × severity**, each low / medium / high. Filled in honestly — several
of these describe the system as it stands today, not as we would like it to be.

| # | Risk | Likelihood | Severity | Mitigation | Residual |
|---|---|---|---|---|---|
| 1 | **Adult contacts a child through the platform** | Low | High | No messaging at all. Age bands strictly separated, enforced in the data layer and re-checked when a request is created. PlayStation IDs released only on mutual agreement. Guardian consent required before an under-16 uses the board; both guardians notified on every exchange. | Low |
| 2 | **Child is taken from the venue by the wrong adult** | Low | High | Tiered supervision recorded at registration and enforced in `guardian-rules.ts`: no under-12s at all, 12–15 need a guardian at the venue for the whole event, 16–17 only where the guardian has recorded permission. **Improved 2026-09-03**: the arrival desk (`/admin/checkin`) now carries the permission to the door instead of leaving it in a spreadsheet. Every name on the list shows a `U18` badge and one line — "Must be collected by an adult", "Adult staying on site", "May leave on their own" — and the same line appears on the big card the moment somebody is scanned in, so the person on the desk reads it at arrival rather than looking it up at half past four. It is also now recorded **who arrived and when** (`checked_in_at`, `checked_in_by`), so "were they ever here?" has an answer. `[STILL NEEDS: the exit itself. Somebody has to be on that door at the end reading the same list, and no code can make them — it is item 2 on the on-the-day checklist. The app can now tell them; it cannot stand there.]` | `[Medium — the information is at the door, the door still needs a person]` |
| 3 | **Medical information not available when a child collapses** | Medium | High | Collected in advance as a structured tick-list plus detail, so a first aider can scan it. `[NEEDS: a printed or offline copy at the first aid point — the venue may have no signal]` | `[Medium]` |
| 4 | **Children's data breached from the store** | Low | High | **Mitigated (round 30).** Data is in Cloudflare D1 — a managed database, encrypted at rest, reachable only through the Worker's binding and never over the public internet. No credentials in the repository. Access is via a project-scoped API token, not an account-wide one. | Low |
| 5 | **Safeguarding disclosure exposed to the public** | Low | High | Was **realised** in development: the moderation queue was readable without authentication because the session stub granted moderator to everyone. Fixed in round 24 (deny by default, never prerendered) and closed in round 35 when real passwordless authentication shipped with D1-backed sessions. Moderator is a database grant with no button in the app. Verified live: `/admin` and `/moderation` both refuse. | Low |
| 6 | **Guardian consent is not genuine** — child enters their own address as the guardian's | Medium | Medium | Guardian email is taken from the registration record, never a child-filled field. Guardian confirms by email link. **Honestly stated: a determined child could still put their own address in at registration.** True of any email-based consent system. Mitigated in depth by the guardian being physically present or contactable on the day. | Medium — accepted, documented |
| 7 | **Safeguarding report goes unread** | Medium | High | Named moderators, 24h public commitment, queue with claim/assignment and an overdue alert, urgent categories jump the queue, rate limiting so the queue cannot be flooded. **`[NEEDS: the rota actually staffed — the tooling exists and the people do not. The named lead and deputy are those in the parent charity's safeguarding policy; confirm they accept covering SWC events and the platform.]`** | `[High until confirmed]` |
| 8 | **Data kept indefinitely** | Low | Medium | **Mitigated (round 33).** `purgeMedical()` deletes the health fields while keeping the registration, which is only possible because they are separate columns rather than part of a JSON blob. A separate cron Worker (`swc-retention`, 03:15 daily) runs it and records each run in `retention_runs`. Durations are in `RETENTION-POLICY.md`. **The job has now been run against the production database and recorded its run** (round 44, 2026-08-31, `(platform)` / `purge-dormant-profiles`, 0 rows — correctly, the only account is a moderator). `[NEEDS: the medical purge specifically has still never fired, because `sikh-fc-27` has no confirmed date and the job refuses to measure from a guess. It will fire 30 days after the event; check it did.]` | Low |
| 9 | **Guardian notification promised but not sent** | Low | High | **Mitigated (rounds 33 and 42).** Email sends through Resend and every attempt is recorded in `email_sends` with its outcome; failures surface at the top of `/moderation` rather than failing silently. An under-18 registering now triggers an email to their guardian at submission stating what was agreed on their behalf, with a "this was not agreed with me" route out. Message bodies are never stored. `[NEEDS: the DMARC record — without it a guardian notice is far more likely to be filed as spam, and an email in a junk folder is worse than one never promised.]` | Low once DMARC is set |
| 10 | Photographs of children used without consent | Medium | Medium | **Superseded by #18 in round 47.** Photography was opt-in and guardian-given for under-18s; it is now a stated condition of registering, so this risk is no longer about a consent that might be ignored but about a consent that is no longer asked for. Read #18 instead. | See #18 |
| 11 | Volunteer with no DBS check has unsupervised access to children | Low | High | Volunteers are DBS-checked and the records are held by the parent charity. `[NEEDS: confirm the checked list covers everyone who will be on the floor on 3 October 2026, including anyone added late.]` | `[Low once the list is confirmed]` |
| 12 | A child sees something distressing in a report they filed | Low | Medium | Reports are visible only to moderators, never to the reported person; block is deliberately silent to avoid retaliation. | Low |
| 13 | **An account is held for a child who never attended an event** | High | Medium | **MITIGATION WITHDRAWN 2026-09-01 — see #17.** The 24-month automatic deletion below was built and ran nightly for three rounds; the team then decided profiles are kept and cleaned up by hand, and the sweep was switched off. Everything about the profile's *contents* below is still true, and the manual sweep uses exactly this rule and these exemptions. What is no longer true is that anything happens on its own. Original assessment (round 44): Introduced deliberately in round 42 (see section 2). A profile holds first name, public handle, email, age band, date of birth, region and avatar — no health data, which lives on the registration and is purged separately. **Retention duration now decided: deleted after 24 months of no activity**, enforced by `purgeDormantProfiles()` on the nightly cron and surfaced on `/admin` so a job that stops running is visible rather than silent. Moderators, anyone who attended, and anyone named on a report or a support ticket are exempt. **Honestly stated: deleting the profile does NOT delete the registration behind it**, which holds the applicant's name, date of birth and email. See risk 14. | Low |
| 14 | **A registration is kept indefinitely** | High | Medium | **Mitigated (round 46).** The duration was the blocker, not the code: `RETENTION-POLICY.md` said 12 months and the brackets never came off, so nothing deleted a registration and the name, date of birth, email and mobile of every applicant — most of them children — were held with no end date. **Confirmed at 12 months from the event date on 2026-08-31** and enforced by `purgeRegistrations()` on the nightly cron: a whole-row delete, recorded in `retention_runs`, scoped to one event at a time and anchored to the event date rather than to "now". Registrations whose applicant is named on a report or a safety support ticket are kept — six years, the same exemption every other rule here applies. | Low |
| 15 | **The registration form is opened to the public in order to test it** | High | Medium | **Mitigated (round 45).** Testing anything after the submit button — the database write, the guardian email, the magic link, the draw, the check-in token — used to require `SWC_REGISTRATION_OPEN=true` on the live site, which would let a real parent enter a real child during a rehearsal. A per-browser test key (`SWC_TEST_KEY`, `/testing?key=…`, 8-hour cookie holding the key itself, constant-time comparison, 24 characters minimum, 404 for a wrong or unset key) now opens the real form for one browser while the public form stays closed. The page says **Testing mode — this saves a real record** in place of the preview banner. Test entries are real rows and must be deleted the same day; `/admin` → Entries does that. | Low |
| 16 | **An erasure request cannot be honoured without hand-written SQL** | Medium | Medium | **Mitigated (round 45).** UK GDPR Art. 17 applies whether or not the code exists. `/admin` → Entries deletes a profile, its entry and everything keyed to either, through the same cascade the retention job uses (`deleteAccount()`); it is shut by default and requires the reference to be typed. It refuses, with a reason, for a moderator or anyone named on a report or support ticket — a legitimate Art. 17(3) refusal, since a safeguarding record about a deleted person cannot be acted on. Every deletion is recorded in `retention_runs` with who did it and why. | Low |
| 17 | **A profile is kept with no end date — now every profile, not only an attendee's** | High | Low–Medium | **DECIDED AND ACCEPTED 2026-09-01, and it went the other way.** The question was how long to keep a profile after somebody attends. The answer was to keep *all* profiles indefinitely and clean up by hand, so the nightly dormancy sweep from risk 13 is switched off (`DORMANT_PROFILE_AUTO_PURGE = false`) and there is now no automatic expiry on any profile. **This is the weakest storage-limitation position in the project and it should be reviewed at a fixed interval rather than when somebody remembers.** What limits it: a profile is the least sensitive store — first name, chosen handle, email, date of birth, region, avatar; no health data, no guardian contact, no mobile, and nothing public but the handle. The registration behind it still goes automatically at twelve months, which is what deletes the name, mobile and guardian details. Erasure on request is a button, and the same 24-month figure now drives a "these could be cleared" count and a one-click sweep on `/admin`, so cleaning up is a minute's work rather than a project. `[NEEDS: a named owner and a review date — "we will clean up when we need to" is only true while somebody actually does.]` | `[Medium — accepted, contingent on the manual sweep actually being run]`
| ~~17a~~ | *(superseded)* The original wording of #17 — how long a profile survives its owner attending an event — is answered by the row above: indefinitely, by decision. The 24-month dormancy rule (risk 13) exempts anyone who attended, because when it was written there was no event-anchored rule to hand them over to. Risk 14 created one, but it deletes the *registration*, not the profile — so twelve months after the event the platform still holds that person's first name, chosen handle, email, date of birth, region and avatar, indefinitely. It is the least sensitive of the stores (no health data, no guardian contact, no mobile) and it is now the only unbounded one. `[NEEDS: a duration. The cheapest answer uses no new figure — stop treating attendance as a permanent exemption and let the same 24 months of inactivity run from the event.]` | `[Medium until the duration is set]` |
| 18 | **Photography is now a condition of entry rather than a consent** | High | Medium | **Accepted by the team (round 47), not mitigated by code.** The photo tick box was removed from the sign-up form on the team's instruction; registering now means agreeing that photos and video of the entrant may be used to promote future events, and `validateRegistration()` records agreement for every submission. **This is a real reduction in a child's control over their own image and it must not be described as consent** — agreement that cannot be declined while still entering is not freely given, so the lawful basis is legitimate interests with an Art. 21 right to object. What keeps it defensible: the statement is on the form, in the applicant's confirmation email, and repeated in full in the email the guardian receives before the day; objecting is free, reasonless, and has no effect on a place. **An objection is now recorded and produces a list (round 57, 2026-09-05).** It used to arrive as a support message and the do-not-film list for 3 October was a person's memory — five separate promises (the form, both emails, the reminder, the privacy notice) resting on somebody remembering an inbox. A moderator now records it against the entry from `/admin/entries` → a person → Photography; `photo_objected_at` and `photo_objected_by` hold that it was recorded, when, and by whom, and `/admin` shows a **Do not photograph** list of names under the event for the person briefing the photographers. Deliberately no column for the *reason* or the *scope*: a free-text note about a child, written by a volunteer, read by whoever is holding a camera, with no retention rule of its own — and a scope a photographer has to interpret at twenty metres is not a control. Anything narrower than "do not photograph this person" stays in the support ticket it arrived in, where a moderator answers it in words. It does not touch `photo_consent`, which records what the person was told when they entered. **What is still not code:** somebody has to read the list out, and no photographer is stopped by a database. `[NEEDS: the wristband-and-briefing process in PHOTOGRAPHY-CONSENT.md.]` | `[Low–Medium — the objection is recorded; the briefing is still a person]` |
| 19 | ~~Registering signs you up to WhatsApp messages about future events~~ | — | — | **WITHDRAWN 2026-09-01, one day after it was raised. The team's plan changed to a WhatsApp community whose joining link is emailed — an invitation somebody accepts, not messages we send unasked — and it is not settled, so every mention of messaging came back off the form, both emails, the privacy notice and the terms. Email is the only channel. The original assessment is kept below because the risk returns the moment a column of mobile numbers is exported for any purpose, and it should be re-read then rather than re-derived.** Original: accepted by the team (round 47), partially mitigated. A new purpose for a number collected to reach someone on the day: direct marketing of future events. Bundled into registration, so — like #18 — it is not consent; it runs on legitimate interests with a right to object, and PECR's soft opt-in is a thin argument for a free event with no prior purchase. Three things reduce it. **Under-18s are never messaged directly** — the messages go to the parent or guardian's number, which also avoids sending WhatsApp traffic to a 12-year-old who is below WhatsApp's own minimum age. The scope is narrow and stated: our own events, a few times a year, nobody else's advertising. And every statement of it names the way out (reply STOP, or the support form). `[NEEDS: an opt-out that is recorded somewhere before the first message is sent — today there is no WhatsApp sending at all, so the promise is currently kept by there being nothing to unsubscribe from. That stops being true the day someone exports a list of numbers.]` | `[Medium until the opt-out is recorded]` |
| 20 | **Sixty-four printed slips carrying children's names and live check-in codes are handled at a desk in a public hall** | High | Low | **Introduced deliberately 2026-09-03, with the alternatives judged worse.** The arrival desk needs to move 64 people, most of them children, through one door in about forty minutes. Paper works for a twelve-year-old with no phone, no signal and no email access; every phone-based or email-based alternative degrades into a volunteer typing names, which is slower and puts *more* on a screen for longer. What limits it: a slip carries only the **public name (first name and last initial) and the reference** — no surname, no date of birth, no phone number, no email, nothing medical, which is exactly what the projector already shows to the same room, and `checkInSlips()` is the only code that builds one with a test asserting the surname and the mobile are absent. The QR code **is** a live credential, so: possession is not authority — check-in runs only through the moderator-gated actions in `src/app/admin/checkin/actions.ts`, there is no public endpoint and no self-service scanner; a second use reports the **time of the first** rather than succeeding again, which is what makes a reused slip visible instead of silent; and `clearCheckInTokens()` blanks every token the night after the event, so a slip kept as a souvenir is inert within a day. **Reduced 2026-09-03**: the slips are no longer laid out for people to help themselves. A volunteer holds them in name order and hands each one over, which came in with the date-of-birth check (risk 21) because the two are one conversation — and which closes the wrong-person case against *our own list* rather than against a document. What cannot be enforced in code: the pile itself. The print sheet and the on-the-day checklist both say to hand them over and bin the leftovers, and `RETENTION-POLICY.md` lists printed slips as a store destroyed at the end of the event. `[NEEDS: somebody named to do the binning. It is the only personal data this project puts on paper.]` | `[Low — accepted, contingent on the leftovers actually being destroyed]` |
| 21 | **Proof of date of birth is required at the door, which some children will not be able to produce** | High | Medium | **DECIDED BY THE TEAM 2026-09-03. Accepted with the access barrier stated rather than mitigated away.** The aim is age, not identity: one open bracket runs 12 to 25, every supervision tier hangs off the date of birth, and until now that date was whatever was typed into a form by whoever was at the keyboard — so a wrong year puts an adult in a children's bracket or lets a fifteen-year-old leave on a permission written for a sixteen-year-old. **The barrier is real and predictable.** Most twelve- to fifteen-year-olds in the UK hold nothing showing a date of birth: no licence, no PASS card unless somebody bought one, and school cards almost never carry a DOB. For that age group this means a passport or a birth certificate — documents kept in a drawer that no parent wants a child carrying. Left unmanaged this excludes exactly the families the event exists to reach, and the discovery point would be a volunteer refusing a child at a door with a parent standing there. Four things manage it, and all four are in code or in copy rather than in anybody's judgement. (1) **A photo on a phone counts** — stated everywhere the requirement is; this is the line that makes it survivable, because the document never leaves the house. (2) **The accepted list is enumerated** in `src/data/id-check.ts` and read by the form, the event page, both emails and the desk, so the answer at the door is reading rather than deciding; it deliberately includes NHS cards and school or GP letters, not just photo ID. (3) **Nobody is turned away by a volunteer.** `ID_NO_DOCUMENT_RULE`: check them in as normal, leave the row marked unchecked, and the **safeguarding lead** decides before they play. Attendance is never gated on it — `checked_in_at` and `dob_verified_at` are separate columns for exactly this reason, and there is a test asserting a check-in succeeds with no verification. (4) **It is said at registration**, not only in the selection email, so a family knows before they invest in applying. **What is recorded is a timestamp and a moderator id and nothing else.** No document type, number, image, or the date read off it — migration 0013 says so and a test walks `PRAGMA table_info` asserting no such column exists, because "passport" against a child's name is a nationality signal we have no use for. The document is looked at and handed straight back. `[NEEDS: the safeguarding lead briefed on this specific decision before 3 October, and a view on whether the anyone-can-be-turned-away question should be revisited if the unchecked list is large on the day.]` | `[Medium — accepted, and the honest residual is exclusion rather than data]` |
| 22 | **Places are drawn by a third-party website** | High | Low | **Introduced deliberately 2026-09-03 on the team's decision**, so the draw can be witnessed rather than trusted. It is scored Low because **no personal data is transferred at all.** The service is given the integers 1..N and nothing else — no names, no ages, no references, no counts of anything about anybody. There is therefore no processor to appoint under Art. 28, no transfer to assess, and nothing of a child's in somebody else's server logs. The mapping from number to person never leaves us (`draw_ballots`, registration ids only, the same rule as `matches`). It also removes a bias the internal draw could never fully answer for: a picker that has never seen a name cannot favour one. **What makes it auditable is the ORDER, and the code enforces it**: the numbering is locked and recorded with the moderator and the moment *before* the draw runs, so a winning number resolves against a mapping that provably could not have moved. `draws` keeps the service named by the moderator and the pasted result verbatim, tied to the exact list by `ballot_list`. A number drawn against a mapping invented afterwards would be indistinguishable from picking winners by hand, which is the failure this is built to prevent. The seeded draw in `src/lib/draw.ts` is retained for backfilling drop-outs. `[NOTE: whichever service is used should be named in the published fairness wording once chosen, alongside the two-pool explanation — a draw described as "random" that gives referred applicants priority is the sort of inaccuracy that gets challenged. Still not chosen as of 2026-09-04; the code takes the name from whatever the moderator types, so no code waits on it.]` | Low |
| 23 | **Moderator access became grantable from inside the app** | Medium | Medium | **A deliberate weakening of the round-24 control, with compensating controls, 2026-09-03.** Until now moderator was a database grant with no button anywhere, because it exposes safeguarding disclosures, every applicant's contact details, the draw and deletion. The forcing problem was the arrival desk: it needs two or three volunteers on a door, and under a single flag staffing a door meant handing out the safeguarding queue — a far worse outcome than a grant button. **So the primary mitigation is not a control on the button, it is that the desk no longer needs the big grant**: `is_desk` grants the arrival desk and nothing else, it is the default option on the page, and its description says what it does and does not include. Around the moderator grant: only an existing moderator can grant; every grant and revocation is written to `staff_grants` with the actor's email as well as their id; a moderator cannot revoke their own moderator role and the last moderator cannot be revoked at all (two routes to the same lock-out, both closed and both tested); an account holding either grant cannot be deleted until it is revoked, so the audit trail cannot be orphaned; and the page flags any account that has never signed in, since a typo produces an invitation that silently goes nowhere. **Answered 2026-09-04: two to three people hold full moderator.** Recorded here as the figure the grant history is checked against — `/admin/people` lists every account holding either role, so "is it still two or three?" is a question with an answer on a screen rather than a matter of recollection. Anything beyond three should be a decision taken again rather than a grant made quietly. `[NEEDS: nothing further on the number. The control remains social — the button will be used by whoever has it — so the check is that somebody actually reads that list before 3 October.]` | `[Medium — accepted; the residual is who gets given it]` |
| 24 | **A moderator can now read one child's whole record on one page** | Medium | Low–Medium | **Introduced deliberately 2026-09-04, and it reduces exposure rather than increasing access.** Nothing new is collected and nobody can see anything they could not see before: a moderator has always been able to read every field, and until now the only way to do it was the entries list, which put a column of children's email addresses on screen for anybody standing behind them. The new page at `/admin/entries` shows the answers that exist to be *used* — referring organisation, city, self-rating, age on the day, supervision facts — plainly, and **masks every contact route, the date of birth and everything medical until a moderator presses a button.** The masking is done on the server: `entryDetail()` never returns an unmasked personal field, so a masked value is genuinely not in the page source, and `entryContact()` is a separate gated call. A test asserts that none of the real values appears in the serialised page data, because CSS-hidden text on a projected screen is exactly the false comfort this is meant to avoid. The masks are fixed-width so they do not leak the length of what they hide. The aggregate counts on the same page identify nobody. `[DECIDED, not needed: an audit of which moderator revealed which child's details. It would need a table, and a table of "who read this child's medical notes" needs its own retention rule and its own answer to a subject access request. Revisit when there is a rota rather than two or three named people who can already see everything.]` | Low |
| 25 | **The month and year of a child's birth is now shown on the arrival-desk screen** | Medium | Low | **Introduced deliberately 2026-09-04, and it is what makes risk 21's control work at all.** The desk exists to compare a document against what we hold. Until now it was given a badge reading "U18" and nothing else, so a volunteer holding a passport that said "14 March 2009" had to subtract two dates, standing up, with a queue — and the check that takes arithmetic is the check that gets nodded through. That is a control that looks present and is not, which is worse than none. The row now reads `Born March 2009 · 17 on the day`. **What limits it:** the DAY is never shown, in the data or on the screen — a month and a year catch a wrong YEAR, which is the entire purpose of the check (a twenty-seven-year-old in a children's bracket, a fifteen-year-old on a sixteen-year-old's permission to leave alone), while the day would only catch a typo and is the part of a date of birth worth having if you are impersonating a child. `checkInRoster()` returns `bornLabel` ("March 2009") and `ageOnDay`, never `dob`, and a test asserts the full date appears nowhere in what the roster serialises — the page is a client component, so anything returned is in the page source. Who can see it is unchanged: desk staff and moderators, on a gated page that is `noindex` and `force-dynamic`, and the same people were already trusted with every child's full name and supervision arrangements on the same screen. **The residual risk is the screen itself**, which faces a queue for forty minutes; it is a laptop angled at a volunteer, and the mitigation is physical, not technical. The desk copy also says to read the document before reading our record aloud — a volunteer who recites the month first has asked a leading question and verified nothing. | `[Low — accepted]` |
| 26 | **A volunteer sign-up form now collects adults' contact details and a THIRD PARTY's** | Medium | Medium | **Introduced deliberately 2026-09-05 (round 57), and the third party is the part that is new in kind.** `/volunteer` listed seven jobs and then handed people to the support form, so an offer to work at an event for children arrived as a paragraph of prose and the three things that decide whether somebody can be given a job — a DBS check, the hours they can give, and whether anybody vouches for them — were never asked. The form now asks them. Two entries on it are worth naming. **The referee** is a person who has not visited this site, has not agreed to anything, and whose name and one contact route we hold because somebody else typed them in: the minimum is taken (a name, how they know the volunteer, and ONE way to reach them — no address, no organisation, no second referee), the form says in the box itself to tell them first, and the acknowledgement email repeats that we will contact them. **The DBS answer is three words** — yes, no, not sure — and there is deliberately no column for a certificate number, an issue date, or anything a check found; that is criminal-records-adjacent data stored for no purpose we can name, and the moment it has a column somebody treats this table as the DBS register, which lives with the safeguarding lead on paper. What else limits it: everyone here is an adult by declaration and the form refuses without it (the refusal points at the support form rather than just saying no, so a willing seventeen-year-old is answered by a person); there is no free text at all; the list is moderators-only on a `noindex`, `force-dynamic` page; and the whole record is deletable in one click. **The real gap is retention.** Nothing deletes these automatically, because invariant 9 says only the team sets a duration and no figure for volunteer records exists in `RETENTION-POLICY.md` — so the policy carries a bracketed proposal, the code enforces nothing, and `/admin/volunteers` says so on the page next to the only button that removes one. `[NEEDS: a retention period for volunteer records, and a decision on whether the referee is actually contacted or the field is dropped — a contact detail collected for a check nobody performs is the worst of both.]` | `[Medium until the retention period is set]` |

## 6. Conclusion — can we proceed?

Updated round 48 (2026-09-01, after the planning meeting).

**Registration was opened to the public on 2026-09-01.** The four things this document
said had to exist first were reported settled at that meeting: a named safeguarding lead
and deputy, a DBS-checked list for the day, insurance (covered by the venue), and sign-off
on this assessment. `SWC_REGISTRATION_OPEN` was set the same day. **The signature block in
section 7 is still blank and the named people are still not written in here** — those are
the team's to fill in, and until they are, this document does not evidence the decision it
records. That gap is the first item on the outstanding list below.

**The direction of travel changed at that meeting, and it should be read honestly.** Two
risks were reduced: WhatsApp marketing was withdrawn before it shipped (#19), and the
PlayStation ID and the dietary list were dropped from the form altogether — less data
collected about children than at any point in this project. One was accepted in the other
direction: profiles are now kept indefinitely with manual clean-up (#17, #13). A DPIA that
recorded only improvements would be a sales document, so both are here.

**Built since this was last assessed:**

| Was blocking | Now |
|---|---|
| #9 guardian notifications do not send | Sending, logged, and failures surfaced to moderators |
| #4 unencrypted JSON files | Cloudflare D1, encrypted at rest, no public route to it |
| #8 nothing is ever deleted | Field-level medical purge on a daily cron Worker |
| #5 no real authentication | Passwordless sign-in, D1 sessions, moderator as a DB grant |
| #13 no duration for a profile with no event | 24 months of no activity, enforced nightly, visible on /admin |
| #14 nothing deletes a registration | 12 months from the event date, enforced nightly (round 46) |
| #16 erasure needs hand-written SQL | A delete button on /admin, one shared cascade, every deletion recorded |
| #10 photography consent might be ignored on the day | Superseded: photography is now a stated condition, and the honest version of the risk is #18 |
| #9 residual: no DMARC record | Live, `p=none`, with Resend DKIM and a `send.` Return-Path so guardian mail aligns on both |
| Data collected that was never needed | PlayStation ID and the dietary list both dropped from the form (2026-09-01) |
| #18 residual: no way to record a photography objection | Recorded against the entry, and a do-not-photograph list of names on `/admin` (round 57) |
| The reminder email promised in every offer email | Built: venue address, times and what to bring, with a separate one to an under-18's guardian carrying the collection rule (round 57) |

**Still outstanding, with the form now open:**

1. **Write the decision down here.** The named safeguarding lead and deputy (#7), the
   confirmation that the DBS list covers everyone on the floor including late additions
   (#11), and a signature and date in section 7. All four were settled verbally on
   2026-09-01 and the form was opened on that basis; none of it is in this file. **A
   safeguarding decision that exists only in somebody's memory of a meeting is the one
   thing an inspector, an insurer or a parent will ask to see.** Nothing else on this list
   comes close to it in importance.
2. **#17 — a named owner and a review date for the manual profile clean-up.** The sweep is
   one click on `/admin`; what it needs is somebody whose job it is and a date in a diary.
3. **#2 residual — the sign-out procedure at the desk.** The app records who may leave
   unaccompanied; nothing enforces it at the door. Now item one of the "On the day"
   checklist at the top of `/admin`, which is a prompt rather than a control.
4. **#26 — how long a volunteer's details are kept**, and whether the referee is actually
   contacted. Nothing deletes a volunteer record automatically and nothing will until the
   team sets a figure; the form now holds a third party's contact details, given for a
   check somebody has to actually perform or the field should come off the form.
   *(#18 — recording a photography objection — was built in round 57 and is closed.)*
5. **#25 residual — where the desk laptop points.** The screen now carries a month and year
   of birth beside a child's name for forty minutes. Nothing in code can fix the angle of a
   laptop lid; add it to the desk brief.

**Closed since the last version:** #9 residual (DMARC is live, with Resend DKIM and SPF
aligned), #19 (withdrawn — no messaging is promised anywhere), and #15/#16, which stay
mitigated. The test key from #15 is still the right way to rehearse even with the form
open, because it is what unlocks the one-click test-data button.

## 7. Sign-off

| Role | Name | Date | Comment |
|---|---|---|---|
| Assessment owner | `[NAME]` | | |
| Safeguarding lead | `[NAME]` | | |
| Reviewed by (data protection) | `[NAME / FIRM]` | | |

Review this DPIA before every event, and whenever a new category of data is added.

---

*Draft version 0.1 — `[DATE]`.*
