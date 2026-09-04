"use client";

import { useState } from "react";
import { sendSignInLink } from "@/app/signin/actions";
import { copy } from "@/copy";

export function SignInForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (sent) {
    return (
      <div className="rounded-2xl border border-kesri/40 bg-kesri/[0.07] p-6">
        <h2 className="font-display text-xl text-kesri">
          {copy.signin.sentTitle}
        </h2>
        <p className="mt-3 text-sm text-muted">{copy.signin.sentBody1}</p>
        <p className="mt-3 text-sm text-muted">{copy.signin.sentBody2}</p>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        setBusy(true);
        setError(null);
        try {
          const r = await sendSignInLink(fd);
          if (r?.error) setError(r.error);
          else setSent(true);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block">
        <span className="text-sm font-semibold text-body">
          {copy.signin.emailLabel}
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-body outline-none focus:border-kesri/60"
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm text-kesri">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
      >
        {busy ? copy.common.sending : copy.signin.submit}
      </button>
    </form>
  );
}
