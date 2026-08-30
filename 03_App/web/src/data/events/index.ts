import type { ChampionshipEvent } from "@/lib/types";
import { sikhFc27 } from "./sikh-fc-27";

/**
 * The event registry. To add an event: create a file in this folder exporting a
 * ChampionshipEvent, then add it to this array. Nothing else needs to change —
 * the homepage, events list, sign-up form and bracket all read from here.
 */
export const EVENTS: ChampionshipEvent[] = [sikhFc27];

export function getEvent(slug: string): ChampionshipEvent | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

export function publicEvents(): ChampionshipEvent[] {
  return EVENTS.filter((e) => e.status !== "draft");
}

export function upcomingEvents(): ChampionshipEvent[] {
  return publicEvents().filter((e) => e.status !== "complete");
}

export function pastEvents(): ChampionshipEvent[] {
  return publicEvents().filter((e) => e.status === "complete");
}
