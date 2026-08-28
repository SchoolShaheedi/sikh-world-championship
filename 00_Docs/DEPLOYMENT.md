# Deployment — Cloudflare Workers

> **LIVE (preview):** https://sikh-world-championship.shaheedibunga.workers.dev
> Deployed to the `media@shaheedibunga.com` account. Registration and the Looking For
> Game board are **switched off** — see "Feature flags" below. Every other page works.
>
> **`sikhchampionships.com` is not attached yet.** It needs a nameserver change first —
> see "Attaching the domain".

## Feature flags — why the sign-up form is not there

`src/lib/features.ts` gates registration and the LFG board. Both are **off in production by
default** and on in local development, so a deploy is safe unless someone deliberately
turns them on.

Two independent reasons, and both currently apply:

1. **Technical.** Both need a writable store. Workers has no writable filesystem, so with
   the flags on every submission is a 500 with no explanation.
2. **Safeguarding.** `04_Legal/DPIA.md` concludes real registrations must not open:
   guardian emails do not send, children's data is not stored securely, nothing is ever
   deleted, DBS checks have not started.

**The second reason outlives the first.** Fixing the database does not make it correct to
switch registration on — that is a safeguarding decision, and the flag is where it gets
recorded.

With the flags off, the sign-up page renders no form fields at all, so nothing can be typed
or submitted, and `POST /api/events/[slug]/register` returns **503 with a plain-English
reason** rather than a 500. The board explains what it will do and why it is not on yet.

To turn them on later — after the database lands *and* a deliberate safeguarding decision:

```bash
npx wrangler secret put SWC_REGISTRATION_OPEN   # "true"
```

The sign-up page is `force-dynamic` so the page and the API always agree about whether
entries are open. Prerendering it would bake "closed" into the HTML at build time, and
flipping the flag would then open the endpoint while the page still said closed.

## Attaching sikhchampionships.com

The domain is registered at **Namecheap** (created 2026-08-26) and still uses Namecheap
nameservers, so Cloudflare cannot serve it yet. Workers custom domains require the zone to
be on Cloudflare — there is no CNAME-only shortcut for Workers.

This part cannot be scripted from here: the wrangler OAuth token has `zone (read)` but not
zone-create, so adding the zone is a dashboard action.

1. **Add the site** at https://dash.cloudflare.com → Add a site → `sikhchampionships.com`
   → Free plan. Cloudflare will show two assigned nameservers.
2. **Change the nameservers at Namecheap:** Domain List → Manage → Nameservers → Custom
   DNS → paste both. Usually live within minutes; allow up to 24h.
3. **Wait for the zone to go Active** (Cloudflare emails you).
4. **Attach it to the Worker:**

```bash
cd 03_App/web
npx wrangler deploy   # after adding the routes block below to wrangler.jsonc
```

Add to `wrangler.jsonc` once the zone is active — **not before**, since a route for a
nonexistent zone fails the deploy:

```jsonc
"routes": [
  { "pattern": "sikhchampionships.com",     "custom_domain": true },
  { "pattern": "www.sikhchampionships.com", "custom_domain": true }
]
```

5. **Set the real origin**, or guardian approval links will point at localhost:

```bash
npx wrangler secret put NEXT_PUBLIC_SITE_URL   # https://sikhchampionships.com
```

> Note the domain is `sikhchampionships.com`, while `00_Docs/NEXT-STEPS.md` says to
> register `sikhworldchampionship.com`. Decide which is canonical and redirect the other;
> having both live and unlinked is worse than either alone.

## What was set up

Hosting target is Cloudflare, via the OpenNext adapter (`@opennextjs/cloudflare`). A Next
app of this shape deploys as a **Worker with static assets**, which is what
`wrangler.jsonc` describes.

### Why Workers and not Pages

