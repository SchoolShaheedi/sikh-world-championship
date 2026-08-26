# Online Play & Chat — Design Thinking
Date: 2026-08-21

## The one thing to be clear about first
**SWC does not host the gameplay.** The match happens on PlayStation. Our job is
matchmaking and coordination — getting two Sikh players who don't know each other to
actually end up in a lobby together on a Tuesday night.

That reframes the whole thing. We are not building Discord. We are building the *thirty
seconds before* Discord: find someone, agree a time, swap PSN IDs, go. The less we try to
own the conversation, the smaller, safer and more likely to succeed this is.

## The core loop
    Browse or post on the LFG board
      -> Send a request ("want a game Thursday 7pm?")
      -> Other player accepts
      -> PSN IDs revealed to each other (only now — never before)
      -> They play on PlayStation
      -> Come back, log the result
      -> Result feeds the ladder and the trophy cabinet
      -> Reason to come back next week

The last three steps are what stop this being a dead noticeboard. **Logging the result is
the retention mechanic**, because it feeds a running ladder. Without it, players connect
once and never open the app again.

## RECOMMENDATION 1 — Build the LFG board first, with NO chat at all
The board delivers "find Sikh players to play with" almost completely. Chat is the
accessory, and it carries essentially all of the risk and all of the ongoing cost.

A post is structured, not free text:
    Rajveer · U16 · PS5 · EA FC 26 · weekday evenings · casual
    [ Request a game ]

Requests are structured too — pick a time window from their stated availability, attach
one of a set of preset notes. No typing at strangers. You cannot groom someone through a
dropdown, and it needs no moderation staff to be safe on day one.

Ship this, see if people use it, then decide what chat is actually needed. My honest
expectation is that 80% of the value lands here and the chat requirement shrinks.

## RECOMMENDATION 2 — Scheduled availability, not "who's online now"
Green dots create pressure to be online, reward the kids with the least supervision, and
make the board look dead at 3pm on a schoolday. Almost nobody can drop everything and
play the moment they get a ping.

Availability windows ("weekday evenings", "Sunday afternoons") make the board useful at
every hour, work across timezones when this goes international, and are far healthier for
a 13-year-old than a status light that rewards being permanently available.

## RECOMMENDATION 3 — Make event attendance the trust backbone
Give every player who attends an SWC event a **verified** badge. Then:
- Verified players can connect freely with other verified players.
- A player who has never been to an event has a plainer profile and tighter limits.

This is quietly the strongest idea in the document, because it does three jobs at once:
it is real-world identity verification that costs nothing extra, it makes online abuse
much harder (you were in a room with a volunteer who checked you in), and it gives people
a concrete reason to come to events. Online growth then feeds event attendance rather
than replacing it.

## RECOMMENDATION 4 — An online ladder / season
Logged results feed a rolling ladder per game and age band. Seasons run 8–10 weeks, and
the top players earn a place at the next in-person final.

This is how "World Sikh Championship" becomes literally true without you flying anyone
anywhere: online qualifiers all year, one live final. It also gives the app a reason to
exist between events, which is currently its weakest point.

## RECOMMENDATION 5 — Do not build a messaging app
If chat ships, keep it deliberately poor:
- No image or file sending. (This removes an entire category of harm in one line.)
- No voice. PlayStation party chat already exists and already has parental controls the
  parents have already configured.
- No group DMs. One-to-one, plus moderated event rooms that open a week before an event
  and close a week after.
- Message history visible to moderators. Say so plainly in the UI — "moderators can see
  reported conversations" — because deterrence works better than detection.

Every feature not built is a feature that cannot be misused and does not need staffing.

## The thing that will actually kill this
Not the code. **Moderation is a permanent staffing commitment**, not a build task.
A chat system for minors needs someone checking reports every day, including the days
nobody feels like it. Two volunteers who are keen in month one and absent by month four
is the normal outcome, and an unmoderated minors chat is worse than no chat.

Be honest about capacity before building chat. If there isn't a real answer to "who reads
the reports on a Wednesday in February", the answer is the LFG board and no chat — and
that is a perfectly good product.

## Age model
- **U16**: LFG board, preset quick messages, matched only with other U16.
- **16–17**: LFG board, free-text chat with 16+, matched with 16+.
- **18+**: full access, but **cannot see or contact any under-18 profile at all.**

That last rule is absolute and should be enforced in the database, not the UI. An adult
account and a child account should be unable to reach each other even if someone finds a
bug in the front end.

## Data model sketch
    LfgPost(id, user, game, platform, ageBand, windows[], note, status, expiresAt)
    GameRequest(id, post, from, to, proposedWindow, status, respondedAt)
    Connection(a, b, source: 'event' | 'online', createdAt)
    Conversation(id, type: 'direct' | 'eventRoom', participants[], eventSlug?)
    Message(id, conversation, sender, body, flags[], createdAt)
    Report(id, reporter, targetUser, context, reason, status, handledBy, handledAt)
    Block(blocker, blocked, createdAt)
    MatchResult(id, game, players[], score, reportedBy, confirmedBy, ladderSeason)

Posts must expire (14 days is about right) or the board fills with stale entries from
players who left months ago — the standard way these boards die.

## Open questions -> asked separately
