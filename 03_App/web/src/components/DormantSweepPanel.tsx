"use client";

import { useState } from "react";
import { purgeDormantNow } from "@/app/admin/actions";

/**
 * The manual clean-up sweep for dormant profiles.
 *
 * Since 2026-09-01 nothing deletes a profile automatically — the team chose to keep them
 * and tidy up when they want to. This is that button. It is shut by default and asks for
 * the word DELETE to be typed, for the same reason the entry panel does: this removes
 * children's accounts in bulk, and one click is a reflex where typing is a decision.
 *
 * `dueNow` is how many profiles the sweep would actually take, computed on the server —
 * so the button can say what it is about to do rather than making somebody find out.
 */
export function DormantSweepPanel({ dueNow }: { dueNow: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (dueNow === 0) {
    return (
      <p className="mt-4 text-muted">
        No profile has been inactive long enough to be worth clearing. Nothing to do.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-ink/20 p-4">
      <p className="text-body">
        {dueNow} profile{dueNow === 1 ? "" : "s"} could be cleared: never attended an
        event, no sign-in and no new registration for 24 months.
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg border border-line px-4 py-2 text-xs font-semibold text-muted transition-colors hover:border-kesri/60 hover:text-body"
        >
          Clean these up
        </button>
      ) : (
        <div className="mt-3">
          <p className="text-xs text-muted">
            This deletes {dueNow} profile{dueNow === 1 ? "" : "s"} and everything attached.
            Moderators, anyone who attended, and anyone named on a report or a support
            ticket are never touched. Type <span className="text-body">DELETE</span> to
            confirm.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="rounded-lg border border-line bg-ink/40 px-3 py-1.5 font-mono text-xs text-body"
              placeholder="DELETE"
            />
            <button
              type="button"
              disabled={typed !== "DELETE" || busy}
              onClick={async () => {
                setBusy(true);
                const r = await purgeDormantNow();
                setMessage(r.message);
                setBusy(false);
                setOpen(false);
                setTyped("");
              }}
              className="rounded-lg bg-kesri px-4 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-kesrisoft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete them"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="text-xs text-muted hover:text-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && <p className="mt-3 text-xs text-kesri">{message}</p>}
    </div>
  );
}
