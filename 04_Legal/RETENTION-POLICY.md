# Data retention and deletion policy — DRAFT

> **STATUS: DRAFT FOR REVIEW.** The durations in `[BRACKETS]` are proposals with reasoning,
> not settled law. Pick each one deliberately — "we'll decide later" is itself a decision,
> and it defaults to keeping children's data forever.

## Why this document has to exist before launch

Written when the app never deleted anything and everything lived in JSON files on disk.
Three of the durations below are now enforced in code — see "What the code does" at the
bottom — and the rest are still documents. Storage limitation is a principle, not a
nice-to-have, and "we kept a ten-year-old's medical notes for six years because nobody
wrote a policy" is not a defensible answer.

This policy is also the thing that makes the privacy notice honest. You cannot tell a
parent how long you keep their child's data until you have decided.

## The table

| Data | Where it lives now | Retention | Reasoning |
|---|---|---|---|
| **A profile's full name, mobile and guardian contact** | `players` | **Cleared as soon as the person has no registration left**, which in practice is the twelve-month rule below reaching the last event they entered. Added 2026-09-02 to make a second entry a confirmation rather than a retype; bounded on the same day it was added, because copying purgeable fields onto an unbounded row would have cancelled the row below it. |
| **Any profile, attended or not** | `players` | **DECIDED 2026-09-01: KEPT until somebody deletes it.** No automatic expiry. The 24-month figure below survives as the line a manual clean-up is measured against — `/admin` counts what could be cleared and clears it in one click (`purgeDormantProfiles()`, moderator-triggered) — but nothing runs on a timer. This reversed the round-44 rule, which deleted dormant profiles nightly for three rounds. | Since round 42 a profile is created for everyone who registers interest, not only for the 64 drawn. That was right for the person — a profile carries benefits they are entitled to either way — but it means holding an account for a child with **no event date to measure from**, which is the one case every other row here depends on. Activity is the latest of account creation, last sign-in and last registration of interest. Exempt: moderators, anyone who attended, and anyone named on a report or support ticket (a safeguarding record whose subject has been deleted cannot be acted on). Surfaced on `/admin` so a job that stops running is visible. |
| **Medical conditions and notes** | `registrations.json` → `answers.medical*` | **`[30]` days after the event, then deleted from the record** | Its only purpose is that one day. There is no reason to hold a child's asthma details a year later. This is the shortest and most important one — and it means deleting *fields* from a record, not the whole record, which the store cannot currently do. |
| **Dietary and accessibility needs** | same | `[30]` days after the event | Same reasoning. Useful to re-ask each event rather than assume it is unchanged. |
| **Registration record (name, DOB, contact, event answers)** | `registrations` | **DECIDED: 12 months after the event, then the row is deleted** — signed off 2026-08-31, enforced by `purgeRegistrations()` | Long enough to answer "was I there?", settle a dispute and plan the next event from real numbers; short enough that a child who applied once and never came back is not on file when the second event runs. A whole-row delete, not a field purge: the row *is* the personal data. Exempt: anyone named on a report or a safety support ticket, whose records run six years. |
| Guardian contact details and permission record | `registrations`, `guardian_approvals` | **12 months after the event, unless linked to a safeguarding concern** | Proof of consent is worth holding for as long as the entry it authorised — so it goes with the registration, on the same clock and with the same exemption. |
| Check-in token | `registrations.json` → `checkInToken` | **Delete the day after the event** | It is a credential. Holding a live credential after it can be used is pure risk. |
| **Safeguarding reports and their outcomes** | `reports.json`, `support-tickets.json` (safety category) | **`[6]` years from resolution** | The long one, deliberately. A concern raised about a child may matter years later, and destroying the record early is the classic safeguarding failure. Confirm against the standard your insurer and local authority expect. |
| Non-safety support tickets | `support-tickets.json` | `[12]` months from resolution | Ordinary correspondence. |
| Moderation audit trail (who claimed, what they decided) | `reports.json` | Same as the report it belongs to | The decision is meaningless without who made it. |
| LFG board posts | `lfg-posts.json` | Already expire after 14 days; **delete, do not just mark expired** | The code sets `expiresAt` but keeps the row. Expiry must become deletion. |
| Game requests, incl. PlayStation IDs and guardian email | `game-requests.json` | **`[90]` days after the request settles** | These contain two children's contact handles and a guardian's email. No reason to keep them once the game has happened. |
| Blocks | `blocks.json` | **Keep while both accounts exist** | A block must not quietly expire. Deleting it re-exposes someone to a person they blocked. |
| Rate-limit counters | In memory | Minutes | Never persisted. |
| Photographs and video from the event | `[WHERE? Drive? A photographer's own drive?]` | `[3]` years, and **delete immediately on request** | Needs deciding — this is currently the biggest undocumented data store in the project, and it lives outside the app entirely. |
| Backups | `[TBC]` | Must not outlive the data they contain by more than `[30]` days | A deletion that leaves the data in a backup for a year is not a deletion. |