Because Pages is not an option for Next.js any more. `@cloudflare/next-on-pages`, the
adapter that targeted Pages, is **formally deprecated** — npm returns
*"Please use the OpenNext adapter instead"* — and has not been updated since July 2026,
while the Workers adapter ships regularly. Cloudflare has moved Next.js hosting to Workers,
Pages is in maintenance for new development, and Workers Static Assets (the `assets`
binding here) is what replaced it.

It would not have run anyway: `next-on-pages` requires `runtime = 'edge'` on every server
route, and the stores use `node:crypto` and `node:fs`. That is a rewrite, not a flag.

**The one thing Pages would have given us**, and it is worth knowing because it is the
blocker on the custom domain: Pages supports custom domains for zones that are *not* on
Cloudflare — you CNAME from the external registrar to `<project>.pages.dev` and Cloudflare
issues the certificate. Workers custom domains require the zone on Cloudflare, which is why
`sikhchampionships.com` needs a nameserver change.

That is a real trade-off, but not one worth taking: it would mean building on a deprecated
adapter and rewriting every route for the edge runtime, to avoid a single one-off DNS
change — and moving DNS to Cloudflare is wanted regardless, since it is what enables Access
for a gated preview, redirects for the domain-name clash, and caching in front of the
Worker.

| File | Purpose |
|---|---|
| `03_App/web/wrangler.jsonc` | Worker name, entry point, compat flags, static asset binding |
| `03_App/web/open-next.config.ts` | OpenNext adapter config (defaults) |
| `package.json` → `cf:build` / `cf:preview` / `cf:deploy` | The three commands |

`nodejs_compat` is required. Without it the build produces a Worker that cannot even load.

**Next was bumped 16.3.1 → 16.3.3.** The adapter's peer range is
`>=15.5.24 <16 || >=16.3.3`, which excludes 16.3.1 precisely. `esbuild` was also added —
the adapter needs it at build time and does not declare it.

## Verified, on the actual Workers runtime

Run locally with `npm run cf:preview`, which executes the built Worker in `workerd` —
the same runtime Cloudflare runs. This is not a simulation.

**Works (200):**

`/` · `/about` · `/safeguarding` · `/events` · `/events/sikh-fifa-26` ·
`/events/sikh-fifa-26/signup` · `/players` · `/sponsors` · `/volunteer` · `/support` ·
`/styleguide`

Every marketing and informational page renders correctly, including the 3D hero and the
brand assets.

**Fails (500):**

- `POST /api/events/[slug]/register` — **registration, the point of the site**
- `/play` — the Looking For Game board
- every server action: sign-up, support form, report, block, guardian approval

## The blocker

```
Error: operation not permitted
    at Module.mkdirSync (node-internal:internal_fs_sync:277:17)
    at Module.mkdir (node-internal:internal_fs_promises:358:23)
```

**Cloudflare Workers has no writable filesystem.** All four stores — `store.ts`,
`play-store.ts`, `guardian-store.ts`, `support-store.ts` — read and write JSON files
through `node:fs`. The moment any of them tries to `mkdir` the data directory, the request
dies.

This is not a misconfiguration and no compat flag fixes it. The stores' own header comments
have said so since round 1: *"a JSON file does not survive a redeploy on most hosts"*. This
is that, arriving.

`/moderation` returns 200 only because it denies access before touching a store. That is
the deny-by-default fix from round 24 working, not the page working.

## What has to happen first

**Finish the database migration.** `00_Docs/DATA-LAYER.md` and `NEXT-STEPS.md` both already
specify **Supabase**, and that decision still holds on Cloudflare — the Supabase client is
HTTP-based and runs fine on Workers. Nothing about hosting here forces a different database.

> Cloudflare's own D1 would also work, but choosing it would contradict a recorded
> decision and tie the data layer to one host. Prefer Supabase unless there is a reason to
> revisit it, and if you do revisit it, record that in `DECISIONS.md`.

