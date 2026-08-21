import type { Metadata } from "next";
import { AVATARS } from "@/data/avatars";
import { Avatar } from "@/components/Avatar";
import { PlayerCard, type CardTier } from "@/components/PlayerCard";
import { QUALITIES } from "@/data/qualities";

export const metadata: Metadata = { title: "Styleguide" };

/** Internal preview of avatars, qualities and card tiers. Not linked from the site nav. */
export default function StyleguidePage() {
  const tiers: [string, CardTier, string][] = [
    ["Bronze — entered one event", "bronze", "player-001"],
    ["Silver — a few events in", "silver", "player-042"],
    ["Gold — regular, volunteers", "gold", "player-117"],
    ["Special — champion", "special", "player-256"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="font-display text-4xl">Styleguide</h1>
      <p className="mt-3 text-muted">Internal preview — not linked from the site.</p>

      {/* Avatars first — this is the set you're replacing with artwork */}
      <h2 className="font-display mt-14 text-2xl text-kesri">
        Avatars ({AVATARS.length})
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Placeholders, drawn in code. Drop artwork into{" "}
        <code className="text-kesri">public/avatars/</code> and set the{" "}
        <code className="text-kesri">image</code> field to swap any of them in — one at a
        time is fine.
      </p>
      <div className="mt-6 grid grid-cols-4 gap-5 sm:grid-cols-6 lg:grid-cols-8">
        {AVATARS.map((a) => (
          <div key={a.id} className="text-center">
            <Avatar avatarId={a.id} size={88} alt={a.label} />
            <p className="mt-1.5 text-[10px] text-muted">{a.label}</p>
          </div>
        ))}
      </div>

      {/* Card tiers */}
      <h2 className="font-display mt-16 text-2xl text-kesri">Card tiers</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Bronze, silver and gold as FIFA does it, plus a special card for event champions.
        Each card draws one of the 32 Qualities.
      </p>
      <div className="mt-6 flex flex-wrap gap-6">
        {tiers.map(([label, tier, seed]) => (
          <div key={tier}>
            <p className="mb-3 text-xs tracking-[0.14em] text-muted uppercase">{label}</p>
            <PlayerCard
              name="Jagdeep Singh"
              gamertag="jagdeep_10"
              division="16+"
              region="Birmingham"
              avatarId="kesri-1"
              eventTitle="FIFA 26"
              seed={seed}
              tier={tier}
            />
          </div>
        ))}
      </div>

      {/* Qualities */}
      <h2 className="font-display mt-16 text-2xl text-kesri">
        The {QUALITIES.length} Qualities
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        One is assigned to each card. Assignment is deterministic — a player keeps the same
        quality on the site, in their email and in print — and every quality is equally
        likely, so none is rarer or worth more than another.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUALITIES.map((q) => (
          <div key={q.id} className="rounded-xl border border-line bg-surface/60 p-4">
            <p className="text-base text-body">{q.gurmukhi}</p>
            <p className="font-display mt-0.5 text-sm text-kesri">{q.name}</p>
            <p className="text-xs font-semibold text-muted">{q.english}</p>
            <p className="mt-2 text-[11px] leading-snug text-muted">{q.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
