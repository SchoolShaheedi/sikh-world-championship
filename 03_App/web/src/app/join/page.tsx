import type { Metadata } from "next";
import Link from "next/link";
import { currentPlayer } from "@/lib/session";
import { upcomingEvents } from "@/data/events";
import { registrationOpen, registrationDemo } from "@/lib/features";
import { PROFILE_BENEFITS } from "@/data/profile-benefits";

export const metadata: Metadata = {
  title: "Create your profile",
  description:
    "One Sikh World Championship profile, every event. Register interest in an event and your profile is created with it.",
};

/**
 * The platform-level front door.
 *
 * Registration is for the PLATFORM, not for one event. A person creates a profile once
 * and then registers interest in each event they want to enter — so this page, not an
 * event-scoped URL, is what the header points at and what goes on a flyer.
 *
 * There is deliberately no separate "create an account" form. The interest form already
 * asks for everything a profile needs, and asking twice is how people abandon half way.
 * So this page explains what a profile is and hands off to the open event's form, which
 * creates the profile as part of registering interest.
 */
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const me = await currentPlayer();
  const events = upcomingEvents();
  const open = registrationOpen() || registrationDemo();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">
        {me ? "Your profile" : "Create your profile"}
      </h1>

      {me ? (
        <p className="mt-4 text-lg text-muted">
          You&apos;re signed in as{" "}
          <span className="text-body">{me.displayName}</span>. You don&apos;t need to make
          another profile — register interest in the events you want and they all attach to
          this one.
        </p>
      ) : (
        <p className="mt-4 text-lg text-muted">
          One profile, every Sikh World Championship event. Make it once — after that,
          entering a new event is just registering your interest, not filling this in again.
        </p>
      )}

      {/* What a profile is actually for. Every line here has to stay true; see
          src/data/profile-benefits.ts for why the sponsor perks are marked as coming. */}
      <section className="mt-10 rounded-3xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-2xl text-kesri">What a profile gives you</h2>
        <ul className="mt-5 space-y-4">
          {PROFILE_BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3">
              <span aria-hidden className="mt-0.5 text-kesri">
                {b.live ? "—" : "○"}
              </span>
              <span>
                <span className="font-semibold text-body">{b.title}</span>
                {!b.live && (
                  <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] tracking-wide text-muted uppercase">
                    coming
                  </span>
                )}
                <span className="mt-0.5 block text-sm text-muted">{b.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">
          {me ? "Register interest" : "Start here"}
        </h2>
        <p className="mt-3 text-muted">
          {me
            ? "Pick an event. We only ask what's specific to it."
            : "Registering interest in your first event is what creates your profile. Places are drawn, so registering interest is not a place — we'll email you either way."}
        </p>

        <div className="mt-6 space-y-4">
          {events.map((event) => (
            <div
              key={event.slug}
              className="rounded-2xl border border-line bg-surface/60 p-5"
            >
              <h3 className="font-display text-xl">{event.title}</h3>
              <p className="mt-1 text-sm text-muted">
                {event.venue?.addressLines[0] ? `${event.venue.addressLines[0]} · ` : ""}
                {event.date
                  ? new Date(event.date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Date being finalised"}
              </p>
              <Link
                href={`/events/${event.slug}/register-interest`}
                className="mt-4 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
              >
                {open ? "Register interest" : "See this event"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {me && (
        <p className="mt-10 text-sm text-muted">
          <Link href="/profile" className="text-kesri hover:underline">
            View your profile
          </Link>
        </p>
      )}

      {!me && (
        <p className="mt-10 text-sm text-muted">
          Already registered for something?{" "}
          <Link href="/signin" className="text-kesri hover:underline">
            Sign in
          </Link>{" "}
          — no password, we email you a link.
        </p>
      )}
    </div>
  );
}
