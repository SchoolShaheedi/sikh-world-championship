# Safeguarding policy — DRAFT

> **STATUS: DRAFT FOR REVIEW.** This is the formal document behind the public
> `/safeguarding` page. The public page must never claim more than this policy commits to,
> and this policy must never commit to more than the code and the rota can deliver — that
> mismatch is exactly what round 24 found and round 25 fixed.
>
> Needs review by someone with safeguarding qualifications, not just legal review.

## 1. Statement

Sikh World Championship exists to bring Sikhs together through competition. Most of our
players are children. Their safety comes before the event, the bracket, the sponsors and
the schedule. If safety and the schedule conflict, the schedule loses.

We are committed to protecting every child and adult at risk who takes part, and to
creating an environment where a concern can be raised easily and is acted on quickly.

## 2. Scope

Applies to everyone acting for SWC: organisers, volunteers, moderators, referees,
photographers and any contractor at an event or on the platform. Applies at physical
events and online.

## 3. Named people

| Role | Name | Contact | DBS status |
|---|---|---|---|
| Designated Safeguarding Lead | `[FULL NAME]` | `[EMAIL]` / `[PHONE]` | `[STARTED? DATE?]` |
| Deputy Safeguarding Lead | `[FULL NAME]` | `[EMAIL]` | `[  ]` |
| Moderator 1 | `[FULL NAME]` | | `[  ]` |
| Moderator 2 | `[FULL NAME]` | | `[  ]` |

> **These are currently "TBC" in `src/data/org.ts` and therefore on the live public page.**
> A safeguarding page naming "TBC" as the person to contact is worse than no page. This
> table is the highest-priority blank in the whole project — and DBS checks take weeks, so
> the names must be settled first.

A deputy is not optional: the lead will sometimes be the person a concern is about, or
simply unreachable.

## 4. What we do at events

- Every entrant under 18 has a parent or guardian's recorded permission.
- Supervision is tiered by age, recorded at sign-up and checked at the desk:
  - **8–11** — a parent or guardian remains at the venue throughout.
  - **12–15** — dropped off and collected; may not leave unaccompanied; guardian
    contactable and within a recorded travel time.
  - **16–17** — may attend and leave independently where the guardian has permitted it.
- Every entrant has an emergency contact on record.
- A qualified first aider is present. Medical, allergy and dietary details are collected
  in advance and available to them. `[Decide: printed copy at the first aid point — venue
  signal cannot be assumed.]`
- Safeguarding leads are identifiable on sight `[lanyards / hi-vis]` and any player or
  parent may approach them.
- Photography is opt-in. Non-consenting players must be identifiable to photographers
  `[wristbands are the usual method — decide and write it down]`.
- No adult is alone and unobserved with a child. Toilets, quiet rooms and corridors are
  `[state the arrangement]`.
- Sign-out at the end of the day matches the permission recorded at sign-up.
  `[NEEDS BUILDING — the app records who may leave alone; nothing yet enforces it at the door.]`

## 5. What we do on the platform

Stated to match the code exactly, as of round 25:

- **There is no chat, for anyone, at any age.** No private messaging exists. Finding a
  practice partner works from fixed menus only — there is no free-text field a player can
  type into and send to another player.
- Under-16s and 16-plus are strictly separated. An adult cannot see, contact or be
  contacted by an under-16. Enforced in the data layer and re-checked at the moment two
  players connect.
- An under-16 needs a guardian's permission to use the board at all. The guardian can
  withdraw it at any time and it takes effect immediately.
- When an under-16 exchanges PlayStation IDs with another player, **both children's
  guardians are emailed** with who, which region, and what game.
- PlayStation IDs are never public. They are released only to two players who have both
  agreed.
- Public profiles show a first name or display name, avatar, region and age band. Never a
  surname, school, address or exact age.
- Report and block are available on every post and profile. Blocks are silent to the
  blocked person, to avoid retaliation.
- Reports are visible only to named moderators, never to the person reported.

**Not yet true, and therefore not to be claimed publicly:** guardian notification emails
do not send (`src/lib/notify.ts` only logs). **Under-16 board access must remain switched
off until they do.**

## 6. Recognising and responding to a concern

Everyone acting for SWC must be able to recognise the categories of abuse — physical,
emotional, sexual, neglect, and online harms including grooming and bullying — and know
that recognising it is not their job to investigate.

**If you have a concern:**

1. If a child is in immediate danger, call 999. Do not wait for a manager.
2. Listen. Do not question or investigate. Do not promise confidentiality you cannot keep.
3. Write down what you saw or were told, in the person's own words, as soon as possible,
   with the date and time.
4. Tell the Designated Safeguarding Lead the same day — `[EMAIL]` / `[PHONE]`.
5. Do not discuss it with anyone else, including other volunteers.

**The lead then:** records it, decides within `[24 hours]` whether to refer, and refers to
`[LOCAL AUTHORITY CHILDREN'S SERVICES — NAME AND NUMBER]` or the police as appropriate.
Referral does not require the parent's consent, and does not require certainty.

`[Add: the local authority's designated officer (LADO) contact for allegations against a
volunteer, and the NSPCC helpline 0808 800 5000 as a fallback route.]`

## 7. Allegations against someone acting for SWC

Handled by the lead, or by the deputy if the allegation concerns the lead. The person is
stood down from any contact with children pending the outcome — this is neutral, not a
finding of guilt. Referred to the LADO and, where relevant, the police and the DBS.

## 8. Online reports

Every report goes into a queue with named assignment and an audit trail. We publicly
commit to responding within **24 hours**, and the tool raises an alert on anything older.
Safety and player-report categories jump the queue. Reports can be made anonymously and
without an account, because the most important report we will ever receive is from a
worried parent who has never logged in.

## 9. Recruitment and training

- DBS checks for the leads and for any volunteer with unsupervised access to children.
- `[Two references for anyone in a supervisory role?]`
- Every volunteer reads this policy and signs to say so, before the event.
- `[Decide the training standard — e.g. a recognised online safeguarding course for the
  leads at minimum.]`

## 10. Review

Owner: `[NAME]`. Reviewed `[annually]` and after every event or incident.

Records kept per `RETENTION-POLICY.md` — safeguarding records for `[6]` years, deliberately
longer than everything else.

---

*Draft version 0.1 — `[DATE]`.*
