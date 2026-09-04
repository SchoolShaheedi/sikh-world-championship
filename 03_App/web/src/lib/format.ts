import type { EventStatus, ChampionshipEvent } from "./types";
import { copy } from "@/copy";

export function formatEventDate(date: string | null): string {
  if (!date) return copy.common.dateTbc;
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function statusLabel(status: EventStatus): string {
  const map: Record<EventStatus, string> = {
    draft: copy.status.draft,
    announced: copy.status.announced,
    "signups-open": copy.status.signupsOpen,
    "signups-full": copy.status.signupsFull,
    "in-progress": copy.status.inProgress,
    complete: copy.status.complete,
  };
  return map[status];
}

/** Where an event sits in the venue/date confirmation cycle. */
export function eventLocationLine(event: ChampionshipEvent): string {
  if (!event.venue) return copy.common.venueTbc;
  return `${event.venue.name}, ${event.venue.postcode}`;
}

/**
 * The town or city, for a sentence that reads "… on Saturday 3 October in Leicester".
 *
 * The LAST address line, not the first. This exists because the guardian notification and
 * the events list both used `addressLines[0]`, which was right only while the venue was a
 * placeholder holding one line ("Leicester"). The moment a real street address was set —
 * round 46 — that same code would have emailed a parent "in 51 Braunstone Lane East".
 *
 * A locality is what those two places actually want: enough for someone to know whether
 * the event is near them, without putting a street address in an email sent to an address
 * typed by whoever filled in the form.
 */
export function venueLocality(event: ChampionshipEvent): string | null {
  const lines = event.venue?.addressLines ?? [];
  return lines.length > 0 ? lines[lines.length - 1] : null;
}

/**
 * The full postal address on one line, for the people who have to get there.
 *
 * Only ever shown where the venue is confirmed — `detailsConfirmed` guards the copy —
 * because naming a place that has not been booked is worse than saying "to be confirmed".
 */
export function venueAddressLine(event: ChampionshipEvent): string | null {
  if (!event.venue) return null;
  return [...event.venue.addressLines, event.venue.postcode]
    .filter((s) => s && s !== "TBC")
    .join(", ");
}
