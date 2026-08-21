import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getEvent } from "@/data/events";
import { register } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) {
    return NextResponse.json({ error: "Unknown event" }, { status: 404 });
  }

  const body = (await req.json()) as Record<string, string | boolean>;
  const divisionId = String(body.divisionId ?? "");
  const division = event.divisions.find((d) => d.id === divisionId);
  if (!division) {
    return NextResponse.json({ error: "Unknown division" }, { status: 400 });
  }

  // Minimal server-side validation. TODO: full schema validation (zod) before launch —
  // never trust the client, especially on the guardian-consent fields.
  for (const required of ["fullName", "dob", "email", "mobile"]) {
    if (!body[required]) {
      return NextResponse.json(
        { error: `Missing ${required}` },
        { status: 400 },
      );
    }
  }

  const result = await register({
    eventSlug: slug,
    divisionId,
    divisionCapacity: division.capacity,
    playerId: crypto.randomUUID(),
    answers: body,
  });

  // TODO before launch:
  //  - send confirmation email with the QR check-in code
  //  - if under 18, send the guardian a copy so they know their child signed up
  //  - append a row to the volunteers' Google Sheet
  return NextResponse.json(result);
}
