import Link from "next/link";
import type { Metadata } from "next";
import { SPONSORS } from "@/data/sponsors";

export const metadata: Metadata = { title: "Sponsors" };

/**
 * What a sponsor is told they get. Trimmed on 2026-09-01 when the award list was cut to
 * three prizes — it used to offer a named Golden Boot and Fair Play award, and neither
 * exists any more. Nothing on this page may promise something the event does not have.
 */
const WHAT_A_SPONSOR_GETS = [
  "Logo on this page, on the event page, and on the big screen beside the live bracket",
  "An offer to every profile holder — a discount only our players can use, reaching them directly rather than through an advert they scroll past",
  "Presence at the event, and mentions across the day",
  "Association with a community event that is free to enter, by design",
];

/**
 * What we need from a business that wants to sponsor. Written as questions because that
 * is what a first conversation actually needs: without the first two, nobody can say yes
 * or no, and without the third the offer cannot go on the site.
 */
const WHAT_TO_TELL_US = [
  "Who you are, and what you do",
  "What you would like to give — money, equipment, prizes, food, or an offer for our players",
  "If it is an offer: what it is, the code, and how long it lasts",
  "Whether you want your logo on the screen on the day",
  "Whether anyone from your team wants to be there",
  "Anything you need from us in return, so we can say yes or no honestly",
];

export default function SponsorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">Sponsors</h1>
      <p className="mt-5 text-lg text-muted">
        Sponsorship is what keeps entry free. It pays for the venue, the consoles, the
        prizes and the langar — so that no young person is priced out of competing.
      </p>

      <h2 className="font-display mt-12 text-2xl">Backing the championship</h2>
      <div className="mt-5 space-y-4">
        {SPONSORS.map((s) => (
          <div key={s.name} className="rounded-2xl border border-line bg-surface/60 p-6">
            <h3 className="font-display text-xl text-kesri">{s.name}</h3>
            <p className="mt-1 text-sm text-muted">{s.blurb}</p>
            <a
              href={`https://${s.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-kesri hover:underline"
            >
              {s.domain} →
            </a>
            {s.offer && (
              <div className="mt-4 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-body">
                <strong className="font-bold">{s.offer.detail}</strong> for Sikh World
                Championships players.
                <a
                  href={s.offer.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block font-semibold text-kesri hover:underline"
                >
                  See the range →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="font-display mt-14 text-2xl">What a sponsor gets</h2>
      <ul className="mt-4 space-y-3 text-muted">
        {WHAT_A_SPONSOR_GETS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="mt-14 rounded-3xl border border-line bg-surface/60 p-8">
        <h2 className="font-display text-2xl text-kesri">Sponsor the championship</h2>
        <p className="mt-4 text-muted">
          Sixty-four players aged 12 to 25, their families in the room with them, and a
          free day out built by volunteers. It is the first event of its kind for Sikh
          youth in the UK, and the people in that hall are the ones you want to reach.
        </p>
        <p className="mt-4 text-muted">Tell us:</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {WHAT_TO_TELL_US.map((q) => (
            <li key={q}>— {q}</li>
          ))}
        </ul>
        <Link
          href="/support?about=sponsor"
          className="mt-6 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );
}
