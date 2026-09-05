"use client";

import { useState } from "react";
import { sendReminders } from "@/app/admin/actions";

/**
 * "We will email again with the venue address and what to bring" — this is that email.
 *
 * A BUTTON, NOT A CRON JOB. The one thing this email exists to carry is a street address,
 * and a scheduled send cannot be told the hall changed. Somebody presses it in the week
 * before, when the details are right.
 *
 * SHUT BEHIND A CONFIRMATION, because it is irreversible in the way that matters: an
 * email to sixty-four children and their parents cannot be unsent. Not a typed
 * confirmation like the delete buttons — this is a good thing to press, just not by
 * accident — but it says the number out loud first.
 *
 * SAFE TO PRESS TWICE, and it will be: the idempotency key is the entry reference, so a
 * second run after three drop-outs are backfilled emails the three and reports the rest
 * as "already had it" rather than sending sixty-four again.
 */
export function ReminderPanel({
  slug,
  withPlace,
  alreadySent,
  guardiansSent,
  venueConfirmed,
}: {
  slug: string;
  withPlace: number;
  alreadySent: number;
  guardiansSent: number;
  venueConfirmed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const outstanding = Math.max(0, withPlace - alreadySent);

  return (
    <div className="mt-8">
      <h3 className="font-display text-lg text-kesri">The reminder email</h3>
      <p className="mt-1 text-sm text-muted">
        The venue address, the times, what to bring, and how to say they can no longer
        come. Under-18s get one and their guardian gets their own, with the collection
        rule on it.
      </p>

      <p className="mt-3 text-sm text-body">
        {withPlace} {withPlace === 1 ? "person has" : "people have"} a place ·{" "}
        {alreadySent} already had it
        {guardiansSent > 0 ? ` · ${guardiansSent} guardian copies sent` : ""}
      </p>

      {!venueConfirmed ? (
        <p className="mt-3 rounded-xl border border-kesri/40 bg-kesri/10 p-3 text-sm text-kesrisoft">
          The venue is not confirmed on this event. The address is the whole point of this
          email, so it will not send until it is.
        </p>
      ) : outstanding === 0 && withPlace > 0 ? (
        <p className="mt-3 text-sm text-muted">
          Everybody with a place has had it. Press again after backfilling drop-outs and
          only the new ones are emailed.
        </p>
      ) : null}

      {venueConfirmed && withPlace > 0 && (
        <div className="mt-3">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-body transition-colors hover:border-kesri/60 hover:text-kesri"
            >
              Send the reminder
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-kesri">
                {outstanding === 0
                  ? "Nobody new to email. Send anyway?"
                  : `This emails ${outstanding} ${outstanding === 1 ? "person" : "people"}, plus a guardian for each under-18. Sure?`}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const fd = new FormData();
                  fd.set("slug", slug);
                  const r = await sendReminders(fd);
                  setMessage(r.error ?? r.message ?? null);
                  setBusy(false);
                  setOpen(false);
                }}
                className="rounded-xl bg-kesri px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
              >
                {busy ? "Sending…" : "Send it"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-muted hover:text-body"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {message && <p className="mt-3 text-sm text-kesri">{message}</p>}
    </div>
  );
}
