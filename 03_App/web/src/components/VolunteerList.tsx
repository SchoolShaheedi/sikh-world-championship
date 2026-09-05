"use client";

import { useState } from "react";
import { decideVolunteer, removeVolunteer } from "@/app/admin/volunteers/actions";
import {
  roleNames,
  availabilityLabel,
  dbsLabel,
  type Volunteer,
} from "@/lib/volunteer-types";

const DBS_TONE: Record<string, string> = {
  yes: "text-ok",
  no: "text-muted",
  "not-sure": "text-kesrisoft",
};

/**
 * The people who offered to help, and the two decisions to make about each one.
 *
 * NOT MASKED, unlike an entrant's record. These are adults who typed their own phone
 * number into a box asking how to reach them, for the express purpose of being reached —
 * masking it would be theatre, and the person who needs it is ringing them at 08:40 on
 * the day. What is here that is genuinely somebody else's is the referee, and that is why
 * the form tells the volunteer to warn them first.
 *
 * DELETION ASKS FOR THE REFERENCE TO BE TYPED, the same as an entry: it removes a
 * person's details and a third party's, and nothing here should be doable by reflex.
 */
export function VolunteerList({ volunteers }: { volunteers: Volunteer[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  async function run(
    fn: (fd: FormData) => Promise<{ ok?: true; message?: string; error?: string }>,
    fd: FormData,
  ) {
    setBusy(true);
    const r = await fn(fd);
    setMessage(r.error ?? r.message ?? null);
    if (!r.error) {
      setConfirming(null);
      setTyped("");
    }
    setBusy(false);
  }

  if (volunteers.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-line bg-ink/20 p-5 text-sm text-muted">
        Nobody has signed up yet. The form is at{" "}
        <a href="/volunteer" className="text-kesri hover:underline">
          /volunteer
        </a>{" "}
        — it is public and needs no account.
      </p>
    );
  }

  return (
    <>
      {message && <p className="mt-4 text-sm text-kesri">{message}</p>}
      <ul className="mt-6 space-y-3">
        {volunteers.map((v) => (
          <li
            key={v.reference}
            className={`rounded-2xl border p-5 ${
              v.status === "new" ? "border-kesri/40 bg-kesri/[0.05]" : "border-line bg-ink/20"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-base font-semibold text-body">
                {v.fullName}
                <span className="ml-2 font-mono text-xs text-muted">{v.reference}</span>
              </p>
              <p className="text-xs text-muted">
                {v.status === "new" ? "not answered yet" : v.status} ·{" "}
                {new Date(v.createdAt).toLocaleDateString("en-GB")}
              </p>
            </div>

            <p className="mt-2 text-sm text-body">{roleNames(v.roles).join(" · ")}</p>
            <p className="mt-1 text-sm text-muted">
              {availabilityLabel(v.availability)} ·{" "}
              <span className={DBS_TONE[v.dbs] ?? "text-muted"}>{dbsLabel(v.dbs)}</span>
            </p>

            <p className="mt-3 text-sm text-muted">
              <a href={`mailto:${v.email}`} className="text-body hover:text-kesri">
                {v.email}
              </a>{" "}
              ·{" "}
              <a href={`tel:${v.mobile}`} className="text-body hover:text-kesri">
                {v.mobile}
              </a>
            </p>

            <p className="mt-2 text-sm text-muted">
              <span className="text-body">Vouched for by</span> {v.refereeName} —{" "}
              {v.refereeRelation} · {v.refereeContact}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(["accepted", "declined", "new"] as const)
                .filter((s) => s !== v.status)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("reference", v.reference);
                      fd.set("status", s);
                      run(decideVolunteer, fd);
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-body transition-colors hover:border-kesri hover:text-kesri disabled:opacity-40"
                  >
                    {s === "accepted"
                      ? "They are in"
                      : s === "declined"
                        ? "Not this time"
                        : "Back to unanswered"}
                  </button>
                ))}

              {confirming === v.reference ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData();
                    fd.set("reference", v.reference);
                    fd.set("confirm", typed);
                    run(removeVolunteer, fd);
                  }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={`Type ${v.reference}`}
                    className="w-40 rounded-lg border border-line bg-ink/40 px-2 py-1 font-mono text-xs text-body"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg border border-kesri px-3 py-1.5 text-xs font-bold text-kesri disabled:opacity-40"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(null);
                      setTyped("");
                    }}
                    className="text-xs text-muted hover:text-body"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(v.reference)}
                  className="ml-auto text-xs text-muted hover:text-body"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
