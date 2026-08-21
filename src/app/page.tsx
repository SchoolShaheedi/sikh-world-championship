import Link from "next/link";
import { ORG } from "@/data/org";
import { upcomingEvents } from "@/data/events";
import { EventCard } from "@/components/EventCard";
import { formatEventDate } from "@/lib/format";

export default function HomePage() {
  const events = upcomingEvents();
  const featured = events[0];

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:pt-24">
        <p className="text-xs font-bold tracking-[0.28em] text-kesri uppercase">
          {ORG.tagline}
        </p>
        <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.05] sm:text-6xl">
          Competition that brings the{" "}
          <span className="text-kesri">Panth</span> together.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{ORG.intro}</p>

        {featured && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/events/${featured.slug}/signup`}
              className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
            >
              Enter {featured.shortTitle}
            </Link>
            <Link
              href={`/events/${featured.slug}`}
              className="rounded-xl border border-line px-6 py-3 font-semibold text-body transition-colors hover:border-kesri/60"
            >
              Event details
            </Link>
          </div>
        )}
      </section>

      {/* Featured event strip */}
      {featured && (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface2 to-surface">
            <div className="grid gap-8 p-7 sm:grid-cols-5 sm:p-10">
              <div className="sm:col-span-3">
                <span className="rounded-md bg-kesri/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-kesri uppercase">
                  Event 01
                </span>
                <h2 className="font-display mt-4 text-3xl sm:text-4xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-muted">{featured.description}</p>
                <Link
                  href={`/events/${featured.slug}`}
                  className="mt-6 inline-block font-semibold text-kesri hover:underline"
                >
                  Full details and rules →
                </Link>
              </div>

              <dl className="space-y-4 sm:col-span-2">
                {[
                  ["When", formatEventDate(featured.date)],
                  ["Where", featured.venue?.name ?? "Venue to be announced"],
                  ["Places", `${featured.capacity} players`],
                  ["Divisions", featured.divisions.map((d) => d.name).join(" · ")],
                  ["Entry", featured.entryFee === 0 ? "Free" : `£${featured.entryFee}`],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-line/60 pb-3">
                    <dt className="text-[11px] tracking-[0.16em] text-muted uppercase">
                      {k}
                    </dt>
                    <dd className="mt-1 font-semibold text-body">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* What we do */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl">More than one tournament</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              t: "Every arena",
              d: "FIFA today. Chess, kabaddi, gatka, quiz and athletics to come. One organisation, one profile, every event you enter.",
            },
            {
              t: "A trophy cabinet that follows you",
              d: "Every event you compete in and every award you win stays on your profile — across sports, across years.",
            },
            {
              t: "Find your players",
              d: "Meet Sikh players near you and online. Post that you're looking for a game, and get matched with someone who plays what you play.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-line bg-surface/60 p-6">
              <h3 className="font-display text-lg text-kesri">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Upcoming events</h2>
          <Link href="/events" className="text-sm font-semibold text-kesri hover:underline">
            All events →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </div>
      </section>
    </>
  );
}
