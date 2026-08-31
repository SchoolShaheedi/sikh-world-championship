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
enforced in code. See risks 13 and 14.

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
| 10 | Photographs of children used without consent | Medium | Medium | Photography opt-in, guardian-given for under-18s, photographers briefed. `[NEEDS: a practical way to identify non-consenting players on the day — wristbands are the usual answer]` | `[Medium]` |
| 11 | Volunteer with no DBS check has unsupervised access to children | Low | High | Volunteers are DBS-checked and the records are held by the parent charity. `[NEEDS: confirm the checked list covers everyone who will be on the floor on 3 October 2026, including anyone added late.]` | `[Low once the list is confirmed]` |
| 12 | A child sees something distressing in a report they filed | Low | Medium | Reports are visible only to moderators, never to the reported person; block is deliberately silent to avoid retaliation. | Low |
| 13 | **An account is held for a child who never attended an event** | High | Low–Medium | **Mitigated (round 44).** Introduced deliberately in round 42 (see section 2). A profile holds first name, public handle, email, age band, date of birth, region and avatar — no health data, which lives on the registration and is purged separately. **Retention duration now decided: deleted after 24 months of no activity**, enforced by `purgeDormantProfiles()` on the nightly cron and surfaced on `/admin` so a job that stops running is visible rather than silent. Moderators, anyone who attended, and anyone named on a report or a support ticket are exempt. **Honestly stated: deleting the profile does NOT delete the registration behind it**, which holds the applicant's name, date of birth and email. See risk 14. | Low |
| 14 | **A registration is kept indefinitely** — the 12-month rule is written down and not built | High | Medium | **NOT mitigated.** `RETENTION-POLICY.md` says a registration is kept 12 months after the event, but nothing deletes it: only the medical fields (30 days) and the check-in token (1 day) are purged. So the name, date of birth, email and mobile of every applicant, most of them children, are held with no end date. This is now the largest storage-limitation gap in the project, and it is blocked on a decision rather than on code — the duration is still `[12]` in brackets, and a purge running to an unconfirmed number is worse than none. `[NEEDS: confirm the duration, then build it. One evening's work once the number is agreed.]` | `[High until the duration is set and enforced]` |

## 6. Conclusion — can we proceed?

Updated round 42 (2026-08-31). The previous conclusion listed four blockers; three of them
have since been built and the fourth has changed shape. What is left is almost entirely
about **people and paperwork, not code**.

**Built since this was last assessed:**

| Was blocking | Now |
|---|---|
| #9 guardian notifications do not send | Sending, logged, and failures surfaced to moderators |
| #4 unencrypted JSON files | Cloudflare D1, encrypted at rest, no public route to it |
| #8 nothing is ever deleted | Field-level medical purge on a daily cron Worker |
| #5 no real authentication | Passwordless sign-in, D1 sessions, moderator as a DB grant |
| #13 no duration for a profile with no event | 24 months of no activity, enforced nightly, visible on /admin |

**Still outstanding before real registrations open:**

1. **#7 — the moderation rota.** The tooling exists; the staffing does not. Confirm the
   charity's named safeguarding lead and deputy accept covering SWC events and the
   platform, and that they are on call for 3 October 2026.
2. **#11 — confirm the DBS-checked list covers everyone who will be on the floor**,
   including anyone added in the last week.
3. **#9 residual — set the DMARC record.** One TXT record. Without it a guardian notice is
   far more likely to be filed as spam.
4. **#14 — confirm how long a registration is kept, then build the purge.** Settled in
   round 44: #13 (the dormant profile) is decided at 24 months and enforced, and doing that
   made the bigger gap obvious. Nothing deletes the registration itself, so an applicant's
   name, date of birth, email and mobile are held with no end date. Blocked on the number,
   not on code.
5. **#2 residual — the sign-out procedure at the desk.** The app records who may leave
   unaccompanied; nothing enforces it at the door.

**This document has never been signed.** Items 1–5 above should be settled and written in
before it is signed the first time, rather than signed now and amended later. Development
and testing with fake data may continue meanwhile; `SWC_REGISTRATION_OPEN` stays off.

## 7. Sign-off

| Role | Name | Date | Comment |
|---|---|---|---|
| Assessment owner | `[NAME]` | | |
| Safeguarding lead | `[NAME]` | | |
| Reviewed by (data protection) | `[NAME / FIRM]` | | |

Review this DPIA before every event, and whenever a new category of data is added.

---

*Draft version 0.1 — `[DATE]`.*
