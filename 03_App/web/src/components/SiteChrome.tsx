"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "./Logo";
import { BrandLockup } from "./BrandLockup";
import { ORG } from "@/data/org";

/**
 * "Find a game" (/play) and "Players" (/players) are hidden for now — the routes, the
 * board, the guardian flow and their tests all still exist and work. Add the two lines
 * back here and in the footer to bring them out of hiding.
 */
const NAV = [
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
];

export function SiteHeader({ logoSrc = null }: { logoSrc?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-linesoft bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-body" onClick={() => setOpen(false)}>
          <Wordmark src={logoSrc} />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`pill px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border border-line bg-surface2 text-body"
                    : "text-muted hover:text-body"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/events/sikh-fc-27/signup"
            className="pill ml-2 bg-kesri px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            Register interest
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
          className="pill border border-line px-4 py-2 text-sm sm:hidden"
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
            href="/events/sikh-fc-27/signup"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-full bg-kesri px-4 py-3 text-center font-bold text-ink"
          >
            Register interest
          </Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter({ logoSrc = null }: { logoSrc?: string | null }) {
  return (
    <footer className="mt-24 border-t border-linesoft bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          {logoSrc ? (
            <BrandLockup src={logoSrc} width={210} />
          ) : (
            <Wordmark />
          )}
          <p className="mt-3 max-w-xs text-sm text-muted">{ORG.tagline}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold tracking-[0.18em] text-muted">EVENTS</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/events" className="text-body hover:text-kesri">All events</Link></li>
            <li><Link href="/events/sikh-fc-27" className="text-body hover:text-kesri">Sikh FC 27</Link></li>
            <li><Link href="/events/sikh-fc-27/bracket" className="text-body hover:text-kesri">Live bracket</Link></li>
            <li><Link href="/volunteer" className="text-body hover:text-kesri">Volunteer with us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold tracking-[0.18em] text-muted">ORGANISATION</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about" className="text-body hover:text-kesri">About</Link></li>
            <li><Link href="/support" className="text-body hover:text-kesri">Support &amp; report a problem</Link></li>
            <li><Link href="/sponsors" className="text-body hover:text-kesri">Sponsors</Link></li>
            {/* In the footer rather than the header: signing in is for the handful of
                people who already have an account, and the header's one call to action
                should stay on entering an event. */}
            <li><Link href="/signin" className="text-body hover:text-kesri">Sign in</Link></li>
            <li><Link href="/support" className="text-body hover:text-kesri">Contact us</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/50 px-4 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {ORG.name}
      </div>
    </footer>
  );
}
