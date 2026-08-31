import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EVENTS, getEvent } from "@/data/events";
import { SignupForm } from "@/components/SignupForm";
import { registrationOpen, registrationDemo } from "@/lib/features";
import { currentPlayer } from "@/lib/session";

/**
 * Rendered per request, not prerendered.
 *
 * `registrationOpen()` reads an environment variable, and `next build` runs with
 * NODE_ENV=production — so a prerendered page would bake "entries are closed" in at build
 * time. Flipping the flag later would then open the API route (which is dynamic) while
 * this page still told everyone it was closed. The page and the endpoint must agree about
 * whether entries are open; disagreeing about a safeguarding gate is how a form quietly
 * starts accepting children's data behind a notice saying it does not.
 */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Register interest · ${getEvent(slug)?.title ?? "Event"}` };
}

export default async function RegisterInterestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const me = await currentPlayer();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Register interest</h1>
      <p className="mt-2 text-xl text-kesri">{event.title}</p>
      <p className="mt-4 text-muted">
        {registrationOpen()
          ? `Free to enter, ${event.capacity} places. Takes about two minutes.`
          : `Free to enter, ${event.capacity} places.`}
      </p>

      {/* Registration is for the platform, not for one event. Said here rather than only
          on /join, because most people arrive on this page from a link and never see the
          explainer. */}
      {(registrationOpen() || registrationDemo()) && (
        <p className="mt-4 text-muted">
          {me ? (
            <>
              You&apos;re signed in as{" "}
              <span className="text-body">{me.displayName}</span>, so this attaches to your
              existing profile — no second account.
            </>
          ) : (
            <>
              This also creates your Sikh World Championship profile, which you keep for
              every future event.{" "}
              <Link href="/join" className="text-kesri hover:underline">
                What a profile gives you
              </Link>
              .
            </>
          )}
        </p>
      )}

      {/* "Sign up now to hold your place" is only true when there is a form to do it
          with. Shown alongside a closed notice it reads as a broken promise. */}
      {registrationOpen() && !event.detailsConfirmed && (
        <p className="mt-6 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          Date and venue are being finalised. Sign up now to hold your place — we&apos;ll
          email you the details as soon as they&apos;re confirmed.
        </p>
      )}

      {registrationDemo() && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-kesri/60 bg-kesri/[0.08] p-5">
          <p className="font-display text-lg text-kesri">Preview — nothing is saved</p>
          <p className="mt-2 text-sm text-muted">
            Entries aren&apos;t open yet. This is the real form, with the real checks, so
            the team can see exactly what an entrant fills in — but submitting it stores
            nothing and does not hold you a place. Please don&apos;t enter anyone&apos;s
            real medical details.
          </p>
        </div>
      )}

      {registrationOpen() || registrationDemo() ? (
        <div className="mt-10">
          <SignupForm
            event={event}
            demo={registrationDemo()}
            prefill={
              me
                ? {
                    email: me.email,
                    region: me.region ?? "",
                    avatarId: me.avatarId ?? "",
                    // Their existing public name. Carried over so the bracket calls them
                    // the same thing at every event they enter.
                    handle: me.handle ?? "",
                  }
                : undefined
            }
          />
        </div>
      ) : (
        /* Registration is not open. Showing the form would be dishonest — it cannot
           save anything, and 04_Legal/DPIA.md says real entries must not be taken yet.
           So say so plainly rather than letting someone fill in twenty fields, including
           their child's medical details, and hit an error. */
        <div className="mt-10 rounded-3xl border border-kesri/40 bg-kesri/[0.07] p-8">
          <h2 className="font-display text-2xl text-kesri">
            Entries aren&apos;t open yet
          </h2>
          <p className="mt-4 text-muted">
            We&apos;re finishing the last pieces before we can take entries safely — the
            parent and guardian notifications, and the systems that hold players&apos;
            details properly. That work comes before the sign-up button, not after it.
          </p>
          <p className="mt-4 text-muted">
            {event.detailsConfirmed
              ? "Entries open soon."
              : "The date and venue are being finalised too."}{" "}
            Nothing is lost by waiting — all {event.capacity} places will be available when
            we open, and entry is free.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/events/${event.slug}`}
              className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
            >
              Event details and rules
            </a>
            <a
              href="/support"
              className="rounded-xl border border-line px-6 py-3 font-semibold text-body transition-colors hover:border-kesri/60"
            >
              Ask us a question
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