## Deletion on request

A player, or a parent on behalf of a younger child, can ask us to delete everything. Since
round 45 that is a button on `/admin` → Entries rather than hand-written SQL; see the
section at the end of this document. What follows is what still has to be true around it.

**Needed before launch:**

- ~~a documented manual procedure that covers *every* store above~~ — done: one cascade,
  `deleteAccount()`, is the only way anything deletes an account, so the retention job and
  the button cannot drift apart and forget the board posts or the game requests. It still
  needs **a named owner**: a button nobody is responsible for pressing is not a procedure
- a `[one month]` response commitment, matching the privacy notice
- a record that the deletion happened (date, who did it, what was covered) — kept even
  after the data is gone, because you may need to prove you complied
- one exception, written down: we will not delete a safeguarding record on request where
  doing so would defeat its purpose. Say this plainly in the privacy notice rather than
  discovering it during a request.

## What the code does, and what it still does not

**Enforced.** `src/lib/retention.ts`, run nightly at 03:15 by a separate cron Worker
(`swc-retention`), with every run recorded in `retention_runs` — a table that deliberately
holds no personal data, so the proof outlives the data it is about.

| Rule | Where |
|---|---|
| Medical and accessibility deleted 30 days after the event (the dietary field stopped being collected on 2026-09-01; the purge still clears it on any older row) | `purgeMedical()` — field-level, which is only possible because those live in their own columns rather than in a JSON blob |
| Check-in tokens cleared the day after the event | `clearCheckInTokens()` |
| **A profile's copy of the contact details cleared once no registration uses them** | `purgeStaleProfileContact()`. Added 2026-09-02 with the change that let a profile hold a full name, a mobile and a guardian's name, relationship and mobile so a returning player need not retype them. Those are the same fields the twelve-month purge deletes, and profiles are kept indefinitely — so this clears them the moment the registration behind them is gone. Keyed on "no registration left" rather than a date of its own, so it needs no second number and follows the twelve-month rule automatically. The profile itself, its first name, date of birth, region, handle and avatar, is untouched |
| ~~Dormant profiles deleted after 24 months~~ — **switched off 2026-09-01** | `DORMANT_PROFILE_AUTO_PURGE = false`. The code is intact and tested; it now runs only when a moderator presses the button on `/admin`, with the same exemptions and the same cascade across sessions, sign-in tokens, guardian approvals, board posts, game requests and blocks |
| **Registrations deleted 12 months after the event** | `purgeRegistrations()` — whole rows, excluding anyone named on a report or a safety ticket |
| Deletion on request, and clearing up after a rehearsal | `deleteAccount()` from `/admin` → Entries, recorded like any scheduled deletion |

**Not enforced. Stated plainly because the gaps matter more than the list above.**

1. **No profile has an end date, by decision (2026-09-01).** This is no longer a gap
   somebody forgot; it is a choice, and it is the weakest point in this document. What a
   profile holds is the least sensitive thing the project stores — first name, chosen
   handle, email, date of birth, region, avatar; nothing medical, no guardian contact, no
   mobile — and the registration behind it still goes automatically at twelve months. What
   makes the choice defensible rather than merely convenient is that somebody actually
   runs the clean-up. **That needs a named owner and a date in a diary, and neither
   exists.** Until they do, "we delete when we need to" is an intention rather than a
   control. Erasure on request is a button and is honoured properly, which is now the main
   protection rather than a backstop.
2. **Expiry means deletion** for LFG posts and settled game requests. The code sets
   `expires_at` and keeps the row.
3. **Backup lifecycle**, once there are backups.

## Review

Owner: `[NAME]`. Review annually, and after every event.

---

*Draft version 0.1 — `[DATE]`.*

## Deletion on request, and deletion after a test

Two deletions happen outside the schedule above, both from `/admin` → Entries:

- **An erasure request** (UK GDPR Art. 17). Removes the profile, the registration and
  everything keyed to either.
- **Clearing up after a rehearsal.** Testing the real registration path creates real rows;
  they are deleted the same day.

Both are refused, with the reason given, for a moderator or for anyone named on a report or
a support ticket. A safeguarding record about someone who has been deleted cannot be acted
on, and those records run six years — a legitimate refusal under Art. 17(3).

Every deletion, manual or scheduled, is recorded in `retention_runs` with who did it and
why. That table is the answer to "did you delete it?".
