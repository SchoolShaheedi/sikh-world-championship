import type { Metadata } from "next";
import { PlayerCard } from "@/components/PlayerCard";
import { TrophyCabinet } from "@/components/TrophyCabinet";

export const metadata: Metadata = { title: "Players" };

/** PREVIEW — replace with a real profile read once accounts are wired up. */
const demoTrophies = [
  { id: "1", label: "Champion",   tier: "gold" as const,        event: "Sikh FIFA 26 Championship", division: "16+" },
  { id: "2", label: "Golden Boot", tier: "special" as const,    event: "Sikh FIFA 26 Championship", division: "16+" },
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
            eventTitle="FIFA 26"
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
            This is a preview. Cabinets fill up as events are held — the first trophies go
            out at Sikh FIFA 26.
          </p>
        </div>
      </div>

      {/* Coming next */}
      <section className="mt-20 rounded-3xl border border-line bg-surface/60 p-8">
        <h2 className="font-display text-2xl">Find players — coming after FIFA 26</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              t: "Looking for a game",
              d: "Post what you play, when you're free, and what platform you're on. Other Sikh players send you a request. Open to every age.",
            },
            {
              t: "Quick messages",
              d: "Send a set message — 'gg', 'rematch?', 'I'm online now'. Simple, friendly, and safe for every age group.",
            },
            {
              t: "Chat (16+)",
              d: "Full messaging for players aged 16 and over, with report and block on every profile and real moderators behind it.",
            },
          ].map((c) => (
            <div key={c.t}>
              <h3 className="font-display text-lg text-kesri">{c.t}</h3>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
