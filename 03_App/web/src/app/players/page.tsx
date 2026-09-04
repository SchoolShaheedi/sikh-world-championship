import type { Metadata } from "next";
import Link from "next/link";
import { PlayerCard } from "@/components/PlayerCard";
import { TrophyCabinet } from "@/components/TrophyCabinet";
import { showDemoData } from "@/lib/features";
import { copy } from "@/copy";

export const metadata: Metadata = { title: copy.players.title };

/**
 * PREVIEW — never rendered in production, see `showDemoData()`. An invented player with
 * an invented cabinet full of trophies from events that have not happened reads as real
 * to anyone who did not write it.
 */
const demoTrophies = [
  { id: "1", label: "Champion",   tier: "gold" as const,        event: "Sikh FC 27 Championship", division: "16+" },
  { id: "2", label: "Golden Boot", tier: "special" as const,    event: "Sikh FC 27 Championship", division: "16+" },
  { id: "3", label: "Semi-finalist", tier: "bronze" as const,   event: "Sikh Chess Championship",   division: "Open" },
  { id: "4", label: "Competitor", tier: "participant" as const, event: "Sikh Kabaddi Cup",          division: "U18" },
];

export default function PlayersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-display text-4xl">{copy.players.title}</h1>
      <p className="mt-3 max-w-2xl text-muted">{copy.players.intro}</p>

      {showDemoData() ? (
        <div className="mt-12 grid gap-12 lg:grid-cols-[300px_1fr]">
          <div>
            <h2 className="mb-4 text-xs font-bold tracking-[0.18em] text-muted uppercase">
              {copy.players.demoCardHeading}
            </h2>
            <PlayerCard
              name="Jagdeep Singh"
              gamertag="jagdeep_10"
              division="16+"
              region="Birmingham"
              avatarId="kesri-1"
              eventTitle="FC 27"
              seed="demo-player"
              tier="gold"
            />
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold tracking-[0.18em] text-muted uppercase">
              {copy.players.demoCabinetHeading}
            </h2>
            <TrophyCabinet trophies={demoTrophies} />
            <p className="mt-6 text-sm text-muted">
              {copy.players.demoNote}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-line bg-surface/60 p-8">
          <h2 className="font-display text-2xl text-kesri">
            {copy.players.emptyTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-muted">{copy.players.emptyBody}</p>
          <Link
            href="/join"
            className="mt-6 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            {copy.players.emptyCta}
          </Link>
        </div>
      )}

    </div>
  );
}
