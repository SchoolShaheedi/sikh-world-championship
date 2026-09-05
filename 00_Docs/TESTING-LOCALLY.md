# Testing the whole thing locally

Every feature, in the order it happens on the day, with the data to try it on. Nothing here
touches production and nothing here needs an email to arrive.

`TESTING-REGISTRATION.md` is the other half of this: it covers rehearsing a **real**
submission on the deployed site, which is the one thing a local database cannot test.

## Setup, once

```bash
cd 03_App/web
npx wrangler d1 migrations apply swc-production --local
node scripts/grant-moderator.mjs you@example.com "Your Name"   # DO THIS ONE FIRST
node scripts/seed-local.mjs                 # 75 invented people, everything switched on
npm run dev                                 # http://localhost:3000
```

**The `grant-moderator` line is not optional and its absence is silent.** `/signin` says
the same thing whether or not an address is known — deliberately, so the form cannot be
used to find out which children have accounts here — so typing an address with no account
gives you a cheerful "check your inbox", no email, and no error. On a laptop that is
indistinguishable from a broken mailer. The seed script now checks and says so, and the
dev-server terminal prints `no account for you@example.com`, but the cheapest fix is to run
it first.

Then sign in at `/signin`. **Nothing is emailed under `npm run dev`** — and not because
the key is missing. `.envrc` loads it from the Keychain, so a laptop *can* reach the live
Resend account, which is worse than useless: a seeded `@example.com` address gets a 422 and
a real one gets a real email sent to a real person from our verified domain, about a child
who does not exist.

So `next dev` prints instead of sending. The magic link and the full text of every email
appear in the terminal running the dev server — which is also the only place the wording of
an offer or a guardian notice can be read without sending one to somebody. Each one is
still recorded as a **failed** send, because it was not delivered; only a 200 from Resend
records `sent`.

`SWC_EMAIL_DEV_SEND=true npm run dev` sends for real, for anyone who means it. Any address
works for `grant-moderator` — it never has to receive anything.

The link points at `http://localhost:3000`, because the base URL is taken from the request
rather than from a constant. Nothing needs setting for that: there is no `.env.local` to
create.

**Sign in under `npm run dev`, not `npm run cf:preview`.** A Worker cannot read the `Host`
header — it is a forbidden header name in the fetch spec — so under `cf:preview` a sign-in
link falls back to the live domain and will not work on your laptop. That fallback is the
correct answer in production; it just makes `cf:preview` the wrong place to test signing in.
Use it for what it is for: catching things `next dev` cannot, like anything touching
`node:fs`.

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

## Reading the four numbers on `/admin`

They have to add up, and for a while they did not — the tile said "Selected" and counted
`status = 'selected'` alone, so everybody who had already checked in dropped out of it while
"places left" underneath counted them. 17 selected, 64 places, 16 left is not arithmetic
anybody can follow (invariant 19).

| Tile | Counts |
|---|---|
| **Awaiting the draw** | Applied, no decision yet. These are who the next draw works from. |
| **— of those, referred** | The subset drawn first, ahead of everyone else. |
| **Have a place** | Selected **plus** already arrived. The sub-line splits it. |
| **Not selected** | Drawn against **and told so** — it stays at 0 until you press *Tell the rest they were not selected*, so 0 does not mean nobody missed out. |

The line underneath states the total, the capacity and how many places are still to fill, so
the arithmetic is on the page rather than in your head. With the seed at the `gameday` stage:
48 have a place (some to arrive, some arrived), 27 are waiting, 75 in total, 16 places left.
Those move as soon as you check people in or add entries of your own through the form.

**"Selected" and "not selected" are draw outcomes, not attendance.** A person who has
arrived is still selected; a person who was never drawn is neither.

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

## Who applied, and one person's record

`/admin` → **Who applied**, or `/admin/entries`.

| Where | What to check |
|---|---|
| The four charts | Referring organisation, city, self-rating, age group. Counts only — nothing here identifies anybody, which is what makes it safe to leave on a screen. |
| The table | Click any name. Email is shown partly, so a row is recognisable without a screen full of children's addresses. |
| A person's page | Referral, city, self-rating, favourite team, age **on the day of the event**, and the supervision line for an under-18. |
| **Show contact details** | Email, mobile, date of birth, guardian and emergency contact, and the medical notes. Press it again to put them away. |
| View source before pressing it | The real values are **not there**. The masking is done on the server, so a masked field is genuinely absent rather than hidden with CSS — which is the difference between a screen that is tidy and one that is safe to project. |
| `LOCAL-000` vs `LOCAL-040` | One is 12 with a medical note and a guardian who stays; the other is an adult. Both render their own supervision line. |
| Sign in as `local-desk@example.com` | Refused. This is moderator-only; desk staff get the door and nothing else. |

