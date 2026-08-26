# 04_Legal

Seven drafts are now in this folder, all version 0.1 and **all needing review**. They were
written by working backwards from what the code actually does, so the field lists,
retention targets and risk register describe this project rather than a generic template.

**They are drafts, not advice.** They need a read by someone qualified in UK data
protection, and the safeguarding policy needs a read by someone with safeguarding
qualifications. Children's data is the area where that distinction matters most.

## What's here

| Document | What it is | Priority |
|---|---|---|
| `DPIA.md` | Data Protection Impact Assessment. **Legally required** before processing children's data, and its conclusion is currently "not yet — do not open real registrations". | **1st** |
| `SAFEGUARDING-POLICY.md` | The formal policy behind the public `/safeguarding` page. Its named-people table is the single most important blank in the project. | **1st** |
| `PRIVACY-NOTICE.md` | What we collect and why, with an accurate field-by-field table and a child-readable summary (ICO Children's Code). | 2nd |
| `RETENTION-POLICY.md` | How long each store is kept. Makes the privacy notice honest — you cannot tell a parent how long you keep their child's data until you have decided. | 2nd |
| `CODE-OF-CONDUCT.md` | The document the sign-up form's "I've read the code of conduct" tick should point at. **It currently points at nothing.** | 3rd |
| `PHOTOGRAPHY-CONSENT.md` | Policy, the wording already in the form, and the wristband problem of honouring it on the day. | 3rd |
| `TERMS-OF-USE.md` | Deliberately thin. Matters least; do it last. | 4th |

## Do these three first, in this order

1. **Start the DBS checks.** They take weeks and everything else waits on them. You cannot
   name a safeguarding lead publicly until theirs is underway.
2. **Fill in `SAFEGUARDING-POLICY.md` section 3** — the named people. `src/data/org.ts`
   currently says `"TBC"`, which means the live public page tells a worried parent to
   contact "TBC". That is worse than having no page.
3. **Work through `DPIA.md` section 5** with the safeguarding lead. It is the document that
   tells you what to build next, in priority order, and it names four blocking items.

## Registering with the ICO

Processing children's personal data almost certainly means SWC must register as a data
controller with the Information Commissioner's Office and pay the annual fee (£40–£60 for a
small organisation). Do this at ico.org.uk/registration. It takes about fifteen minutes,
and the registration number goes in `PRIVACY-NOTICE.md`.

## Insurance

Public liability cover for the event day is separate from everything above and is not
drafted here — it is a purchase, not a document. When you get quotes, ask specifically what
the insurer requires of you regarding under-18s, supervision ratios, DBS checks and
emergency contacts, because their answer may change decisions already taken in
`DECISIONS.md`.

## Two things to know about these drafts

**They are honest about what does not work.** The DPIA risk register records that guardian
notification emails do not send, that data sits in unencrypted files, that nothing is ever
deleted, and that the moderation queue was briefly readable by anyone. That is deliberate —
a DPIA that only lists risks you have already solved is worthless, and the ICO is
explicitly more forgiving of a documented known risk than an undocumented one.

**This repository is public.** These drafts are therefore publicly readable, including
those honest weaknesses. That is consistent with how `DECISIONS.md` already documents the
project's limitations, but it is worth a conscious decision rather than a surprise. If you
would rather they were private, move this folder to shared storage and leave a pointer
here — the code does not depend on them.
