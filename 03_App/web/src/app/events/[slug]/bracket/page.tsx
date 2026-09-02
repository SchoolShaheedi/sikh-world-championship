import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, getEvent } from "@/data/events";
import { BracketView } from "@/components/BracketView";
import { generateKnockout, advanceWinners, type Entrant } from "@/lib/bracket";
import { showDemoData } from "@/lib/features";
import { LiveBracket } from "@/components/LiveBracket";

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
 * Sixty-four invented Sikh names — the full first round of a straight knockout — so the
 * layout can be checked on a projector and on a phone before anyone has registered. Shown publicly they are indistinguishable from a
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
    "Nirmal S.", "Opinder K.", "Paramjit S.", "Rajvir S.", "Sandeep K.", "Taran S.",
    "Ujagar S.", "Vikram S.", "Yadwinder S.", "Amanpreet K.", "Bikram S.", "Charan S.",
    "Daljit K.", "Eshan S.", "Fateh S.", "Gagan K.", "Harjot S.", "Ikroop K.",
    "Jasmeet S.", "Kulwant S.", "Loveleen K.", "Mohit S.", "Nanak S.", "Pavit K.",
    "Ranjit S.", "Sehaj S.", "Tarnjit K.", "Udham S.", "Veer S.", "Waris S.",
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

      {/* THE REAL BRACKET, when there is one.
          Polls every four seconds, so this page follows the hall — somebody at home sees
          a result within seconds of the room seeing it. When no bracket has been built it
          renders its own holding message, so there is nothing to branch on here.

          The demo below is a separate thing entirely and never appears in production. */}
      <div className="mt-10">
        <LiveBracket slug={event.slug} />
      </div>

      {showDemoData() && (
        <p className="mt-8 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          <strong>Below: demo data — not real players.</strong> Shown outside production
          only, so the layout can be checked before anyone has registered.
        </p>
      )}

      {showDemoData() && (
      <div className="mt-12 space-y-16">
        {event.divisions.map((d) => {
          const bracket = advanceWinners(
            generateKnockout(d.id, d.name, demoEntrants(d.id, 64)),
          );
          return (
            <section key={d.id}>
              <h2 className="font-display mb-5 text-2xl">
                <span className="text-kesri">{d.name}</span> division
              </h2>
              <p className="mb-5 text-sm text-muted">
                Straight knockout — all 64 players, first round to final.
              </p>
              <BracketView
                bracket={bracket}
                names={new Map(demoEntrants(d.id, 64).map((e) => [e.id, e.name]))}
              />
            </section>
          );
        })}
      </div>
      )}
    </div>
  );
}
