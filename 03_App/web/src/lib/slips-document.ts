/**
 * The check-in slips, as a complete HTML document with no application in it.
 *
 * WHY THIS IS NOT A PAGE. It was one, and it printed as blank sheets on a real laptop
 * while printing perfectly in headless Chrome — twice, hardened twice, reported twice. A
 * page inherits the whole document: Tailwind's preflight, the site's near-black theme, a
 * `position: sticky` header, two fixed-position pseudo-elements painting grain over every
 * printed page, a flex `body` with `min-height: 100dvh` that Chrome fragments badly, and
 * whatever a browser extension has decided to inject with `!important`. Every one of
 * those is a way for somebody else's colour or layout decision to reach a sheet of paper,
 * and defending against them one at a time is a game with no end and no test.
 *
 * So the slips stopped being a page. This builds the entire document — doctype, head,
 * one stylesheet, the slips — and a route handler returns it as `text/html`. There is no
 * React on the page, no framework CSS, no font request, no site chrome and no theme. What
 * a printer receives is what is in this file, which is also the only reason the print
 * layout can be tested at all.
 *
 * It is also just simpler. The measurements here are millimetres on A4; Tailwind's scale
 * is rem against a screen, so the old page could not use it and carried its own plain CSS
 * anyway. This removes the framework the page was fighting rather than adding another
 * layer of defence against it.
 *
 * WHAT IS ON A SLIP, AND WHAT IS NOT. The public name — first name and last initial,
 * exactly what goes on the projector — the reference, and the QR code. No surname, no date
 * of birth, no phone number, no email, nothing medical. `checkInSlips()` selects those
 * fields and no others, and a test asserts the surname and the mobile never reach it.
 *
 * THE ONE REAL RISK, STATED. The QR code IS the check-in credential. A slip in the wrong
 * hands is a slip that can be presented as somebody else — which is why the check-in
 * endpoint is behind the staff gate (possession is not authority: see
 * admin/checkin/actions.ts), why a second use reports the time of the first rather than
 * silently succeeding, and why the nightly job blanks every token the day after the event.
 * The remaining exposure is a slip somebody keeps, and the mitigation for that is printed
 * on the sheet: collect the leftovers and bin them.
 */
import { qrSvgPath } from "./qr";
import type { Slip } from "./check-in";

/** Slips per A4 sheet: three columns, six rows. */
export const SLIPS_PER_SHEET = 18;

/**
 * HTML-escape. Everything interpolated below is either ours or a name somebody typed into
 * a registration form, and a name is user input however ordinary it looks.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Black on white, always. These are printed and then read by a camera under strip
 * lighting, and a decoder wants maximum contrast. `shape-rendering="crispEdges"` turns off
 * anti-aliasing, because a blurred module edge is exactly the ambiguity that error
 * correction then has to spend itself on.
 */