Migrating the four stores is the same work either way, and it also clears **DPIA risk #4**
(children's medical notes currently sitting in unencrypted files), so it is not wasted
effort on hosting — it is the top blocking item already on the list.

## Do not put this live yet, even once it runs

`04_Legal/DPIA.md` concludes: **do not open real registrations.** Four unmitigated risks,
each individually blocking:

1. Guardian notification emails do not send (`src/lib/notify.ts` only logs)
2. Children's data not stored securely
3. Nothing is ever deleted — no retention enforcement
4. DBS checks not started; safeguarding lead is still `TBC` on the public page

A working public sign-up form before those are resolved would collect real children's data
into a system the project's own impact assessment says is not ready. Deploying is a
technical step; **going live is a safeguarding decision.**

### The safe interim option

If the goal is a URL to show collaborators, sponsors or a venue, deploy the site with:

- **Cloudflare Access** in front of it (email-gated, free tier covers this) so it is not
  public
- `X-Robots-Tag: noindex` so it never enters a search index
- the sign-up route disabled or visibly marked as a preview, so nobody submits real details

That gets a shareable link today without opening a children's-data form to the internet.

## Which Cloudflare account — pinned with direnv

`wrangler login` is **global**. It writes one credential file for the whole machine, so
logging in for one project silently repoints every other project on it. This workspace has
at least four Cloudflare accounts across its projects, which makes that a real hazard
rather than a theoretical one.

The repo-root `.envrc` pins this project's account:

```bash
export CLOUDFLARE_ACCOUNT_ID=c1b50ea317dc2bbd5fdff7d6d9a3e8d9   # media@shaheedibunga.com
```

direnv is already installed and hooked into `~/.zshrc`. Run `direnv allow` once after
changing `.envrc`. The variable is set anywhere inside the project, including
`03_App/web/`, and unset outside it — verified.

**What this buys you:** a wrangler command run from this directory either targets the right
account or fails loudly. Verified by pinning a bogus account:

```
✘ ERROR  A request to the Cloudflare API (/accounts/…) failed.
         Authentication error [code: 10000]
```

An account ID is an identifier, not a credential — Cloudflare's own docs put it in
committed config — so `.envrc` is safe to commit even though this repository is public.

### Full isolation, optionally

The pin guarantees *which account*. It does not change *who you are authenticated as* —
that still comes from the global login. To make this directory completely independent of
whatever `wrangler login` last touched, copy `.envrc.local.example` to `.envrc.local`
(gitignored) and add a project-scoped API token. Wrangler prefers `CLOUDFLARE_API_TOKEN`
over the OAuth session, and every code path respects it — including wrangler invoked
indirectly by the OpenNext adapter.

Scope the token to the media@shaheedibunga.com account only, from the "Edit Cloudflare
Workers" template. Least privilege matters more than usual here: public repo, children's
data.

### Why not XDG_CONFIG_HOME

Setting `XDG_CONFIG_HOME` to a project-local directory *does* give wrangler a fully
isolated credential store — tested, and it works on macOS. It was rejected because it also
redirects every other XDG-respecting tool in this directory, `gh` included, which would
lose its authentication. A scoped API token achieves the same isolation with no collateral
damage.

## Deploying, when it is time

```bash
cd 03_App/web
npx wrangler login          # must be the account that owns the domain
npm run cf:build
npm run cf:preview          # exercise it in workerd first
npm run cf:deploy
```

**Check `npx wrangler whoami` before deploying.** As of writing, this machine is
authenticated as `vismaadcreatives@gmail.com`, which is *not* the intended
`media@shaheedibunga.com` account. Deploying to the wrong Cloudflare account puts the site
under the wrong billing, the wrong domain and the wrong access controls, and is annoying to
unpick.

### Environment variables

Set in the Cloudflare dashboard or via `wrangler secret put` — never in `wrangler.jsonc`,
which is committed:

- `NEXT_PUBLIC_SITE_URL` — the real origin. Guardian approval links are built from it, so
  if it is wrong those emails point at localhost.
- Database and email credentials, once they exist. See `03_App/web/.env.example`.

`SWC_DEV_MODERATOR` must **never** be set in production. It is refused when
`NODE_ENV=production` anyway, but do not rely on that alone.
