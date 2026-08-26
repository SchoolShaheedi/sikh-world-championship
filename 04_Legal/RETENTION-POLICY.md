# Data retention and deletion policy — DRAFT

> **STATUS: DRAFT FOR REVIEW.** The durations in `[BRACKETS]` are proposals with reasoning,
> not settled law. Pick each one deliberately — "we'll decide later" is itself a decision,
> and it defaults to keeping children's data forever.

## Why this document has to exist before launch

Right now the app never deletes anything. Every registration, report, guardian approval
and support ticket stays in a JSON file indefinitely. That is a live UKGDPR problem the
moment the first real child registers: storage limitation is a principle, not a
nice-to-have, and "we kept a ten-year-old's medical notes for six years because nobody
wrote a policy" is not a defensible answer.

This policy is also the thing that makes the privacy notice honest. You cannot tell a
parent how long you keep their child's data until you have decided.

## The table

| Data | Where it lives now | Proposed retention | Reasoning |
|---|---|---|---|
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

## What the code needs

None of this is enforceable today. In rough priority:

1. **Field-level deletion** for medical notes. The store deletes whole records or nothing,
   so a 30-day medical purge is currently impossible. This is the gap that matters most.
2. **A scheduled job** that applies the table above. A retention policy nobody runs is a
   document, not a control.
3. **Expiry means deletion** for LFG posts and settled game requests.
4. **`deletedAt` audit rows**, so a deletion is provable after the fact.
5. **Backup lifecycle** set to match, once there are backups.

## Review

Owner: `[NAME]`. Review annually, and after every event.

---

*Draft version 0.1 — `[DATE]`.*
