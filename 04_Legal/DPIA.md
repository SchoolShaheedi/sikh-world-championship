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

Running an in-person esports competition (Sikh FIFA 26 Championship, 64 players, open to
ages 8+) with an accompanying website that handles registration, check-in, a live bracket,
and an online "Looking For Game" board for finding practice partners.

**Data subjects:** children aged 8–17, adults 18+, parents and guardians, volunteers.

**Volume:** 64 players for event 1, of whom a substantial share will be children, plus
their guardians. Larger for later events.

**Processing:** collection at sign-up, storage, display of a limited public subset (first
name, avatar, region, age band), email notification, moderation of reports, and deletion
per `RETENTION-POLICY.md`.

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
- **No chat at all** (round 25), which removes an entire category of processing: there are
  no private messages between users, so there is nothing to filter, retain, or breach

**Lawful bases:** contract for the registration itself; explicit consent for health data;
legitimate interests for safeguarding measures; legal obligation where safeguarding law
applies. See `PRIVACY-NOTICE.md`.

## 5. Risks

Scored **likelihood × severity**, each low / medium / high. Filled in honestly — several
of these describe the system as it stands today, not as we would like it to be.

| # | Risk | Likelihood | Severity | Mitigation | Residual |
|---|---|---|---|---|---|
| 1 | **Adult contacts a child through the platform** | Low | High | No chat at all. Age bands strictly separated, enforced in the data layer and re-checked when a request is created. PlayStation IDs released only on mutual agreement. Guardian consent required before an under-16 uses the board; both guardians notified on every exchange. | Low |
| 2 | **Child is taken from the venue by the wrong adult** | Low | High | Tiered supervision recorded at sign-up: under-12 guardian on site, 12–15 collected, explicit "may not leave unaccompanied" default. Check-in via QR. `[NEEDS: a sign-out procedure at the desk to match — the app records the permission but nothing enforces it at the door]` | `[Medium until the desk procedure exists]` |
| 3 | **Medical information not available when a child collapses** | Medium | High | Collected in advance as a structured tick-list plus detail, so a first aider can scan it. `[NEEDS: a printed or offline copy at the first aid point — the venue may have no signal]` | `[Medium]` |
| 4 | **Children's data breached from the store** | **Medium** | High | **Not yet mitigated.** Data currently sits in unencrypted JSON files on the application host. Must move to a managed database with encryption at rest and role-based access before any real registration. | **High until migrated** |
| 5 | **Safeguarding disclosure exposed to the public** | Low | High | Was **realised** in development: the moderation queue was readable without authentication because the session stub granted moderator to everyone. Fixed in round 24 — deny by default, refused in production, page no longer prerendered. Real authentication still outstanding. | Medium until auth ships |
| 6 | **Guardian consent is not genuine** — child enters their own address as the guardian's | Medium | Medium | Guardian email is taken from the registration record, never a child-filled field. Guardian confirms by email link. **Honestly stated: a determined child could still put their own address in at registration.** True of any email-based consent system. Mitigated in depth by the guardian being physically present or contactable on the day. | Medium — accepted, documented |
| 7 | **Safeguarding report goes unread** | Medium | High | Named moderators, 24h public commitment, queue with claim/assignment and an overdue alert, urgent categories jump the queue, rate limiting so the queue cannot be flooded. **`[NEEDS: the rota actually staffed — the tooling exists and the people do not]`** | `[High until named]` |
| 8 | **Data kept indefinitely** | **High** | Medium | **Not yet mitigated.** Nothing is ever deleted today. `RETENTION-POLICY.md` sets the durations; the scheduled deletion and field-level medical purge are unbuilt. | **High until built** |
| 9 | **Guardian notification promised but not sent** | **High** | High | **Not yet mitigated.** `src/lib/notify.ts` logs to the console and sends no email. The public safeguarding page previously promised notifications it could not deliver. **Under-16 board access must stay off until this sends.** | **High — blocking** |
| 10 | Photographs of children used without consent | Medium | Medium | Photography opt-in, guardian-given for under-18s, photographers briefed. `[NEEDS: a practical way to identify non-consenting players on the day — wristbands are the usual answer]` | `[Medium]` |
| 11 | Volunteer with no DBS check has unsupervised access to children | Medium | High | `[NEEDS: DBS checks started — they take weeks. Named leads first, then anyone with unsupervised access.]` | `[High until done]` |
| 12 | A child sees something distressing in a report they filed | Low | Medium | Reports are visible only to moderators, never to the reported person; block is deliberately silent to avoid retaliation. | Low |

## 6. Conclusion — can we proceed?

**Not yet.** Four risks are unmitigated and each is individually blocking for real
registrations from children:

1. **#9 — guardian notifications do not send.** A safeguarding promise the software does
   not keep.
2. **#4 — data is not stored securely.** Unencrypted files holding children's medical notes.
3. **#8 — nothing is ever deleted.**
4. **#11 — DBS checks not started.** These take weeks; start them first, today.

Plus #7: the moderation rota needs real named people, not "TBC".

Development and testing with fake data may continue. **Sign-off for real registrations
should be withheld until 1, 2 and 4 are done and 3 has a dated plan.**

## 7. Sign-off

| Role | Name | Date | Comment |
|---|---|---|---|
| Assessment owner | `[NAME]` | | |
| Safeguarding lead | `[NAME]` | | |
| Reviewed by (data protection) | `[NAME / FIRM]` | | |

Review this DPIA before every event, and whenever a new category of data is added.

---

*Draft version 0.1 — `[DATE]`.*
