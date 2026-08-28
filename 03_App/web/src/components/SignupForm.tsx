"use client";

import { useMemo, useState } from "react";
import type { ChampionshipEvent, FormField } from "@/lib/types";
import { AVATARS } from "@/data/avatars";
import { Avatar } from "./Avatar";
import { PlayerCard } from "./PlayerCard";
import { qualityFor } from "@/data/qualities";
import {
  guardianTier,
  TIER_EXPLANATION,
  GUARDIAN_DISTANCE,
  MEDICAL_CONDITIONS,
  MEDICAL_NONE,
} from "@/lib/guardian-rules";

/**
 * Human names for the keys the server validates, used when a submission is rejected.
 * Anything missing falls back to the raw key rather than hiding the error.
 */
const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  dob: "Date of birth",
  email: "Email",
  mobile: "Mobile",
  region: "Region",
  medicalConditions: "Medical conditions",
  medical: "Medical detail",
  dietary: "Dietary needs",
  accessibility: "Accessibility needs",
  avatarId: "Avatar",
  guardianName: "Parent / guardian name",
  guardianRelation: "Relationship to player",
  guardianEmail: "Parent / guardian email",
  guardianMobile: "Parent / guardian mobile",
  guardianConsent: "Parent / guardian permission",
  guardianOnSite: "Staying at the venue",
  guardianDropOff: "Drop-off and collection",
  guardianDistance: "How far away you'll be",
  guardianIndependentConsent: "Permission to attend independently",
  mayLeaveUnaccompanied: "Leaving unaccompanied",
  guardianPhotoConsent: "Photo permission",
  emergencyName: "Emergency contact name",
  emergencyRelation: "Emergency contact relationship",
  emergencyPhone: "Emergency contact phone",
  rulesAgreed: "Rules and code of conduct",
  accountConsent: "SWC profile",
  photoConsent: "Photo permission",
  psnId: "PSN ID",
  skill: "Self-rating",
  favouriteTeam: "Favourite team",
  ownController: "Own controller",
};

