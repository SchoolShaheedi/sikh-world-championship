import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sponsors" };

export default function SponsorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">Sponsors</h1>
      <p className="mt-5 text-lg text-muted">
        Sponsorship is what keeps entry free. It pays for the venue, the consoles, the
        trophies and the langar — so that no young person is priced out of competing.
      </p>

      <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
        {/* TODO: replace with sponsor logos as they're confirmed. */}
        Sponsor logos will appear here.
      </div>

      <h2 className="font-display mt-14 text-2xl">What a sponsor gets</h2>
      <ul className="mt-4 space-y-3 text-muted">
        <li>Logo on this page, on the event page and on the live bracket screen</li>
        <li>Logo on player cards, which players share themselves across social media</li>
        <li>Named awards — the Golden Boot or Fair Play award can carry your name</li>
        <li>Presence at the event, and mentions across the day</li>
        <li>Association with a community event that is free to enter, by design</li>
        <li>
          An offer to profile holders — a discount or early access that only people with a
          Sikh World Championship profile can use, reaching them directly rather than
          through an advert they scroll past
        </li>
      </ul>

      {/* Stated as a plan, not a live benefit. No sponsor has agreed an offer yet, and a
          person deciding whether to make a profile must not be promised a discount that
          does not exist — see src/data/profile-benefits.ts. */}
      <p className="mt-6 text-sm text-muted">
        Sponsor offers are new and none are live yet. If you would like yours to be the
        first, say so when you get in touch.
      </p>

      <p className="mt-10 rounded-2xl border border-line bg-surface/60 p-5 text-muted">
        To sponsor an event,{" "}
        <Link href="/support" className="text-kesri hover:underline">
          get in touch
        </Link>
        .
      </p>
    </div>
  );
}
