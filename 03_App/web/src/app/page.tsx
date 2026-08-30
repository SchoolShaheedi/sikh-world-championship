import Link from "next/link";
import { ORG } from "@/data/org";
import { upcomingEvents } from "@/data/events";
import { EventCard } from "@/components/EventCard";
import { formatEventDate } from "@/lib/format";
import { CinematicHero } from "@/components/CinematicHero";
import { Logo3D } from "@/components/Logo3D";
import { findLogo, findLogo3D } from "@/lib/brand-assets";
import { HeroArcs } from "@/components/HeroArcs";

export default function HomePage() {
  const events = upcomingEvents();
  const featured = events[0];
  // Both are drop-ins — see public/brand/README.md.
  const logo = findLogo();
  const logo3d = findLogo3D();

  return (
    <>
      <CinematicHero>
        {featured && <HeroArcs event={featured} />}

        {/* Copy sits bottom-left, clear of the subject on the right. */}
        <div className="relative z-50 w-full px-5 pb-14 sm:px-8 sm:pb-16 md:px-12 md:pb-24">
          <div className="max-w-[300px] sm:max-w-xl">
            <p
              className="micro hero-rise !text-body/90"
              style={{ animationDelay: "0.15s" }}
            >
              {ORG.tagline}
            </p>

            <h1
              className="display-xl hero-rise mt-4 text-[clamp(2.4rem,6.4vw,4.4rem)]"
              style={{ animationDelay: "0.3s" }}
            >
              Competition that brings the{" "}
              <span className="text-flare">Panth</span> together
            </h1>

            <p
              className="hero-rise mt-5 max-w-md text-sm text-body/85 sm:text-base"
              style={{ animationDelay: "0.5s" }}
            >
              {ORG.intro}
            </p>

            {featured && (
              <div
                className="hero-rise mt-8 flex flex-wrap gap-3"
                style={{ animationDelay: "0.7s" }}
              >
                <Link
                  href={`/events/${featured.slug}/signup`}
                  className="group pill relative inline-flex items-center gap-2 overflow-hidden bg-kesri px-7 py-3.5 font-bold text-ink shadow-lg shadow-black/30 transition-transform hover:scale-[1.04] active:scale-95 sm:px-8"
                >
                  Enter {featured.shortTitle} →
                  {/* Shine sweep on hover. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                </Link>
                <Link
                  href={`/events/${featured.slug}`}
                  className="pill inline-flex items-center gap-2 border border-line bg-ink/50 px-7 py-3.5 font-semibold text-body backdrop-blur-sm transition-colors hover:border-kesri/60"
                >
                  Event details
                </Link>
              </div>
            )}
          </div>
        </div>
      </CinematicHero>

      {/* Featured event strip */}
      {featured && (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="reveal lift overflow-hidden rounded-[20px] border border-line bg-surface2">
            <div className="grid gap-8 p-7 sm:grid-cols-5 sm:p-10">
              <div className="sm:col-span-3">
                <span className="pill inline-block bg-kesri/15 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-kesri uppercase">
                  Event 01
                </span>
                <h2 className="display-xl mt-4 text-[clamp(1.7rem,4vw,2.6rem)]">
                  {featured.title}
                </h2>
                <p className="mt-3 text-muted">{featured.description}</p>
                <Link
                  href={`/events/${featured.slug}`}
                  className="link-underline mt-6 inline-block font-semibold text-kesri"
                >
                  Full details and rules →
                </Link>
              </div>

              <dl className="space-y-4 sm:col-span-2">
                {[
                  ["When", formatEventDate(featured.date)],
                  ["Where", featured.venue?.name ?? "Venue to be announced"],
                  ["Places", `${featured.capacity} players`],
                  [
                    featured.divisions.length === 1 ? "Division" : "Divisions",
                    featured.divisions.map((d) => d.name).join(" · "),
                  ],
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
        <p className="micro">01 — The organisation</p>
        <h2 className="display-xl mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)]">
          More than one tournament
        </h2>
        <div className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-3">
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
            <div key={c.t} className="lift glass rounded-[20px] p-6">
              <h3 className="font-display text-lg text-kesri">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statement. A deliberate change of pace between two grids — one oversized line,
          lots of air, no card. */}
      <section className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-32">
        <div
          aria-hidden
          className="bloom left-1/2 h-[260px] w-[560px] -translate-x-1/2 opacity-[0.13]"
          style={{ background: "var(--swc-gold)", top: 20 }}
        />
        <div className="relative">
          <p className="micro">02 — Why</p>
          <p className="display-xl mx-auto mt-6 max-w-4xl text-[clamp(1.6rem,4.2vw,3rem)] leading-[1.08]">
            Sixty-four players will walk in as strangers.
            <br className="hidden sm:block" />{" "}
            <span className="text-flare">They won&apos;t walk out as strangers.</span>
          </p>
          <p className="mx-auto mt-7 max-w-lg text-muted">
            That&apos;s the point. The trophy is the excuse.
          </p>
        </div>
      </section>

      {/* Stats band. Echoes the hero arcs further down the page, in mono. */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="reveal-stagger grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-4">
          {[
            ["64", "Places"],
            ["1", "Open division"],
            ["3+", "Matches each"],
            ["£0", "To enter"],
          ].map(([value, label]) => (
            <div key={label} className="bg-surface px-6 py-8 text-center">
              <p className="font-mono-num text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold text-body">
                {value}
              </p>
              <p className="micro mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="micro">03 — What&apos;s on</p>
            <h2 className="display-xl mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)]">
              Upcoming events
            </h2>
          </div>
          <Link href="/events" className="link-underline text-sm font-semibold text-kesri">
            All events →
          </Link>
        </div>
        <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </div>
      </section>

      {/* CTA closer. The page used to end on a list and then a footer, which meant it
          never actually asked for the thing it exists to ask for. */}
      {featured && (
        <section className="relative mx-auto mt-8 max-w-6xl px-4 pb-20">
          <div className="reveal glass relative overflow-hidden rounded-[28px] px-6 py-16 text-center sm:px-12 sm:py-20">
            {/* Echo of the hero bloom, so the page closes on the note it opened with. */}
            <div
              aria-hidden
              className="bloom left-1/2 h-[300px] w-[520px] -translate-x-1/2 opacity-25"
              style={{ background: "var(--swc-kesri)", top: -80 }}
            />

            <div className="relative">
              {logo3d && (
                <Logo3D
                  url={logo3d}
                  fallbackSrc={logo}
                  size={200}
                  className="mx-auto mb-6"
                />
              )}

              <p className="micro">04 — Your place</p>

              <h2 className="display-xl mx-auto mt-4 max-w-3xl text-[clamp(1.9rem,4.6vw,3.4rem)]">
                {featured.capacity} places. Free to enter.
                <br />
                <span className="text-flare">Take one.</span>
              </h2>

              <p className="mx-auto mt-5 max-w-md text-muted">
                Two minutes to apply. Places are limited and decided by a draw — no
                entry fee, langar on the day, and everyone plays at least three matches.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/events/${featured.slug}/signup`}
                  className="group pill relative inline-flex items-center gap-2 overflow-hidden bg-kesri px-8 py-4 font-bold text-ink shadow-lg shadow-black/30 transition-transform hover:scale-[1.04] active:scale-95"
                >
                  Enter {featured.shortTitle} →
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                </Link>
                <Link
                  href="/volunteer"
                  className="pill inline-flex items-center gap-2 border border-line px-8 py-4 font-semibold text-body transition-colors hover:border-kesri/60"
                >
                  Volunteer instead
                </Link>
              </div>

              <p className="micro mt-8">
                Free entry · Ages 12–21 · PlayStation 5
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
