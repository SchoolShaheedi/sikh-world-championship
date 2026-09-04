import Link from "next/link";
import type { Metadata } from "next";
import { SPONSORS } from "@/data/sponsors";
import { copy } from "@/copy";

export const metadata: Metadata = { title: copy.sponsors.title };

/**
 * What a sponsor is told they get. Trimmed on 2026-09-01 when the award list was cut to
 * three prizes — it used to offer a named Golden Boot and Fair Play award, and neither
 * exists any more. Nothing on this page may promise something the event does not have.
 */
const WHAT_A_SPONSOR_GETS = [
  copy.sponsors.whatYouGet1,
  copy.sponsors.whatYouGet2,
  copy.sponsors.whatYouGet3,
  copy.sponsors.whatYouGet4,
];

/**
 * What we need from a business that wants to sponsor. Written as questions because that
 * is what a first conversation actually needs: without the first two, nobody can say yes
 * or no, and without the third the offer cannot go on the site.
 */
const WHAT_TO_TELL_US = [
  copy.sponsors.tellUs1,
  copy.sponsors.tellUs2,
  copy.sponsors.tellUs3,
  copy.sponsors.tellUs4,
  copy.sponsors.tellUs5,
  copy.sponsors.tellUs6,
];

export default function SponsorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">{copy.sponsors.title}</h1>
      <p className="mt-5 text-lg text-muted">{copy.sponsors.intro}</p>

      <h2 className="font-display mt-12 text-2xl">
        {copy.sponsors.backingTitle}
      </h2>
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
                <strong className="font-bold">{s.offer.detail}</strong>{" "}
                {copy.sponsors.offerSuffix}
                <a
                  href={s.offer.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block font-semibold text-kesri hover:underline"
                >
                  {copy.sponsors.offerLink}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="font-display mt-14 text-2xl">
        {copy.sponsors.whatYouGetTitle}
      </h2>
      <ul className="mt-4 space-y-3 text-muted">
        {WHAT_A_SPONSOR_GETS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="mt-14 rounded-3xl border border-line bg-surface/60 p-8">
        <h2 className="font-display text-2xl text-kesri">
          {copy.sponsors.pitchTitle}
        </h2>
        <p className="mt-4 text-muted">{copy.sponsors.pitchBody}</p>
        <p className="mt-4 text-muted">{copy.sponsors.tellUsIntro}</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {WHAT_TO_TELL_US.map((q) => (
            <li key={q}>— {q}</li>
          ))}
        </ul>
        <Link
          href="/support?about=sponsor"
          className="mt-6 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
        >
          {copy.sponsors.cta}
        </Link>
      </div>
    </div>
  );
}
