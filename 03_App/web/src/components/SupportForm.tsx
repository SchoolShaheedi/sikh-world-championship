"use client";

import { useState } from "react";
import { SUPPORT_CATEGORIES } from "@/lib/support-types";
import { submitTicket } from "@/app/support/actions";
import { copy } from "@/copy";

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
        <h2 className="font-display text-2xl">{copy.support.doneTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {done.urgent ? copy.support.doneUrgent : copy.support.doneNormal}
        </p>
        <p className="mt-4 text-sm text-muted">
          {copy.support.doneReference}{" "}
          <span className="font-mono text-kesri">{done.reference}</span>
        </p>
        <button
          onClick={() => setDone(null)}
          className="mt-6 rounded-xl border border-line px-5 py-2.5 text-sm text-body"
        >
          {copy.support.doneAnother}
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
          {copy.support.formAboutLegend}
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
                      {copy.support.formPriority}
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
          {copy.support.formDetailLegend}
        </legend>

        <label className="block">
          <span className="text-sm font-semibold text-body">
            {copy.support.formSubject}{" "}
            <span className="font-normal text-muted">
              {copy.support.formOptional}
            </span>
          </span>
          <input
            name="subject"
            className={field}
            placeholder={copy.support.formSubjectPlaceholder}
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-body">
            {copy.support.formMessage}
          </span>
          <textarea
            name="message"
            rows={6}
            required
            className={field}
            placeholder={
              category.urgent
                ? copy.support.formMessagePlaceholderUrgent
                : copy.support.formMessagePlaceholder
            }
          />
        </label>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {copy.support.formReachLegend}
        </legend>
        <p className="text-sm text-muted">{copy.support.formReachIntro}</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-body">
              {copy.support.formName}{" "}
              <span className="font-normal text-muted">
                {copy.support.formOptional}
              </span>
            </span>
            <input name="name" className={field} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-body">
              {copy.support.formEmail}{" "}
              <span className="font-normal text-muted">
                {copy.support.formOptional}
              </span>
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
              {copy.support.formGuardian}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {copy.support.formGuardianHint}
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
        {copy.support.formSubmit}
      </button>
    </form>
  );
}
