# Next steps

## Blocked on you (information needed)
- [ ] Event date, start/end times
- [ ] Venue name, full address, postcode
- [ ] Contact email + social handles  -> `src/data/org.ts`
- [ ] Safeguarding lead name + email, and two named moderators -> `src/data/org.ts`
- [ ] Confirm physical trophy order (2 champion cups, 2 runner-up, 4 semi-finalist,
      ~64 medals) — engraving takes weeks, order early
- [ ] Your own words for the "Why we're doing this" section -> `src/app/about/page.tsx`
- [ ] Logo — placeholder shield/globe mark is in `src/components/Logo.tsx`

## Do this week, regardless of the build
- [ ] Register `sikhworldchampionship.com`
- [ ] Claim @sikhworldchampionship on Instagram, TikTok, YouTube
- [ ] Line up the safeguarding leads and start their DBS checks (these take time)

## Build — next up
- [ ] Replace the JSON store with Supabase (see DATA-LAYER.md)
- [ ] Confirmation emails + QR check-in code
- [ ] Guardian notification email when an under-18 registers
- [ ] Admin area: registration list, check-in scanner, score entry
- [ ] Wire the bracket to real registrations (currently demo data)
- [ ] Server-side validation with zod on the register endpoint
- [ ] Player card as a downloadable/shareable PNG (og:image)
- [ ] Volunteer sign-up form (reuses the same form engine)

## Build — after FIFA 26
- [ ] Player accounts and public profiles
- [ ] Trophy cabinet populated from real results
- [ ] Looking For Game board + preset quick messages (all ages)
- [ ] Free-text chat for 16+, with report/block and moderation tooling
- [ ] Capacitor wrap for iOS/Android

## Adding a second event
1. Create `src/data/events/your-event.ts` exporting a `ChampionshipEvent`
2. Add it to the array in `src/data/events/index.ts`
That's it — homepage, events list, event page, sign-up form and bracket all pick it up.
Sport-specific sign-up questions go in that event's `formFields`.

## Online play — built (LFG board v1)
- [x] LFG board, 16+ only, gated server-side in every page and action
- [x] Structured posts (game / platform / availability windows / intensity / preset note)
- [x] Structured requests — no free typing at strangers anywhere
- [x] Gamertags released only on an accepted request, to those two players only
- [x] Report + block on every post; blocks hide posts in both directions
- [x] Moderation queue with claim, status, resolution note and audit trail
- [x] Overdue alert when a report has waited over 24h

### Before it goes live
- [ ] Replace `src/lib/session.ts` — it's a stub returning a fixed demo player
- [ ] Replace `src/lib/play-store.ts` JSON files with Supabase (same caveats as
      registrations — see DATA-LAYER.md)
- [ ] Delete `src/lib/play-seed.ts` once real players exist
- [ ] Email or push when a request arrives or is accepted — without this the board only
      works for people who happen to open the site
- [ ] Expire pending requests after ~7 days
- [ ] Restrict `/moderation` properly (currently gated on a stub flag)
- [ ] Name the moderators publicly on /safeguarding before the board opens

### Deferred, deliberately
- Free-text chat (needs the moderation rota staffed and proven first)
- Under-16 access, via event-verified connections
- Match result logging, ladder and seasons

## Under-16 board access + Support — built
- [x] Age-band segregation, enforced at the board query AND at request creation
- [x] Guardian consent gate for under-16s, with an explanation rather than a locked door
- [x] Guardian notified on every connection (who, region, game, window)
- [x] "Met at an event" verified badge
- [x] /support — six categories, works with no account and no name
- [x] Emergency contacts above the form
- [x] Urgent tickets surfaced at the top of /moderation, guardian-flagged

### Before under-16 access goes live — BLOCKING
- [ ] `src/lib/notify.ts` currently only logs. The guardian notification is a
      safeguarding promise made publicly on /safeguarding, so it MUST actually send
      before under-16 access is switched on for real players.
- [ ] Build the guardian approval flow itself (email with a one-click approve/revoke link)
- [ ] Confirm the safeguarding page wording matches what the code actually does

## Guardian approval + tests — built
- [x] Token-based approval page, no account needed for the guardian
- [x] Approve / decline / revoke / reinstate, with full history shown
- [x] Pending requests expire (30 days); settled records stay reachable for revocation
- [x] Re-asking replaces a pending request instead of stacking links
- [x] Guardian email taken from the account, never from a child-filled form
- [x] Board access reads live approval state — revoking cuts access immediately
- [x] 72 tests (`npm test`) over the safety-critical logic
- [x] FIXED: registration reference collisions (see DECISIONS.md round 10)

### Still blocking a real launch
- [ ] `src/lib/notify.ts` still only logs — all four guardian emails must actually send
- [ ] `src/lib/session.ts` is still a stub returning a fixed demo player
- [ ] Stores are still JSON files (docs/DATA-LAYER.md)
- [ ] Rate-limit the approval-request action (currently a child could trigger repeated
      emails to a guardian by clicking repeatedly)
- [ ] Log IP + timestamp on guardian decisions, for disputes
