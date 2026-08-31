#!/usr/bin/env python3
"""
Redact API keys from Claude Code conversation transcripts.

Rotation is the real fix — a rotated key in a transcript is a dead string. This is the
cleanup that follows it, so a file on disk is not still holding a live-looking credential
that gets pasted somewhere by mistake.

    python3 scripts/scrub-transcripts.py            # report only
    python3 scripts/scrub-transcripts.py --write     # rewrite in place

The transcript of the CURRENTLY RUNNING session is skipped: it is being appended to, and
rewriting it under the process would lose messages. Run this again after quitting.
Pass --session <id> to name the session to skip.
"""
import argparse
import glob
import os
import re
import sys
import tempfile

# Prefixed, length-bounded shapes only. A generic "long random string" rule would redact
# hashes, ids and base64 assets, i.e. it would corrupt the transcript to no purpose.
PATTERNS = [
    re.compile(r"cfut_[A-Za-z0-9]{20,}"),                       # Cloudflare user token
    re.compile(r"re_[A-Za-z0-9]{6,}_[A-Za-z0-9]{16,}"),         # Resend API key
    re.compile(r"v1\.0-[a-f0-9]{20,}-[A-Za-z0-9_-]{20,}"),      # Cloudflare global key
    re.compile(r"sk-ant-[A-Za-z0-9_-]{20,}"),                   # Anthropic key
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),                  # GitHub token
]
REPLACEMENT = "<redacted-by-scrub-transcripts>"


def scrub(text: str) -> tuple[str, int]:
    total = 0
    for p in PATTERNS:
        text, n = p.subn(REPLACEMENT, text)
        total += n
    return text, total


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--session", default=os.environ.get("CLAUDE_SESSION_ID", ""))
    ap.add_argument(
        "--dir",
        default=os.path.expanduser("~/.claude/projects"),
        help="Directory of project transcript folders.",
    )
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.dir, "**", "*.jsonl"), recursive=True))
    hits = 0
    for path in files:
        if args.session and args.session in os.path.basename(path):
            print(f"skip (active session): {path}")
            continue

        found = 0
        out = None
        if args.write:
            fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path))
            out = os.fdopen(fd, "w", encoding="utf-8")

        with open(path, "r", encoding="utf-8", errors="surrogateescape") as fh:
            for line in fh:
                clean, n = scrub(line)
                found += n
                if out:
                    out.write(clean)

        if out:
            out.close()
            if found:
                os.replace(tmp, path)
                os.chmod(path, 0o600)
            else:
                os.unlink(tmp)

        if found:
            hits += found
            print(f"{'redacted' if args.write else 'would redact'} {found:>4}  {path}")

    print(f"\n{hits} occurrence(s) across {len(files)} transcript(s).")
    if hits and not args.write:
        print("Re-run with --write to rewrite them.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
