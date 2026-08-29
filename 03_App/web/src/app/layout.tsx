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

/**
 * `metadataBase` is required for the Open Graph image to work at all: without it Next
 * emits a relative og:image URL, and every scraper ignores it. That is why shares
 * rendered a grey triangle rather than anything of ours.
 *
 * Falls back to the production origin rather than localhost, so a preview build still
 * produces shareable URLs instead of links to someone's laptop.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sikhchampionships.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${ORG.name} — ${ORG.tagline}`,
    template: `%s · ${ORG.short}`,
  },
  description: ORG.intro,
  openGraph: {
    type: "website",
    siteName: ORG.name,
    title: `${ORG.name} — ${ORG.tagline}`,
    description: ORG.intro,
    url: SITE_URL,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${ORG.name} — ${ORG.tagline}`,
    description: ORG.intro,
  },
  // The site is not open for entries and the safeguarding leads are still unnamed, so
  // there is nothing here worth indexing yet. Flip this when entries open.
  robots: { index: false, follow: true },
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
