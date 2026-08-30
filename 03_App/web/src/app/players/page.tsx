import type { Metadata } from "next";
import Link from "next/link";
import { PlayerCard } from "@/components/PlayerCard";
import { TrophyCabinet } from "@/components/TrophyCabinet";
import { showDemoData } from "@/lib/features";

export const metadata: Metadata = { title: "Players" };

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
      <h1 className="font-display text-4xl">Players</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every player who enters an event gets a Sikh World Championship profile — a player
        card, and a trophy cabinet that follows them across every sport and every year.
      </p>

      {showDemoData() ? (
        <div className="mt-12 grid gap-12 lg:grid-cols-[300px_1fr]">
          <div>
            <h2 className="mb-4 text-xs font-bold tracking-[0.18em] text-muted uppercase">
              Player card
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
              Trophy cabinet
            </h2>
            <TrophyCabinet trophies={demoTrophies} />
            <p className="mt-6 text-sm text-muted">
              Demo data, shown outside production only.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-line bg-surface/60 p-8">
          <h2 className="font-display text-2xl text-kesri">Nobody has competed yet</h2>
          <p className="mt-4 max-w-2xl text-muted">
            Player cards and trophy cabinets fill up as events are held. The first ones go
            out at Sikh FC 27 in Leicester.
          </p>
          <Link
            href="/join"
            className="mt-6 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            Create your profile
          </Link>
        </div>
      )}

    </div>
  );
}
