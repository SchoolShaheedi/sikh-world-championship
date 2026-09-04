import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, getEvent } from "@/data/events";
import { formatEventDate, statusLabel, venueAddressLine } from "@/lib/format";
import { copy, fill } from "@/copy";
import { Rich } from "@/copy/Rich";

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
            {copy.common.freeEntry}
          </span>
        )}
      </div>

      <h1 className="display-xl mt-4 text-[clamp(2.2rem,5.4vw,3.8rem)]">{event.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{event.description}</p>

      {!event.detailsConfirmed && (
        <p className="mt-6 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          <strong className="font-bold">{copy.event.unconfirmedStrong}</strong>{" "}
          {copy.event.unconfirmedRest}
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href={`/events/${event.slug}/register-interest`}
          className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
        >
          {copy.event.ctaRegister}
        </Link>
        <Link
          href={`/events/${event.slug}/bracket`}
          className="rounded-xl border border-line px-6 py-3 font-semibold text-body transition-colors hover:border-kesri/60"
        >
          {copy.event.ctaBracket}
        </Link>
      </div>

      {/* Key facts */}
      <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            copy.event.factWhen,
            formatEventDate(event.date),
            event.times ?? copy.common.timesTbc,
          ],
          [
            copy.event.factWhere,
            event.venue?.name ?? copy.common.venueTbc,
            // The full address, not just the postcode, once the venue is confirmed —
            // this card is where somebody works out how they are getting there.
            (event.detailsConfirmed ? venueAddressLine(event) : null) ??
              event.venue?.postcode ??
              copy.event.factWhereFallback,
          ],
          [
            copy.event.factFormat,
            copy.event.factFormatValue,
            copy.event.factFormatSub,
          ],
          [
            copy.event.factPlatform,
            copy.event.factPlatformValue,
            copy.event.factPlatformSub,
          ],
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
            ? copy.event.divisionsOneTitle
            : fill(copy.event.divisionsManyTitle, {
                n: event.divisions.length,
              })}
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
                  ? fill(copy.event.divisionOpenAges, { min: d.minAge })
                  : fill(copy.event.divisionAgeRange, {
                      min: d.minAge,
                      max: d.maxAge,
                    })}
              </p>
              <p className="mt-4 text-sm text-body">
                <strong className="font-bold">{d.capacity}</strong>{" "}
                {copy.event.divisionPlaces}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Rules + prizes */}
      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">{copy.event.rulesTitle}</h2>
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
          <h2 className="font-display text-2xl">{copy.event.prizesTitle}</h2>
          <ul className="mt-5 space-y-3">
            {event.prizes.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-muted">
                <span className="text-gold">◆</span>
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-xl border border-line bg-surface/60 p-4 text-sm text-muted">
            <Rich
              text={copy.event.prizesNote}
              em={(s, i) => (
                <span key={i} className="text-kesri">
                  {s}
                </span>
              )}
            />
          </p>
        </section>
      </div>
    </div>
  );
}
