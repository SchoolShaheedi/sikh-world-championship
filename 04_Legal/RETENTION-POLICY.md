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
| **A profile that never attended an event** | `players` | **DECIDED: delete after 24 months of no activity** — signed off 2026-08-31, enforced in `src/lib/retention.ts` | Since round 42 a profile is created for everyone who registers interest, not only for the 64 drawn. That was right for the person — a profile carries benefits they are entitled to either way — but it means holding an account for a child with **no event date to measure from**, which is the one case every other row here depends on. Activity is the latest of account creation, last sign-in and last registration of interest. Exempt: moderators, anyone who attended, and anyone named on a report or support ticket (a safeguarding record whose subject has been deleted cannot be acted on). Surfaced on `/admin` so a job that stops running is visible. |
| **Medical conditions and notes** | `registrations.json` → `answers.medical*` | **`[30]` days after the event, then deleted from the record** | Its only purpose is that one day. There is no reason to hold a child's asthma details a year later. This is the shortest and most important one — and it means deleting *fields* from a record, not the whole record, which the store cannot currently do. |
| **Dietary and accessibility needs** | same | `[30]` days after the event | Same reasoning. Useful to re-ask each event rather than assume it is unchanged. |
| Registration record (name, DOB, contact, event answers) | `registrations.json` | `[12]` months after the event | Long enough to answer "was I there?", handle a dispute, and plan the next event. Not indefinite. |
| Guardian contact details and permission record | `registrations.json`, `guardian-approvals.json` | `[12]` months after the event, **unless linked to a safeguarding concern** | Proof of consent is worth holding for as long as the entry it authorised. |
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

A player, or a parent on behalf of a younger child, can ask us to delete everything. Today
that is a manual job: someone edits the JSON files. That is acceptable for zero real users
and unacceptable at 64.

**Needed before launch:**

- a documented manual procedure, with a named owner, that covers *every* store above —
  it is easy to delete the registration and forget the LFG posts and the game requests
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
| Medical, dietary and accessibility deleted 30 days after the event | `purgeMedical()` — field-level, which is only possible because those live in their own columns rather than in a JSON blob |
| Check-in tokens cleared the day after the event | `clearCheckInTokens()` |
| Dormant profiles deleted after 24 months | `purgeDormantProfiles()`, plus the cascade across sessions, sign-in tokens, guardian approvals, board posts, game requests and blocks |

**Not enforced. Stated plainly because the gaps matter more than the list above.**

1. **The 12-month registration rule.** This is now the biggest one. A registration holds
   the applicant's name, date of birth, email and mobile, and nothing deletes it — so
   deleting a dormant *profile* does not remove that person's details, only their account.
   The duration is still `[12]` in brackets, which is why it has not been built: a purge
   running to an unconfirmed number is worse than no purge. **Decide the number, then
   build it.**
2. **Expiry means deletion** for LFG posts and settled game requests. The code sets
   `expires_at` and keeps the row.
3. **Deletion on request** is still a manual job. See below.
4. **Backup lifecycle**, once there are backups.

## Review

Owner: `[NAME]`. Review annually, and after every event.

---

*Draft version 0.1 — `[DATE]`.*
