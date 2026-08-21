import type { Metadata } from "next";
import { ORG } from "@/data/org";

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
      </ul>

      <p className="mt-10 rounded-2xl border border-line bg-surface/60 p-5 text-muted">
        To sponsor an event, get in touch:{" "}
        <span className="text-kesri">{ORG.email}</span>
      </p>
    </div>
  );
}
