import type { Metadata } from "next";
import { currentPlayer } from "@/lib/session";
import { allReports, moderationHealth } from "@/lib/play-store";
import { allTickets, supportHealth } from "@/lib/support-store";
import { failedSends } from "@/lib/email";
import { categoryById } from "@/lib/support-types";
import type { ReportStatus } from "@/lib/play-types";
import { handleReport, handleTicket } from "./actions";

export const metadata: Metadata = { title: "Moderation" };

/**
 * Never prerender this page.
 *
 * What it renders depends entirely on who is asking — it holds safeguarding disclosures,
 * reporter identities and parents' email addresses. Next was building it as a static
 * page, which means that once a real session exists, one visitor's queue could be baked
 * into HTML and served to the next person. Rendering per request is the only correct
 * behaviour for this page.
 */
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<ReportStatus, string> = {
  open: "border-kesri/50 bg-kesri/10 text-kesri",
  investigating: "border-royal/50 bg-royal/10 text-body",
  actioned: "border-ok/50 bg-ok/10 text-ok",
  dismissed: "border-line bg-surface text-muted",
};

/**
 * The moderation queue.
 *
 * This exists because the decision was "a small volunteer team on a rota". A rota needs
 * assignment (so two people don't work the same report) and an audit trail (so a decision
 * can be explained later). An email inbox gives you neither.
 */
