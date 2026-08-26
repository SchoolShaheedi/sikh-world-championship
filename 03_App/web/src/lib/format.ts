import type { EventStatus, ChampionshipEvent } from "./types";

export function formatEventDate(date: string | null): string {
  if (!date) return "Date to be announced";
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function statusLabel(status: EventStatus): string {
  const map: Record<EventStatus, string> = {
    draft: "Draft",
    announced: "Announced",
    "signups-open": "Sign-ups open",
    "signups-full": "Waitlist only",
    "in-progress": "Live today",
    complete: "Complete",
  };
  return map[status];
}

/** Where an event sits in the venue/date confirmation cycle. */
export function eventLocationLine(event: ChampionshipEvent): string {
  if (!event.venue) return "Venue to be announced";
  return `${event.venue.name}, ${event.venue.postcode}`;
}
