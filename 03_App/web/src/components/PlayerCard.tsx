import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { HoloCard } from "./HoloCard";
import { qualityFor, type Quality } from "@/data/qualities";
import { copy } from "@/copy";

/**
 * FIFA-Ultimate-Team-style player card, generated the moment someone registers.
 * Players screenshot and post these — it's the cheapest marketing the event has.
 *
 * Where FIFA puts six skill ratings, this puts ONE of the 32 Qualities (see
 * data/qualities.ts), assigned deterministically from the player's id. That makes cards
 * collectable — "which one did you get?" — without ever scoring a person's character.
 */

export type CardTier = "bronze" | "silver" | "gold" | "special";

const TIER: Record<
  CardTier,
  { frame: string; face: string; ink: string; sub: string; rule: string }
> = {
  bronze: {
    frame: "linear-gradient(150deg,#C08552,#8A5A32 55%,#5E3A1E)",
    face: "linear-gradient(178deg,#3A2617,#1A1009)",
    ink: "#F0C99A",
    sub: "#C9915C",
    rule: "rgba(240,201,154,0.24)",
  },
  silver: {
    frame: "linear-gradient(150deg,#E4EAF2,#A8B4C6 55%,#6E7A8C)",
    face: "linear-gradient(178deg,#2A3340,#12171E)",
    ink: "#EDF2F8",
    sub: "#B3C0D1",
    rule: "rgba(237,242,248,0.22)",
  },
  gold: {
    frame: "linear-gradient(150deg,#F6DF9A,#D8B45A 52%,#8A6A22)",
    face: "linear-gradient(178deg,#3A2E12,#171104)",
    ink: "#FBE9B4",
    sub: "#D8B45A",
    rule: "rgba(251,233,180,0.26)",
  },
  special: {
    frame: "linear-gradient(150deg,#FFD98A,#F2842B 46%,#7A2E12)",
    face: "linear-gradient(178deg,#1B1206,#07040A)",
    ink: "#FFD98A",
    sub: "#F2842B",
    rule: "rgba(255,217,138,0.3)",
  },
};

export function PlayerCard({
  name,
  gamertag,
  division,
  region,
  avatarId,
  photoUrl,
  eventTitle,
  /** Seeds the quality. Use the player id, or the registration reference before one exists. */
  seed = "swc",
  /** Override the drawn quality. Leave unset in normal use. */
  quality,
  tier = "bronze",
}: {
  name: string;
  gamertag: string;
  division: string;
  region: string;
  avatarId: string | null;
  photoUrl?: string | null;
  eventTitle: string;
  seed?: string;
  quality?: Quality;
  tier?: CardTier;
}) {
  const t = TIER[tier];
  const q = quality ?? qualityFor(seed);

  // Surname is dropped: cards get shared publicly, and a full name plus a region plus a
  // school-age face is more identifying information than a child should be posting.
  const firstName = name.trim().split(/\s+/)[0] || "Player";

  return (
    <HoloCard>
      <div
        className="relative overflow-hidden rounded-[22px] p-[2.5px] shadow-2xl"
        style={{ width: 292, background: t.frame }}
      >
        <div
          className="relative overflow-hidden rounded-[20px] px-4 pt-4 pb-4"
          style={{ background: t.face }}
        >
          {/* Sheen */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full opacity-20 blur-3xl"
            style={{ background: t.sub }}
          />

          {/* Top block: quality on the left, portrait on the right */}
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0 pt-1">
              <p
                className="text-[10px] font-bold tracking-[0.2em]"
                style={{ color: t.sub }}
              >
                {copy.players.cardQualityLabel}
              </p>
              <p
                className="mt-1.5 text-[19px] leading-tight"
                style={{ color: t.ink }}
              >
                {q.gurmukhi}
              </p>
              <p
                className="font-display mt-0.5 text-[15px] leading-tight"
                style={{ color: t.ink }}
              >
                {q.name}
              </p>
              <p
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: t.sub }}
              >
                {q.english}
              </p>
            </div>

            <div className="-mt-1 -mr-1 shrink-0">
              <Avatar
                avatarId={avatarId}
                photoUrl={photoUrl}
                size={132}
                alt={firstName}
              />
            </div>
          </div>

          {/* Name */}
          <div className="relative mt-2 text-center">
            <div className="h-px w-full" style={{ background: t.rule }} />
            <p
              className="font-display mt-2 truncate text-[21px] tracking-wide uppercase"
              style={{ color: t.ink }}
            >
              {firstName}
            </p>
            <div className="mt-2 h-px w-full" style={{ background: t.rule }} />
          </div>

          {/* Division / region */}
          <div className="relative mt-2.5 grid grid-cols-2 text-center">
            <div>
              <p
                className="text-[9px] font-bold tracking-[0.16em]"
                style={{ color: t.sub }}
              >
                {copy.players.cardDivisionLabel}
              </p>
              <p
                className="font-display mt-0.5 text-[15px]"
                style={{ color: t.ink }}
              >
                {division}
              </p>
            </div>
            <div>
              <p
                className="text-[9px] font-bold tracking-[0.16em]"
                style={{ color: t.sub }}
              >
                {copy.players.cardFromLabel}
              </p>
              <p
                className="font-display mt-0.5 truncate text-[15px]"
                style={{ color: t.ink }}
              >
                {region || "—"}
              </p>
            </div>
          </div>

          <div className="mt-3 h-px w-full" style={{ background: t.rule }} />

          {/* Footer */}
          <div className="relative mt-2.5 flex items-center justify-between">
            <div className="min-w-0">
              {gamertag && (
                <p
                  className="truncate text-[10px] font-semibold"
                  style={{ color: t.sub }}
                >
                  @{gamertag}
                </p>
              )}
              <p
                className="truncate text-[8px] font-bold tracking-[0.14em] uppercase"
                style={{ color: t.sub }}
              >
                {eventTitle}
              </p>
            </div>
            <Logo size={22} />
          </div>
        </div>
      </div>
    </HoloCard>
  );
}
