import Link from "next/link";
import type { Metadata } from "next";
import { ORG } from "@/data/org";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="display-xl text-[clamp(2.1rem,4.8vw,3.4rem)]">About {ORG.name}</h1>
      <p className="mt-5 text-lg text-muted">{ORG.intro}</p>

      <h2 className="font-display mt-12 text-2xl">Why we&apos;re doing this</h2>
      <p className="mt-4 text-muted">
        {/* TODO: replace with the founders' own words — this section should not sound
            like it was written by a committee. */}
        <em className="text-body">
          [Placeholder — your words go here. What made you want to start this&#63; Say it
          plainly; people respond to the real reason far more than to a mission statement.]
        </em>
      </p>

      <h2 className="font-display mt-12 text-2xl">What we run</h2>
      <p className="mt-4 text-muted">
        We started with FIFA because it&apos;s what people already play. But the
        championship isn&apos;t about one game — chess, kabaddi, gatka, quiz and athletics
        are all on the way. One organisation, one profile, and a trophy cabinet that
        follows you across all of them.
      </p>

      <h2 className="font-display mt-12 text-2xl">Get involved</h2>
      <ul className="mt-4 space-y-3 text-muted">
        <li>
          <strong className="text-body">Compete.</strong> Every event is free to enter and
          open to all levels.
        </li>
        <li>
          <strong className="text-body">Volunteer.</strong> Events need referees, check-in
          staff, langar and setup crew.
        </li>
        <li>
          <strong className="text-body">Sponsor.</strong> Sponsorship pays for trophies,
          kit and venues, and keeps entry free.
        </li>
      </ul>

      <p className="mt-10 rounded-2xl border border-line bg-surface/60 p-5 text-muted">
        Get in touch through <Link href="/support" className="text-kesri hover:underline">our contact form</Link>.
      </p>
    </div>
  );
}
