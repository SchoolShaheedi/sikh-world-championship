# Testing the real registration path

The quickest honest way to rehearse an entry end to end, without opening the form to the
public.

## Why not just switch registration on

`SWC_REGISTRATION_OPEN=true` opens the form to everyone who visits sikhchampionships.com.
The form asks a child for their date of birth, their guardian's email and their medical
conditions. Leaving that open for an afternoon's testing means a real parent could enter a
real child into an event whose date, venue, insurance and DBS checks are not settled — and
they would have no way of knowing it was a rehearsal.

`SWC_REGISTRATION_DEMO=true` (the current production setting) is the opposite problem: it
runs every check and then skips the write, so it tests nothing that happens after the
submit button. The D1 write, the guardian email, the magic link, the draw and the check-in
token are all untested by it.

## The mechanism

A key, in a cookie. The form is live for the browser that has it, closed for everyone
else, on the same deployment.

```
/testing?key=<SWC_TEST_KEY>   → real registration for this browser, 8 hours
/testing?key=clear            → closed again
```

The cookie holds the key itself, not a flag, so it cannot be forged by typing
`swc_tester=1`. Comparison is constant-time. With no key configured the route 404s, and a
wrong key gets the same 404 — there is nothing to iterate against.

## Setting or rotating the key

```bash
cd 03_App/web
K=$(openssl rand -hex 24)
printf '%s' "$K" | npx wrangler secret put SWC_TEST_KEY
security add-generic-password -U -A -a "$USER" -s swc-test-key -w "$K"   # so it is recoverable
printf 'https://sikhchampionships.com/testing?key=%s' "$K" | pbcopy      # ready-made link
unset K
```

Nothing there prints the key. To get the link again later:

```bash
printf 'https://sikhchampionships.com/testing?key=%s' \
  "$(security find-generic-password -a "$USER" -s swc-test-key -w)" | pbcopy
```

## A rehearsal

1. Open the link. It lands on `/join`.
2. Enter an event. The page says **Testing mode — this saves a real record**, in place of
   the usual preview banner.
3. Fill the form in with made-up details. Use a real email address you control if you want
   to test what actually arrives — the guardian email and the magic link are real.
4. Check `/admin`: the entry appears under **Entries**, and the public name under **Names
   on the screen**.
5. Run the draw if you want to test selection, the offer email and the check-in token.
6. Delete the entry: **Entries → Show all → Delete**, then type the reference. This removes
   the profile, the entry, and everything attached to both. It is recorded under Retention
   at the bottom of `/admin`.
7. Visit `/testing?key=clear`, or leave it — the cookie expires after 8 hours.

## What testing this way does NOT cover

- **The public state.** Nobody else can reach the form, so it does not test what a real
  entrant sees the day entries open. That is one more deploy, and a decision, not a test.
- **Load.** One browser.
- **Deliverability at scale.** One email to one inbox tells you the template renders and
  the domain is verified. It does not tell you 64 guardian emails will land.

## The one thing to be careful about

Test entries are real rows in the live database with real names in them. Delete them the
same day. An undeleted test entry is indistinguishable from a real one at the check-in
desk, and it will appear in the draw.
