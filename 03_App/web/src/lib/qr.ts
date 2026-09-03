/**
 * QR codes, for the arrival desk.
 *
 * ONE JOB: turn a check-in token into something a camera can read off a printed slip.
 *
 * WHY A LIBRARY AND NOT OUR OWN ENCODER. A QR encoder is Reed–Solomon error correction,
 * eight mask patterns and a format-information BCH code. All three are places where a bug
 * produces a code that looks perfect and does not scan — and the first anybody would know
 * is a queue of sixty-four people at the door. `qrcode-generator` has been the reference
 * JavaScript implementation since 2009, has no dependencies, and does no I/O, so it runs
 * unchanged on Cloudflare Workers.
 *
 * WHY THE SVG IS OURS. The library can emit its own markup, but this page is printed, and
 * print needs control: exact module alignment on a millimetre grid, no anti-aliased gaps
 * between cells, no inline styles a print stylesheet has to fight. One `<path>` built from
 * the module matrix gives all of that, and keeps the output a plain string that React
 * renders as an attribute rather than as HTML.
 *
 * HOW WE KNOW IT WORKS. qr.test.ts encodes with this module and decodes with jsQR — a
 * separate implementation by a different author. Two independent codebases agreeing on the
 * bits is a much stronger statement than any assertion about our own output, and it is the
 * only test that would actually have caught a Reed–Solomon mistake.
 */
import qrcode from "qrcode-generator";

/**
 * Marks the payload as one of ours.
 *
 * Costs five characters and buys a real distinction at the desk: a QR code that is not
 * ours at all — a loyalty card, a Wi-Fi code, a poster on the wall — is rejected with
 * "that is not a pass for this event", while a pass we do not recognise gets "that pass
 * is not on the list". Those two need different things done about them, and a volunteer
 * should not have to guess which one they are looking at.
 *
 * Versioned because the day we change what is in the payload, the old printed slips are
 * already in a box.
 */
export const QR_PREFIX = "SWC1:";

/** Wrap a check-in token as it is printed. */
export function checkInPayload(token: string): string {
  return `${QR_PREFIX}${token}`;
}

/**
 * Pull the token back out of a scan, or null if this is not one of our codes.
 *
 * Trims first: some scanners append a newline, and a token with a trailing "\n" matches
 * nothing in the database, which at a desk looks exactly like an unrecognised pass.
 */
export function tokenFromScan(raw: string): string | null {
  const s = raw.trim();
  if (!s.startsWith(QR_PREFIX)) return null;
  const token = s.slice(QR_PREFIX.length);
  return token.length > 0 ? token : null;
}

/**
 * Error correction level M — about 15% of the code can be damaged and still read.
 *
 * L would fit a smaller grid and print larger modules, which is tempting. M is chosen
 * because these are handled: picked up off a table, put in a pocket, held in a fist while
 * queueing. A creased slip is the expected case, not the exception.
 */
const EC_LEVEL = "M" as const;

/** Quiet zone, in modules. Four is the specification's figure; less and readers fail. */
const MARGIN = 4;

export interface QrMatrix {
  /** Module grid, row-major. True is dark. Excludes the quiet zone. */
  modules: boolean[][];
  /** Grid width in modules, excluding the quiet zone. */
  count: number;
}

/**
 * Encode a string to its module grid.
 *
 * Type number 0 asks the library for the smallest version the data fits in, which for a
 * check-in token is version 3 (29×29). Fixing a version by hand would mean a longer token
 * silently overflowing.
 */
export function qrMatrix(text: string): QrMatrix {
  const qr = qrcode(0, EC_LEVEL);
  qr.addData(text, "Byte");
  qr.make();
  const count = qr.getModuleCount();
  const modules: boolean[][] = [];
  for (let r = 0; r < count; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < count; c++) row.push(qr.isDark(r, c));
    modules.push(row);
  }
  return { modules, count };
}

export interface QrSvg {
  /** `d` attribute for a single `<path>`, in module units. */
  path: string;
  /** viewBox width and height, including the quiet zone. */
  size: number;
}

/**
 * One path, in module coordinates, for a `viewBox` of `size`.
 *
 * Consecutive dark modules in a row are merged into one rectangle. Not premature: the
 * slips page renders sixty-four of these, and per-module rectangles doubled the size of
 * the printed document for no visual difference whatsoever.
 *
 * Coordinates are integers in module units and the caller sets the physical size, so the
 * printer's own rounding lands on module boundaries rather than a third of the way into
 * one. That is the difference between a crisp code and a grey one.
 */
export function qrSvgPath(text: string): QrSvg {
  const { modules, count } = qrMatrix(text);
  const parts: string[] = [];

  for (let r = 0; r < count; r++) {
    let c = 0;
    while (c < count) {
      if (!modules[r][c]) {
        c += 1;
        continue;
      }
      let run = 1;
      while (c + run < count && modules[r][c + run]) run += 1;
      parts.push(`M${c + MARGIN} ${r + MARGIN}h${run}v1h-${run}z`);
      c += run;
    }
  }

  return { path: parts.join(""), size: count + MARGIN * 2 };
}
