"use client";

import { useMemo, useState } from "react";
import type { ChampionshipEvent, FormField } from "@/lib/types";
import { AVATARS } from "@/data/avatars";
import { Avatar } from "./Avatar";
import { PlayerCard } from "./PlayerCard";
import { qualityFor } from "@/data/qualities";

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

export function SignupForm({ event }: { event: ChampionshipEvent }) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [avatarId, setAvatarId] = useState<string>(AVATARS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    status: "confirmed" | "waitlisted";
    reference: string;
    /** Goes in the QR code — not shown on screen, and never printed on a public list. */
    checkInToken: string;
    waitlistPosition?: number;
  }>(null);

  const set = (k: string, v: string | boolean) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const dob = (values.dob as string) ?? "";
  const age = ageOn(dob, event.date);
  const isMinor = age !== null && age < 18;

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
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, avatarId, divisionId: division.id }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-3xl border border-line bg-surface/70 p-8 text-center">
        <h2 className="font-display text-3xl">
          {result.status === "confirmed"
            ? "You're in."
            : "You're on the waitlist."}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {result.status === "confirmed" ? (
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
            <label className="block sm:col-span-2">
              <Label hint="Anything our first aider should know. Leave blank if none.">
                Medical conditions or allergies
              </Label>
              <textarea
                rows={2}
                className={inputCx}
                value={(values.medical as string) ?? ""}
                onChange={(e) => set("medical", e.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <Check
              required
              checked={!!values.guardianConsent}
              onChange={(v) => set("guardianConsent", v)}
              label="My parent or guardian knows I'm entering and gives permission for me to take part."
            />
            <Check
              checked={!!values.photoConsent}
              onChange={(v) => set("photoConsent", v)}
              label="I'm happy to appear in photos and video from the day."
              hint="Optional — tick or leave it, either is completely fine. If you leave it, our photographers are told and you won't be filmed."
            />
          </div>
        </fieldset>
      )}

      {/* 5. On the day + consent */}
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {isMinor ? "5." : "4."} On the day
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
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

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting || !division}
          className="rounded-xl bg-kesri px-8 py-4 font-bold text-ink transition-colors hover:bg-kesrisoft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Sending…" : "Confirm my place"}
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
  values: Record<string, string | boolean>;
  set: (k: string, v: string | boolean) => void;
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
