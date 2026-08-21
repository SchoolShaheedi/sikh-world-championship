import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ORG } from "@/data/org";

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
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
