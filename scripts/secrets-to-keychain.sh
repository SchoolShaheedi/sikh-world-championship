#!/usr/bin/env bash
#
# Move this project's API keys out of a plaintext file and into the macOS Keychain.
#
# WHY THIS EXISTS
# The keys were leaked twice, both times the same way: they lived as literal strings in
# .envrc.local, and something read that file into a transcript — an AI agent running
# `cat`, a screen share, a paste. .envrc.local was never committed; git was never the
# problem. The file being readable was.
#
# After running this, .envrc.local contains no secret. It contains two `security`
# lookups. Anything that reads the file — a person, an agent, a log — gets the lookup,
# not the key. That is the whole mechanism.
#
# Usage:
#   ./scripts/secrets-to-keychain.sh            # prompt for new (rotated) values
#   ./scripts/secrets-to-keychain.sh --migrate  # move the values already in .envrc.local
#
# Nothing in here ever echoes a value: `read -rs` suppresses the terminal echo, and the
# values are passed to `security` via a variable, never on a visible command line.
set -euo pipefail

cd "$(dirname "$0")/.."
LOCAL=".envrc.local"
ACCOUNT="${USER}"

# One keychain item per key. The service names are the contract with .envrc.local below.
CF_SERVICE="swc-cloudflare-api-token"
RESEND_SERVICE="swc-resend-api-key"

store() {
  local service="$1" value="$2"
  # -U updates in place if it already exists. -A lets any process on this login session
  # read it without an authorisation dialog, which is what makes `direnv` usable; the
  # protection here is that the value is no longer sitting in a file, not that macOS
  # gates each read.
  security add-generic-password -U -A -a "$ACCOUNT" -s "$service" -w "$value"
  echo "  stored: $service"
}

if [ "${1:-}" = "--migrate" ]; then
  [ -f "$LOCAL" ] || { echo "No $LOCAL to migrate."; exit 1; }
  echo "Reading current values from $LOCAL (not printing them)…"
  # shellcheck disable=SC1090
  set +u; . <(grep -E '^export (CLOUDFLARE_API_TOKEN|RESEND_API_KEY)=' "$LOCAL" || true); set -u
  [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && store "$CF_SERVICE" "$CLOUDFLARE_API_TOKEN"
  [ -n "${RESEND_API_KEY:-}" ] && store "$RESEND_SERVICE" "$RESEND_API_KEY"
  echo
  echo "NOTE: migrating keeps keys that have already been exposed. Rotate them, then run"
  echo "      this script again with no arguments to replace the stored values."
else
  echo "Paste the ROTATED values. Input is hidden and is never written to a file."
  echo
  printf "Cloudflare API token (blank = leave unchanged): "
  read -rs cf; echo
  printf "Resend API key       (blank = leave unchanged): "
  read -rs re; echo
  echo
  [ -n "$cf" ] && store "$CF_SERVICE" "$cf"
  [ -n "$re" ] && store "$RESEND_SERVICE" "$re"
  unset cf re
fi

# Rewrite .envrc.local as a loader. Overwritten every time, so it can never drift back
# into holding a literal.
cat > "$LOCAL" <<'LOADER'
# Secrets for this project. THERE ARE NO SECRETS IN THIS FILE.
#
# The values live in the macOS Keychain and are fetched at shell-entry time. Written by
# scripts/secrets-to-keychain.sh — edit that, not this. This file is gitignored, but the
# reason it holds no literals is not git: it is that files get read out loud. Two leaks,
# both from a `cat` of this path.
#
# To see or change a value:
#   ./scripts/secrets-to-keychain.sh          # set (hidden input)
#   security find-generic-password -a "$USER" -s swc-cloudflare-api-token -w
#
# Least privilege still matters: this repository is public and the app handles children's
# data. Scope the Cloudflare token to the media@shaheedibunga.com account and to Workers,
# D1 and DNS only. Never an account-wide token.

export CLOUDFLARE_API_TOKEN="$(security find-generic-password -a "$USER" -s swc-cloudflare-api-token -w 2>/dev/null || true)"
export RESEND_API_KEY="$(security find-generic-password -a "$USER" -s swc-resend-api-key -w 2>/dev/null || true)"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "direnv: no Cloudflare token in the keychain — run ./scripts/secrets-to-keychain.sh"
fi
LOADER

echo
echo "Rewrote $LOCAL as a keychain loader — it now contains no secret."
echo "Run 'direnv allow' to pick it up."
