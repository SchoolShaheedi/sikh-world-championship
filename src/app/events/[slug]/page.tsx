import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, getEvent } from "@/data/events";
import { formatEventDate, statusLabel } from "@/lib/format";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-kesri/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-kesri uppercase">
          {statusLabel(event.status)}
        </span>
        {event.entryFee === 0 && (
          <span className="rounded-md bg-ok/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-ok uppercase">
            Free entry
          </span>
        )}
      </div>

      <h1 className="display-xl mt-4 text-[clamp(2.2rem,5.4vw,3.8rem)]">{event.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{event.description}</p>

      {!event.detailsConfirmed && (
        <p className="mt-6 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          <strong className="font-bold">Date and venue are being finalised.</strong>{" "}
          Register your place now — everyone who signs up gets the details by email as soon
          as they&apos;re confirmed.
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href={`/events/${event.slug}/signup`}
          className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
        >
          Sign up — it&apos;s free
        </Link>
        <Link
          href={`/events/${event.slug}/bracket`}
          className="rounded-xl border border-line px-6 py-3 font-semibold text-body transition-colors hover:border-kesri/60"
        >
          Live bracket
        </Link>
      </div>

      {/* Key facts */}
      <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["When", formatEventDate(event.date), event.times ?? "Times to be confirmed"],
          [
            "Where",
            event.venue?.name ?? "Venue to be announced",
            event.venue ? event.venue.postcode : "United Kingdom",
          ],
          ["Format", "Groups into knockouts", "Everyone plays at least 3 matches"],
          ["Platform", "PlayStation 5", "Consoles and screens provided"],
        ].map(([k, v, sub]) => (
          <div key={k} className="rounded-2xl border border-line bg-surface/60 p-5">
            <dt className="micro">{k}</dt>
            <dd className="font-display mt-2 text-lg text-body">{v}</dd>
            <dd className="mt-1 text-sm text-muted">{sub}</dd>
          </div>
        ))}
      </dl>

      {/* Divisions. Headline adapts so a future multi-division event needs no edit. */}
      <section className="mt-14">
        <h2 className="font-display text-2xl">
          {event.divisions.length === 1
            ? "One division, one champion"
            : `${event.divisions.length} divisions, ${event.divisions.length} champions`}
        </h2>
        <div
          className={`mt-5 grid gap-4 ${
            event.divisions.length === 1 ? "" : "sm:grid-cols-2"
          }`}
        >
          {event.divisions.map((d) => (
            <div key={d.id} className="rounded-2xl border border-line bg-surface/60 p-6">
              <h3 className="font-display text-2xl text-kesri">{d.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {d.maxAge === 99
                  ? `Open to everyone aged ${d.minAge} and over on the day`
                  : `Ages ${d.minAge}–${d.maxAge} on the day of the event`}
              </p>
              <p className="mt-4 text-sm text-body">
                <strong className="font-bold">{d.capacity}</strong> places
              </p>
              {event.divisions.length === 1 && (
                <p className="mt-4 text-sm text-muted">
                  Everyone plays in the same bracket. The group stage seeds on how you rate
                  yourself at sign-up, so your first matches are against players at a
                  similar level.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Rules + prizes */}
      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Rules</h2>
          <ol className="mt-5 space-y-3">
            {event.rules.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-display shrink-0 text-kesri">{i + 1}.</span>
                <span className="text-muted">{r}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl">Prizes</h2>
          <ul className="mt-5 space-y-3">
            {event.prizes.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-muted">
                <span className="text-gold">◆</span>
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-xl border border-line bg-surface/60 p-4 text-sm text-muted">
            Every award also lands in your{" "}
            <span className="text-kesri">SWC trophy cabinet</span> — a permanent record on
            your profile, across every event you ever enter.
          </p>
        </section>
      </div>
    </div>
  );
}
