import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS, getEvent } from "@/data/events";
import { LiveBracket } from "@/components/LiveBracket";
import { copy } from "@/copy";

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
    title: `Big screen · ${getEvent(slug)?.title ?? "Event"}`,
    // Nothing about this page belongs in a search result — it is furniture for one room
    // on one day, and a stale copy of it in an index would be a bracket with no context.
    robots: { index: false, follow: false },
  };
}

/**
 * THE BIG SCREEN.
 *
 * Open this on the laptop plugged into the television, put the browser full screen, and
 * leave it. It polls every four seconds and never needs touching again; scores are entered
 * on /admin from a different device.
 *
 * WHY IT IS A SEPARATE PAGE from the public bracket at /events/<slug>/bracket, when both
 * show the same thing:
 *
 *   - No header, no footer, no navigation. Every one of those is a thing somebody can
 *     click by accident in front of a room, and none of them is useful on a television.
 *   - No "updated at" line and no reconnect message. The public page says those because a
 *     person on a sofa needs to know whether it is stuck; on the wall it is clutter, and
 *     anybody in the hall can see for themselves which match just finished.
 *   - Bigger, and only the bracket. The event title and the round names are the only text.
 *
 * It is deliberately NOT gated on being a moderator. It has to work from whichever laptop
 * is actually plugged in at 09:15, and it shows exactly what the public bracket page shows
 * — chosen handles and scores, nothing else. A login prompt on a television at the moment
 * the first round is called is a worse failure than a URL somebody could guess.
 */
export default async function TvPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <div className="min-h-screen bg-ink px-8 py-6">
      <div className="mb-6 flex items-baseline justify-between gap-6">
        <h1 className="font-display text-3xl text-kesri">{event.title}</h1>
        <p className="text-sm tracking-[0.18em] text-muted uppercase">
          {copy.tv.label}
        </p>
      </div>
      {/* Six seconds rather than four: on a screen nobody is interacting with, half the
          requests for the same result is the better trade. */}
      <LiveBracket slug={event.slug} intervalMs={6000} showStatus={false} />
    </div>
  );
}