## Two people with the same name

`LOCAL-012` and `LOCAL-034` are both **Aman S.** — the same first name and the same last
initial, which is the normal case rather than an edge one when the surnames are Singh and
Kaur.

They show as **Aman S. (1)** and **Aman S. (2)** in three places that must agree: the
printed slip, the desk list and the bracket. Check all three. Then withdraw somebody else
(`UPDATE registrations SET status='withdrawn' WHERE reference='LOCAL-020'`) and confirm the
numbers have **not** moved — they are keyed on the reference, because a printed slip that
stops matching the projector is worse than an ambiguous one.

## The arrival desk

`/admin/checkin/slips` → one slip per player with a place, 18 to an A4 sheet. Print them,
or just hold the **screen** up to the laptop's own camera.

This is **not a page** — it is a route handler returning a complete HTML document built by
`src/lib/slips-document.ts`, with no site header, no theme, no Tailwind and no JavaScript in
it (invariant 18). It got that way because it printed as three blank sheets on a real laptop
while printing perfectly in headless Chrome, twice, after being hardened twice: the page was
right, and what was wrong was everything a page inherits.

**Print it to a PDF and look at the PDF**, rather than trusting the screen. Expect three
sheets for 48 slips, black codes on white, names breaking at the space and never mid-word.

*If your preview is blank*, open the same URL in a **private/incognito window** and print
from there. The document carries its own stylesheet and nothing else, so blank sheets now
mean a browser extension — a dark-mode or reader extension — is rewriting the colours with
`!important`, and extensions are off in a private window. The page says this on itself, for
whoever hits it on the day. Safari and Firefox print it correctly too.

`/admin/checkin`:

| Try this | Expect |
|---|---|
| Start the camera, scan a slip | Big green result, a beep, the counter goes up |
| Scan the **same** slip again | "Already checked in" **with the time of the first scan** — a double scan a second later and a slip somebody else used half an hour ago are indistinguishable without that clock |
| Scan any other QR code you own | "That is not one of our passes" — different from "not on today's list", because the two need different actions |
| Type a reference into the manual box | Same result, same audit row. It is not a lesser path. |
| Check somebody in by name from the list | Same again |
| **Undo** a check-in | Clears the four columns. Does not clear their profile's attendance badge. |
| Record a date of birth | **Confirm date of birth** (amber, an action) becomes **✓ Date of birth confirmed** (green, a state). A separate one-tap step and **never a gate** — check somebody in with nothing verified and it works, because who is in the building must be right even while the ID question is not. |
| Read the born line on any row | `Born March 2009 · 17 on the day`. The month and year we hold plus the age **on the day of the event**, so the volunteer compares two things instead of doing arithmetic in a queue. The **day** of the month is never shown, in the data or on the screen — see DPIA 25. |
| **`LOCAL-005`** — the age boundary | Born 8 October 2008, five days after the event. Reads `Born October 2008 · 17 on the day` and keeps the U18 badge, because the age that counts is the age on 3 October and not the age today. This is the row that proves it in a browser rather than only in a test. |
| The **Date of birth not confirmed** filter | Four seeded people arrived without one. The safeguarding lead decides about them, not the door. |
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

## Calling matches to stations

`/admin` → **The bracket** → set **Working stations** and press *Call the next matches*.

Rule 9 forfeits a player who does not reach their station within five minutes of being
called, and until 2026-09-05 nothing in the app could say which station that was. The
`station` column had existed since migration 0009 with nothing writing to it.

| Do this | What should happen |
|---|---|
| Set stations to **4** and press it | The first four playable matches go live on 1, 2, 3 and 4, and the message says how many are still waiting |
| Press it again straight away | Nothing is assigned — every console is busy. It never hands out a station twice |
| Look at `/events/sikh-fc-27/tv` | The four live matches carry **Station 1**–**4** on the orange bar, at the right-hand end where somebody scanning the screen for their own name will find it |
| Enter a score on one of them | Its station clears. Press *Call the next matches* again and the next match gets exactly that console back |
| Change one row's dropdown to a different number | It moves. This is the answer to a console breaking, and it deliberately does **not** refuse a station already in use — the person pressing it can see the room |
| Set a row's dropdown back to **—** | The match goes back to pending and rejoins the queue |
| Try to move a finished match | Refused: clear the score first |

