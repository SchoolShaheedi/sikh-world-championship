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

Running an in-person esports competition (Sikh FC 27 Championship, 64 players, ages 12–21,
Leicester, Saturday 3 October 2026) with an accompanying website that handles platform
registration, expressions of interest in each event, a random draw for places, check-in and
a live bracket. An online "Looking For Game" board for finding practice partners is built
but switched off and is not in scope for this assessment.

**Data subjects:** children aged 12–17, young adults 18–21, parents and guardians,
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

**Special category data:** health — medical conditions, allergies, dietary and
accessibility needs.

## 3. Why we need to do it

To run the competition at all: to check eligibility, seed a fair bracket, keep children
safe on the day, feed people without poisoning anyone, and give a first aider the
information they need before an incident rather than during one.

## 4. Necessity and proportionality

**What we deliberately do NOT collect,** having considered it: home address, postcode,
school, year group, gender, ethnicity, photographs of the player as a profile default
(avatars are the default), or an exact age shown publicly.

**Data minimisation decisions already taken and recorded in DECISIONS.md:**

- Player photo is optional; the default is an illustrated avatar (round 5, decision 18)
- Region, never a postcode
- Age band shown publicly, never date of birth
- Guardian presence tiered by age rather than blanket, so we do not demand a parent's
  whole Saturday where the risk does not justify it (round 24)
- Emergency contact not duplicated for under-18s — the guardian record serves it (round 25)
- **No messaging at all** (round 25), which removes an entire category of processing: there are
  no private messages between users, so there is nothing to filter, retain, or breach
- **The public bracket shows a self-chosen tournament handle**, not the real name and not
  the PlayStation ID (round 44). A PSN ID is a *contact route*: search it and you can send
  a friend request to a twelve-year-old, which would undo the platform's strongest
  protection — IDs are otherwise released only to two players who have both agreed to a
  game. The handle is refused if it matches the entrant's own PSN ID or contains their
  surname, and a moderator reads the list of names before the day, because the automatic
  checks catch only what a machine can see

**Lawful bases:** contract for the registration itself; explicit consent for health data;
legitimate interests for safeguarding measures; legal obligation where safeguarding law
applies. See `PRIVACY-NOTICE.md`.

## 5. Risks

Scored **likelihood × severity**, each low / medium / high. Filled in honestly — several
of these describe the system as it stands today, not as we would like it to be.

| # | Risk | Likelihood | Severity | Mitigation | Residual |
|---|---|---|---|---|---|
| 1 | **Adult contacts a child through the platform** | Low | High | No messaging at all. Age bands strictly separated, enforced in the data layer and re-checked when a request is created. PlayStation IDs released only on mutual agreement. Guardian consent required before an under-16 uses the board; both guardians notified on every exchange. | Low |
| 2 | **Child is taken from the venue by the wrong adult** | Low | High | Tiered supervision recorded at registration and enforced in `guardian-rules.ts`: no under-12s at all, 12–15 need a guardian at the venue for the whole event, 16–17 only where the guardian has recorded permission. Check-in via QR. `[NEEDS: a sign-out procedure at the desk to match — the app records the permission but nothing enforces it at the door]` | `[Medium until the desk procedure exists]` |
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
| 18 | **Photography is now a condition of entry rather than a consent** | High | Medium | **Accepted by the team (round 47), not mitigated by code.** The photo tick box was removed from the sign-up form on the team's instruction; registering now means agreeing that photos and video of the entrant may be used to promote future events, and `validateRegistration()` records agreement for every submission. **This is a real reduction in a child's control over their own image and it must not be described as consent** — agreement that cannot be declined while still entering is not freely given, so the lawful basis is legitimate interests with an Art. 21 right to object. What keeps it defensible: the statement is on the form, in the applicant's confirmation email, and repeated in full in the email the guardian receives before the day; objecting is free, reasonless, and has no effect on a place. What is missing: **nothing in the app records an objection.** It arrives as a support message, and the "do not film" list for 3 October is currently a person's memory. `[NEEDS: a way to flag a registration as objecting, and the wristband-and-briefing process in PHOTOGRAPHY-CONSENT.md.]` | `[Medium until the objection can be recorded]` |
| 19 | ~~Registering signs you up to WhatsApp messages about future events~~ | — | — | **WITHDRAWN 2026-09-01, one day after it was raised. The team's plan changed to a WhatsApp community whose joining link is emailed — an invitation somebody accepts, not messages we send unasked — and it is not settled, so every mention of messaging came back off the form, both emails, the privacy notice and the terms. Email is the only channel. The original assessment is kept below because the risk returns the moment a column of mobile numbers is exported for any purpose, and it should be re-read then rather than re-derived.** Original: accepted by the team (round 47), partially mitigated. A new purpose for a number collected to reach someone on the day: direct marketing of future events. Bundled into registration, so — like #18 — it is not consent; it runs on legitimate interests with a right to object, and PECR's soft opt-in is a thin argument for a free event with no prior purchase. Three things reduce it. **Under-18s are never messaged directly** — the messages go to the parent or guardian's number, which also avoids sending WhatsApp traffic to a 12-year-old who is below WhatsApp's own minimum age. The scope is narrow and stated: our own events, a few times a year, nobody else's advertising. And every statement of it names the way out (reply STOP, or the support form). `[NEEDS: an opt-out that is recorded somewhere before the first message is sent — today there is no WhatsApp sending at all, so the promise is currently kept by there being nothing to unsubscribe from. That stops being true the day someone exports a list of numbers.]` | `[Medium until the opt-out is recorded]` |

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
4. **#18 — a way to record a photography objection**, so the "do not film" list on the day
   comes out of the system rather than somebody's memory. Small; in the build backlog.

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
