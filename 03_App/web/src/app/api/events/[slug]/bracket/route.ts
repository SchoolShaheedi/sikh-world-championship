import { NextResponse } from "next/server";
import { getEvent } from "@/data/events";
import { storedBracket } from "@/lib/match-store";

/**
 * The bracket, as JSON, for the television in the hall to poll.
 *
 * PUBLIC AND DELIBERATELY THIN. What it returns is exactly what is already on the public
 * bracket page: the shape of the draw, the scores, and the handles players chose for the
 * screen. No real names, no ages, no emails, nothing about a guardian — so this endpoint
 * being open costs nothing that walking past the projector would not.
 *
 * `version` is the whole point. The TV asks every few seconds and only re-renders when
 * the version differs from the one it drew, so a quiet afternoon is one cheap query per
 * poll rather than a re-render of 63 matches.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return NextResponse.json({ error: "Unknown event" }, { status: 404 });

  const stored = await storedBracket(slug, event.divisions[0]?.name ?? "Open");

  // 200 with an empty bracket, not a 404: "no bracket yet" is a normal state on the
  // morning of the event, and the TV should show a holding screen rather than an error.
  return NextResponse.json(
    stored ?? { bracket: null, names: {}, version: "none" },
    {
      headers: {
        // Never cached. A cached bracket on a screen in a hall is worse than a blank one:
        // the room can see the match that just finished and the screen cannot.
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  );
}
