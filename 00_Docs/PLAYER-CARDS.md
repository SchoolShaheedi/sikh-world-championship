# Player Cards — Design
Date: 2026-08-21 (revised — supersedes the six-stat design below)

## CURRENT DESIGN: one Quality per card, drawn from 32

Each card carries **one** of 32 Qualities — Sat, Santokh, Dharam, Sidak, Pyaar, Daya,
Shanti, Sant Sipahi (the warrior), and 24 more. Gurmukhi, romanised name and English
all appear on the card face.

Two rules in the implementation:

**Assignment is deterministic, not re-rolled.** The quality comes from a hash of the
player's id, so a player keeps the same quality on the website, in their confirmation
email and on anything printed. A quality that changed on refresh would be worthless to
collect and confusing to share.

**Every quality is equally likely — no rare tier.** Ranking Sat above Shukrana would be
making a claim about which virtues matter more, which isn't ours to make, and a child
drawing a "common" virtue shouldn't feel short-changed. Verified even across 64,000
draws: worst deviation 4.3%, all 32 used.

**This design resolves the open question the earlier version raised.** Because the
quality is *drawn* rather than *scored*, nobody is being rated on their character.
"Jagdeep drew Anakh" is a completely different sentence from "Jagdeep scores 74 in Truth."
The numeric virtue stats have been removed.

Card tiers (bronze / silver / gold / special champion card) are unchanged.

---

## SUPERSEDED — the earlier six-stat design, kept for reference

## What was built
A FIFA-Ultimate-Team-style card with six stats. The six are the **Panj Gun** (the five
virtues of Sikhi) plus **Chardi Kala**:

| Code | Gurmukhi     | Name        | English      |
|------|--------------|-------------|--------------|
| SAT  | ਸਤ           | Sat         | Truth        |
| DYA  | ਦਯਾ          | Daya        | Compassion   |
| SNT  | ਸੰਤੋਖ        | Santokh     | Contentment  |
| NIM  | ਨਿਮਰਤਾ       | Nimrata     | Humility     |
| PYR  | ਪਿਆਰ         | Pyaar       | Love         |
| CHK  | ਚੜ੍ਹਦੀ ਕਲਾ   | Chardi Kala | High Spirits |

A FIFA card has exactly six stats. Sikhi has five named virtues, and Chardi Kala is the
obvious sixth. The format fits without being forced — which is the only reason it's worth
doing at all.

Card tiers mirror FIFA: bronze -> silver -> gold, plus a special orange/black card for
event champions.

## The three rules baked into the design

**1. Stats are earned by what you DO at SWC events, not by who you are.**
Turning up, helping out, playing fair, volunteering, bringing a friend. The card measures
your record with us. It is not a judgement of anyone's character or faith, and every piece
of wording on the site has to make that obvious.

**2. Nothing starts low and nothing goes down.**
Everyone begins at 50 across the board and only climbs. No child is ever shown a card
telling them they score 34 in Compassion. This is the rule that makes the whole idea safe,
and it should not be relaxed later for "balance" — a virtue score used as a punishment
would be worse than having no stats at all.

**3. Five of the six can be maxed without winning a single match.**
63 of 64 players go home without the trophy. If the card only measured football skill,
63 cards would be a record of losing. This way, the player who lost in round one but
helped set up, cheered from the sideline and brought two friends has a better card than
a champion who sulked. That is the correct incentive for a Sikh championship — and it's
the bit that makes this genuinely different from FIFA rather than a reskin.

## !! OPEN QUESTION — needs your call before this goes public

**Is putting a number on a virtue acceptable?**

The upside is real: it turns good conduct into something visible and collectable, gives
every player a reason to care beyond winning, and teaches the Panj Gun to kids who'd never
read about them. It is the single most on-brand idea in the project.

The risk is also real: some people — especially older or more observant sangat members —
may find quantifying Sat or Daya on a 0–99 scale disrespectful, or feel it trivialises
concepts that are meant to be lived rather than scored. "Jagdeep has 74 Truth" is a
sentence that can land badly.

Mitigations already in place: nothing starts low, nothing goes down, and stats are framed
as an event record.

Three ways to go, if the scale is a concern:
- **A. Keep numbers** (as built) — most FIFA-like, most shareable, highest risk.
- **B. Use pips or bars** instead of 0–99 — same idea, no explicit score, softer feel.
- **C. Rename the axis** — keep the six virtues but label them as "seva earned" or badges
  rather than a rating of the virtue itself.

Worth asking two or three people whose judgement you trust — ideally including someone
older and more observant than your target players — before this goes public. It is much
easier to change now than after 64 kids have posted their cards.

## Also worth deciding
- Physical trophies: does the tiering match the digital one? (2 champion cups, 2
  runner-up, 4 semi-finalist, ~64 medals — engraving takes weeks, order early.)
- Should the champion's special card be a physical printed card handed over on the day?
  Cheap to print, and a genuinely great thing for a 14-year-old to keep.
