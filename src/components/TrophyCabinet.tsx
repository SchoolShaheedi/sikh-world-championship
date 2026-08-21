import type { AwardTier } from "@/lib/types";

export interface CabinetEntry {
  id: string;
  label: string;
  tier: AwardTier["tier"];
  event: string;
  division: string;
}

const TIER_STYLE: Record<
  AwardTier["tier"],
  { colour: string; size: number; ring: string }
> = {
  gold:        { colour: "var(--swc-gold)",   size: 62, ring: "border-gold/50" },
  silver:      { colour: "var(--swc-silver)", size: 52, ring: "border-silver/40" },
  bronze:      { colour: "var(--swc-bronze)", size: 46, ring: "border-bronze/40" },
  participant: { colour: "var(--swc-muted)",  size: 38, ring: "border-line" },
  special:     { colour: "var(--swc-kesri)",  size: 46, ring: "border-kesri/40" },
};

/**
 * Trophy size encodes placing: a champion's cup is visibly bigger than a competitor's
 * medal. That difference is the whole point of a cabinet — you can read someone's
 * record at a glance.
 */
export function TrophyCabinet({ trophies }: { trophies: CabinetEntry[] }) {
  if (trophies.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
        No trophies yet. Enter an event.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {trophies.map((t) => {
        const s = TIER_STYLE[t.tier];
        return (
          <div
            key={t.id}
            className={`flex items-center gap-4 rounded-2xl border ${s.ring} bg-surface/70 p-4`}
          >
            <Trophy tier={t.tier} colour={s.colour} size={s.size} />
            <div className="min-w-0">
              <p className="font-display truncate text-base" style={{ color: s.colour }}>
                {t.label}
              </p>
              <p className="truncate text-sm text-body">{t.event}</p>
              <p className="text-xs text-muted">{t.division}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Trophy({
  tier,
  colour,
  size,
}: {
  tier: AwardTier["tier"];
  colour: string;
  size: number;
}) {
  // Participants and specials get a medal; placings get a cup.
  const medal = tier === "participant" || tier === "special";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={tier}
      className="shrink-0"
    >
      {medal ? (
        <>
          <path d="M22 6h20l-6 18H28L22 6Z" fill={colour} opacity="0.55" />
          <circle cx="32" cy="41" r="16" fill={colour} opacity="0.22" />
          <circle cx="32" cy="41" r="12" fill="none" stroke={colour} strokeWidth="3.5" />
          <circle cx="32" cy="41" r="4" fill={colour} />
        </>
      ) : (
        <>
          {/* Handles */}
          <path
            d="M17 16h-5a7 7 0 0 0 7 12M47 16h5a7 7 0 0 1-7 12"
            fill="none"
            stroke={colour}
            strokeWidth="3.5"
          />
          {/* Cup */}
          <path d="M17 10h30v14c0 9-6.7 15-15 15s-15-6-15-15V10Z" fill={colour} />
          {/* Stem + base */}
          <rect x="29" y="39" width="6" height="9" fill={colour} opacity="0.75" />
          <rect x="20" y="48" width="24" height="6" rx="2" fill={colour} />
        </>
      )}
    </svg>
  );
}
