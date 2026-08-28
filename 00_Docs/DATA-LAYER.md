> **STATUS (2026-08-28, round 30): MIGRATED. This document's Supabase plan is superseded.**
>
> The stores are now **Cloudflare D1**. Supabase was chosen before Cloudflare was picked
> for hosting; see DECISIONS.md round 29 for why that reversed, and round 30 for the
> migration itself. The reasoning below about *why* the JSON files had to go is still
> accurate and worth reading — it is only the destination that changed.
>
> Schema: `03_App/web/migrations/`. Access layer: `src/lib/db.ts`.

# Data layer — current state and what must change before launch

## Today (development)
Registrations are written to `web/.data/registrations.json` via `src/lib/store.ts`.
This makes the whole sign-up flow work end to end with no accounts, keys or third-party
setup — you can demo the real thing today.

## Before the event goes live, this MUST be replaced
The JSON file is not safe for real registrations:

1. **It does not survive a redeploy.** Most hosts (Vercel, Netlify) have an ephemeral
   filesystem. Every deploy would wipe every sign-up.
2. **No concurrency safety.** Two people submitting at the same instant can overwrite
   each other — read-modify-write with no locking.
3. **It stores sensitive data in plaintext.** Guardian contact details, medical
   conditions and allergies for children. That needs encryption at rest, access control,
   and a retention policy (delete it a set period after the event).

## Recommended: Supabase (Postgres)
Chosen because it gives auth, database and row-level security in one, has a generous
free tier, and the accounts requirement means auth is needed anyway.

Tables map directly onto the types already defined in `src/lib/types.ts`:
  players, events, divisions, registrations, matches, trophies, reports

Row-level security rules that matter:
- A player can read and edit only their own registration.
- Guardian details and medical notes are readable ONLY by named event admins,
  never by other players and never through the public API.
- Public player profiles expose display name, avatar, region and age band. Nothing else.

## Migration path
`src/lib/store.ts` is the only file that touches storage. Swapping to Supabase means
reimplementing these functions against the database and changing nothing else:

    registrationsFor(eventSlug)
    confirmedCount(eventSlug, divisionId)
    register({...})
    promoteFromWaitlist(eventSlug, divisionId)
    checkIn(token)

## Google Sheet export
Volunteers wanted a spreadsheet. That should be an **export**, not the source of truth:
a scheduled job (or an admin button) that writes the current confirmed list to a Sheet.
Keeps the database authoritative while volunteers get the tool they actually want.

Important: the export must NOT include medical notes or guardian phone numbers by
default. Those go on a separate, restricted sheet held only by the safeguarding lead.
