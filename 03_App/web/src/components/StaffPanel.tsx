"use client";

import { useState } from "react";
import { addStaff, removeStaff } from "@/app/admin/people/actions";
import type { StaffMember, StaffGrant, StaffRole } from "@/lib/staff";

/**
 * Adding and removing the people who can do things.
 *
 * THE DESIGN PROBLEM. Two roles of wildly different weight sit on one page, and the danger
 * is that they look alike enough for somebody to pick the wrong one in a hurry. So the
 * default is `desk`, the moderator option carries what it actually grants in the label
 * rather than in help text somewhere else, and choosing it makes the button say what it is
 * about to do. Nothing is hidden behind a confirmation dialogue — those get clicked
 * through — the wording just stops pretending the two are the same size.
 */
export function StaffPanel({
  staff,
  grants,
  meEmail,
}: {
  staff: StaffMember[];
  grants: StaffGrant[];
  meEmail: string;
}) {
  const [role, setRole] = useState<StaffRole>("desk");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function run(fn: (fd: FormData) => Promise<{ ok?: true; message?: string; error?: string }>, fd: FormData) {
    setBusy(true);
    setMessage(null);
    setError(null);
    const r = await fn(fd);
    if (r.error) setError(r.error);
    else if (r.message) setMessage(r.message);
    setBusy(false);
  }

  const moderators = staff.filter((s) => s.role === "moderator");

  return (
    <div>
      <form
        className="rounded-3xl border border-line bg-surface/60 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData();
          fd.set("email", email);
          fd.set("role", role);
          fd.set("note", note);
          run(addStaff, fd).then(() => {
            setEmail("");
            setNote("");
          });
        }}
      >
        <h2 className="font-display text-2xl">Add somebody</h2>
        <p className="mt-1 text-sm text-muted">
          Any email address. If they have never been here, an account is created and they
          sign in at <span className="text-body">/signin</span> with a link — there is no
          password to send them.
        </p>

        <label className="mt-5 block text-sm text-muted">
          Their email address
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="volunteer@example.com"
            className="mt-1.5 w-full rounded-xl border border-line bg-ink/40 px-4 py-3 text-body placeholder:text-muted/70 focus:border-kesri focus:outline-none"
          />
        </label>

        <fieldset className="mt-5">
          <legend className="text-sm text-muted">What they can do</legend>
          <div className="mt-2 space-y-2">
            {(
              [
                {
                  id: "desk" as StaffRole,
                  title: "Arrival desk only",
                  detail:
                    "Check people in, print the slips, record that a date of birth was seen. Nothing else — no admin page, no messages, no draw, no deletion. This is the one for volunteers on the door.",
                },
                {
                  id: "moderator" as StaffRole,
                  title: "Full moderator — everything",
                  detail:
                    "All of the above, plus every applicant's name, date of birth, mobile and guardian contact; safeguarding reports and messages; running the draw; and deleting accounts. Give this to the people organising the event, not to somebody helping for an afternoon.",
                },
              ]
            ).map((opt) => (
              <label
                key={opt.id}
                className={`block cursor-pointer rounded-2xl border p-4 transition-colors ${
                  role === opt.id
                    ? "border-kesri/70 bg-kesri/[0.07]"
                    : "border-line hover:border-line"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="role"
                    checked={role === opt.id}
                    onChange={() => setRole(opt.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-body">{opt.title}</span>
                    <span className="mt-1 block text-sm text-muted">{opt.detail}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-5 block text-sm text-muted">
          Why, for the record (optional)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="On the door for Sikh FC 27"
            className="mt-1.5 w-full rounded-xl border border-line bg-ink/40 px-4 py-3 text-body placeholder:text-muted/70 focus:border-kesri focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={busy || !email}
          className="mt-5 rounded-xl bg-kesri px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
        >
          {busy
            ? "Working…"
            : role === "moderator"
              ? "Give full moderator access"
              : "Give desk access"}
        </button>

        {message && (
          <p className="mt-4 rounded-xl border border-emerald-400/50 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-rose-400/50 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </p>
        )}
      </form>

      <h2 className="font-display mt-10 text-2xl">Who has access</h2>
      <p className="mt-1 text-sm text-muted">
        {moderators.length} moderator{moderators.length === 1 ? "" : "s"} ·{" "}
        {staff.length - moderators.length} desk
      </p>

      <ul className="mt-4 divide-y divide-line/60 rounded-2xl border border-line">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-[14rem] flex-1">
              <p className="font-semibold text-body">
                {s.email}
                {s.email === meEmail && <span className="ml-2 text-xs text-muted">(you)</span>}
              </p>
              <p className="text-xs text-muted">
                {s.role === "moderator" ? "Full moderator" : "Arrival desk only"}
                {" · added "}
                {new Date(s.createdAt).toLocaleDateString("en-GB")}
              </p>
              {s.neverSignedIn && (
                /* The invitation is a link to an address somebody typed. A typo makes an
                   account that can never be used, and the day of the event is a bad time
                   to discover it. */
                <p className="text-xs text-amber-300">
                  Has never signed in — check the address is right
                </p>
              )}
            </div>

            {confirmRemove === s.email ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("email", s.email);
                    run(removeStaff, fd).then(() => setConfirmRemove(null));
                  }}
                  className="rounded-lg bg-rose-500/80 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  Yes, remove all access
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(null)}
                  className="text-xs text-muted underline"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(s.email)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-body"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {grants.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-muted">Every change, recorded</h2>
          <p className="mt-1 text-sm text-muted">
            &ldquo;Somebody made them a moderator&rdquo; is not an answer, so this says who.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted">
            {grants.map((g, i) => (
              <li key={`${g.at}-${i}`} className="flex flex-wrap gap-x-3">
                <span>{new Date(g.at).toLocaleString("en-GB")}</span>
                <span className={g.granted ? "text-emerald-300" : "text-rose-300"}>
                  {g.granted ? "granted" : "removed"} {g.role}
                </span>
                <span className="text-body">{g.targetEmail}</span>
                <span>by {g.actorEmail}</span>
                {g.note && <span>— {g.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
