"use client";

import { useState } from "react";
import { togglePhotoObjection } from "@/app/admin/entries/actions";

/**
 * Recording that somebody does not want to be photographed.
 *
 * WHY A MODERATOR PRESSES IT AND NOT THE PERSON. Photography is a condition of entering
 * (invariant 12), and an objection arrives as a conversation — a message, or a parent
 * saying it at the door. The moderator answers them in words and records the one fact a
 * photographer can act on. A self-service tick box would turn a stated condition back
 * into a consent field, which is precisely what that invariant is about.
 *
 * THE UNDO IS AS EASY AS THE DO. The likely reason this is ever cleared is that it was
 * pressed against the wrong person, and a control that is hard to reverse is a control
 * people avoid touching until they are certain — which on a Saturday morning means not
 * recording it at all.
 */
export function PhotoObjectionToggle({
  reference,
  objectedAt,
}: {
  reference: string;
  objectedAt: string | null;
}) {
  const [at, setAt] = useState(objectedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(objected: boolean) {
    setBusy(true);
    setError(null);
    const r = await togglePhotoObjection(reference, objected);
    if ("error" in r) setError(r.error);
    else setAt(objected ? new Date().toISOString() : null);
    setBusy(false);
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg text-kesri">Photography</h2>
      {at ? (
        <div className="mt-3 rounded-xl border border-kesri/40 bg-kesri/[0.07] p-4">
          <p className="text-sm text-body">
            <strong>Do not photograph.</strong> Recorded{" "}
            {new Date(at).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            . They are on the list under this event on{" "}
            <span className="font-mono">/admin</span>, which is what gets read to the
            photographers.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => set(false)}
            className="mt-3 text-xs text-muted hover:text-body disabled:opacity-40"
          >
            Recorded by mistake — clear it
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-line bg-ink/20 p-4">
          <p className="text-sm text-muted">
            Photography is a condition of entering, so there is nothing to consent to and
            no box they ticked. If they have told us they would rather not be photographed
            — by message, or at the door — record it here and they go on the list the
            photographers are read.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => set(true)}
            className="mt-3 rounded-lg border border-line px-4 py-2 text-xs font-semibold text-body transition-colors hover:border-kesri/60 hover:text-kesri disabled:opacity-40"
          >
            They asked not to be photographed
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-kesri">{error}</p>}
    </section>
  );
}
