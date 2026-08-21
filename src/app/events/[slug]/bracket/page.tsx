import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, getEvent } from "@/data/events";
import { BracketView } from "@/components/BracketView";
import { generateKnockout, advanceWinners, type Entrant } from "@/lib/bracket";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Bracket · ${getEvent(slug)?.title ?? "Event"}` };
}

/**
 * PREVIEW DATA. Until real registrations exist, the page shows a demo bracket so the
 * layout can be checked on a projector and on a phone. Replace `demoEntrants` with a
 * read from the registration store once sign-ups are in.
 */
function demoEntrants(divisionId: string, n: number): Entrant[] {
  const names = [
    "Jagdeep S.", "Arjan K.", "Simran K.", "Harman S.", "Gurdeep S.", "Manveer S.",
    "Ravi S.", "Baljit K.", "Amrit S.", "Navjot K.", "Karan S.", "Prabh S.",
    "Jasleen K.", "Sukhman S.", "Tegh S.", "Anmol K.",
  ];
  return Array.from({ length: n }, (_, i) => ({
    id: `${divisionId}-p${i}`,
    name: names[i % names.length],
    seed: i + 1,
  }));
}

export default async function BracketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Live bracket</h1>
          <p className="mt-2 text-kesri">{event.title}</p>
        </div>
        <Link
          href={`/events/${event.slug}`}
          className="text-sm font-semibold text-muted hover:text-kesri"
        >
          ← Back to event
        </Link>
      </div>

      <p className="mt-6 rounded-xl border border-line bg-surface/60 p-4 text-sm text-muted">
        <strong className="text-body">Preview.</strong> This is demo data showing how the
        bracket will look. On the day it updates live as scores come in — on the big screen
        in the hall, and on this page for anyone following from home.
      </p>

      <div className="mt-12 space-y-16">
        {event.divisions.map((d) => {
          const bracket = advanceWinners(
            generateKnockout(d.id, d.name, demoEntrants(d.id, 16)),
          );
          return (
            <section key={d.id}>
              <h2 className="font-display mb-5 text-2xl">
                <span className="text-kesri">{d.name}</span> division
              </h2>
              <BracketView
                bracket={bracket}
                names={new Map(demoEntrants(d.id, 16).map((e) => [e.id, e.name]))}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
