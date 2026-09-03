# Testing the whole thing locally

Every feature, in the order it happens on the day, with the data to try it on. Nothing here
touches production and nothing here needs an email to arrive.

`TESTING-REGISTRATION.md` is the other half of this: it covers rehearsing a **real**
submission on the deployed site, which is the one thing a local database cannot test.

## Setup, once

```bash
cd 03_App/web
npx wrangler d1 migrations apply swc-production --local
node scripts/grant-moderator.mjs you@example.com "Your Name"
node scripts/seed-local.mjs                 # 75 invented people, everything switched on
npm run dev                                 # http://localhost:3000
```

Sign in at `/signin`. **No email is sent locally** — there is no `RESEND_API_KEY` — so the
magic link is printed in the terminal running `npm run dev`, along with the full text of
every email that would have gone out. That terminal is the only place the wording of an
offer or a guardian notice can be read without sending one to somebody.

To rewind to an earlier point in the timeline, or start over:

```bash
node scripts/seed-local.mjs entries    # entries open, nothing decided
node scripts/seed-local.mjs places     # ... a draw has filled 48 of 64
node scripts/seed-local.mjs gameday    # ... 31 have arrived at the desk
node scripts/seed-local.mjs --clear
```

The seeded rows are `local-*` ids, `local-*@example.com` addresses and `LOCAL-*`
references, so `--clear` finds all of them and nothing else. `example.com` can never
receive mail (RFC 2606), so a stray send cannot reach a real person. The script refuses
`--remote`.

## What a member of the public sees

| Where | What to check |
|---|---|
| `/` | The hero, the countdown, the featured event. Resize to a phone. |
| `/events` and `/events/sikh-fc-27` | Date, venue, rules, prizes, the proof-of-age rule. |
| `/events/sikh-fc-27/register-interest` | Submit as a **13-year-old** — the longest path: guardian block, on-site supervision, guardian email. Then as a 25-year-old and check the guardian block disappears. Try a surname in the name field, an under-12 date of birth, a missing consent. |
| `/events/sikh-fc-27/bracket` | Public bracket. Empty until one is built. |
| `/join`, `/support`, `/volunteer`, `/sponsors`, `/players` | Every public page renders with real rows behind it. |
| `/signin` | A magic link for a seeded entrant, e.g. `local-9@example.com`. |
| `/profile` | Signed in as that entrant: their own record, and nobody else's. |

## The interested list, and getting rid of what should not be in it

`/admin` → **Entries** → *Show all*.

Three seeded rows exist to be deleted, because a control nobody has pressed is a control
nobody knows the shape of:

| Reference | What it is |
|---|---|
| `LOCAL-B0` | An obvious rehearsal row — "Test Test". |
| `LOCAL-B1` | Keyboard mash. |
| `LOCAL-B2` | The same child as `LOCAL-005`, entered again from a second address. The one that actually turns up, and the hard one to spot. |

Deleting asks you to **type the reference**, not click OK. It removes the profile, the
entry and everything attached to both, and records it under **Retention** at the foot of
`/admin`.

**Delete before you lock the draw list.** Deleting afterwards is allowed — an erasure
request cannot be made to wait for a draw — but the numbering deliberately does not close
up, so the list keeps a hole in it: everybody else still holds the number they were given,
the range stays 1 to *n*, and that number simply cannot win. The panel says so and tells
you to lock a new list. To see it: lock a list, delete an entry from it, and look at the
draw panel.

## The draw, both ways

`/admin` → **Draw with an outside service**.

1. **Lock the list.** Nothing else is possible first — a number means something only
   because the mapping from number to person was recorded *before* the draw.
2. It prints the whole instruction: *"Ask for 28 numbers between 1 and 39, with no
   repeats."* That is random.org's form, word for word. There is a copy button for
   wheel-style pickers. (Those two figures move as you delete entries — 36 of the 75 seeded
   people are referred and take a place with no draw at all, leaving 28 places among the 39
   who are not.)
3. Paste whatever comes back, in any format. Read the preview. Commit.

Things worth trying, each of which is a trap that has already been closed:

- Paste a **numbered** list — `1. 5` / `2. 8` / `3. 12`. Refused, and it explains that the
  list positions have been read as winners too.
- Paste a number outside the range, or the same number twice. Both refused by name.
- Paste **fewer** numbers than there are places. Allowed with a warning — drawing in stages
  is legitimate.
- Withdraw somebody after locking
  (`UPDATE registrations SET status='withdrawn' WHERE reference='LOCAL-012'`) and then draw
  their number. Skipped, named, and the place stays open.

**Both branches of the pool split are reachable, deliberately.** Referred applicants take
priority for every place, so normally they all fit and the general pool is the one drawn —
that is the `entries` stage. After the `places` stage there are 16 places left and 22
referred applicants waiting for them, so locking a list there shows the *referred* pool
being the contested one and the general pool not drawn at all. `splitPools()` has unit tests
on that boundary, but a branch that can never be reached through the UI is a branch nobody
has looked at.

`/admin` → **The draw** is the other method: seeded, instant, recomputable from its stored
seed. It is for backfilling three drop-outs on a Tuesday, not for the draw people watch.
The panel says which is which.

Committing either one **creates accounts and emails everybody**. Locally the emails fail
(no key) and their full text appears in the dev-server terminal — read the offer email and
the guardian notice there.

## The arrival desk

`/admin/checkin/slips` → one slip per player with a place, 18 to an A4 sheet. Print them,
or just hold the **screen** up to the laptop's own camera.

