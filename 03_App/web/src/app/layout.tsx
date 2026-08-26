import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ORG } from "@/data/org";
import { findLogo, findLogoMark } from "@/lib/brand-assets";

/**
 * Three faces, each doing one job:
 *   display — Space Grotesk, for headlines. Has actual character at heavy weights,
 *             where system-ui just looks like bold Helvetica.
 *   body    — Inter, for everything readable.
 *   mono    — JetBrains Mono, for micro-labels, stat numbers and section numbering.
 *             The mono is what makes the small detailing read as craft rather than
 *             just small text.
 *
 * Loaded through next/font, so they're self-hosted, preloaded, and carry a size-adjusted
 * fallback — no layout shift and no render-blocking request to Google.
 */
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${ORG.name} — ${ORG.tagline}`,
    template: `%s · ${ORG.short}`,
  },
  description: ORG.intro,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Drop a file into public/brand/ and it appears — see that folder's README.
  // The nav renders at 22px, so it uses the simplified mark when one is supplied.
  const logo = findLogo();
  const mark = findLogoMark();

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="page-grain flex min-h-dvh flex-col">
        <SiteHeader logoSrc={mark} />
        <main className="flex-1">{children}</main>
        <SiteFooter logoSrc={logo} />
      </body>
    </html>
  );
}
