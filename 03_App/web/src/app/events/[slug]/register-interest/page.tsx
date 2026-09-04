import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EVENTS, getEvent } from "@/data/events";
import { SignupForm } from "@/components/SignupForm";
import { registrationDemo, registrationOpen } from "@/lib/features";
import { registrationLive, isTester } from "@/lib/testing-access";
import { currentPlayer } from "@/lib/session";
import { copy, fill } from "@/copy";

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
  return {
    title: `${copy.registerInterest.title} · ${getEvent(slug)?.title ?? "Event"}`,
  };
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
  /**
   * Does this browser hold the test key? Asked separately from `live`, because once
   * registration is genuinely open `live` is true for everyone and would tell us nothing.
   * This is what unlocks the one-click test-data button, so it must mean "a tester", not
   * "the form works".
   */
  const tester = await isTester();
  const testing = tester && !registrationOpen();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">{copy.registerInterest.title}</h1>
      <p className="mt-2 text-xl text-kesri">{event.title}</p>
      <p className="mt-4 text-muted">
        {fill(
          live
            ? copy.registerInterest.introLive
            : copy.registerInterest.introClosed,
          { capacity: event.capacity },
        )}
      </p>

      {/* Said before the form, not after it. The team's feedback was that people read
          "register" as "I have a place" — so the page states what the form actually does
          before anyone starts filling it in, and the confirmation email says it again. */}
      {(live || demo) && (
        <p className="mt-4 rounded-xl border border-line bg-surface/60 p-4 text-sm text-muted">
          <span className="text-body">
            {copy.registerInterest.notAPlaceStrong}
          </span>{" "}
          {fill(copy.registerInterest.notAPlaceRest, {
            capacity: event.capacity,
            closes: event.applicationsCloseAt
              ? fill(copy.registerInterest.notAPlaceCloses, {
                  closeDate: new Date(
                    event.applicationsCloseAt,
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                  }),
                })
              : copy.registerInterest.notAPlaceClosesTbc,
          })}
        </p>
      )}

      {/* Registration is for the platform, not for one event. Said here rather than only
          on /join, because most people arrive on this page from a link and never see the
          explainer. */}
      {(live || demo) && (
        <p className="mt-4 text-muted">
          {me ? (
            <>
              {copy.registerInterest.signedInPrefix}{" "}
              <span className="text-body">{me.displayName}</span>
              {copy.registerInterest.signedInRest}
            </>
          ) : (
            <>
              {copy.registerInterest.createsProfile}{" "}
              <Link href="/join" className="text-kesri hover:underline">
                {copy.registerInterest.createsProfileLink}
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
          {copy.registerInterest.detailsFinalising}
        </p>
      )}

      {/* Testing mode. Louder than the demo banner, because the failure it prevents is
          worse: in demo mode a real entry is not saved, here a test entry IS. Someone has
          to be able to tell at a glance which of the two they are looking at. */}
      {testing && (
        <div className="mt-6 rounded-2xl border-2 border-kesri bg-kesri/[0.14] p-5">
          <p className="font-display text-lg text-kesri">
            {copy.registerInterest.testingTitle}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copy.registerInterest.testingBody1}{" "}
            <Link href="/admin" className="text-kesri hover:underline">
              {copy.registerInterest.testingAdminLink}
            </Link>{" "}
            {copy.registerInterest.testingBody2}{" "}
            <span className="font-mono text-xs">/testing?key=clear</span>.
          </p>
        </div>
      )}

      {demo && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-kesri/60 bg-kesri/[0.08] p-5">
          <p className="font-display text-lg text-kesri">
            {copy.registerInterest.demoTitle}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copy.registerInterest.demoBody}
          </p>
        </div>
      )}

      {live || demo ? (
        <div className="mt-10">
          <SignupForm
            event={event}
            demo={demo}
            /* One-click fill, for a rehearsal. Never for the public: a button that types
               a fake child into a real form is a fast way to get a fake child into a real
               draw. Testers and the closed preview only. */
            testFill={demo || tester}
            /**
             * What carries over from an existing profile.
             *
             * Widened on 2026-09-02: entering a second event used to mean retyping
             * twenty-odd fields, because a profile held only a first name, an email, a
             * date of birth, a region and an avatar. It now also holds the full name, the
             * mobile and — for an under-18 — the guardian's name, relationship, email and
             * mobile, all written from a validated registration and never from a page
             * anybody can edit.
             *
             * WHAT IS STILL NOT PREFILLED, on purpose:
             *   - medical, allergies, accessibility. Per-event, purged 30 days after each
             *     one, and a stale allergy shown as already-answered is worse than a
             *     blank box.
             *   - every consent. A consent given for October is not a consent for next
             *     March, and the guardian is emailed again each time so the claim is
             *     re-made rather than inherited.
             *   - the event's own questions, which are the point of asking.
             */
            prefill={
              me
                ? {
                    email: me.email,
                    region: me.region ?? "",
                    avatarId: me.avatarId ?? "",
                    // Their existing public name. Carried over so the bracket calls them
                    // the same thing at every event they enter.
                    handle: me.handle ?? "",
                    dob: me.dateOfBirth ?? "",
                    fullName: me.fullName ?? "",
                    mobile: me.mobile ?? "",
                    guardianName: me.guardianName ?? "",
                    guardianRelation: me.guardianRelation ?? "",
                    guardianEmail: me.guardianEmail ?? "",
                    guardianMobile: me.guardianMobile ?? "",
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
            {copy.registerInterest.closedTitle}
          </h2>
          <p className="mt-4 text-muted">
            {copy.registerInterest.closedBody1}
          </p>
          <p className="mt-4 text-muted">
            {event.detailsConfirmed
              ? copy.registerInterest.closedSoon
              : copy.registerInterest.closedDetailsToo}{" "}
            {fill(copy.registerInterest.closedBody2, {
              capacity: event.capacity,
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/events/${event.slug}`}
              className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
            >
              {copy.registerInterest.closedCtaDetails}
            </a>
            <a
              href="/support"
              className="rounded-xl border border-line px-6 py-3 font-semibold text-body transition-colors hover:border-kesri/60"
            >
              {copy.registerInterest.closedCtaAsk}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
