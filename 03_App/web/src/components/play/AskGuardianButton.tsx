"use client";

import { useState } from "react";
import { askGuardian } from "@/app/play/guardian-actions";

export function AskGuardianButton({ status }: { status: string | null }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">(
    status === "pending" ? "sent" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <div className="rounded-xl border border-ok/40 bg-ok/10 p-4">
        <p className="text-sm font-semibold text-body">
          We&apos;ve emailed your parent or guardian.
        </p>
        <p className="mt-1 text-sm text-muted">
          As soon as they say yes, the board opens up for you. Give them a nudge if
          they haven&apos;t seen it.
        </p>
        <button
          onClick={() => setState("idle")}
          className="mt-3 text-sm text-kesri hover:underline"
        >
          Send it again
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        disabled={state === "sending"}
        onClick={async () => {
          setState("sending");
          const res = await askGuardian();
          if (res.ok) setState("sent");
          else {
            setError(res.error ?? "Something went wrong.");
            setState("idle");
          }
        }}
        className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink hover:bg-kesrisoft disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Email my parent or guardian"}
      </button>
      {error && <p className="mt-3 text-sm text-kesrisoft">{error}</p>}
    </div>
  );
}
