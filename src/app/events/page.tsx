import type { Metadata } from "next";
import { upcomingEvents, pastEvents } from "@/data/events";
import { EventCard } from "@/components/EventCard";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-display text-4xl">Events</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every Sikh World Championship event, past and upcoming. Each one is open to Sikh
        players of all levels — you don&apos;t need to be the best, you just need to turn up.
      </p>

      <h2 className="font-display mt-12 text-xl text-kesri">Upcoming</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((e) => (
          <EventCard key={e.slug} event={e} />
        ))}
      </div>

      <h2 className="font-display mt-14 text-xl text-muted">Past</h2>
      {past.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          No past events yet — Sikh FIFA 26 is the first.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {past.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