function qr(payload: string, label: string): string {
  const { path, size } = qrSvgPath(payload);
  return (
    `<svg class="qr" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"` +
    ` role="img" aria-label="Check-in code for ${esc(label)}">` +
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<path d="${path}" fill="#000000"/>` +
    `</svg>`
  );
}

/**
 * The stylesheet.
 *
 * `color-scheme: light` is on `:root` and not on a region, which is the difference that
 * matters: Chrome's auto-dark-mode decides per DOCUMENT, so declaring it on the sheet
 * opted a white box out of nothing. A document that says it is light is not force-darkened
 * at all.
 *
 * `forced-color-adjust: none` is for Windows High Contrast and macOS "Increase contrast",
 * which REPLACE author colours with system ones — in a dark system palette, light ink on
 * white paper. `print-color-adjust: exact` stops the browser "optimising" colour for
 * print, which is also what drops the white ground under a QR code when the print
 * dialogue's "Background graphics" is off.
 *
 * Every text element states its own colour. Reaching the names by inheritance loses to any
 * direct rule from anywhere, and there is no longer anywhere for such a rule to come from —
 * but a code that scans on screen and prints blank is discovered at a door with a queue
 * behind it, so this is the one place worth belt and braces.
 */
const CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #000;
             forced-color-adjust: none; -webkit-print-color-adjust: exact;
             print-color-adjust: exact; }

.notes { max-width: 44rem; margin: 0 auto; padding: 1.75rem 1rem 0;
         font: 400 15px/1.55 system-ui, -apple-system, sans-serif; color: #1a1a1a; }
.notes h1 { font-size: 1.5rem; margin: 0 0 .75rem; color: #000; }
.notes p { margin: 0 0 .75rem; }
.notes strong { color: #000; }
.notes .warn { border-left: 3px solid #b26a00; padding-left: .9rem; }
.notes .hint { border-left: 3px solid #999; padding-left: .9rem; color: #444; font-size: 14px; }
.notes a { color: #0b57d0; }

.sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
         width: 190mm; margin: 1.5rem auto; background: #fff; color: #000; }
.slip { display: flex; align-items: center; gap: 2.5mm; height: 43mm; padding: 2.5mm;
        border: 0.3mm dashed #b0b0b0; background: #fff; color: #000;
        forced-color-adjust: none; break-inside: avoid; page-break-inside: avoid; }
.qr { width: 30mm; height: 30mm; flex: none; forced-color-adjust: none; }
.who { min-width: 0; }
/* 11.5pt, not 13: at 13pt "Amandeep" does not fit the 28mm the text column has once the
   code has taken its 30mm, and the wrap lands mid-word — "Amandee p S." on a slip a
   volunteer is reading off a table. 'word-break: normal' keeps breaks at the space;
   'overflow-wrap' is the fallback for a single unbroken word. */
.name { margin: 0; font: 700 11.5pt/1.2 system-ui, -apple-system, sans-serif; color: #000;
        word-break: normal; overflow-wrap: break-word; hyphens: none; }
.ref { margin: 1.5mm 0 0; font: 400 9.5pt/1 ui-monospace, "SF Mono", monospace;
       letter-spacing: .02em; color: #000; }
.ev { margin: 1.5mm 0 0; font: 400 7pt/1 system-ui, -apple-system, sans-serif; color: #555; }

@media print {
  .notes { display: none !important; }
  @page { size: A4 portrait; margin: 10mm; }
  .sheet { width: auto; margin: 0; }
}
`;

/** Wrap a body in the document shell. Used for the slips and for the refusal alike. */
function doc(title: string, body: string): string {
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    // Belt to the CSS `color-scheme` braces: some engines read the meta and not the
    // property, and this document must never be force-darkened.
    `<meta name="color-scheme" content="light">` +
    `<meta name="robots" content="noindex, nofollow">` +
    `<title>${esc(title)}</title><style>${CSS}</style></head>` +
    `<body>${body}</body></html>`
  );
}

/** What somebody without desk access gets. Deliberately says nothing about the event. */
export function slipsRefused(): string {
  return doc(
    "Staff only",
    `<div class="notes"><h1>Staff only</h1><p>You do not have access to this page.</p></div>`,
  );
}

/**
 * The printable sheet.
 *
 * `eventTitle` goes above the sheet for whoever is at the printer; `eventShortTitle` is
 * the one line that fits on a slip.
 */
export function slipsDocument(input: {
  eventTitle: string;
  eventShortTitle: string;
  slips: readonly Slip[];
}): string {
  const { eventTitle, eventShortTitle, slips } = input;
  const sheets = Math.ceil(slips.length / SLIPS_PER_SHEET);

  const notes =
    slips.length === 0
      ? `<p>Nothing to print. Codes are issued when the draw runs, so if the draw has not
           happened yet there are no slips.</p>`
      : `<p><strong>${slips.length} slips.</strong> Print on plain A4 — ${SLIPS_PER_SHEET} to
           a page, so ${sheets} sheet${sheets === 1 ? "" : "s"}. In the print dialogue set
           <strong>Scale: 100%</strong> and turn <strong>headers and footers off</strong>; a
           shrunk page shrinks the codes and they stop scanning across a desk.</p>
         <p>Cut along the grey lines and keep them in the order they print, which is
           first-name order. <strong>Hand each one over</strong> — do not lay the pile out
           for people to help themselves. You are checking their date of birth at the same
           moment, so it is one conversation, and handing it over means the wrong person
           cannot pick up somebody else&rsquo;s slip.</p>
         <p class="warn"><strong>These are the passes.</strong> A slip is what marks somebody
           present, so treat the pile like tickets: keep them face-up on one table with a
           volunteer beside it, and put the leftovers in a bin bag at the end rather than
           back in a folder. They stop working the day after the event in any case — the
           nightly job clears every code.</p>
         <p>Press <strong>Ctrl-P</strong> (Windows) or <strong>&#8984;-P</strong> (Mac) to
           print.</p>
         <p class="hint"><strong>If the preview shows blank pages,</strong> open this page in
           a private or incognito window and print from there. This page carries its own
           stylesheet and nothing else, so blank sheets mean a browser extension — a
           dark-mode or reader extension — is rewriting the colours, and extensions are off
           in a private window. Safari and Firefox print it correctly too.</p>`;

  const grid = slips
    .map(
      (s) =>
        `<div class="slip">${qr(s.payload, s.publicName)}<div class="who">` +
        `<p class="name">${esc(s.publicName)}</p>` +
        `<p class="ref">${esc(s.reference)}</p>` +
        `<p class="ev">${esc(eventShortTitle)}</p>` +
        `</div></div>`,
    )
    .join("");

  return doc(
    `Check-in slips — ${eventTitle}`,
    `<div class="notes"><h1>Check-in slips — ${esc(eventTitle)}</h1>${notes}</div>` +
      `<div class="sheet">${grid}</div>`,
  );
}
