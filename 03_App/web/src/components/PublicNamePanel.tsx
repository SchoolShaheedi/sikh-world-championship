"use client";

import { useState } from "react";
import { overrideHandle } from "@/app/admin/actions";
import { HANDLE_MAX } from "@/lib/handle";
import type { BracketName } from "@/lib/players";

/**
 * The names that will appear on the projector, and the one place they can be corrected.
 *
 * WHY THIS SCREEN EXISTS: the public name is free text a child typed at registration. The
 * automatic refusals in lib/handle.ts catch the two things a machine can check — the
 * entrant's own PSN ID, and their surname — and nothing else. An insult, a phone number,
 * a stranger's name or somebody's Instagram handle all pass. Sixty-four rows read once,
 * before the day, is the control that closes that gap, and a control with no screen is a
 * control nobody performs.
 *
 * A change here is not announced to the player. It should be rare and it should be
 * followed by telling them why, which is a conversation, not a database field.
 */
export function PublicNamePanel({ names }: { names: BracketName[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (names.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="font-display text-lg text-kesri">Names on the screen</h3>
        <p className="mt-1 text-sm text-muted">
          Nobody has a place yet. Once the draw has run, every public name appears here to
          be read through before the day.
        </p>
      </div>
    );
  }

  async function save(playerId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("playerId", playerId);
      fd.set("handle", draft);
      const r = (await overrideHandle(fd)) as { error?: string; message?: string };
      setMessage(r.error ?? r.message ?? null);
      if (!r.error) setEditing(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-lg text-kesri">Names on the screen</h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-muted underline decoration-dotted hover:text-body"
        >
          {open ? "Hide" : `Read through ${names.length}`}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        What the bracket and the projector will say. Read these before the day: the checks
        at sign-up only catch a player&apos;s own PSN ID and their surname.
      </p>

      {open && (
        <>
          <ul className="mt-3 space-y-2">
            {names.map((n) => (
              <li
                key={n.playerId}
                className="rounded-xl border border-line bg-ink/20 p-3 text-sm"
              >
                {editing === n.playerId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      maxLength={HANDLE_MAX}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-body focus:border-kesri focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => save(n.playerId)}
                      className="rounded-lg bg-kesri px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-lg border border-line px-3 py-1.5 text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-display text-base text-body">{n.handle}</span>
                    {/* The profile's own first name, so a moderator can see at a glance
                        whether the handle is a nickname or something unrelated. */}
                    <span className="text-muted">profile: {n.displayName}</span>
                    {n.status === "checked-in" && (
                      <span className="text-xs text-ok">checked in</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(n.playerId);
                        setDraft(n.handle);
                        setMessage(null);
                      }}
                      className="ml-auto text-muted underline decoration-dotted hover:text-body"
                    >
                      Change
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {message && <p className="mt-3 text-sm text-body">{message}</p>}
        </>
      )}
    </div>
  );
}
