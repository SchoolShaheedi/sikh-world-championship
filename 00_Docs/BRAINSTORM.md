# World Sikh Championship — Brainstorm v0.1
Date: 2026-08-19

## 1. What the platform actually is
Two products that share one account system:

**A. Event platform** (near-term, needed for FIFA 26)
- Tournament sign-up, payment (or free), roster, brackets, results, standings, prizes.
- One event now, many later (FIFA, chess, kabaddi, gatka, quiz/Gurmat competitions, esports, athletics).
- So: build "Events" as a generic entity from day one, not hardcoded to FIFA.

**B. Sikh gamer network** (the long-term reason people stay)
- Find other Sikh players by game / platform / region / age band / skill.
- Without this, the app is dead 3 days after the tournament ends. This is the retention engine.

## 2. Why the second part is the hard part
"Sikh kids find online players to play with and connect" = a minors-facing social network.
That triggers real obligations, not optional nice-to-haves:
- COPPA (US, under 13), UK Age Appropriate Design Code, GDPR-K (EU, under 16 in most states).
- Apple App Store 1.2 / Google Play Families policy: apps with UGC + minors need reporting,
  blocking, moderation, and a published moderation plan or they get rejected.
- Practical must-haves: parental consent flow for under-13/16, no public sharing of real
  full name/school/city, report+block on every profile, message filtering, adult accounts
  cannot DM minor accounts, verified moderators.
Design decision that solves most of this cheaply: **age bands (13-15, 16-17, 18+) with strict
messages ("gg", "rematch?", "add me"). Open DMs can come later once moderation exists.

## 3. Suggested build order
- **Phase 0 (weeks 0-2): Landing page + sign-up form.** Ship a one-page site with a form
  (Google Form / Typeform / simple Next.js + Cloudflare D1). Collect registrations for FIFA 26 now.
  Do NOT block the tournament on building an app.
- **Phase 1 (weeks 2-8): Tournament engine.** Accounts, event pages, bracket generation,
  match reporting with screenshot proof, admin panel, standings, results.
- **Phase 2 (months 3-6): Player network.** Profiles, gamertag linking, "looking for a game"
- **Phase 3: Multi-event platform.** Recurring seasons, leaderboards across events, chapters
  by country/gurdwara, sponsor/donation layer.

## 4. FIFA 26 tournament — practical questions to settle
- Platform fragmentation is the #1 killer: PS5, Xbox, PC do not cross-play uniformly in EA FC.
  Either restrict to one platform, or run separate brackets per platform with a cross-play final
  only if EA supports it. Decide before sign-ups open.
- Format: single elim (fast, one loss = out, sad kids) vs double elim (fairer, ~2x matches)
  vs group stage -> knockout (best experience, most admin).
- Match settings: half length (4/6 min), custom vs default teams, legacy defending off,
  no ultimate team (pay-to-win) — use Kick-off with equal-rated clubs.
- Proof of result: both players screenshot final score, upload in app; admin resolves disputes.
- Age divisions: U13 / U16 / U18 / Open. Prizes differ.
- Timezone: if global, matches need scheduling windows, not fixed times.
- No-shows: 10-minute rule, then walkover.

## 5. Data model sketch (keeps every future event working)
User(id, name, dob/age_band, country, guardian_email?, verified)
GamerHandle(user, platform, handle)          # PSN / Xbox / EA ID / Steam
Event(id, title, game, format, start, rules_md, status)
Division(event, name, age_min, age_max, platform)
Registration(user, division, status, paid, seed)
Match(division, round, p1, p2, scheduled_at, score, proof_url, status)
Dispute(match, raised_by, notes, resolution)
Friendship(a, b, status)
LFG_Post(user, game, platform, window, note)   # "looking for game"
Report(reporter, target_user, reason, status)

## 6. Brand / naming
- WSC = World Sikh Championship. Sub-brands: "WSC FIFA", "WSC Chess", "WSC Gatka".
- Consider: is this Sikh-only, or Sikh-led-and-open-to-all? Affects sign-up wording, sponsor
  appeal, and platform policy (identity-restricted membership is fine but must be worded well).
- Needs: logo, colours (kesri/blue is obvious — consider something less predictable),
  domain (worldsikhchampionship.com + short one like wsc.gg style), socials.

## 7. Money
- Free entry + sponsor-funded prizes is the safest start (avoids payment processing, refunds,
  gambling-adjacent rules for paid-entry tournaments with cash prizes — real issue in some
  jurisdictions, especially with minors).
- If paid: Stripe, low fee, clear refund policy, and never cash prizes to minors without
  guardian consent — use vouchers/kit/equipment instead.

## 8. Open questions -> see QUESTIONS.md
