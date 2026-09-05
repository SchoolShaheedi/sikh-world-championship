"use client";

import { useState } from "react";
import {
  VOLUNTEER_ROLES,
  VOLUNTEER_AVAILABILITY,
  VOLUNTEER_DBS,
} from "@/lib/volunteer-types";
import { submitVolunteer } from "@/app/volunteer/actions";
import { copy } from "@/copy";
import { Rich } from "@/copy/Rich";

const field =
  "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-body placeholder:text-muted/60 focus:border-kesri focus:outline-none";

/**
 * The volunteer sign-up.
 *
 * REPLACES A LINK TO THE SUPPORT FORM. Until now the one call to action on /volunteer
 * sent people to "Something else"-shaped free text, so an offer of help arrived as a
 * paragraph and the three things that decide whether somebody can be given a job — DBS,
 * availability, and does anybody vouch for them — were never asked.
 *
 * WRITTEN FOR SOMEBODY DOING A GOOD TURN, which sets the tone for two of the boxes:
 *
 *   - The DBS question says, in the help text, that we do not want the certificate
 *     number and that "no" rules nothing out. Both are true, and unsaid they make a
 *     helpful person feel investigated.
 *   - The referee box says to tell the person first. They have not visited this site and
 *     have not agreed to anything, and asking somebody to hand over a third party's phone
 *     number without a word about it is the thing on this form worth being careful with.
 */
export function VolunteerForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (done) {
    return (
      <div className="rounded-3xl border border-ok/40 bg-ok/[0.07] p-8 text-center">
        <h2 className="font-display text-2xl">{copy.volunteer.doneTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">{copy.volunteer.doneBody}</p>
        <p className="mt-4 text-sm text-muted">
          {copy.volunteer.doneReference}{" "}
          <span className="font-mono text-kesri">{done}</span>
        </p>
        <button
          onClick={() => setDone(null)}
          className="mt-6 rounded-xl border border-line px-5 py-2.5 text-sm text-body"
        >
          {copy.volunteer.doneAnother}
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        const res = await submitVolunteer(fd);
        if ("error" in res && res.error) setError(res.error);
        else if ("reference" in res && res.reference) {
          setError(null);
          setDone(res.reference);
        }
      }}
      className="space-y-8"
    >
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {copy.volunteer.formRolesLegend}
        </legend>
        <p className="text-sm text-muted">{copy.volunteer.formRolesHelp}</p>

        <div className="mt-4 space-y-2.5">
          {VOLUNTEER_ROLES.map((r) => (
            <label
              key={r.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-line p-4 transition-colors hover:border-muted"
            >
              <input
                type="checkbox"
                name="roles"
                value={r.id}
                className="mt-1 size-4 shrink-0 accent-[var(--swc-kesri)]"
              />
              <span>
                <span className="block text-sm font-semibold text-body">
                  {r.name}
                  {"dbsRequired" in r && r.dbsRequired && (
                    <span className="ml-2 rounded bg-kesri/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-kesri uppercase">
                      {copy.volunteer.formDbsNeeded}
                    </span>
                  )}
                </span>
                {r.detail && (
                  <span className="mt-0.5 block text-xs text-muted">{r.detail}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {copy.volunteer.formWhenLegend}
        </legend>
        <div className="space-y-2.5">
          {VOLUNTEER_AVAILABILITY.map((a, i) => (
            <label
              key={a.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-line p-4 transition-colors hover:border-muted"
            >
              <input
                type="radio"
                name="availability"
                value={a.id}
                defaultChecked={i === 0}
                className="mt-1 size-4 shrink-0 accent-[var(--swc-kesri)]"
              />
              <span>
                <span className="block text-sm font-semibold text-body">{a.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{a.help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {copy.volunteer.formDbsLegend}
        </legend>
        <p className="text-sm text-muted">{copy.volunteer.formDbsHelp}</p>
        <div className="mt-4 space-y-2.5">
          {VOLUNTEER_DBS.map((d, i) => (
            <label key={d.id} className="flex cursor-pointer gap-3">
              <input
                type="radio"
                name="dbs"
                value={d.id}
                defaultChecked={i === VOLUNTEER_DBS.length - 1}
                className="mt-0.5 size-4 shrink-0 accent-[var(--swc-kesri)]"
              />
              <span className="text-sm text-body">{d.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {copy.volunteer.formYouLegend}
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-body">
              {copy.volunteer.formName}
            </span>
            <input name="fullName" required autoComplete="name" className={field} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-body">
              {copy.volunteer.formEmail}
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={field}
            />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-body">
            {copy.volunteer.formMobile}
          </span>
          <input name="mobile" type="tel" required autoComplete="tel" className={field} />
          <span className="mt-1.5 block text-xs text-muted">
            {copy.volunteer.formMobileHelp}
          </span>
        </label>

        <label className="mt-6 flex cursor-pointer gap-3">
          <input
            type="checkbox"
            name="over18"
            required
            className="mt-1 size-5 shrink-0 accent-[var(--swc-kesri)]"
          />
          <span>
            <span className="block text-sm text-body">{copy.volunteer.formOver18}</span>
            <span className="mt-0.5 block text-xs text-muted">
              {copy.volunteer.formOver18Help}
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {copy.volunteer.formRefereeLegend}
        </legend>
        <p className="text-sm text-muted">
          <Rich
            text={copy.volunteer.formRefereeIntro}
            em={(s, i) => (
              <strong key={i} className="text-body">
                {s}
              </strong>
            )}
          />
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-body">
              {copy.volunteer.formRefereeName}
            </span>
            <input name="refereeName" required className={field} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-body">
              {copy.volunteer.formRefereeContact}
            </span>
            <input name="refereeContact" required className={field} />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-body">
            {copy.volunteer.formRefereeRelation}
          </span>
          <input
            name="refereeRelation"
            required
            placeholder={copy.volunteer.formRefereeRelationPlaceholder}
            className={field}
          />
        </label>
      </fieldset>

      {error && (
        <p className="rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          className="rounded-xl bg-kesri px-8 py-4 font-bold text-ink hover:bg-kesrisoft"
        >
          {copy.volunteer.formSubmit}
        </button>
        <p className="mt-4 max-w-xl text-xs text-muted">{copy.volunteer.formPrivacy}</p>
      </div>
    </form>
  );
}
