#!/usr/bin/env python3
"""
Block any tool call that could put a secret into a transcript.

WHY THIS EXISTS
Keys for this project leaked twice, both times because an agent read a file that happened
to contain them and the file's contents went into a conversation transcript. Moving the
values into the macOS Keychain (scripts/secrets-to-keychain.sh) removes the file as a
source. This hook is the second layer: it refuses the *commands* that would print a
secret, whatever it is stored in.

Deny, not ask. A prompt is a decision made in a hurry by whoever is watching; the whole
failure mode here is that nobody was watching closely.

Wired up in .claude/settings.json as a PreToolUse hook. Exit 2 with a message on stderr
is how a PreToolUse hook refuses a call.
"""
import json
import re
import sys

# Each entry: (compiled pattern, what to say instead).
RULES = [
    (r"\.envrc\.local",
     "That file is the loader for this project's API keys. Reading it is how they leaked "
     "twice. It holds no literals any more, but the answer to 'what is the token' is "
     "still no. Use `direnv` and let the env var be inherited."),
    (r"\.dev\.vars|\.env\.local|\.env\.production",
     "Local environment files can hold secrets. Not readable through a tool call."),
    (r"find-generic-password",
     "That prints a secret from the Keychain to stdout, which means into a transcript. "
     "Refused. Commands that NEED the value get it from the inherited environment."),
    (r"\bprintenv\b|\bexport\s+-p\b|\benv\s*$|\benv\s*\||direnv\s+export",
     "Dumping the environment prints every secret in it. Read one named non-secret "
     "variable if you need it, e.g. `echo \"$CLOUDFLARE_ACCOUNT_ID\"`."),
    (r"\$\{?(CLOUDFLARE_API_TOKEN|RESEND_API_KEY|SWC_TEST_KEY)\b",
     "Expanding a secret into a command line puts it in the transcript. Tools that need "
     "it already inherit it from the environment — don't pass it explicitly."),
    (r"\.claude/projects/.*\.jsonl",
     "Conversation transcripts contain everything ever printed, including the keys that "
     "leaked before. Not readable through a tool call. "
     "Use scripts/scrub-transcripts.py to redact them."),
    (r"wrangler\s+secret\s+list.*--?\bvalue",
     "Refused: that would print deployed secret values."),
]

# `security add-generic-password` (writing) and the scrub script are the two things that
# legitimately mention the patterns above.
ALLOW = re.compile(r"secrets-to-keychain\.sh|scrub-transcripts\.py|add-generic-password")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0  # Never break the session over a malformed hook payload.

    tool = payload.get("tool_name", "")
    ti = payload.get("tool_input") or {}
    if tool not in ("Bash", "Read", "Edit", "Write", "Grep", "Glob", "NotebookEdit"):
        return 0

    haystack = " ".join(
        str(ti.get(k, ""))
        for k in ("command", "file_path", "path", "pattern", "notebook_path")
    )
    if not haystack.strip():
        return 0
    if ALLOW.search(haystack):
        return 0

    for pattern, reason in RULES:
        if re.search(pattern, haystack, re.IGNORECASE):
            print(f"Blocked by .claude/hooks/deny-secret-reads.py.\n{reason}",
                  file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
