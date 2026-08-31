import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Volunteer" };

export default function VolunteerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">Volunteer with us</h1>
      <p className="mt-5 text-lg text-muted">
        A 64-player event needs roughly 15 people to run properly. If you can give a day,
        we&apos;d be glad to have you.
      </p>

      <h2 className="font-display mt-12 text-2xl">Roles on the day</h2>
      <ul className="mt-4 space-y-3 text-muted">
        <li><strong className="text-body">Check-in desk</strong> — scanning QR codes, handing out wristbands</li>
        <li><strong className="text-body">Referees</strong> — one per few stations, settling disputes, starting matches</li>
        <li><strong className="text-body">Score entry</strong> — keeping the live bracket up to date (one dedicated person)</li>
        <li><strong className="text-body">Setup and pack-down</strong> — consoles, screens, cabling, tables</li>
        <li><strong className="text-body">Langar and refreshments</strong></li>
        <li><strong className="text-body">Photography and social</strong></li>
        <li><strong className="text-body">Safeguarding leads</strong> — DBS check required</li>
      </ul>

      {/* Deep-links to the support form with "I'd like to volunteer" already selected.
          Until round 43 this pointed at bare /support, which had no volunteering option at
          all — so the one call to action on the page sent people to a form that did not
          fit what they came to say, and they had to file it under "Something else".

          TODO: a real volunteer sign-up form (same form engine as event registration — see
          src/lib/types.ts FormField). It needs the DBS question, availability and a
          reference, none of which belong in a general support message. */}
      <div className="mt-10 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-xl text-kesri">How to volunteer</h2>
        <p className="mt-3 text-muted">
          Tell us which role suits you and whether you can give the whole day. No account
          needed.
        </p>
        <Link
          href="/support?about=volunteer"
          className="mt-5 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
        >
          Volunteer with us
        </Link>
      </div>
    </div>
  );
}
