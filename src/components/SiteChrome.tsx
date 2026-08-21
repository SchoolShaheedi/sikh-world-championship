"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "./Logo";
import { ORG } from "@/data/org";

const NAV = [
  { href: "/events", label: "Events" },
  { href: "/play", label: "Find a game" },
  { href: "/players", label: "Players" },
  { href: "/about", label: "About" },
  { href: "/safeguarding", label: "Safety" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-body" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-surface2 text-body" : "text-muted hover:text-body"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/events/sikh-fifa-26/signup"
            className="ml-2 rounded-lg bg-kesri px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            Sign up
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
          className="rounded-lg border border-line px-3 py-2 text-sm sm:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line/70 px-4 pb-4 sm:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block border-b border-line/50 py-3 text-body"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/events/sikh-fifa-26/signup"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-lg bg-kesri px-4 py-3 text-center font-bold text-ink"
          >
            Sign up
          </Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted">{ORG.tagline}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold tracking-[0.18em] text-muted">EVENTS</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/events" className="text-body hover:text-kesri">All events</Link></li>
            <li><Link href="/events/sikh-fifa-26" className="text-body hover:text-kesri">Sikh FIFA 26</Link></li>
            <li><Link href="/events/sikh-fifa-26/bracket" className="text-body hover:text-kesri">Live bracket</Link></li>
            <li><Link href="/play" className="text-body hover:text-kesri">Find a game</Link></li>
            <li><Link href="/volunteer" className="text-body hover:text-kesri">Volunteer with us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold tracking-[0.18em] text-muted">ORGANISATION</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about" className="text-body hover:text-kesri">About</Link></li>
            <li><Link href="/safeguarding" className="text-body hover:text-kesri">Safety &amp; safeguarding</Link></li>
            <li><Link href="/support" className="text-body hover:text-kesri">Support &amp; report a problem</Link></li>
            <li><Link href="/sponsors" className="text-body hover:text-kesri">Sponsors</Link></li>
            <li><span className="text-muted">{ORG.email}</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/50 px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {ORG.name}
      </div>
    </footer>
  );
}