`/admin/checkin`:

| Try this | Expect |
|---|---|
| Start the camera, scan a slip | Big green result, a beep, the counter goes up |
| Scan the **same** slip again | "Already checked in" **with the time of the first scan** — a double scan a second later and a slip somebody else used half an hour ago are indistinguishable without that clock |
| Scan any other QR code you own | "That is not one of our passes" — different from "not on today's list", because the two need different actions |
| Type a reference into the manual box | Same result, same audit row. It is not a lesser path. |
| Check somebody in by name from the list | Same again |
| **Undo** a check-in | Clears the four columns. Does not clear their profile's attendance badge. |
| Record a date of birth | A separate one-tap step. **Never a gate** — check somebody in with nothing verified and it works, because who is in the building must be right even while the ID question is not. |
| The **No date of birth** filter | Four seeded people arrived without one. The safeguarding lead decides about them, not the door. |
| Open the desk in two tabs | Every action returns the whole roster, so the counter is a fact rather than one tab's opinion |
| The end-of-day list | U18 badges and the leaving permission against every name. No contact details anywhere — deliberately. |

The camera needs HTTPS or localhost. `http://<your-ip>:3000` from a phone will not get one;
use the laptop's own camera, or `npm run cf:preview` on localhost.

## Starting the tournament without 64 players

Yes. `/admin` → **The bracket** → *Build the bracket*.

It is built from everyone with a **place** — not from everyone who has arrived — and it
needs only two of them. The field is rounded up to the next power of two and the gap is
filled with byes, resolved before anything is stored, so the first round on the screen is
already correct. The seeded 48 gives a 64-slot bracket with 16 byes.

| Where | What to check |
|---|---|
| `/events/sikh-fc-27/bracket` | The public board, polling every four seconds |
| `/events/sikh-fc-27/tv` | The big screen. No chrome. Polls every six seconds. |
| `/admin` → enter a score | The TV moves within six seconds without a refresh |
| Enter a **wrong** score, then correct it | The whole board is recomputed, so the right player ends up in the next round — not the one you first typed |
| Kill the dev server with the TV open | It keeps the last good bracket on screen and says it is reconnecting. A hall staring at a spinner is worse than a hall staring at a bracket thirty seconds old. |
| `/admin` → **Names on the screen** | The 48 people with places. First name plus last initial, built from the registration rather than typed by anybody. Correct one and watch it reach the TV and the slips. |
| Wipe the bracket and rebuild it | Refuses to overwrite a bracket that already has a score in it |

## Two roles, and who can see what

`/admin/people`. Three staff accounts are seeded:

| Address | Role |
|---|---|
| `local-moderator@example.com` | A second moderator — so you can try revoking one without the app stopping you for being the last |
| `local-desk@example.com` | Desk only |
| `local-newdesk@example.com` | Desk only, **never signed in** — flagged amber, because an invitation goes to an address somebody typed |

Sign in as `local-desk@example.com` and confirm the separation for yourself: `/admin`,
`/admin/people` and `/moderation` all refuse; `/admin/checkin` and the slips do not.

Guardrails to try: revoking your own moderator role (refused), revoking the last moderator
(refused), granting "desk" to a moderator (refused as a downgrade in disguise), deleting an
account that still holds a grant (refused until it is revoked). Every grant and revocation
appears in the history at the bottom of the page with the actor's email.

## Moderation

`/moderation`. Five tickets and two reports are seeded.

- Two tickets are **safeguarding** and sort to the top.
- One is an **erasure request** — follow it through to deleting the account.
- One is a **photography objection**. It has no field of its own: it arrives as a message,
  and the list of who objected has to be carried to the photographers by hand. That is the
  gap, and seeing it here is the point.
- Assign one to yourself, resolve one, write a resolution.

`/guardian/local-guardian-token` is a guardian's approval page waiting to be decided.
Approve it, then revoke it — a guardian keeps a permanent way back in, which is what makes
the consent more than theatre.

## The Looking For Game board

`/play`. Off in production (`SWC_BOARD_OPEN`), on locally. Four posts are seeded across
both age bands and one request is pending.

The segregation is the feature: sign in as an under-16 (`local-0@example.com`) and as an
adult (`local-40@example.com`) in turn, and neither sees the other's posts. It is enforced
in `boardFor()` **and** again in `createRequest()`, so try sending a request to a post from
the wrong pool.

## Retention and deletion

`/admin`, at the foot.

| Try this | Expect |
|---|---|
| The **dormant profile** sweep | One seeded profile is due — two years old, no entry, no activity. Moderators, attendees and anyone named on a report are exempt. |
| Delete an entrant with a report against them | Refused, and it says why. A safeguarding record about a deleted person cannot be acted on. |
| Every deletion | A row under **Retention**, naming who did it |

The nightly job itself (medical fields at 30 days, tokens the day after the event, the row
at 12 months) is a separate Worker on a cron trigger and is covered by
`src/lib/retention.test.ts` rather than by clicking.

## What local testing cannot cover

- **A real email arriving.** Deliverability, rendering in Gmail and Outlook, and the
  guardian link working from a phone. That needs the deployed site — see
  `TESTING-REGISTRATION.md`.
- **The public state of the form.** Whether the door is open to everybody is a decision,
  not a test.
- **workerd.** `next dev` has a filesystem and Workers does not. Anything touching
  `node:fs` works locally and fails in production, which cost us the site logo once. Run
  `npm run cf:preview` before believing a page works.
- **Load.** One browser, one laptop, sixty-four people arriving in forty minutes.