The number of working stations is typed in each time and stored nowhere. Eight were
promised, one has a dead HDMI port, so it is seven — and that is found out at 09:15, not
at deploy time.

**Stations are not on the printed slips, on purpose.** The slips are printed the night
before; a station is decided on the day. A printed number that has since moved would send
a player to a console somebody else is sitting at, which is worse than no number at all.

## The reminder email

`/admin` → **The reminder email**. This is the email every offer has promised since the
offers were written — "we will email again with the venue address and what to bring" — and
until 2026-09-05 nothing sent it.

**Nothing leaves your laptop.** Under `npm run dev` every email is printed in full in the
terminal running the dev server instead of being sent, which is the only way to read the
wording without emailing a real child.

| Do this | What should happen |
|---|---|
| Read the panel before pressing anything | "48 people have a place · 0 already had it" |
| Press *Send the reminder*, then confirm | The terminal fills with the emails. The message says how many went, how many went to guardians, and how many already had it |
| Read one in the terminal | The street address and the postcode — the only email that carries them — the times, what to bring (read from `src/data/id-check.ts`, so it cannot drift from the desk's list), the reference, and the photography line with the way out |
| Find one addressed to a guardian | A **separate** email, not a copy. It names the child and states the collection rule: an under-16's guardian is told to stay at the venue; a 16–17-year-old's is told which way the leaving permission went |
| Press it a second time | "0 sent · 48 already had it". Nobody is emailed twice |
| Check somebody in, then press it again | Still nobody: arriving does not make a new person |

## Volunteers

`/volunteer` is public and needs no account. `/admin/volunteers` is the queue, and the
`extras` seed stage puts five people in it.

| Do this | What should happen |
|---|---|
| Submit the form without ticking **I am 18 or over** | Refused — and the refusal points at `/support` rather than just saying no, because a willing seventeen-year-old should be answered by a person |
| Submit with no job ticked, or no mobile | Refused. The mobile is the number somebody rings at 08:40 when a desk is unstaffed |
| Submit properly | A `VOL-` reference on screen, an acknowledgement printed in the terminal, and a new row at the top of `/admin/volunteers` |
| Read `/admin/volunteers` | Five seeded people: one accepted, one declined, three unanswered. It says **Nobody confirmed for: Referees, Score entry, …** — which is the actual gap in a rota of fifteen |
| Accept somebody, then look again | The list re-sorts: unanswered first, because it is a queue of work |
| Press **Delete** | It asks for the reference to be typed. This removes the volunteer's details *and* the details of the person they named |

The referee is the part of this form worth looking at closely: a name, how they know the
volunteer, and one contact route for **somebody who has never visited the site**. The form
says to tell them first and the acknowledgement email repeats that we will contact them.
If nobody is actually going to make that call, the question should come off the form.

**Nothing deletes a volunteer record automatically**, and the page says so. No retention
period has been decided, and this app does not invent one (invariant 21).

## Do not photograph

Photography is a condition of entering, so consent is true on every row and useless to a
photographer. The only list that means anything is the opposite one.

| Do this | What should happen |
|---|---|
| `/admin` → scroll to **Do not photograph** | One name: the seeded objector who has a place. It is not shown at all when nobody has objected |
| `/admin/entries` | Two rows carry a **no photos** marker — the one above and `LOCAL-060`, who is still waiting for a place. That difference is deliberate: the photographers' list is narrowed to people who will be in the hall |
| Open `/admin/entries/LOCAL-000` → **Photography** | "They asked not to be photographed". Press it and the name appears on `/admin` |
| Press *Recorded by mistake — clear it* | Gone completely, with no marker left behind. The likely reason to clear one is that it went against the wrong person |

There is deliberately no box for the reason or the scope. A note about a child, written by
a volunteer and read by whoever is holding a camera, would have no retention rule of its
own — and "not on Instagram but the website is fine" is not something a photographer can
apply at twenty metres. Anything narrower than "do not photograph this person" stays in
the support ticket it arrived in.

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
