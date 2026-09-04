"use client";

import { useState } from "react";
import { askGuardian } from "@/app/play/guardian-actions";
import { copy } from "@/copy";

export function AskGuardianButton({ status }: { status: string | null }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">(
    status === "pending" ? "sent" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <div className="rounded-xl border border-ok/40 bg-ok/10 p-4">
        <p className="text-sm font-semibold text-body">
          {copy.play.askGuardianSentTitle}
        </p>
        <p className="mt-1 text-sm text-muted">
          {copy.play.askGuardianSentBody}
        </p>
        <button
          onClick={() => setState("idle")}
          className="mt-3 text-sm text-kesri hover:underline"
        >
          {copy.play.askGuardianSendAgain}
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
            setError(res.error ?? copy.play.askGuardianError);
            setState("idle");
          }
        }}
        className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink hover:bg-kesrisoft disabled:opacity-50"
      >
        {state === "sending" ? copy.common.sending : copy.play.askGuardianCta}
      </button>
      {error && <p className="mt-3 text-sm text-kesrisoft">{error}</p>}
    </div>
  );
}
