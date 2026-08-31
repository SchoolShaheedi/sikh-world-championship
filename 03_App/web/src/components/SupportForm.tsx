"use client";

import { useState } from "react";
import { SUPPORT_CATEGORIES } from "@/lib/support-types";
import { submitTicket } from "@/app/support/actions";

const field =
  "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-body placeholder:text-muted/60 focus:border-kesri focus:outline-none";

export function SupportForm({ initialCategory }: { initialCategory?: string } = {}) {
  /**
   * The first category is the default because it is the safeguarding one — if someone
   * lands here worried about a child, the right option is already selected.
   *
   * `initialCategory` overrides it when the person arrived from a page that already knows
   * why (the volunteer page, for instance). Validated against the real list so a hand-typed
   * query string cannot leave the form with no category selected.
   */
  const [categoryId, setCategoryId] = useState<string>(() =>
    SUPPORT_CATEGORIES.some((c) => c.id === initialCategory)
      ? initialCategory!
      : SUPPORT_CATEGORIES[0].id,
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; urgent: boolean } | null>(null);

  const category = SUPPORT_CATEGORIES.find((c) => c.id === categoryId)!;

  if (done) {
    return (
      <div className="rounded-3xl border border-ok/40 bg-ok/[0.07] p-8 text-center">
        <h2 className="font-display text-2xl">Message received.</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {done.urgent
            ? "This has gone straight to the top of our moderators' queue. Someone will look at it within 24 hours."
            : "We'll come back to you as soon as we can — usually within a few days."}
        </p>
        <p className="mt-4 text-sm text-muted">
          Your reference is{" "}
          <span className="font-mono text-kesri">{done.reference}</span>
        </p>
        <button
          onClick={() => setDone(null)}
          className="mt-6 rounded-xl border border-line px-5 py-2.5 text-sm text-body"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        const res = await submitTicket(fd);
        if ("error" in res && res.error) setError(res.error);
        else if ("reference" in res && res.reference) {
          setError(null);
          setDone({ reference: res.reference, urgent: !!res.urgent });
        }
      }}
      className="space-y-8"
    >
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          What&apos;s it about?
        </legend>

        <div className="space-y-2.5">
          {SUPPORT_CATEGORIES.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                categoryId === c.id
                  ? "border-kesri bg-kesri/[0.08]"
                  : "border-line hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c.id}
                checked={categoryId === c.id}
                onChange={() => setCategoryId(c.id)}
                className="mt-1 size-4 shrink-0 accent-[var(--swc-kesri)]"
              />
              <span>
                <span className="block text-sm font-semibold text-body">
                  {c.label}
                  {c.urgent && (
                    <span className="ml-2 rounded bg-kesri/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-kesri uppercase">
                      Priority
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{c.help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          Tell us what happened
        </legend>

        <label className="block">
          <span className="text-sm font-semibold text-body">
            Subject <span className="font-normal text-muted">(optional)</span>
          </span>
          <input name="subject" className={field} placeholder="One line summary" />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-body">Your message</span>
          <textarea
            name="message"
            rows={6}
            required
            className={field}
            placeholder={
              category.urgent
                ? "What happened, who was involved, and when. Include anything you can — names, dates, what was said."
                : "As much detail as you can give us."
            }
          />
        </label>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          How we reach you
        </legend>
        <p className="text-sm text-muted">
          You can leave these blank and send it anonymously. We&apos;d rather hear from
          you anonymously than not hear from you at all — but without an email we
          can&apos;t come back to you.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-body">
              Your name <span className="font-normal text-muted">(optional)</span>
            </span>
            <input name="name" className={field} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-body">
              Email <span className="font-normal text-muted">(optional)</span>
            </span>
            <input name="email" type="email" className={field} />
          </label>
        </div>

        <label className="mt-5 flex cursor-pointer gap-3">
          <input
            type="checkbox"
            name="fromGuardian"
            className="mt-1 size-5 shrink-0 accent-[var(--swc-kesri)]"
          />
          <span>
            <span className="block text-sm text-body">
              I&apos;m a parent or guardian
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              So we know to reply to you rather than to a young person.
            </span>
          </span>
        </label>
      </fieldset>

      {error && (
        <p className="rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="rounded-xl bg-kesri px-8 py-4 font-bold text-ink hover:bg-kesrisoft"
      >
        Send message
      </button>
    </form>
  );
}
