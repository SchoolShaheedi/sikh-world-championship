"use client";

import { useState } from "react";
import { deleteAccountAndEntry, deleteEntryOnly } from "@/app/admin/actions";

export interface EntryRow {
  reference: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
  /** Null when the retention job has already unlinked the profile. */
  playerId: string | null;
}

/**
 * Every entry, and the button that deletes one.
 *
 * WHY IT IS COLLAPSED AND NOT PRETTY
 * This is the most destructive control in the app and it sits on the same page as the
 * draw. Nothing about it should invite a stray click: it is shut by default, the count is
 * the only thing showing, and each deletion asks for a typed confirmation of the
 * reference rather than a yes/no dialog. Typing "SFC-1042" is a deliberate act; clicking
 * OK is a reflex.
 *
 * WHY IT EXISTS AT ALL
 * Two reasons that will not go away: cleaning up after a rehearsal on the real
 * registration path, and honouring an erasure request without hand-writing SQL against
 * production at speed, under pressure, from a parent's phone call.
 */
export function EntryAdminPanel({ entries }: { entries: EntryRow[] }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="font-display text-lg text-kesri">Entries</h3>
        <p className="mt-1 text-sm text-muted">
          No entries yet. Once there are, each one can be deleted from here — a test entry
          after a rehearsal, or a real one if somebody asks to be removed.
        </p>
      </div>
    );
  }

  async function remove(row: EntryRow) {
    setBusy(true);
    setMessage(null);
    try {
      const fd = new FormData();
      let r: { error?: string; message?: string };
      if (row.playerId) {
        fd.set("playerId", row.playerId);
        fd.set("label", `${row.fullName} (${row.reference})`);
        r = (await deleteAccountAndEntry(fd)) as { error?: string; message?: string };
      } else {
        fd.set("reference", row.reference);
        r = (await deleteEntryOnly(fd)) as { error?: string; message?: string };
      }
      setMessage(r.error ?? r.message ?? null);
      if (!r.error) {
        setConfirming(null);
        setTyped("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-lg text-kesri">Entries</h3>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setConfirming(null);
            setMessage(null);
          }}
          className="text-sm text-muted underline decoration-dotted hover:text-body"
        >
          {open ? "Hide" : `Show all ${entries.length}`}
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Deleting an entry here removes the profile, the entry, and everything attached to
        both — permanently, with no undo. It is recorded under Retention at the bottom of
        this page.
      </p>

      {open && (
        <>
          <ul className="mt-3 space-y-2">
            {entries.map((row) => (
              <li
                key={row.reference}
                className="rounded-xl border border-line bg-ink/20 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-mono text-xs text-muted">{row.reference}</span>
                  <span className="text-body">{row.fullName}</span>
                  <span className="text-muted">{row.email}</span>
                  <span className="text-xs text-muted">{row.status}</span>
                  {!row.playerId && (
                    <span className="text-xs text-muted">no profile attached</span>
                  )}
                  {confirming !== row.reference && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(row.reference);
                        setTyped("");
                        setMessage(null);
                      }}
                      className="ml-auto text-muted underline decoration-dotted hover:text-body"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {confirming === row.reference && (
                  <div className="mt-3 rounded-lg border border-line bg-surface/60 p-3">
                    <p className="text-muted">
                      Type <span className="font-mono text-body">{row.reference}</span> to
                      delete {row.fullName} permanently.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        autoFocus
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-body focus:border-kesri focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={busy || typed.trim() !== row.reference}
                        onClick={() => remove(row)}
                        className="rounded-lg bg-kesri px-3 py-1.5 font-semibold text-ink disabled:opacity-40"
                      >
                        Delete permanently
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className="rounded-lg border border-line px-3 py-1.5 text-muted"
                      >
                        Cancel
                      </button>
                    </div>
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
