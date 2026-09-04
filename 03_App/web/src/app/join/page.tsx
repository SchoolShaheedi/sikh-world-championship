import type { Metadata } from "next";
import Link from "next/link";
import { currentPlayer } from "@/lib/session";
import { upcomingEvents } from "@/data/events";
import { registrationDemo } from "@/lib/features";
import { registrationLive } from "@/lib/testing-access";
import { PROFILE_BENEFITS } from "@/data/profile-benefits";
import { venueLocality } from "@/lib/format";
import { copy } from "@/copy";

export const metadata: Metadata = {
  title: copy.join.metaTitle,
  description: copy.join.metaDescription,
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
  const open = (await registrationLive()) || registrationDemo();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">
        {me ? copy.join.titleSignedIn : copy.join.titleSignedOut}
      </h1>

      {me ? (
        <p className="mt-4 text-lg text-muted">
          {copy.join.introSignedInPrefix}{" "}
          <span className="text-body">{me.displayName}</span>
          {copy.join.introSignedInRest}
        </p>
      ) : (
        <p className="mt-4 text-lg text-muted">
          {copy.join.introSignedOut1}{" "}
          <span className="text-body">{copy.join.introSignedOut2}</span>{" "}
          {copy.join.introSignedOut3}
        </p>
      )}

      {/* What a profile is actually for. Every line here has to stay true; see
          src/data/profile-benefits.ts for why the sponsor perks are marked as coming. */}
      <section className="mt-10 rounded-3xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-2xl text-kesri">
          {copy.join.benefitsTitle}
        </h2>
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
                    {copy.join.benefitComing}
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
          {me ? copy.join.startTitleSignedIn : copy.join.startTitleSignedOut}
        </h2>
        <p className="mt-3 text-muted">
          {me ? copy.join.startBodySignedIn : copy.join.startBodySignedOut}
        </p>

        <div className="mt-6 space-y-4">
          {events.map((event) => (
            <div
              key={event.slug}
              className="rounded-2xl border border-line bg-surface/60 p-5"
            >
              <h3 className="font-display text-xl">{event.title}</h3>
              <p className="mt-1 text-sm text-muted">
                {venueLocality(event) ? `${venueLocality(event)} · ` : ""}
                {event.date
                  ? new Date(event.date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : copy.common.dateBeingFinalised}
              </p>
              <Link
                href={`/events/${event.slug}/register-interest`}
                className="mt-4 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
              >
                {open ? copy.join.eventCtaOpen : copy.join.eventCtaClosed}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {me && (
        <p className="mt-10 text-sm text-muted">
          <Link href="/profile" className="text-kesri hover:underline">
            {copy.join.viewProfile}
          </Link>
        </p>
      )}

      {!me && (
        <p className="mt-10 text-sm text-muted">
          {copy.join.alreadyRegistered}{" "}
          <Link href="/signin" className="text-kesri hover:underline">
            {copy.join.alreadyRegisteredLink}
          </Link>{" "}
          {copy.join.alreadyRegisteredAfter}
        </p>
      )}
    </div>
  );
}
