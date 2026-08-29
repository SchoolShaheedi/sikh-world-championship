import { ImageResponse } from "next/og";
import { ORG } from "@/data/org";

/**
 * The image people see when the site is shared — WhatsApp, Slack, Instagram DMs, the
 * gurdwara WhatsApp group. Until now there was none, so shares rendered a grey triangle.
 *
 * For a community event that spreads by being forwarded, this is not decoration: it is
 * the first thing most people will ever see of SWC, usually before the website itself.
 *
 * Generated rather than a static file so the wordmark and tagline stay in step with
 * `src/data/org.ts` — a hand-made PNG would quietly go stale the moment the name changes,
 * and there is already a naming discrepancy in flight (Championship vs Championships).
 */
export const alt = `${ORG.name} — ${ORG.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette, from globals.css. Duplicated deliberately: this renders outside the
// browser, so CSS custom properties are not available.
const INK = "#0B0B0C";
const KESRI = "#FF8A2B";
const TEXT = "#F4F4F5";
const MUTED = "#9B9BA3";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: INK,
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* A kesri wash from the corner — the same warm glow the site's hero uses. */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -180,
            width: 760,
            height: 760,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(255,138,43,0.22) 0%, rgba(255,138,43,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 16,
              height: 52,
              background: KESRI,
              borderRadius: 4,
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              color: KESRI,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {ORG.short}
          </div>
        </div>

        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: TEXT,
            lineHeight: 1.04,
            marginTop: 26,
            letterSpacing: -2,
            display: "flex",
            maxWidth: 900,
          }}
        >
          {ORG.name}
        </div>

        <div
          style={{
            fontSize: 40,
            color: KESRI,
            marginTop: 22,
            display: "flex",
          }}
        >
          {ORG.tagline}
        </div>

        <div
          style={{
            fontSize: 26,
            color: MUTED,
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span>sikhchampionships.com</span>
          <span>Esports · Sport · Mind games</span>
        </div>
      </div>
    ),
    size,
  );
}
