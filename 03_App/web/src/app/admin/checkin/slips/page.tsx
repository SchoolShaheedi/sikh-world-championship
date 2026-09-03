import type { Metadata } from "next";
import { currentPlayer } from "@/lib/session";
import { EVENTS, getEvent } from "@/data/events";
import { checkInSlips } from "@/lib/check-in";
import { QrCode } from "@/components/QrCode";

export const metadata: Metadata = {
  title: "Check-in slips",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The slips, ready to print.
 *
 * WHAT THIS PAGE IS. Sixty-four cards, three across and six down on A4, each with one
 * player's public name, their reference and their check-in QR code. Print, cut along the
 * lines, keep in name order, and HAND EACH ONE OVER at the desk rather than laying the
 * pile out for people to help themselves.
 *
 * That changed on 2026-09-03 with the date-of-birth requirement, and it is a better shape
 * for two reasons that have nothing to do with each other. The ID has to be looked at
 * anyway, so handing the slip over makes it one conversation instead of two. And the
 * handover is itself a check against our own list, which is a stronger thing than a
 * document: the wrong person cannot pick up a slip that a volunteer is holding.
 *
 * WHY PAPER AND NOT AN EMAIL WITH A CODE IN IT. Half the entrants are twelve to fifteen.
 * A plan that depends on a child having a charged phone, having found the right email, and
 * having signal in a hall is a plan that degrades into a volunteer typing names — which is
 * the thing this was built to avoid. Paper works for everybody or for nobody, and it works.
 *
 * WHAT IS ON A SLIP, AND WHAT IS NOT. The public name — first name and last initial,
 * exactly what goes on the projector — and the reference. No surname, no date of birth, no
 * phone number, no email, nothing medical. These lie face-up on a table in a public hall,
 * so a slip must reveal no more than the big screen already does. `checkInSlips()` is the
 * only thing that builds them and it selects those fields and no others; a test asserts
 * the surname and the mobile are absent.
 *
 * THE ONE REAL RISK, STATED. The QR code IS the check-in credential. A slip in the wrong
 * hands is a slip that can be presented as somebody else — which is why the check-in
 * endpoint is behind the moderator gate (possession is not authority: see
 * admin/checkin/actions.ts), why a second use reports the time of the first rather than
 * silently succeeding, and why the nightly job blanks every token the day after the event.
 * The remaining exposure is a slip somebody keeps, and the mitigation for that is on the
 * sheet: collect the leftovers and bin them.
 */
export default async function SlipsPage() {
  const me = await currentPlayer();
  if (!me?.canWorkDesk) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Staff only</h1>
      </div>
    );
  }

  const event = getEvent(EVENTS[0]?.slug ?? "");
  const slips = event ? await checkInSlips(event.slug) : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Everything in here is screen-only: instructions for whoever is at the printer. */}
      <div className="no-print">
        <h1>Check-in slips — {event?.title ?? "no event"}</h1>
        {slips.length === 0 ? (
          <p>
            Nothing to print. Codes are issued when the draw runs, so if the draw has not
            happened yet there are no slips.
          </p>
        ) : (
          <>
            <p>
              <strong>{slips.length} slips.</strong> Print on plain A4 — 18 to a page, so{" "}
              {Math.ceil(slips.length / 18)} sheets. In the print dialogue, set{" "}
              <strong>Scale: 100%</strong> and turn <strong>headers and footers off</strong>;
              a shrunk page shrinks the codes and they stop scanning across a desk.
            </p>
            <p>
              Cut along the grey lines and keep them in the order they print, which is
              first-name order. <strong>Hand each one over</strong> — do not lay the pile
              out for people to help themselves. You are checking their date of birth at
              the same moment, so it is one conversation, and handing it over means the
              wrong person cannot pick up somebody else&rsquo;s slip.
            </p>
            <p className="warn">
              <strong>These are the passes.</strong> A slip is what marks somebody present,
              so treat the pile like tickets: keep them face-up on one table with a
              volunteer beside it, and put the leftovers in a bin bag at the end rather than
              back in a folder. They stop working the day after the event in any case — the
              nightly job clears every code.
            </p>
            {/* Deliberately a line of text and not a button. Printing is Ctrl-P in every
                browser ever made, and turning this page into a client component to call
                window.print() would be a JavaScript dependency bought for nothing. */}
            <p className="printbtn">Press Ctrl-P (Windows) or ⌘-P (Mac) to print</p>
          </>
        )}
      </div>

      <div className="sheet">
        {slips.map((s) => (
          <div className="slip" key={s.reference}>
            <QrCode value={s.payload} className="qr" title={`Check-in code for ${s.publicName}`} />
            <div className="who">
              <p className="name">{s.publicName}</p>
              <p className="ref">{s.reference}</p>
              <p className="ev">{event?.shortTitle ?? ""}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Plain CSS rather than Tailwind, on purpose.
 *
 * This is the one page in the app whose layout is measured in millimetres on paper, and
 * Tailwind's scale is in rem against a screen. Print needs `@page`, physical units, and
 * `break-inside: avoid` — none of which have utility classes here — and it needs the site's
 * dark theme completely off, because a dark background either wastes a cartridge or prints
 * the code as grey-on-grey.
 */
const CSS = `
  .no-print { max-width: 44rem; margin: 0 auto; padding: 2rem 1rem; color: #d6d3cd;
              font: 400 15px/1.55 system-ui, sans-serif; }
  .no-print h1 { font-size: 1.6rem; margin: 0 0 .75rem; color: #fff; }
  .no-print p { margin: 0 0 .75rem; }
  .no-print strong { color: #fff; }
  .no-print .warn { border-left: 3px solid #e8a33d; padding-left: .9rem; }
  .printbtn { margin-top: .5rem; border: 1px solid #4a463f; background: none;
              color: #d6d3cd; border-radius: .6rem; padding: .6rem 1rem; font: inherit; }

  /* The sheet itself is always white with black text, on screen as well as on paper, so
     what is previewed is what comes out of the printer. */
  .sheet { background: #fff; color: #000; display: grid; grid-template-columns: repeat(3, 1fr);
           gap: 0; width: 190mm; margin: 1.5rem auto; }
  .slip { display: flex; align-items: center; gap: 2.5mm; box-sizing: border-box;
          height: 43mm; padding: 2.5mm; border: 0.3mm dashed #b0b0b0;
          break-inside: avoid; page-break-inside: avoid; }
  .qr { width: 30mm; height: 30mm; flex: none; }
  .who { min-width: 0; }
  .name { margin: 0; font: 700 13pt/1.15 system-ui, sans-serif; word-break: break-word; }
  .ref { margin: 1.5mm 0 0; font: 400 9.5pt/1 ui-monospace, monospace; letter-spacing: .02em; }
  .ev { margin: 1.5mm 0 0; font: 400 7pt/1 system-ui, sans-serif; color: #555; }

  @media print {
    .no-print { display: none !important; }
    @page { size: A4 portrait; margin: 10mm; }
    html, body { background: #fff !important; }
    .sheet { width: auto; margin: 0; }
  }
`;