/** Age on a given date (or today if the event date isn't confirmed yet). */
function ageOn(dob: string, on: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const ref = on ? new Date(on) : new Date();
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

const Label = ({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) => (
  <span className="block">
    <span className="block text-sm font-semibold text-body">{children}</span>
    {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
  </span>
);

const inputCx =
  "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-body placeholder:text-muted/60 focus:border-kesri focus:outline-none";

export function SignupForm({
  event,
  demo = false,
}: {
  event: ChampionshipEvent;
  /** Preview mode: the form works, the submission is discarded. See lib/features.ts. */
  demo?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string | boolean | string[]>>({});
  const [avatarId, setAvatarId] = useState<string>(AVATARS[0].id);
  const [submitting, setSubmitting] = useState(false);
  /**
   * A rejected submission. The form used to pass the response straight to `setResult`
   * without checking the status, so a 400 rendered the success screen and told the
   * registrant they were "number undefined in the queue". Validation is strict now, so
   * being rejected is a normal path and has to say something useful.
   */
  const [failure, setFailure] = useState<null | {
    error: string;
    fieldErrors?: Record<string, string>;
  }>(null);
  const [result, setResult] = useState<null | {
    demo?: boolean;
    status: "confirmed" | "waitlisted";
    reference: string;
    /** Goes in the QR code — not shown on screen, and never printed on a public list. */
    checkInToken: string;
    waitlistPosition?: number;
  }>(null);

  const set = (k: string, v: string | boolean | string[]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const dob = (values.dob as string) ?? "";
  const age = ageOn(dob, event.date);
  const isMinor = age !== null && age < 18;

  /**
   * Which guardian questions apply. Tiered rather than blanket — see
   * src/lib/guardian-rules.ts, which the server validator reads from the same module, so
   * the form can never ask for less than the server insists on.
   */
  const tier = age === null ? null : guardianTier(age);

  /** Toggle one value in a multi-select answer, e.g. the medical tick-list. */
  const toggleIn = (key: string, option: string) =>
    setValues((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      // "None" is exclusive: ticking it clears the rest, and ticking anything else
      // clears "None". Otherwise a record can say both "nothing to declare" and "asthma".
      if (option === MEDICAL_NONE) return { ...prev, [key]: next.includes(MEDICAL_NONE) ? [MEDICAL_NONE] : [] };
      return { ...prev, [key]: next.filter((o) => o !== MEDICAL_NONE) };
    });

  /**
   * Division is derived from age, never chosen, so nobody can game it.
   * With a single open division this resolves for every eligible age — but the logic
   * stays age-based so adding divisions to a future event needs no change here.
   */
  const division = useMemo(() => {
    if (age === null) return null;
    return (
      event.divisions.find((d) => age >= d.minAge && age <= d.maxAge) ?? null
    );
  }, [age, event.divisions]);

  const tooYoung =
    age !== null && age < Math.min(...event.divisions.map((d) => d.minAge));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!division) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, avatarId, divisionId: division.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFailure({
          error: data?.error ?? "Something went wrong. Please try again.",
          fieldErrors: data?.fieldErrors,
        });
        return;
      }
      setResult(data);
    } catch {
      setFailure({
        error:
          "We couldn't reach the server. Check your connection and try again — nothing has been submitted.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-3xl border border-line bg-surface/70 p-8 text-center">
        {result.demo && (
          /* The whole point of the demo is to show the flow. The one thing it must never
             do is let someone leave believing they have a place. */
          <p className="mx-auto mb-5 max-w-md rounded-xl border-2 border-dashed border-kesri/60 bg-kesri/[0.08] px-4 py-3 text-sm text-kesrisoft">
            <strong className="font-bold">Preview only — nothing was saved.</strong> This is
            what an entrant would see. No place has been held and no details were stored.
          </p>
        )}
        <h2 className="font-display text-3xl">
          {result.demo
            ? "This is the confirmation screen"
            : result.status === "confirmed"
              ? "You're in."
              : "You're on the waitlist."}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {result.demo ? (
            <>
              A real entrant would be told their place is confirmed here, and would get an
              email with a QR check-in code to bring on the day. None of that happened.
            </>
          ) : result.status === "confirmed" ? (
            <>
              {event.divisions.length === 1 ? (
                <>Your place is confirmed.</>
              ) : (
                <>
                  Your place in the{" "}
                  <strong className="text-body">{division?.name}</strong> division is
                  confirmed.
                </>
              )}{" "}
              Check your email for your check-in QR code — bring it on the day.
            </>
          ) : (
            <>
              All {event.capacity} places are taken, but you&apos;re number{" "}
              <strong className="text-body">{result.waitlistPosition}</strong> in the
              queue. Places usually open up — we&apos;ll email you the moment one does.
            </>
          )}
        </p>
        <p className="mt-4 text-sm text-muted">
          Reference <span className="font-mono text-kesri">{result.reference}</span>
        </p>

        <div className="mt-8">
          <p className="micro">Your player card</p>
          <div className="mt-4 flex justify-center">
            <PlayerCard
              name={(values.fullName as string) || "Player"}
              gamertag={(values.psnId as string) || ""}
              division={division?.name ?? ""}
              region={(values.region as string) || ""}
              avatarId={avatarId}
              eventTitle={event.shortTitle}
              seed={result.reference}
            />
          </div>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted">
            Your quality is <strong className="text-body">{qualityFor(result.reference).name}</strong>{" "}
            — one of 32. Screenshot your card and post it, and see which one your friends
            got.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {/* 1. Player */}
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">1. About you</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <Label>Full name</Label>
            <input
              required
              className={inputCx}
              value={(values.fullName as string) ?? ""}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </label>

          <label className="block">
            <Label hint="Checks you're old enough to compete. We never show your exact age publicly.">
              Date of birth
            </Label>
            <input
              required
              type="date"
              className={inputCx}
              value={dob}
              onChange={(e) => set("dob", e.target.value)}
            />
          </label>

          <label className="block">
            <Label hint="Region only — never your full address.">Area you&apos;re from</Label>
            <input
              required
              placeholder="e.g. Birmingham"
              className={inputCx}
              value={(values.region as string) ?? ""}
              onChange={(e) => set("region", e.target.value)}
            />
          </label>

          <label className="block">
            <Label>Email</Label>
            <input
              required
              type="email"
              className={inputCx}
              value={(values.email as string) ?? ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>

          <label className="block">
            <Label>Mobile</Label>
            <input
              required
              type="tel"
              className={inputCx}
              value={(values.mobile as string) ?? ""}
              onChange={(e) => set("mobile", e.target.value)}
            />
          </label>
        </div>

        {/* Live eligibility feedback */}
        {division && (
          <p className="mt-5 rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm text-body">
            {event.divisions.length === 1 ? (
              <>
                <strong className="font-bold text-ok">You&apos;re eligible.</strong>{" "}
                Everyone competes in one open bracket, whatever their age.
              </>
            ) : (
              <>
                You&apos;ll compete in the{" "}
                <strong className="font-bold text-ok">{division.name}</strong> division.
              </>
            )}
          </p>
        )}
        {tooYoung && (
          <p className="mt-5 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
            You need to be at least {Math.min(...event.divisions.map((d) => d.minAge))} on
            the day of the event to compete. Come along and support anyway — and keep an
            eye out, we&apos;ll be running younger age groups at future events.
          </p>
        )}
      </fieldset>

      {/* 2. Event-specific questions */}
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          2. Your game
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {event.formFields
            .filter((f) => !f.minorsOnly)
            .map((f) => (
              <EventField key={f.name} field={f} values={values} set={set} />
            ))}
        </div>
      </fieldset>

      {/* 3. Player card */}
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          3. Your player card
        </legend>
        <p className="text-sm text-muted">
          Pick an avatar for your card. A photo is optional — you can add one later from
          your profile if you want to, and plenty of players never do.
        </p>

        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAvatarId(a.id)}
              aria-pressed={avatarId === a.id}
              aria-label={a.label}
              className={`rounded-2xl border-2 p-1 transition-colors ${
                avatarId === a.id
                  ? "border-kesri bg-kesri/10"
                  : "border-line hover:border-muted"
              }`}
            >
              <Avatar avatarId={a.id} size={56} alt={a.label} />
            </button>
          ))}
        </div>
      </fieldset>

      {/* 4. Guardian — under 18s only */}
      {isMinor && (
        <fieldset className="rounded-3xl border border-kesri/40 bg-kesri/[0.06] p-6">
          <legend className="font-display px-2 text-lg text-kesri">
            4. Parent or guardian
          </legend>
          <p className="text-sm text-muted">
            You&apos;re under 18, so we need a parent or guardian&apos;s details and their
            permission. This is how we keep everyone safe on the day — see our{" "}
            <a href="/safeguarding" className="text-kesri hover:underline">
              safeguarding policy
            </a>
            .
          </p>
          {tier && tier !== "none" && (
            <p className="mt-3 rounded-xl border border-kesri/30 bg-kesri/[0.08] p-3 text-sm text-body">
              {TIER_EXPLANATION[tier]}
            </p>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <Label>Parent / guardian name</Label>
              <input
                required
                className={inputCx}
                value={(values.guardianName as string) ?? ""}
                onChange={(e) => set("guardianName", e.target.value)}
              />
            </label>
            <label className="block">
              <Label>Their relationship to you</Label>
              <input
                required
                placeholder="e.g. mother, father, uncle"
                className={inputCx}
                value={(values.guardianRelation as string) ?? ""}
                onChange={(e) => set("guardianRelation", e.target.value)}
              />
            </label>
            <label className="block">
              <Label>Their email</Label>
              <input
                required
                type="email"
                className={inputCx}
                value={(values.guardianEmail as string) ?? ""}
                onChange={(e) => set("guardianEmail", e.target.value)}
              />
            </label>
            <label className="block">
              <Label>Their mobile</Label>
              <input
                required
                type="tel"
                className={inputCx}
                value={(values.guardianMobile as string) ?? ""}
                onChange={(e) => set("guardianMobile", e.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">
              To be completed by the parent or guardian
            </p>

            <Check
              required
              checked={!!values.guardianConsent}
              onChange={(v) => set("guardianConsent", v)}
              label="I am this player's parent or guardian, and I give permission for them to take part."
            />

            {/* Supervision promise — one per tier, so nobody answers a question that
                doesn't apply to their child's age. */}
            {tier === "on-site" && (
              <Check
                required
                checked={!!values.guardianOnSite}
                onChange={(v) => set("guardianOnSite", v)}
                label="I will stay at the venue for the whole event."
                hint="Required for players under 12. You don't need to sit with them — there's seating, langar and the bracket on the big screen — but we need you in the building."
              />
            )}

            {tier === "drop-off" && (
              <>
                <Check
                  required
                  checked={!!values.guardianDropOff}
                  onChange={(v) => set("guardianDropOff", v)}
                  label="I will drop my child off and collect them, and I'll be reachable on the number above all day."
                  hint="Required for players aged 12 to 15. They won't be allowed to leave on their own."
                />
                <label className="block">
                  <Label hint="So we know what to expect if we need to call you back to the venue.">
                    How far away will you be during the event?
                  </Label>
                  <select
                    required
                    className={inputCx}
                    value={(values.guardianDistance as string) ?? ""}
                    onChange={(e) => set("guardianDistance", e.target.value)}
                  >
                    <option value="">Choose…</option>
                    {GUARDIAN_DISTANCE.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {tier === "independent" && (
              <>
                <Check
                  required
                  checked={!!values.guardianIndependentConsent}
                  onChange={(v) => set("guardianIndependentConsent", v)}
                  label="I'm happy for them to come to the event and leave on their own, and I'll be reachable on the number above."
                  hint="For players aged 16 and 17."
                />
                <Check
                  checked={!!values.mayLeaveUnaccompanied}
                  onChange={(v) => set("mayLeaveUnaccompanied", v)}
                  label="They may leave the venue unaccompanied at the end of the day."
                  hint="Optional. If you leave this, we'll expect them to be collected."
                />
              </>
            )}

            {/* Photo consent is the guardian's to give, not the child's — a child can't
                agree to their own image being used. Optional either way: decision 18. */}
            <Check
              checked={!!values.guardianPhotoConsent}
              onChange={(v) => set("guardianPhotoConsent", v)}
              label="I'm happy for my child to appear in photos and video from the day."
              hint="Completely optional, and it never affects their place. If you leave it, our photographers are told and they won't be filmed."
            />
          </div>
        </fieldset>
      )}

      {/* 5. On the day + consent */}
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {isMinor ? "5." : "4."} On the day
        </legend>

        {/* Emergency contact — adults only.
            Every participant has one on record: for an under-18 it is the parent or
            guardian captured above, so they are not asked twice. Round 25. */}
        {!isMinor && (
          <div className="mb-6 rounded-2xl border border-line bg-ink/20 p-5">
            <p className="text-xs tracking-[0.16em] text-muted uppercase">
              Emergency contact
            </p>
            <p className="mt-2 text-sm text-muted">
              Someone we can call on the day if you&apos;re hurt or unwell. Not you —
              someone who isn&apos;t at the event.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <label className="block">
                <Label>Their name</Label>
                <input
                  required
                  className={inputCx}
                  value={(values.emergencyName as string) ?? ""}
                  onChange={(e) => set("emergencyName", e.target.value)}
                />
              </label>
              <label className="block">
                <Label>Relationship to you</Label>
                <input
                  required
                  placeholder="partner, brother, friend…"
                  className={inputCx}
                  value={(values.emergencyRelation as string) ?? ""}
                  onChange={(e) => set("emergencyRelation", e.target.value)}
                />
              </label>
              <label className="block">
                <Label>Their phone number</Label>
                <input
                  required
                  type="tel"
                  className={inputCx}
                  value={(values.emergencyPhone as string) ?? ""}
                  onChange={(e) => set("emergencyPhone", e.target.value)}
                />
              </label>
            </div>
          </div>
        )}

        {isMinor && (
          <p className="mb-6 rounded-2xl border border-line bg-ink/20 p-4 text-sm text-muted">
            <span className="text-body">Emergency contact:</span> we&apos;ll use the parent
            or guardian details above, so there&apos;s nothing extra to fill in here.
          </p>
        )}

        {/* Medical, dietary and accessibility together: they are the three things a
            volunteer or first aider needs on the day, and they are asked of everyone.
            Round 24 moved the medical questions here from the under-18 guardian section —
            an adult with epilepsy or a severe allergy needs the first aider to know just
            as much as a child does, and dietary allergies were already collected from
            everyone, so asking only minors was inconsistent. Every field stays optional. */}
            <div>
            <Label hint="Tick anything that applies. Our first aider reads this, so 'None' is a real answer we need.">
              Medical conditions
            </Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {MEDICAL_CONDITIONS.map((c) => {
                const selected = Array.isArray(values.medicalConditions)
                  ? (values.medicalConditions as string[]).includes(c)
                  : false;
                return (
                  <label
                    key={c}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-surface/60 p-3 text-sm has-checked:border-kesri/60 has-checked:bg-kesri/[0.08]"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleIn("medicalConditions", c)}
                      className="mt-0.5 h-4 w-4 accent-kesri"
                    />
                    <span className="text-body">{c}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <label className="mt-5 block">
            <Label hint="Which inhaler, which allergy, what to do — the detail a first aider would actually need. Leave blank if nothing applies.">
              Anything else our first aider should know
            </Label>
            <textarea
              rows={2}
              className={inputCx}
              value={(values.medical as string) ?? ""}
              onChange={(e) => set("medical", e.target.value)}
            />
          </label>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <Label hint="Wheelchair access, quiet space, anything else — just ask.">
              Accessibility needs
            </Label>
            <input
              className={inputCx}
              value={(values.accessibility as string) ?? ""}
              onChange={(e) => set("accessibility", e.target.value)}
            />
          </label>
          <label className="block">
            <Label hint="Langar is served. Tell us about allergies.">
              Dietary needs
            </Label>
            <input
              className={inputCx}
              value={(values.dietary as string) ?? ""}
              onChange={(e) => set("dietary", e.target.value)}
            />
          </label>
        </div>

        {!isMinor && (
          <div className="mt-6">
            <Check
              checked={!!values.photoConsent}
              onChange={(v) => set("photoConsent", v)}
              label="I'm happy to appear in photos and video from the day."
              hint="Optional."
            />
          </div>
        )}

        <div className="mt-5 space-y-4">
          <Check
            required
            checked={!!values.rulesAgreed}
            onChange={(v) => set("rulesAgreed", v)}
            label="I've read the rules and the code of conduct, and I'll play by them."
          />
          <Check
            required
            checked={!!values.accountConsent}
            onChange={(v) => set("accountConsent", v)}
            label="Create my Sikh World Championship profile so my results and trophies are saved."
          />
        </div>
      </fieldset>

      {failure && (
        <div
          role="alert"
          className="rounded-2xl border border-kesri/50 bg-kesri/[0.08] p-5"
        >
          <p className="font-semibold text-body">{failure.error}</p>
          {failure.fieldErrors && Object.keys(failure.fieldErrors).length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {Object.entries(failure.fieldErrors).map(([field, message]) => (
                <li key={field}>
                  {/* Field keys are camelCase internally; a registrant should not have to
                      read "guardianOnSite". */}
                  <span className="text-body">{FIELD_LABELS[field] ?? field}</span>
                  {" — "}
                  {message}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted">
            Nothing has been submitted yet. Fix the above and press the button again.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting || !division}
          className="rounded-xl bg-kesri px-8 py-4 font-bold text-ink transition-colors hover:bg-kesrisoft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Sending…" : demo ? "Submit (preview — saves nothing)" : "Confirm my place"}
        </button>
        <p className="text-sm text-muted">
          Free to enter. {event.capacity} places.
        </p>
      </div>
    </form>
  );
}

function EventField({
  field,
  values,
  set,
}: {
  field: FormField;
  // Shares the parent form's value bag, which holds arrays for multi-select answers.
  values: Record<string, string | boolean | string[]>;
  set: (k: string, v: string | boolean | string[]) => void;
}) {
  const wide = field.type === "textarea" || field.type === "checkbox";

  if (field.type === "checkbox") {
    return (
      <div className="sm:col-span-2">
        <Check
          checked={!!values[field.name]}
          onChange={(v) => set(field.name, v)}
          label={field.label}
          hint={field.help}
        />
      </div>
    );
  }

  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <Label hint={field.help}>{field.label}</Label>
      {field.type === "select" ? (
        <select
          required={field.required}
          className={inputCx}
          value={(values[field.name] as string) ?? ""}
          onChange={(e) => set(field.name, e.target.value)}
        >
          <option value="">Choose…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          required={field.required}
          rows={3}
          className={inputCx}
          value={(values[field.name] as string) ?? ""}
          onChange={(e) => set(field.name, e.target.value)}
        />
      ) : (
        <input
          required={field.required}
          type={field.type}
          placeholder={field.placeholder}
          className={inputCx}
          value={(values[field.name] as string) ?? ""}
          onChange={(e) => set(field.name, e.target.value)}
        />
      )}
    </label>
  );
}

function Check({
  checked,
  onChange,
  label,
  hint,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer gap-3">
      <input
        type="checkbox"
        required={required}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0 accent-[var(--swc-kesri)]"
      />
      <span>
        <span className="block text-sm text-body">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
