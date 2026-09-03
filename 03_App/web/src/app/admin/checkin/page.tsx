import type { Metadata } from "next";
import Link from "next/link";
import { currentPlayer } from "@/lib/session";
import { EVENTS, getEvent } from "@/data/events";
import { checkInRoster, slipReadiness } from "@/lib/check-in";

export const metadata: Metadata = {
  title: "Arrivals",
  // Never indexed. It holds the names of every child expected at a venue on a given day.
  robots: { index: false, follow: false },
};

/** Depends entirely on who is asking, and changes every few seconds on the day. */
export const dynamic = "force-dynamic";

/**
 * The arrival desk.
 *
 * A page of its own rather than a panel on /admin, for one reason: on 3 October this is
 * open, full screen, on a laptop by the door, for forty minutes, and nothing else is on
 * it. Everything on /admin — the draw, retention, the entry list — is a distraction at
 * best and a mis-click at worst when somebody is working quickly with a queue in front of
 * them.
 *
 * The event is taken from the first one in the data rather than the URL. There is one
 * event, and asking a volunteer to pick it from a list at the door is a question with one
 * possible answer. When there are two, this becomes /admin/checkin/[slug].
 */
export default async function CheckInPage() {
  const me = await currentPlayer();
  if (!me?.isModerator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Moderators only</h1>
        <p className="mt-3 text-muted">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const event = getEvent(EVENTS[0]?.slug ?? "");
  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">No event</h1>
        <p className="mt-3 text-muted">There is nothing in the events data to check in to.</p>
      </div>
    );
  }

  const roster = await checkInRoster(event.slug, event.date);
  const slips = await slipReadiness(event.slug);

  const { CheckInDesk } = await import("@/components/CheckInDesk");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {roster.length === 0 ? (
        <>
          <h1 className="font-display text-4xl">Arrivals</h1>
          <p className="mt-3 max-w-xl text-muted">
            Nobody has a place yet, so there is nobody to check in and no slips to print.
            Run the draw on <Link href="/admin" className="text-kesri underline">the admin page</Link>{" "}
            first — check-in codes are issued at selection, not when somebody applies.
          </p>
        </>
      ) : (
        <>
          <CheckInDesk
            slug={event.slug}
            eventTitle={event.title}
            capacity={event.capacity}
            initialRoster={roster}
          />

          <section className="mt-12 border-t border-line pt-8">
            <h2 className="font-display text-xl text-kesri">Before the day: print the slips</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              One slip per player, with their code and their reference. Print them, cut them
              along the lines and keep them in name order. Hand each one over at the desk —
              you are checking their date of birth in the same breath — and they hold it to
              the camera.
            </p>
            <Link
              href="/admin/checkin/slips"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-xl border border-kesri/60 px-5 py-2.5 text-sm font-bold text-kesri transition-colors hover:bg-kesri/10"
            >
              Open the print sheet ({slips.printable} slip{slips.printable === 1 ? "" : "s"}) ↗
            </Link>
            {slips.missingToken > 0 && (
              <p className="mt-3 max-w-2xl rounded-xl border border-amber-400/50 bg-amber-500/10 p-4 text-sm text-amber-200">
                {slips.missingToken} {slips.missingToken === 1 ? "player has" : "players have"} a
                place but no check-in code, so {slips.missingToken === 1 ? "they" : "they"} will
                not get a slip. That happens when the code has been cleared after a previous
                event, or when selection was recorded by hand. They can still be checked in by
                name above.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
