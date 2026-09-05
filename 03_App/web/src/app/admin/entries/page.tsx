import type { Metadata } from "next";
import Link from "next/link";
import { currentPlayer } from "@/lib/session";
import { EVENTS, getEvent } from "@/data/events";
import { registrationsFor } from "@/lib/store";
import { entryStats, maskEmail, type Tally } from "@/lib/entry-detail";
import { ageOnEventDay } from "@/lib/registration-schema";
import { isReferred } from "@/data/referral-orgs";
import { photoObjectionRefs } from "@/lib/photo-objection";

export const metadata: Metadata = {
  title: "Entries",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A bar per row, drawn with a div rather than a chart library.
 *
 * The question these answer is "is the outreach working" and "where is everybody
 * travelling from", and a number next to a proportional bar answers both. A charting
 * dependency for six horizontal bars would be 40 kB to say the same thing.
 */
function Bars({ title, rows, note }: { title: string; rows: Tally[]; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl border border-line bg-ink/20 p-5">
      <h3 className="font-display text-base text-kesri">{title}</h3>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-body">{r.label}</span>
              <span className="font-mono text-muted">{r.count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-kesri/70"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted">Nothing yet.</li>}
      </ul>
    </div>
  );
}

/**
 * Everyone who applied, and the shape of the field.
 *
 * WHY IT IS ITS OWN PAGE. /admin is a page of controls — the draw, the bracket, deletion —
 * and this is a page for reading. Mixing seventy-five rows into it would have buried the
 * buttons that matter on the morning.
 *
 * The counts identify nobody and are safe to leave on a screen. The table gives a name and
 * a city and a referral, which are the three things needed to find the person you are
 * thinking of; contact details are on the individual page, masked until asked for.
 */
export default async function EntriesPage() {
  const me = await currentPlayer();
  if (!me?.isModerator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Moderators only</h1>
      </div>
    );
  }

  const event = getEvent(EVENTS[0]?.slug ?? "");
  const slug = event?.slug ?? "";
  const [rows, stats, noPhotos] = await Promise.all([
    slug ? registrationsFor(slug) : Promise.resolve([]),
    slug ? entryStats(slug, event?.date ?? null) : Promise.resolve(null),
    slug ? photoObjectionRefs(slug) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/admin" className="text-sm text-muted hover:text-body">
        ← Admin
      </Link>
      <h1 className="font-display mt-3 text-3xl text-body">
        Entries — {event?.title ?? "no event"}
      </h1>

      {stats && (
        <>
          <p className="mt-2 text-sm text-muted">
            <span className="text-body">{stats.total}</span> applications ·{" "}
            <span className="text-body">{stats.referredTotal}</span> referred ·{" "}
            <span className="text-body">{stats.under18}</span> under 18 ·{" "}
            <span className="text-body">{stats.withMedical}</span> with something medical
            declared
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Bars
              title="Referred by"
              rows={stats.byReferral}
              note="Referred applicants take priority for every place. This is whether the outreach is reaching anybody."
            />
            <Bars
              title="Travelling from"
              rows={stats.byRegion}
              note="Who is coming a long way, which is a langar and a finish-time question."
            />
            <Bars
              title="How they rate themselves"
              rows={stats.bySelfRating}
              note="Their own answer, used to seed the bracket so the strongest do not all meet in round one."
            />
            <Bars
              title="Age on the day"
              rows={stats.byAgeGroup}
              note="Grouped by what each group needs: 12–15 a parent on site, 16–17 a leaving permission."
            />
          </div>
        </>
      )}

      <h2 className="font-display mt-10 text-lg text-kesri">Everyone who applied</h2>
      <p className="mt-1 text-sm text-muted">
        Click a row for the whole record. Email is shown partly so a row can be recognised
        without a screen full of children&rsquo;s addresses.
      </p>

      <div className="scroll-x mt-4">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-2 pr-3 font-normal">Name</th>
              <th className="py-2 pr-3 font-normal">Reference</th>
              <th className="py-2 pr-3 font-normal">Status</th>
              <th className="py-2 pr-3 font-normal">Age</th>
              <th className="py-2 pr-3 font-normal">City</th>
              <th className="py-2 pr-3 font-normal">Referred</th>
              <th className="py-2 pr-3 font-normal">Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const age = ageOnEventDay(String(r.answers.dob), event?.date ?? null);
              return (
                <tr key={r.reference} className="border-b border-linesoft">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/admin/entries/${encodeURIComponent(r.reference)}`}
                      className="text-body underline decoration-dotted hover:text-kesri"
                    >
                      {String(r.answers.fullName)}
                    </Link>
                    {/* The only photography fact worth showing. Consent is true on every
                        row — it is a condition of entering — so a "consented" marker
                        would be noise on all 75 lines and this one is on the few that
                        change what somebody does. */}
                    {noPhotos.has(r.reference) && (
                      <span className="ml-2 rounded bg-kesri/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-kesri uppercase">
                        no photos
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono text-muted">{r.reference}</td>
                  <td className="py-2 pr-3 text-muted">{r.status}</td>
                  <td className="py-2 pr-3 text-muted">{age ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted">
                    {(r.answers.region as string) || "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted">
                    {isReferred(r.answers.referralOrg as string)
                      ? (r.answers.referralOrg as string)
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted">
                    {maskEmail(r.answers.email as string)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-muted">
                  Nobody has applied yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