export default async function ModerationPage() {
  const me = await currentPlayer();
  if (!me.isModerator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Moderators only</h1>
        <p className="mt-3 text-muted">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const [reports, health, tickets, sHealth, failedEmails] = await Promise.all([
    allReports(),
    moderationHealth(),
    allTickets(),
    supportHealth(),
    failedSends(),
  ]);

  // Urgent support tickets are safety concerns and player reports raised through the
  // support form — often by parents who have no account. They belong in the same queue
  // as in-app reports, not in a separate inbox nobody remembers to check.
  const urgentTickets = tickets.filter(
    (t) => t.urgent && (t.status === "new" || t.status === "in-progress"),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl">Moderation</h1>
      <p className="mt-3 text-muted">
        Every report, oldest unhandled first. Claim one before you work it.
      </p>

      {/* A guardian notification that did not send is a SAFEGUARDING INCIDENT, not an ops
          detail: the connection happened and the one person who should know does not.
          It goes above the queue because it is more urgent than anything in it — nobody
          reported this, and nobody will. */}
      {failedEmails.length > 0 && (
        <div
          role="alert"
          className="mt-8 rounded-2xl border-2 border-kesri/60 bg-kesri/[0.10] p-5"
        >
          <h2 className="font-display text-lg text-kesri">
            {failedEmails.length} notification{failedEmails.length === 1 ? "" : "s"} did not
            send
          </h2>
          <p className="mt-2 text-sm text-muted">
            Nobody has been told. If any of these is a guardian notice, contact the parent
            directly — do not wait for a retry.
          </p>
          <ul className="mt-4 space-y-2.5">
            {failedEmails.slice(0, 10).map((f) => (
              <li key={f.id} className="rounded-xl border border-line bg-surface/60 p-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-body">{f.kind}</span>
                  <span className="text-muted">{f.toEmail}</span>
                  {f.attempts > 1 && (
                    <span className="text-xs text-kesri">{f.attempts} attempts</span>
                  )}
                  <span className="ml-auto text-xs text-muted">
                    {new Date(f.createdAt).toLocaleString("en-GB")}
                  </span>
                </div>
                {f.error && <p className="mt-1.5 text-xs text-muted">{f.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The health numbers. If the oldest open report is measured in days, the rota has
          stopped working — and that's the failure mode that kills these platforms. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Open reports" value={String(health.open)} alert={health.open > 0} />
        <Stat
          label="Urgent tickets"
          value={String(sHealth.urgentOpen)}
          alert={sHealth.urgentOpen > 0}
        />
        <Stat
          label="Oldest waiting"
          value={
            health.oldestOpenHours === null
              ? "—"
              : health.oldestOpenHours < 24
                ? `${health.oldestOpenHours}h`
                : `${Math.floor(health.oldestOpenHours / 24)}d`
          }
          alert={(health.oldestOpenHours ?? 0) >= 24}
        />
        <Stat label="Target" value="Within 24h" />
      </div>

      {(health.oldestOpenHours ?? 0) >= 24 && (
        <p className="mt-5 rounded-xl border border-kesri/50 bg-kesri/10 p-4 text-sm text-kesrisoft">
          A report has been waiting more than 24 hours. That&apos;s the commitment we make
          publicly on the safeguarding page — someone needs to pick it up.
        </p>
      )}

      {/* Urgent support tickets, above in-app reports — a safeguarding concern from a
          parent outranks a report about a rude message. */}
      {urgentTickets.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-kesri">
            Urgent from the support form ({urgentTickets.length})
          </h2>
          <div className="mt-4 space-y-4">
            {urgentTickets.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-kesri/50 bg-kesri/[0.07] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-md border border-kesri/50 bg-kesri/15 px-2 py-1 text-[11px] font-bold tracking-wider text-kesri uppercase">
                      {t.status}
                    </span>
                    {t.fromGuardian && (
                      <span className="ml-2 rounded-md border border-royal/50 bg-royal/15 px-2 py-1 text-[11px] font-bold tracking-wider text-body uppercase">
                        From a guardian
                      </span>
                    )}
                    <p className="font-display mt-2.5 text-lg text-body">{t.subject}</p>
                    <p className="mt-1 text-sm text-muted">
                      {categoryById(t.category)?.label} · {t.reference} ·{" "}
                      {t.name ?? "Anonymous"}
                      {t.email ? ` · ${t.email}` : " · no reply address"}
                    </p>
                  </div>
                  {t.assignedTo && (
                    <p className="text-xs text-muted">
                      Claimed by <span className="text-body">{t.assignedTo}</span>
                    </p>
                  )}
                </div>

                <p className="mt-4 rounded-xl border border-line bg-ink/40 p-3 text-sm whitespace-pre-wrap text-muted">
                  {t.message}
                </p>

                <form action={handleTicket} className="mt-4">
                  <input type="hidden" name="ticketId" value={t.id} />
                  <input
                    name="resolution"
                    placeholder="What did you do? (recorded for the audit trail)"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted/60"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        ["in-progress", "Claim / in progress"],
                        ["resolved", "Resolved"],
                        ["closed", "Close"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        name="status"
                        value={value}
                        className="rounded-lg border border-line px-4 py-2 text-sm text-body hover:border-kesri hover:text-kesri"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <h2 className="font-display mt-10 text-xl">In-app reports</h2>
      <div className="mt-4 space-y-4">
        {reports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-12 text-center text-muted">
            No reports. Good.
          </p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-surface/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span
                    className={`rounded-md border px-2 py-1 text-[11px] font-bold tracking-wider uppercase ${STATUS_STYLE[r.status]}`}
                  >
                    {r.status}
                  </span>
                  <p className="font-display mt-2.5 text-lg text-body">{r.reason}</p>
                  <p className="mt-1 text-sm text-muted">
                    About <strong className="text-body">{r.targetDisplayName}</strong> ·{" "}
                    {r.context} ·{" "}
                    {new Date(r.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {r.assignedTo && (
                  <p className="text-xs text-muted">
                    Claimed by <span className="text-body">{r.assignedTo}</span>
                  </p>
                )}
              </div>

              {r.detail && (
                <p className="mt-4 rounded-xl border border-line bg-ink/40 p-3 text-sm text-muted">
                  {r.detail}
                </p>
              )}

              {r.resolution && (
                <p className="mt-3 text-sm text-muted">
                  <span className="text-body">Outcome:</span> {r.resolution}
                </p>
              )}

              {r.status !== "actioned" && r.status !== "dismissed" && (
                <form action={handleReport} className="mt-4">
                  <input type="hidden" name="reportId" value={r.id} />
                  <input
                    name="resolution"
                    placeholder="What did you do? (recorded for the audit trail)"
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted/60"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        ["investigating", "Claim / investigating"],
                        ["actioned", "Actioned"],
                        ["dismissed", "Dismiss"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        name="status"
                        value={value}
                        className="rounded-lg border border-line px-4 py-2 text-sm text-body hover:border-kesri hover:text-kesri"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        alert ? "border-kesri/50 bg-kesri/[0.07]" : "border-line bg-surface/60"
      }`}
    >
      <p className="text-[11px] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p
        className={`font-display mt-1.5 text-2xl ${alert ? "text-kesri" : "text-body"}`}
      >
        {value}
      </p>
    </div>
  );
}
