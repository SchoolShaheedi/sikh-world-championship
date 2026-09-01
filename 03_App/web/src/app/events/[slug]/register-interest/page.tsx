import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EVENTS, getEvent } from "@/data/events";
import { SignupForm } from "@/components/SignupForm";
import { registrationDemo, registrationOpen } from "@/lib/features";
import { registrationLive } from "@/lib/testing-access";
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

  /**
   * Three states now, not two. `live` is "can this browser actually submit" — true when
   * entries are open to the public OR when this browser holds the test key. `demo` only
   * applies when it cannot, because a preview banner over a form that really writes is
   * the exact lie the banner exists to prevent.
   */
  const live = await registrationLive();
  const demo = !live && registrationDemo();
  const testing = live && !registrationOpen();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Register interest</h1>
      <p className="mt-2 text-xl text-kesri">{event.title}</p>
      <p className="mt-4 text-muted">
        {live
          ? `Free to enter, ${event.capacity} places. Takes about two minutes.`
          : `Free to enter, ${event.capacity} places.`}
      </p>

      {/* Said before the form, not after it. The team's feedback was that people read
          "register" as "I have a place" — so the page states what the form actually does
          before anyone starts filling it in, and the confirmation email says it again. */}
      {(live || demo) && (
        <p className="mt-4 rounded-xl border border-line bg-surface/60 p-4 text-sm text-muted">
          <span className="text-body">This form registers your interest — it does not
          give you a place.</span>{" "}
          All {event.capacity} places are decided by a random draw
          {event.applicationsCloseAt
            ? ` after entries close on ${new Date(
                event.applicationsCloseAt,
              ).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`
            : " after entries close"}
          . You get a confirmation email as soon as you submit it, and another after the
          draw either way — so there is nothing to chase.
        </p>
      )}

      {/* Registration is for the platform, not for one event. Said here rather than only
          on /join, because most people arrive on this page from a link and never see the
          explainer. */}
      {(live || demo) && (
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
      {live && !event.detailsConfirmed && (
        <p className="mt-6 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          Date and venue are being finalised. Sign up now to hold your place — we&apos;ll
          email you the details as soon as they&apos;re confirmed.
        </p>
      )}

      {/* Testing mode. Louder than the demo banner, because the failure it prevents is
          worse: in demo mode a real entry is not saved, here a test entry IS. Someone has
          to be able to tell at a glance which of the two they are looking at. */}
      {testing && (
        <div className="mt-6 rounded-2xl border-2 border-kesri bg-kesri/[0.14] p-5">
          <p className="font-display text-lg text-kesri">
            Testing mode — this saves a real record
          </p>
          <p className="mt-2 text-sm text-muted">
            Entries are closed to the public. This browser is holding a test key, so the
            form works for real: it writes to the live database and sends real emails.
            Use made-up details, and delete the entry from{" "}
            <Link href="/admin" className="text-kesri hover:underline">
              Admin
            </Link>{" "}
            when you are done. Close it again at{" "}
            <span className="font-mono text-xs">/testing?key=clear</span>.
          </p>
        </div>
      )}

      {demo && (
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

      {live || demo ? (
        <div className="mt-10">
          <SignupForm
            event={event}
            demo={demo}
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
