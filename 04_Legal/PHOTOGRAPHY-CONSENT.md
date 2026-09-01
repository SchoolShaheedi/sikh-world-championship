# Photography and filming — DRAFT

> **STATUS: DRAFT FOR REVIEW.** Covers the policy, the wording already in the sign-up
> form, and the practical problem of honouring it on the day.
>
> **CHANGED IN ROUND 47 (2026-09-01), ON THE TEAM'S INSTRUCTION.** Photography moved from
> an opt-in tick box to a stated condition of registering. Read the next section before
> using this document for anything: the change is built, and it carries a legal cost that
> is described honestly rather than papered over.

## Policy

Photography and filming are a **condition of taking part**, stated on the sign-up form
and repeated in the confirmation email and the guardian email. Registering is agreeing.
There is no tick box, and there is no separate answer for a child.

**This is not "consent" in the UK GDPR sense, and the paperwork must stop calling it
that.** Consent has to be freely given, and something you cannot decline while still
entering is not freely given. What we actually have is:

| | |
|---|---|
| Lawful basis | **Legitimate interests** — promoting a free community event we could not fund or fill without showing what it looks like |
| The individual's right | To **object** (Art. 21), at any time, before or after the day, with no effect on their place |
| For an under-18 | The objection is the parent or guardian's to make, and the guardian email tells them so, by name, before the event |
| What must exist | A legitimate interests assessment, and a route to object that a parent can actually find |

The ICO Children's Code expects a child's data to be used in ways a child and their parent
would reasonably expect. A parent at a free community tournament does expect a camera. What
they do not expect is having no say — so **the objection route is what makes this
defensible, and it is the part that only exists on paper today.** See the day-of section.

`[REVIEWER: if this ever needs to be genuinely lawful consent rather than legitimate
interests — a grant condition, an insurer, a school partnership — the tick box has to come
back. Nothing else does it.]`

## What this covers, and what it does not

Covered: photographs and video taken at the event, used on the SWC website, SWC social
media accounts, and in material promoting future SWC events.

**Not** covered: sale or licensing to third parties, use by sponsors in their own
advertising, press distribution, or anything implying endorsement. If any of those are
wanted, they need their own asking — and because they are further from what anyone expects
at a youth tournament, they need a real tick box, not another stated condition.

An objection can be made at any time via the support form, with no account and no reason
required. We remove the image from anywhere we control within `[14]` days. We cannot
un-publish something already reshared by someone else, and the wording says so.

## Honouring it on the day — the hard part

A policy that only exists in a database is not a policy. On the day, a photographer with a
long lens has no idea who consented.

Round 47 made this harder, not easier. When photography was opt-in, the app produced two
lists and the photographers needed the shorter one. Now every registration records
`photo_consent = true`, so **the only people on the "do not film" list are those who
actively objected — and nothing in the app lets a moderator record an objection.** It
arrives as a support message and has to be carried to the day by a human being.

**Needed:**

- A way to record an objection against a registration, so the "do not film" list comes out
  of the same system as everything else. Currently a support ticket and somebody's memory.
  In the build backlog.
- `[A visible marker for the people who objected — coloured wristbands are the standard
  answer. That group is now expected to be small, which makes marking it the right way
  round. The photographer's rule must be a single simple sentence.]`
- A printed list at the check-in desk, and a briefing for every photographer before they
  start.
- One named person the photographers can ask.
- No photography in `[toilets, changing areas, quiet rooms, prayer spaces]`.
- Group and crowd shots: `[decide — either treat as covered by the same consent, or avoid
  identifiable crowd shots entirely. The second is safer and cheaper to enforce.]`

## Storage

Event photography is currently the largest undocumented store of children's personal data
in the project — it lives entirely outside the app. It needs an owner, a location, an access
list and a retention period (`RETENTION-POLICY.md` proposes `[3]` years).

Photographs must not remain on a photographer's personal device or card after the event.
`[Write down the handover process.]`

## The wording in the form today

A statement in the block above the submit button, not a tick box:

> **Photos and video are taken at the event.** By registering you agree
> `[your child may appear in them | you may appear in them]`, on our website, our social
> media, and in material promoting future events. Not for sale, not for sponsors' own
> advertising. If you'd rather `[they were not filmed | not be filmed]`, tell us before
> the day and our photographers are told.

The guardian email repeats it in full, unprompted, before the day — which matters more
than the form does, because the form was filled in by whoever was at the keyboard and the
email reaches the adult it made claims about.

`[REVIEWER: both still promise that "our photographers are told". That promise now depends
on a process that does not exist — see the day-of section. Build the objection list or
soften both wordings. Do not publish a promise the event day cannot keep.]`

---

*Draft version 0.1 — `[DATE]`.*
