"use client";

import { useMemo, useState } from "react";
import type { ChampionshipEvent, FormField } from "@/lib/types";
import { AVATARS } from "@/data/avatars";
import { Avatar } from "./Avatar";
import { REFERRAL_OPTIONS, REFERRAL_OTHER } from "@/data/referral-orgs";
import { checkHandle, defaultHandle, HANDLE_MAX } from "@/lib/handle";
import {
  guardianTier,
  TIER_EXPLANATION,
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
  accessibility: "Accessibility needs",
  avatarId: "Avatar",
  handle: "Name on the bracket",
  guardianName: "Parent / guardian name",
  guardianRelation: "Relationship to player",
  guardianEmail: "Parent / guardian email",
  guardianMobile: "Parent / guardian mobile",
  guardianConsent: "Parent / guardian permission",
  guardianOnSite: "Staying at the venue",
  guardianIndependentConsent: "Permission to attend independently",
  mayLeaveUnaccompanied: "Leaving unaccompanied",
  dietarySelfManaged: "Dietary needs on the day",
  emergencyName: "Emergency contact name",
  emergencyRelation: "Emergency contact relationship",
  emergencyPhone: "Emergency contact phone",
  rulesAgreed: "Rules and code of conduct",
  referralOrg: "How you heard about this",
  referralDetail: "Which one",
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
  testFill = false,
  prefill,
}: {
  event: ChampionshipEvent;
  /** Preview mode: the form works, the submission is discarded. See lib/features.ts. */
  demo?: boolean;
  /**
   * Show the one-click "fill with test data" button.
   *
   * Only ever true in the closed preview or for a browser holding the test key — see the
   * register-interest page. A rehearsal means filling in twenty-odd fields, and doing that
   * by hand is why rehearsals get skipped; doing it in front of the public is why a fake
   * child ends up in a real draw.
   */
  testFill?: boolean;
  /**
   * Values carried over from an existing profile, for a signed-in player registering
   * interest in a second event.
   *
   * Only identity fields that do not change between events. Medical and accessibility
   * are deliberately NOT prefilled: they are purged after each event
   * (04_Legal/RETENTION-POLICY.md), they genuinely change, and a stale allergy shown as
   * already-answered is worse than an empty box. Consents are never prefilled either —
   * a consent has to be given for this event, not inherited from the last one.
   */
  prefill?: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string | boolean | string[]>>(
    () =>
      Object.fromEntries(
        Object.entries(prefill ?? {}).filter(([, v]) => v !== ""),
      ) as Record<string, string>,
  );
  // Checked against the real list: the server rejects an unknown avatar, so a stale id
  // on an old profile would break the form rather than just look wrong.
  const [avatarId, setAvatarId] = useState<string>(() =>
    AVATARS.some((a) => a.id === prefill?.avatarId) ? prefill!.avatarId : AVATARS[0].id,
  );
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
    status: string;
    reference: string;
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

  /**
   * The public name, and what is wrong with it if anything.
   *
   * Checked live with the SAME function the server uses, so the two cannot disagree —
   * the point of the field is that it is not the surname, and finding that out after
   * pressing submit is a bad way to learn it. (It also refuses a PSN ID when one is
   * known; since 2026-09-01 we do not collect one, so that arm never fires here.)
   */
  const handleFallback = defaultHandle((values.fullName as string) ?? "");
  const handleProblem =
    typeof values.handle === "string" && values.handle.trim() !== ""
      ? checkHandle(values.handle, {
          fullName: (values.fullName as string) ?? "",
        })
      : null;

  const tooYoung =
    age !== null && age < Math.min(...event.divisions.map((d) => d.minAge));

  /**
   * The follow-up question to "how did you hear about this?", or null when the answer is
   * already specific. Two of the options name a category rather than an organisation.
   */
  const referralDetailLabel =
    values.referralOrg === "Uni Sikh Society"
      ? "Which university?"
      : values.referralOrg === REFERRAL_OTHER
        ? "Which organisation?"
        : null;

  /**
   * Fill the whole form with made-up details, for a rehearsal.
   *
   * A 13-year-old on purpose: that is the longest path through the form — guardian block,
   * on-site supervision, the guardian email — so one click exercises the parts most likely
   * to be broken. The two email boxes are deliberately left alone: a rehearsal is only
   * worth doing if the emails arrive somewhere a person can read them.
   *
   * Nothing here is a real person. The names are invented and the numbers are Ofcom's
   * reserved 07700 900xxx drama range, which cannot ring anybody.
   */
  function fillWithTestData() {
    setValues((v) => ({
      ...v,
      fullName: "Test Entrant",
      dob: "2013-05-02",
      mobile: "07700 900123",
      region: "Leicester",
      handle: "",
      medicalConditions: [MEDICAL_NONE],
      medical: "",
      accessibility: "",
      referralOrg: "Uni Sikh Society",
      referralDetail: "Leicester",
      guardianName: "Test Guardian",
      guardianRelation: "Mother",
      guardianMobile: "07700 900124",
      guardianConsent: true,
      guardianOnSite: true,
      rulesAgreed: true,
      skill: "Casual player",
      favouriteTeam: "Test FC",
      ownController: false,
    }));
  }

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
          <p className="mx-auto mb-5 max-w-md rounded-xl border-2 border-dashed border-kesri/60 bg-kesri/[0.08] px-4 py-3 text-sm text-kesrisoft">
            <strong className="font-bold">Preview only — nothing was saved.</strong> This is
            what an applicant would see. No application has been recorded.
          </p>
        )}

        {/* Deliberately NOT "You're in". Filling in this form does not secure a place —
            there are more applications than places and they are decided by a draw. Saying
            anything warmer here would be a promise we cannot keep, and the person who
            reads it is often a parent. */}
        <h2 className="font-display text-3xl">Interest registered</h2>

        <p className="mx-auto mt-3 max-w-md text-muted">
          Thanks {String(values.fullName ?? "").split(" ")[0] || "—"}. This is a
          registration of interest, not a place yet: there are {event.capacity} places and
          we expect more interest than that.
        </p>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Applications close{" "}
          {event.applicationsCloseAt
            ? new Date(event.applicationsCloseAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
              })
            : "shortly"}
          , then places are drawn. <span className="text-body">We&apos;ll email you either
          way</span> — you don&apos;t need to do anything until then.
        </p>

        {!result.demo && (
          <p className="mt-5 text-sm text-muted">
            Reference <span className="font-mono text-kesri">{result.reference}</span>
          </p>
        )}

        {!result.demo && (
          <p className="mx-auto mt-6 max-w-md text-sm text-muted">
            We&apos;ve emailed you a copy{isMinor && " and told your parent or guardian"}.
            Your Sikh World Championships profile is set up with this email address — you
            can sign in any time, and it carries over to every future event. If you get a
            place we&apos;ll send a check-in code for the day.
          </p>
        )}
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
                Everyone aged 12 to 21 competes in the same open bracket.
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

        {/* The public name.
            Placed here rather than with "About you" on purpose: this fieldset is
            everything other people see, and the question "what goes on the big screen?"
            only makes sense next to the avatar. */}
        <label className="mt-6 block">
          <Label hint="Shown on the bracket, the big screen and your player card. Not your surname, and please not your PSN ID — anyone could then look you up on PlayStation.">
            Name on the bracket
          </Label>
          <input
            className={inputCx}
            maxLength={HANDLE_MAX}
            placeholder={handleFallback ? `${handleFallback} (leave blank for this)` : "e.g. Amrit S."}
            value={(values.handle as string) ?? ""}
            onChange={(e) => set("handle", e.target.value)}
            aria-invalid={handleProblem ? true : undefined}
          />
          {handleProblem ? (
            <span className="mt-2 block text-sm text-kesri">{handleProblem.message}</span>
          ) : (
            <span className="mt-2 block text-xs text-muted">
              Leave it blank and we&apos;ll use{" "}
              <span className="text-body">{handleFallback || "your first name"}</span>.
            </span>
          )}
        </label>

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
            permission. This is how we keep everyone safe on the day.
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
                hint="Required for players under 16. You don't need to sit with them — there's seating, langar and the bracket on the big screen — but we need you in the building."
              />
            )}

            {tier === "independent" && (
              <>
                <Check
                  required
                  checked={!!values.guardianIndependentConsent}
                  onChange={(v) => set("guardianIndependentConsent", v)}
                  label="I'm happy for them to come to the event on their own, and I'll be reachable on the number above."
                  hint="For players aged 16 and 17. Under 16s need a parent or guardian at the venue."
                />
                <Check
                  checked={!!values.mayLeaveUnaccompanied}
                  onChange={(v) => set("mayLeaveUnaccompanied", v)}
                  label="They may leave the venue unaccompanied at the end of the day."
                  hint="Optional. If you leave this, we'll expect them to be collected."
                />
                {/* The form no longer asks for dietary needs. For 12–15 a parent is in
                    the building all day; 18+ are adults. A 16 or 17-year-old may be here
                    on their own, so this is the one tier where somebody has to be told
                    whose job it is. Required for that reason. */}
                <Check
                  required
                  checked={!!values.dietarySelfManaged}
                  onChange={(v) => set("dietarySelfManaged", v)}
                  label="They'll tell the team about any dietary needs when they arrive."
                  hint="Langar is served on the day. We don't hold a dietary list, so anything that matters — an allergy especially — needs saying at the counter. Put anything a first aider would need in the medical box below as well."
                />
              </>
            )}

          </div>
        </fieldset>
      )}

      {/* 5. On the day + consent */}
      <fieldset className="rounded-3xl border border-line bg-surface/60 p-6">
        <legend className="font-display px-2 text-lg text-kesri">
          {isMinor ? "5." : "4."} On the day
        </legend>

        {/* Referral. Its only use is draw order — referred applicants are drawn first.
            Deliberately NOT a religion question: "Another organisation" and "Nobody" are
            real answers, and nothing infers anything from the choice. */}
        <label className="mb-6 block">
          <Label hint="Places are limited. Applicants referred by a partner organisation are drawn first.">
            How did you hear about this?
          </Label>
          <select
            required
            className={inputCx}
            value={(values.referralOrg as string) ?? ""}
            onChange={(e) => set("referralOrg", e.target.value)}
          >
            <option value="">Choose…</option>
            {REFERRAL_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        {/* Which one. "Uni Sikh Society" and "Another organisation" are both whole
            categories, and the draw treats them as referrals — so without this the
            outreach that actually worked is invisible. Free text, one line, and it is
            not used for anything but knowing who to thank. */}
        {referralDetailLabel && (
          <label className="mb-6 block">
            <Label hint="Just the name — it tells us which outreach is working.">
              {referralDetailLabel}
            </Label>
            <input
              required
              className={inputCx}
              value={(values.referralDetail as string) ?? ""}
              onChange={(e) => set("referralDetail", e.target.value)}
            />
          </label>
        )}

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

        {/* Medical and accessibility together: what a volunteer or first aider needs on
            the day, asked of everyone. Round 24 moved the medical questions here from the
            under-18 guardian section — an adult with epilepsy or a severe allergy needs
            the first aider to know just as much as a child does. Every field is optional.

            The separate "dietary needs" box was dropped on 2026-09-01: langar is served,
            a parent is at the venue for every under-16, and a food allergy is a medical
            fact that belongs in the first-aider box above rather than in a second field
            that only the kitchen reads. 16- and 17-year-olds acknowledge in the guardian
            section that telling us on the day is theirs to do. */}
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

        <label className="mt-5 block">
          <Label hint="Wheelchair access, quiet space, anything else — just ask.">
            Accessibility needs
          </Label>
          <input
            className={inputCx}
            value={(values.accessibility as string) ?? ""}
            onChange={(e) => set("accessibility", e.target.value)}
          />
        </label>

        <div className="mt-5 space-y-4">
          <Check
            required
            checked={!!values.rulesAgreed}
            onChange={(v) => set("rulesAgreed", v)}
            label="I've read the rules and the code of conduct, and I'll play by them."
          />
          {/* STATEMENTS, NOT CHECKBOXES.
              Each of these is a condition of registering rather than a choice, so
              offering a tick box would be offering a choice that does not exist. That is
              a deliberate decision (round 47, team feedback) and it has a legal cost:
              agreement bundled into entry is not "consent" under UK GDPR, so the basis
              for the photography is legitimate interests with a right to object — which
              is why it names the way out.
              See 04_Legal/PHOTOGRAPHY-CONSENT.md and DPIA risk 18. */}
          <div className="space-y-3 rounded-xl border border-line bg-ink/20 p-4 text-sm text-muted">
            <p className="font-semibold text-body">What registering means</p>
            <p>
              <span className="text-body">This registers your interest — it is not a
              place.</span>{" "}
              All {event.capacity} places are decided by a random draw after entries
              close. We email you either way, and we email you now to confirm we have
              this form.
            </p>
            <p>
              <span className="text-body">If you get a place, we&apos;ll create your SWC
              profile.</span>{" "}
              It saves your results and trophies across every event you play in, and you
              sign in with this email address — no password. If you don&apos;t get a place
              this time, no profile is created.
            </p>
            <p>
              <span className="text-body">
                Photos and video are taken at the event.
              </span>{" "}
              By registering{" "}
              {isMinor
                ? "you agree your child may appear in them"
                : "you agree you may appear in them"}
              , on our website, our social media, and in material promoting future
              events. Not for sale, not for sponsors&apos; own advertising. If
              you&apos;d rather{" "}
              {isMinor ? "they were not filmed" : "not be filmed"}, tell us before
              the day and our photographers are told.
            </p>
            <p>
              <span className="text-body">We contact you by email.</span> Your
              confirmation, the result of the draw, and news about future events all come
              by email — there is nothing else to sign up to.
            </p>
            <p className="text-xs">
              Anything here can be stopped at any time — before the day or after it — at{" "}
              <a href="/support" className="text-kesri hover:underline">
                sikhchampionships.com/support
              </a>
              , with no effect on your place.
            </p>
          </div>
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

      {testFill && (
        <div className="rounded-2xl border border-dashed border-kesri/60 bg-kesri/[0.06] p-5">
          <p className="font-display text-kesri">Rehearsal shortcut</p>
          <p className="mt-1 text-sm text-muted">
            Fills every box with made-up details for a 13-year-old — the longest path
            through the form, so it exercises the guardian section and the guardian email.
            <span className="text-body">
              {" "}
              Your own email address is left blank on purpose
            </span>{" "}
            — type one you can actually read, in both boxes, or the emails go nowhere.
          </p>
          <button
            type="button"
            onClick={fillWithTestData}
            className="mt-4 rounded-xl border border-kesri bg-kesri/20 px-5 py-2.5 text-sm font-bold text-kesri transition-colors hover:bg-kesri/30"
          >
            Fill with test data
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting || !division || handleProblem !== null}
          className="rounded-xl bg-kesri px-8 py-4 font-bold text-ink transition-colors hover:bg-kesrisoft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Sending…" : demo ? "Submit (preview — saves nothing)" : "Register interest"}
        </button>
        <p className="text-sm text-muted">
          Free to enter. {event.capacity} places, more applications than places expected.
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
