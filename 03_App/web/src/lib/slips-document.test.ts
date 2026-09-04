/**
 * The print document.
 *
 * These slips printed as three blank sheets on a real laptop while printing perfectly in
 * headless Chrome, twice, after being hardened twice. The page was never wrong; what was
 * wrong was that a page cannot be tested — the thing that broke it lived in the document
 * around it, in a stylesheet nobody on this side controls.
 *
 * So the document is now a string this file can read. The tests below are mostly about
 * what must NOT be in it, because every one of those was a real way for a sheet of paper
 * to come out empty.
 */
import { describe, expect, it } from "vitest";
import { slipsDocument, slipsRefused, SLIPS_PER_SHEET } from "./slips-document";
import type { Slip } from "./check-in";

const slip = (over: Partial<Slip> = {}): Slip => ({
  reference: over.reference ?? "SWC-0001",
  publicName: over.publicName ?? "Amritpal S.",
  payload: over.payload ?? "swc:checkin:tok-amritpal",
});

const doc = (slips: Slip[] = [slip()]) =>
  slipsDocument({ eventTitle: "Sikh FC 27 Championship", eventShortTitle: "FC 27", slips });

describe("the printable slips document", () => {
  it("is a complete document and not a fragment", async () => {
    const html = doc();
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<html lang=\"en\">");
    expect(html).toContain("</html>");
  });

  /**
   * THE WHOLE POINT. Every name below is something that reached the old page through the
   * root layout and could paint over, invert or blank a sheet: Tailwind's preflight and
   * dark theme, a sticky header, two fixed-position pseudo-elements painting grain on
   * every printed page, and a flex body with a viewport-height minimum that Chrome
   * fragments badly across pages.
   */
  it("carries no application CSS, no site chrome and no theme", async () => {
    const html = doc();
    for (const banned of [
      "page-grain", // fixed-position grain, repainted on every printed page
      "min-h-dvh", // a viewport-height flex body, fragmented badly in paged media
      "sticky", // the site header, which sticks to the top of every printed page
      "globals.css",
      "_next/static", // no framework stylesheet, so no cascade to lose to
      "tailwind",
      "<script", // nothing to hydrate: what is printed is what was sent
      "backdrop-filter",
    ]) {
      expect(html.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  /**
   * `color-scheme` on `:root` and not on a region. Chrome's auto-dark-mode decides per
   * DOCUMENT, so the old declaration on the white sheet opted a white box out of nothing.
   */
  it("declares itself a light document, at the root and in a meta tag", async () => {
    const html = doc();
    expect(html).toContain(":root { color-scheme: light; }");
    expect(html).toContain('<meta name="color-scheme" content="light">');
  });

  it("states a colour on every text element rather than inheriting one", async () => {
    // Inheritance loses to any direct rule from anywhere. There is no longer anywhere for
    // such a rule to come from, but this is the page discovered at a door with a queue.
    const html = doc();
    for (const rule of [".name {", ".ref {", ".ev {"]) {
      const block = html.slice(html.indexOf(rule), html.indexOf(rule) + 260);
      expect(block).toMatch(/color:\s*#/);
    }
  });

  it("keeps the sheet out of a printer's colour and contrast overrides", async () => {
    const html = doc();
    expect(html).toContain("forced-color-adjust: none");
    expect(html).toContain("print-color-adjust: exact");
    expect(html).toContain("@page { size: A4 portrait; margin: 10mm; }");
    expect(html).toContain("break-inside: avoid");
  });

  it("renders one slip per person, with the code, the name and the reference", async () => {
    const html = doc([
      slip({ reference: "SWC-0001", publicName: "Aman S. (1)" }),
      slip({ reference: "SWC-0002", publicName: "Aman S. (2)", payload: "swc:checkin:tok-2" }),
    ]);
    expect(html.match(/class="slip"/g)).toHaveLength(2);
    expect(html.match(/class="qr"/g)).toHaveLength(2);
    expect(html).toContain(">Aman S. (1)<");
    expect(html).toContain(">Aman S. (2)<");
    expect(html).toContain(">SWC-0001<");
    expect(html).toContain(">SWC-0002<");
  });

  it("draws the code as black modules on a white ground", async () => {
    // A camera under strip lighting wants maximum contrast, and a decoder wants a quiet
    // zone that is actually white when "Background graphics" is off.
    const html = doc();
    expect(html).toContain('fill="#ffffff"');
    expect(html).toContain('fill="#000000"');
    expect(html).toContain('shape-rendering="crispEdges"');
  });

  it("never puts the raw token in anything a person or a crawler reads", async () => {
    const html = doc([slip({ payload: "swc:checkin:secret-token-value" })]);
    // The payload belongs in the QR path and the aria-label must not repeat it.
    expect(html).not.toContain('aria-label="Check-in code for swc:checkin');
    expect(html).toContain('aria-label="Check-in code for Amritpal S."');
  });

  it("escapes a name, because a name is user input however ordinary it looks", async () => {
    const html = doc([slip({ publicName: 'Aman <script>alert(1)</script> S. & "co"' })]);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;co&quot;");
  });

  it("counts the sheets the way a printer will", async () => {
    const many = Array.from({ length: 48 }, (_, i) =>
      slip({ reference: `SWC-${i}`, payload: `swc:checkin:t${i}` }),
    );
    expect(SLIPS_PER_SHEET).toBe(18);
    expect(doc(many)).toContain("48 slips.");
    expect(doc(many)).toContain("3 sheets");
    expect(doc([slip()])).toContain("1 sheet.");
  });

  it("says why a blank preview is not this page's fault, on the page", async () => {
    // The one cause left is an extension rewriting colours with !important, and the
    // volunteer who hits it on 3 October needs the answer where they are, not in a doc.
    expect(doc()).toContain("incognito");
  });

  it("tells whoever is printing to collect the leftovers", async () => {
    // A slip is a live credential until the nightly job clears it. RETENTION-POLICY.
    expect(doc()).toContain("bin bag");
  });

  it("explains itself when there is nothing to print, rather than showing an empty grid", async () => {
    const html = doc([]);
    expect(html).toContain("Nothing to print");
    expect(html).not.toContain('class="slip"');
  });

  it("refuses without naming the event or how many people are coming", async () => {
    const html = slipsRefused();
    expect(html).toContain("Staff only");
    expect(html).not.toContain("Sikh FC 27");
    expect(html).not.toContain('class="slip"');
  });
});
