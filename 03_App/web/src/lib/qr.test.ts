/**
 * The printed pass has to scan.
 *
 * These tests do not assert anything about our own output shape, because a QR code that
 * we agree with ourselves about is worth nothing. They ENCODE with src/lib/qr.ts and
 * DECODE with jsQR — a separate implementation, by a different author, from a different
 * decade. If the error correction, the mask choice or the format bits were wrong, our own
 * assertions would pass and this one would not.
 *
 * The rasteriser below is what a camera sees: a grid of black and white pixels with a
 * quiet zone around it. Nothing about it is clever; it exists so the test can hand jsQR
 * the same thing a webcam would.
 */
import { describe, it, expect } from "vitest";
import jsQR from "jsqr";
import { qrMatrix, qrSvgPath, checkInPayload, tokenFromScan, QR_PREFIX } from "./qr";

/** Render a module grid to RGBA pixels, quiet zone included, as a camera would see it. */
function rasterise(text: string, scale = 4, margin = 4) {
  const { modules, count } = qrMatrix(text);
  const width = (count + margin * 2) * scale;
  const data = new Uint8ClampedArray(width * width * 4).fill(255);

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!modules[r][c]) continue;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const px = (c + margin) * scale + x;
          const py = (r + margin) * scale + y;
          const i = (py * width + px) * 4;
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      }
    }
  }
  return { data, width };
}

function roundTrip(text: string): string | null {
  const { data, width } = rasterise(text);
  return jsQR(data, width, width)?.data ?? null;
}

describe("a code we print can be read by a decoder that is not ours", () => {
  it("round-trips a real check-in payload", () => {
    // The shape selection.ts actually issues: 24 random bytes, base64url.
    const token = "kR7pQzT2nX9vL4mB8sD1yF6hJ0wC3eGa";
    const payload = checkInPayload(token);
    expect(roundTrip(payload)).toBe(payload);
  });

  it("round-trips every base64url character, so no token can be the unlucky one", () => {
    // A token is drawn from this alphabet. Encoding all of it in one payload exercises
    // byte-mode boundaries that a single sample would miss by chance.
    const all = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    expect(roundTrip(checkInPayload(all))).toBe(checkInPayload(all));
  });

  it("round-trips a hundred random tokens", () => {
    // Masking is chosen per code from the data. One sample tests one mask; a hundred
    // tokens cover the choice, which is where a plausible-looking encoder goes wrong.
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    for (let n = 0; n < 100; n++) {
      let token = "";
      for (let i = 0; i < 32; i++) {
        token += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      const payload = checkInPayload(token);
      expect(roundTrip(payload)).toBe(payload);
    }
  });
});

describe("the grid", () => {
  it("is version 3 for a check-in token — 29 modules", () => {
    // Not an arbitrary assertion: it fixes the physical size. At 29 modules a 30mm slip
    // prints ~1mm cells, which a laptop webcam reads across a desk. If a longer payload
    // pushed this to version 6, the same 30mm would print 0.7mm cells and stop scanning
    // at that distance — so the number is worth pinning.
    expect(qrMatrix(checkInPayload("kR7pQzT2nX9vL4mB8sD1yF6hJ0wC3eGa")).count).toBe(29);
  });

  it("leaves the four-module quiet zone in the viewBox", () => {
    const { size } = qrSvgPath(checkInPayload("kR7pQzT2nX9vL4mB8sD1yF6hJ0wC3eGa"));
    expect(size).toBe(29 + 8);
  });

  it("draws something, in integer module coordinates only", () => {
    const { path } = qrSvgPath(checkInPayload("kR7pQzT2nX9vL4mB8sD1yF6hJ0wC3eGa"));
    expect(path.length).toBeGreaterThan(100);
    // Fractional coordinates are how a printed code goes grey: the printer rounds them
    // into the middle of a module. There must not be any.
    expect(path).not.toMatch(/\./);
  });

  it("draws the SAME grid it encoded — the path is read back and compared", () => {
    /**
     * The one step the round-trip above does not cover. `qrMatrix` is tested against a
     * real decoder, but the `<path>` is built from it by hand, and a mistake in the run
     * merging — an off-by-one, a mirrored coordinate, a quiet zone applied to one axis —
     * would leave every assertion above passing and print sixty-four unreadable slips.
     *
     * So: parse the path back into a grid and compare it to the matrix it came from.
     */
    const text = checkInPayload("kR7pQzT2nX9vL4mB8sD1yF6hJ0wC3eGa");
    const { modules, count } = qrMatrix(text);
    const { path, size } = qrSvgPath(text);

    const drawn: boolean[][] = Array.from({ length: size }, () =>
      new Array<boolean>(size).fill(false),
    );
    const re = /M(\d+) (\d+)h(\d+)v1h-\d+z/g;
    let m: RegExpExecArray | null;
    let runs = 0;
    while ((m = re.exec(path))) {
      const [x, y, run] = [Number(m[1]), Number(m[2]), Number(m[3])];
      for (let i = 0; i < run; i++) drawn[y][x + i] = true;
      runs += 1;
    }
    // Every command in the path was understood by that pattern, so nothing was skipped.
    expect(path.split("M").length - 1).toBe(runs);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inQuietZone = r < 4 || c < 4 || r >= 4 + count || c >= 4 + count;
        expect(drawn[r][c]).toBe(inQuietZone ? false : modules[r - 4][c - 4]);
      }
    }
  });

  it("merges runs rather than emitting a rectangle per module", () => {
    const { path } = qrSvgPath(checkInPayload("kR7pQzT2nX9vL4mB8sD1yF6hJ0wC3eGa"));
    // A finder pattern is seven dark modules in a row, so at least one run must be long.
    expect(path).toMatch(/h[3-9]v1/);
  });
});

describe("reading a scan back", () => {
  it("accepts one of ours", () => {
    expect(tokenFromScan(checkInPayload("abc123"))).toBe("abc123");
  });

  it("tolerates the newline some scanners append", () => {
    expect(tokenFromScan(`${QR_PREFIX}abc123\n`)).toBe("abc123");
  });

  it("refuses a QR code that is not ours at all", () => {
    // The distinction the desk needs: this is somebody's loyalty card, not a pass we have
    // lost track of. Different sentence, different action.
    expect(tokenFromScan("https://example.com")).toBeNull();
    expect(tokenFromScan("WIFI:S=Gurdwara;")).toBeNull();
  });

  it("refuses our prefix with nothing after it", () => {
    expect(tokenFromScan(QR_PREFIX)).toBeNull();
  });

  it("does not treat a bare token as valid", () => {
    // Belt and braces on the prefix: an unprefixed 32-character string is not a pass,
    // even though it looks exactly like the token inside one.
    expect(tokenFromScan("kR7pQzT2nX9vL4mB8sD1yF6hJ0wC3eGa")).toBeNull();
  });
});
