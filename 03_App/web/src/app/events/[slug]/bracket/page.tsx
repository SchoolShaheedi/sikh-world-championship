import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, getEvent } from "@/data/events";
import { BracketView } from "@/components/BracketView";
import { generateKnockout, advanceWinners, type Entrant } from "@/lib/bracket";
import { showDemoData } from "@/lib/features";

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
 * PREVIEW DATA — never shown in production. See `showDemoData()`.
 *
 * Thirty-two invented Sikh names, so the layout can be checked on a projector and on a
 * phone before anyone has registered. Shown publicly they are indistinguishable from a
 * real draw: someone would look for their own name, and on the day the hall would be
 * looking at a screen full of people who do not exist.
 *
 * NOT YET WIRED to real registrations. That needs a decision first about what name to put
 * on a public screen for a 12-year-old — see 00_Docs/MEETING-QUESTIONS.md.
 */
function demoEntrants(divisionId: string, n: number): Entrant[] {
  const names = [
    "Jagdeep S.", "Arjan K.", "Simran K.", "Harman S.", "Gurdeep S.", "Manveer S.",
    "Ravi S.", "Baljit K.", "Amrit S.", "Navjot K.", "Karan S.", "Prabh S.",
    "Jasleen K.", "Sukhman S.", "Tegh S.", "Anmol K.", "Inder S.", "Kiran K.",
    "Manpreet S.", "Rupinder K.", "Sahib S.", "Onkar S.", "Meher K.", "Dilraj S.",
    "Ekam S.", "Guneet K.", "Hardeep S.", "Ishar S.", "Jeevan S.", "Kamal K.",
    "Lakhbir S.", "Mandeep K.",
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

      {showDemoData() ? (
        <p className="mt-6 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          <strong>Demo data — not real players.</strong> Shown outside production only, so
          the layout can be checked before anyone has registered.
        </p>
      ) : (
        <div className="mt-10 rounded-3xl border border-line bg-surface/60 p-8">
          <h2 className="font-display text-2xl text-kesri">The bracket goes live on the day</h2>
          <p className="mt-4 text-muted">
            Once places are drawn and the group stage is played, the knockout bracket
            appears here and updates as scores come in — on the big screen in the hall, and
            on this page for anyone following from home.
          </p>
          <Link
            href={`/events/${event.slug}`}
            className="mt-6 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            Event details
          </Link>
        </div>
      )}

      {showDemoData() && (
      <div className="mt-12 space-y-16">
        {event.divisions.map((d) => {
          const bracket = advanceWinners(
            generateKnockout(d.id, d.name, demoEntrants(d.id, 32)),
          );
          return (
            <section key={d.id}>
              <h2 className="font-display mb-5 text-2xl">
                <span className="text-kesri">{d.name}</span> division
              </h2>
              <p className="mb-5 text-sm text-muted">
                The knockout stage — the 32 players who came through the group stage.
              </p>
              <BracketView
                bracket={bracket}
                names={new Map(demoEntrants(d.id, 32).map((e) => [e.id, e.name]))}
              />
            </section>
          );
        })}
      </div>
      )}
    </div>
  );
}
