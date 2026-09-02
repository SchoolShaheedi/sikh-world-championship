import type { Metadata } from "next";
import { upcomingEvents, pastEvents } from "@/data/events";
import { EventCard } from "@/components/EventCard";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const past = pastEvents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="display-xl text-[clamp(2.2rem,5vw,3.6rem)]">Events</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every Sikh World Championships event, past and upcoming. Each one is open to Sikh
        players of all levels — you don&apos;t need to be the best, you just need to turn up.
      </p>

      <p className="micro mt-12">01 — Upcoming</p>
      <h2 className="display-xl mt-3 text-[clamp(1.5rem,3vw,2.1rem)]">Upcoming</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((e) => (
          <EventCard key={e.slug} event={e} />
        ))}
      </div>

      <p className="micro mt-14">02 — Past</p>
      <h2 className="display-xl mt-3 text-[clamp(1.5rem,3vw,2.1rem)] text-muted">Past</h2>
      {past.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          No past events yet — Sikh FC 27 is the first.
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
