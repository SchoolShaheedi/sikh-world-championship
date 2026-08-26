import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getEvent } from "@/data/events";
import { register } from "@/lib/store";
import { validateRegistration } from "@/lib/registration-schema";

/**
 * Register for an event.
 *
 * All validation lives in `@/lib/registration-schema` so it can be unit-tested without
 * standing up a request. Two things this endpoint used to get wrong, both now closed
 * there and covered by tests:
 *   - arbitrary extra keys in the body were persisted alongside medical notes
 *   - an under-18 could be confirmed with no guardian details and no consent
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) {
    return NextResponse.json({ error: "Unknown event" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const divisionId = String(
    (body as Record<string, unknown> | null)?.divisionId ?? "",
  );
  const division = event.divisions.find((d) => d.id === divisionId);
  if (!division) {
    return NextResponse.json({ error: "Unknown division" }, { status: 400 });
  }

  const result = validateRegistration(event, division, body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, fieldErrors: result.fieldErrors },
      { status: 400 },
    );
  }

  const registration = await register({
    eventSlug: slug,
    divisionId,
    divisionCapacity: division.capacity,
    playerId: crypto.randomUUID(),
    // Only what the schema returned — never the raw body.
    answers: result.answers,
  });

  // TODO before launch:
  //  - send confirmation email with the QR check-in code
  //  - if under 18, send the guardian a copy so they know their child signed up
  //  - append a row to the volunteers' Google Sheet
  return NextResponse.json(registration);
}
