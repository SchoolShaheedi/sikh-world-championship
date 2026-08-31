/**
 * The venue helpers.
 *
 * These exist because of a bug that was one commit away from happening. The guardian
 * notification email and the events list both read `venue.addressLines[0]` to fill in
 * "on Saturday 3 October in ___". That was correct only while the venue was a placeholder
 * holding a single line, "Leicester". When the real address went in (round 46) the same
 * code would have emailed a parent "in 51 Braunstone Lane East".
 */
import { describe, it, expect } from "vitest";
import { venueLocality, venueAddressLine, eventLocationLine } from "./format";
import type { ChampionshipEvent } from "./types";

function event(venue: ChampionshipEvent["venue"], detailsConfirmed = true) {
  return { venue, detailsConfirmed } as ChampionshipEvent;
}

const REAL = {
  name: "GNG FC — Riverside Football Ground",
  addressLines: ["51 Braunstone Lane East", "Braunstone Town", "Leicester"],
  postcode: "LE3 2FD",
};

describe("venueLocality", () => {
  it("is the town or city, not the street", () => {
    expect(venueLocality(event(REAL))).toBe("Leicester");
  });

  it("still works for a one-line placeholder", () => {
    expect(
      venueLocality(event({ name: "TBC", addressLines: ["Leicester"], postcode: "TBC" })),
    ).toBe("Leicester");
  });

  it("is null with no venue, so callers omit the phrase rather than print 'null'", () => {
    expect(venueLocality(event(null))).toBeNull();
  });
});

describe("venueAddressLine", () => {
  it("is the full postal address", () => {
    expect(venueAddressLine(event(REAL))).toBe(
      "51 Braunstone Lane East, Braunstone Town, Leicester, LE3 2FD",
    );
  });

  it("drops a placeholder postcode instead of printing TBC to a visitor", () => {
    expect(
      venueAddressLine(event({ name: "TBC", addressLines: ["Leicester"], postcode: "TBC" })),
    ).toBe("Leicester");
  });

  it("is null with no venue", () => {
    expect(venueAddressLine(event(null))).toBeNull();
  });
});

describe("eventLocationLine", () => {
  it("names the venue and postcode", () => {
    expect(eventLocationLine(event(REAL))).toBe(
      "GNG FC — Riverside Football Ground, LE3 2FD",
    );
  });

  it("says so when there is no venue", () => {
    expect(eventLocationLine(event(null))).toBe("Venue to be announced");
  });
});
