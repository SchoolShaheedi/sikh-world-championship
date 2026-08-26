# Chat & Player Connection — Design + Safety
Date: 2026-08-21

## The honest framing
"Sikh kids find other Sikh players online and chat with them" is the best idea in this
project — it's the thing that makes the platform matter after the trophy is handed out.
It is also the single highest-risk thing to build, because it is a **messaging service used
by children**. Grooming risk is real and platforms that ship open DMs for minors without
controls get shut down, sued, or rejected from app stores.

This is not a reason to drop it. It's a reason to build it in the right shape. The right
shape costs almost nothing extra if decided now, and is very expensive to retrofit later.

## Recommended design: three tiers, unlocking by age

### Tier 1 — LFG board ("Looking For Game")  [everyone, including U16]
Not chat. A public board of posts:
  "Rajveer, 14, PS5, FIFA 26, free weekday evenings, casual — [Request to play]"
Another player taps **Request to play**. That sends a *structured request*, not free text.
If accepted, both get each other's gamertag and can play. The actual conversation happens
inside PlayStation, which already has parental controls the parents have already set.

This delivers 90% of the value — "find Sikh players to play with" — with almost none of the
risk. **It is the feature. Chat is the accessory.**

### Tier 2 — Quick messages  [everyone]
Fixed preset messages only, no free typing:
  "gg" / "rematch?" / "good game, add me" / "can't play tonight" / "what time?" /
  "I'm online now" / "Waheguru ji ka Khalsa"
Impossible to groom someone with a fixed menu. Warm and social, zero moderation burden.

### Tier 3 — Free-text chat  [16+ only in v1, or U16 with verified guardian opt-in]
Real messaging, but with:
  - Adults (18+) cannot initiate contact with under-18 accounts. Ever. Hard rule.
  - U16 accounts can only message players in their own age band.
  - Automatic filtering of phone numbers, addresses, external links, and other
    contact-detail patterns.
  - Report + block on every single profile and every conversation, one tap, always visible.
  - Messages retained so reports can actually be investigated.
  - Guardian email gets a notification when their under-16 enables chat.

### Group chat — event chat rooms  [moderated, time-limited]
A chat room per event ("Sikh FIFA 26 Championship"), open from a week before to a week after.
Great for hype, lift-sharing, meeting people before the day. Volunteers moderate it.
It closes automatically. Bounded risk, high value.

## Ship order
Phase 2a: LFG board + quick messages + profiles.   <- do this first, it's the real feature
Phase 2b: event chat rooms, moderated.
Phase 2c: free-text DMs for 16+.
Phase 2d: U16 DMs with guardian opt-in — only once moderation is genuinely staffed.

## Non-negotiables regardless of tier
- Report and block on every profile and conversation.
- No real-world identifiers on public profiles: no full surname, no school, no home
  address, no exact age — display "14" as "U16" and area as region ("West Midlands"),
  never a postcode.
- Named moderators. At least two. Real people who check reports within 24h.
- A written, published moderation and safeguarding policy. Needed for app stores, and it's
  the thing that reassures parents enough to let their kids sign up at all.
- Account deletion that actually deletes.

## The parent question
Parents are the real gatekeepers here — not the kids. A visible, plain-English
"How we keep your child safe" page will drive more sign-ups than any marketing.
Sikh parents handing their 13-year-old a social app want to see that someone thought
about this. Make it a selling point, not fine print.
