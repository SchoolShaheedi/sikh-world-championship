# Secrets

## What went wrong, twice

The Cloudflare API token and the Resend API key were leaked twice. Both times the same way:
they were literal strings in `.envrc.local`, something read that file, and the contents
went into a conversation transcript on disk.

`.envrc.local` was never committed. **Git was never the problem.** The file being readable
was. Two rotations changed nothing about that, which is why it happened a second time.

## What changed

**1. The values are not in a file any more.** They live in the macOS Keychain.
`.envrc.local` now contains two `security` lookups and no values, so reading it — by a
person, an agent, a screen share, a log — yields nothing.

```bash
./scripts/secrets-to-keychain.sh            # set or rotate (hidden input)
./scripts/secrets-to-keychain.sh --migrate   # move values already in .envrc.local
direnv allow
```

**2. The commands that would print a secret are refused.**
`.claude/hooks/deny-secret-reads.py`, wired up in `.claude/settings.json` as a PreToolUse
hook, blocks any agent tool call that reads `.envrc.local`, dumps the environment
(`printenv`, `env`, `direnv export`), calls `security find-generic-password`, reads a
transcript file, or expands a secret variable into a command line. Deny, not ask: a prompt
is a decision made in a hurry by whoever is watching, and the failure mode here is that
nobody was watching closely.

**3. Production secrets never touch this machine.** They are Cloudflare secrets, set by
pipe so the value is never typed on a command line and never appears in the shell history:

```bash
cd 03_App/web
printf '%s' "$VALUE" | npx wrangler secret put RESEND_API_KEY
```

`wrangler.jsonc` is committed and this repository is public. Only non-secrets go in `vars`
there — the account id, the mail-from address. Both are identifiers, not credentials.

**4. Deploying from a shell direnv has not touched: `direnv exec`.**

A non-interactive shell — an agent's, a script's, a CI step's — never runs the direnv hook,
so `CLOUDFLARE_API_TOKEN` is simply absent and wrangler fails with *"the given account is
not valid or is not authorized"*, which reads like a permissions problem and is not one.

```bash
direnv exec /path/to/repo npx wrangler d1 migrations apply swc-production --remote
```

`direnv exec` loads `.envrc`, runs the one command with the variables in its environment,
and prints nothing. That is the whole point: it is the only way to get the token to
wrangler without the value passing through a command line, a log or a transcript. Do not
"solve" this by exporting the token by hand, and do not read the file to find out what it
holds — that is precisely the habit that leaked it twice.

## Rotating after an exposure

1. **Cloudflare** — https://dash.cloudflare.com/profile/api-tokens → roll the token.
   Scope: the media@shaheedibunga.com account only; Workers Scripts:Edit, D1:Edit,
   Zone→DNS:Edit. Never an account-wide token: this repository is public and the app holds
   children's data.
2. **Resend** — https://resend.com/api-keys → revoke and create. Sending permission only.
3. `./scripts/secrets-to-keychain.sh` with the new values.
4. `printf '%s' "$NEW" | npx wrangler secret put RESEND_API_KEY` for production.
5. Redact the dead strings from transcripts on disk — a rotated key is inert, but a
   live-looking credential in a file gets pasted somewhere by mistake:

```bash
python3 scripts/scrub-transcripts.py          # report
python3 scripts/scrub-transcripts.py --write  # rewrite in place
```

Run it after quitting the session you are in — it skips the transcript being appended to,
because rewriting that file under a running process loses messages.

## The keys currently in the repository's history of exposure

| Key | Status |
|---|---|
| `CLOUDFLARE_API_TOKEN` | exposed twice in transcripts — **rotate** |
| `RESEND_API_KEY` | exposed twice in transcripts — **rotate** |
| `SWC_TEST_KEY` | generated 31 Aug 2026 without ever being printed; in the Keychain as `swc-test-key` and as a Cloudflare secret |
