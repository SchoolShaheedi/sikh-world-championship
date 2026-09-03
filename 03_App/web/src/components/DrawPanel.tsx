"use client";

import { useState } from "react";
import { previewDraw, commitDraw, closeAndNotify } from "@/app/admin/actions";

/**
 * Running the draw.
 *
 * Preview is separated from commit deliberately. Committing creates accounts and emails
 * sixty-odd people, several of them children — that is not something to trigger with one
 * click and no sight of what it will do. Preview shows the exact outcome, changes nothing,
 * and can be run as often as you like.
 *
 * Committing then asks for confirmation, because the emails cannot be recalled.
 */
export function DrawPanel({
  slug,
  placesLeft,
  waiting,
  latestDrawId,
}: {
  slug: string;
  capacity: number;
  placesLeft: number;
  waiting: number;
  latestDrawId: string | null;
}) {
  const [preview, setPreview] = useState<null | {
    applicants: number;
    places: number;
    referredTaken: number;
    generalTaken: number;
    names: string[];
  }>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: (fd: FormData) => Promise<unknown>, extra?: Record<string, string>) => {
    setBusy(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.set("slug", slug);
      for (const [k, v] of Object.entries(extra ?? {})) fd.set(k, v);
      const r = (await fn(fd)) as { error?: string; message?: string; preview?: typeof preview };
      if (r?.error) setMessage(r.error);
      if (r?.message) setMessage(r.message);
      if (r?.preview !== undefined) setPreview(r.preview);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-line bg-ink/20 p-5">
      <h3 className="font-display text-lg text-kesri">The draw</h3>
      <p className="mt-1 text-sm text-muted">
        {placesLeft} place{placesLeft === 1 ? "" : "s"} left, {waiting} awaiting a decision.
        Referred applicants are drawn first, then everyone else — random within each group.
      </p>
      {/* TWO WAYS TO RUN THE DRAW, and having both is deliberate rather than indecision.
          This one is instant and recomputable from its stored seed, which is the right
          tool for backfilling three drop-outs on a Tuesday. The outside service below is
          slower and public, which is the right tool for the draw people watch. Saying so
          here stops the second panel looking like a replacement for this one. */}
      <p className="mt-2 text-sm text-muted">
        This runs here and now, and records a seed so the same result can be recomputed and
        shown to be honest. For a draw people can <em>watch</em>, use{" "}
        <span className="text-body">Draw with an outside service</span> below — this one is
        the quicker tool for backfilling a drop-out.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || waiting === 0}
          onClick={() => run(previewDraw)}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-body transition-colors hover:border-kesri/60 disabled:opacity-40"
        >
          {busy ? "Working…" : "Preview — changes nothing"}
        </button>

        <button
          type="button"
          disabled={busy || waiting === 0 || placesLeft === 0}
          onClick={() => {
            // Accounts get created and real people get emailed. Worth one interruption.
            const ok = window.confirm(
              `This will draw up to ${placesLeft} places, create their accounts and email them.\n\n` +
                `Emails cannot be recalled. Continue?`,
            );
            if (ok) run(commitDraw);
          }}
          className="rounded-xl bg-kesri px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
        >
          Run the draw and email offers
        </button>

        {latestDrawId && (
          <button
            type="button"
            disabled={busy || waiting === 0}
            onClick={() => {
              const ok = window.confirm(
                `This tells all ${waiting} remaining applicants they did not get a place.\n\n` +
                  `Do this only once places are settled — backfilling drop-outs is easier before it.\n\nContinue?`,
              );
              if (ok) run(closeAndNotify, { drawId: latestDrawId });
            }}
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-kesri/60 disabled:opacity-40"
          >
            Tell the rest they were not selected
          </button>
        )}
      </div>

      {message && (
        <p role="status" className="mt-4 rounded-xl border border-kesri/40 bg-kesri/[0.08] p-3 text-sm text-body">
          {message}
        </p>
      )}

      {preview && (
        <div className="mt-4 rounded-xl border border-dashed border-line p-4">
          <p className="text-sm text-body">
            Would draw <strong>{preview.referredTaken}</strong> referred and{" "}
            <strong>{preview.generalTaken}</strong> general, from {preview.applicants}{" "}
            applicants.
          </p>
          <p className="mt-1 text-xs text-muted">
            A preview uses a fresh random seed each time, so the names below will differ on
            the next run. Only the committed draw is recorded.
          </p>
          {preview.names.length > 0 && (
            <p className="mt-3 text-sm text-muted">{preview.names.join(" · ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
