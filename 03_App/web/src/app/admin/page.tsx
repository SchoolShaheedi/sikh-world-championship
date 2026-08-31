import type { Metadata } from "next";
import { currentPlayer } from "@/lib/session";
import { EVENTS } from "@/data/events";
import { registrationsFor } from "@/lib/store";
import { getDb } from "@/lib/db";
import { isReferred } from "@/data/referral-orgs";
import { DrawPanel } from "@/components/DrawPanel";
import { PublicNamePanel } from "@/components/PublicNamePanel";
import { EntryAdminPanel, type EntryRow } from "@/components/EntryAdminPanel";
import { bracketNames } from "@/lib/players";
import { dormancySnapshot, DORMANT_PROFILE_RETENTION_MONTHS } from "@/lib/retention";

export const metadata: Metadata = { title: "Admin" };

/**
 * Never prerender. What this shows depends entirely on who is asking, and it holds
 * applicants' names — the same reasoning as /moderation.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await currentPlayer();
  if (!me?.isModerator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Moderators only</h1>
        <p className="mt-3 text-muted">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const db = await getDb();

  const events = await Promise.all(
    EVENTS.map(async (event) => {
      const rows = await registrationsFor(event.slug);
      const applied = rows.filter((r) => r.status === "applied");
      const { results: draws } = await db
        .prepare("SELECT * FROM draws WHERE event_slug = ? ORDER BY ran_at DESC")
        .bind(event.slug)
        .all<{ id: string; ran_at: string; seed: string; applicants: number; places: number }>();

      return {
        event,
        names: await bracketNames(event.slug),
        /**
         * Every entry, whatever its status, so a test entry can be deleted before the
         * draw as well as after it. `playerId` may be null: the retention job unlinks a
         * dormant profile and leaves the row, and an erasure request has to be able to
         * reach one of those too.
         */
        entries: rows.map(
          (r): EntryRow => ({
            reference: r.reference,
            fullName: String(r.answers.fullName ?? "—"),
            email: String(r.answers.email ?? "—"),
            status: r.status,
            createdAt: r.createdAt,
            playerId: r.playerId ?? null,
          }),
        ),
        counts: {
          applied: applied.length,
          selected: rows.filter((r) => r.status === "selected").length,
          notSelected: rows.filter((r) => r.status === "not-selected").length,
          checkedIn: rows.filter((r) => r.status === "checked-in").length,
          // Only among those still waiting — what the next draw actually has to work with.
          referredWaiting: applied.filter((r) => isReferred(r.answers.referralOrg as string)).length,
        },
        draws,
      };
    }),
  );

  /**
   * Retention numbers, read once for the whole page. Not per event — the dormant-profile
   * rule is the one retention rule with no event behind it, which is exactly why it needed
   * a decision of its own.
   */
  const dormancy = await dormancySnapshot();

  const { results: runs } = await db
    .prepare("SELECT * FROM retention_runs ORDER BY ran_at DESC LIMIT 8")
    .all<{ ran_at: string; event_slug: string; action: string; rows_affected: number; note: string | null }>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl">Admin</h1>
      <p className="mt-3 text-muted">
        Applications and the draw. Everything here is recorded — see the draw history under
        each event.
      </p>

      {events.map(({ event, counts, draws, names, entries }) => (
        <section
          key={event.slug}
          className="mt-10 rounded-3xl border border-line bg-surface/60 p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl">{event.title}</h2>
            <p className="text-sm text-muted">
              {event.capacity} places
              {event.applicationsCloseAt && (
                <>
                  {" · "}applications close{" "}
                  {new Date(event.applicationsCloseAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                  })}
                </>
              )}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              ["Awaiting the draw", counts.applied],
              ["— of those, referred", counts.referredWaiting],
              ["Selected", counts.selected],
              ["Not selected", counts.notSelected],
            ].map(([label, n]) => (
              <div key={label} className="rounded-2xl border border-line bg-ink/30 p-4">
                <p className="text-[11px] tracking-[0.16em] text-muted uppercase">{label}</p>
                <p className="font-display mt-1.5 text-2xl text-body">{n}</p>
              </div>
            ))}
          </div>

          <DrawPanel
            slug={event.slug}
            capacity={event.capacity}
            placesLeft={Math.max(0, event.capacity - counts.selected - counts.checkedIn)}
            waiting={counts.applied}
            latestDrawId={draws[0]?.id ?? null}
          />

          <PublicNamePanel names={names} />

          <EntryAdminPanel entries={entries} />

          {draws.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-lg text-kesri">Draw history</h3>
              <p className="mt-1 text-sm text-muted">
                Each draw records the seed it used, so the same result can be recomputed and
                shown to be honest.
              </p>
              <ul className="mt-3 space-y-2">
                {draws.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-line bg-ink/20 p-3 text-sm"
                  >
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-body">
                        {new Date(d.ran_at).toLocaleString("en-GB")}
                      </span>
                      <span className="text-muted">
                        {d.places} places from {d.applicants} applicants
                      </span>
                      <span className="font-mono text-xs text-muted">seed {d.seed}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}

      {/* Retention.
          Deliberately the quiet corner at the bottom: nobody comes to this page for it,
          and it should not compete with the draw. But it has to be SOMEWHERE a person
          looks, because a deletion job that reports to nothing is indistinguishable from
          one that has silently stopped running — and the thing it deletes is a child's
          account. */}
      <section className="mt-16 border-t border-line pt-8 text-sm">
        <h2 className="font-display text-lg text-muted">Retention</h2>
        <p className="mt-2 max-w-2xl text-muted">
          A profile that never attended an event is deleted after{" "}
          {DORMANT_PROFILE_RETENTION_MONTHS} months of no activity — no sign-in and no new
          registration. Moderators, anyone who attended, and anyone named on a report or a
          support ticket are exempt. Runs nightly at 03:15.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["Profiles", dormancy.profiles],
            ["In scope of the rule", dormancy.inScope],
            ["Due in the next 90 days", dormancy.dueWithin90Days],
            ["Deleted to date", dormancy.deletedAllTime],
          ].map(([label, n]) => (
            <div key={label} className="rounded-xl border border-line bg-ink/20 p-3">
              <p className="text-[10px] tracking-[0.16em] text-muted uppercase">{label}</p>
              <p className="font-display mt-1 text-xl text-muted">{n}</p>
            </div>
          ))}
        </div>

        {dormancy.dueNow > 0 && (
          /* Non-zero here means the nightly job has not run since these accounts passed
             the line. Worth saying out loud rather than leaving in a column. */
          <p className="mt-4 rounded-xl border border-kesri/40 bg-kesri/[0.06] p-3 text-body">
            {dormancy.dueNow} profile{dormancy.dueNow === 1 ? "" : "s"} past the{" "}
            {DORMANT_PROFILE_RETENTION_MONTHS}-month line and not yet deleted. The nightly
            job should clear these — if this number persists, it has stopped running.
          </p>
        )}

        <p className="mt-4 text-muted">
          Last dormant-profile run:{" "}
          {dormancy.lastRunAt
            ? new Date(dormancy.lastRunAt).toLocaleString("en-GB")
            : "never"}
        </p>

        {runs.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-xs text-muted">
            {runs.map((r, i) => (
              <li key={`${r.ran_at}-${i}`} className="flex flex-wrap gap-x-3">
                <span>{new Date(r.ran_at).toLocaleString("en-GB")}</span>
                <span className="text-body">{r.action}</span>
                <span>{r.event_slug}</span>
                <span>{r.rows_affected} rows</span>
              </li>
            ))}
          </ul>
        )}

        {/* Stated plainly because it would otherwise read as more than it is. */}
        <p className="mt-4 max-w-2xl text-xs text-muted">
          Deleting a profile does not delete the registration behind it — that holds the
          applicant&apos;s name, date of birth and email, and has its own retention period
          measured from the event. That rule is written down but not yet enforced in code.
        </p>
      </section>
    </div>
  );
}
