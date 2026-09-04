import { currentPlayer } from "@/lib/session";
import { EVENTS, getEvent } from "@/data/events";
import { checkInSlips } from "@/lib/check-in";
import { slipsDocument, slipsRefused } from "@/lib/slips-document";

/** Who has a place changes all morning, and a cached sheet is a sheet missing somebody. */
export const dynamic = "force-dynamic";

/**
 * The printable check-in slips.
 *
 * A route handler and not a page, so the response is a complete document with no site
 * chrome, no theme and no framework CSS in it — see the header of lib/slips-document.ts
 * for why that stopped being optional.
 *
 * `robots` and the title are set in the document itself rather than through Next's
 * metadata, which a route handler does not have; `X-Robots-Tag` says it again in a header
 * so a crawler that never parses the HTML still hears it.
 *
 * The event is taken from the first one in the data rather than the URL, for the same
 * reason the desk is: there is one event, and asking a volunteer to pick it from a list
 * of one is a question with one possible answer.
 */
export async function GET() {
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow",
  };

  // Desk staff as well as moderators — that is the whole reason the second role exists.
  const me = await currentPlayer();
  if (!me?.canWorkDesk) {
    return new Response(slipsRefused(), { status: 403, headers });
  }

  const event = getEvent(EVENTS[0]?.slug ?? "");
  if (!event) {
    return new Response(
      slipsDocument({ eventTitle: "no event", eventShortTitle: "", slips: [] }),
      { headers },
    );
  }

  return new Response(
    slipsDocument({
      eventTitle: event.title,
      eventShortTitle: event.shortTitle ?? event.title,
      slips: await checkInSlips(event.slug),
    }),
    { headers },
  );
}
