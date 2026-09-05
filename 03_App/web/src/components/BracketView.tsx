import type { KnockoutBracket, Match } from "@/lib/bracket";
import { roundName, winnerOf } from "@/lib/bracket";
import { copy, fill } from "@/copy";

/**
 * The live bracket. Two jobs, and they pull in different directions:
 *   1. a projector in the hall — must be legible from 20 metres
 *   2. a parent's phone at home — must fit a 375px screen
 * Solved by scrolling horizontally by round, with each round a fixed-width column.
 */
export function BracketView({
  bracket,
  names,
}: {
  bracket: KnockoutBracket;
  names: Map<string, string>;
}) {
  const rounds = Array.from({ length: bracket.rounds }, (_, r) =>
    bracket.matches.filter((m) => m.round === r).sort((a, b) => a.position - b.position),
  );

  return (
    <div className="scroll-x -mx-4 px-4 pb-4">
      <div className="flex min-w-max gap-5">
        {rounds.map((matches, r) => (
          <div key={r} className="w-[230px] shrink-0">
            <h3 className="mb-3 text-[11px] font-bold tracking-[0.18em] text-muted uppercase">
              {roundName(r, bracket.rounds)}
            </h3>
            <div className="flex h-full flex-col justify-around gap-3">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} names={names} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  names,
}: {
  match: Match;
  names: Map<string, string>;
}) {
  const winner = winnerOf(match);
  const live = match.status === "live";

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-surface/80 ${
        live ? "border-kesri shadow-[0_0_0_3px_rgba(242,132,43,0.15)]" : "border-line"
      }`}
    >
      {/* THE STATION IS THE HALF OF THIS BAR THAT DOES A JOB. "Live" is decoration — the
          scores tell you that. Rule 9 forfeits a match if a player does not reach their
          station within five minutes of being called, so the number is what somebody is
          scanning the screen for, and it gets the weight and its own end of the bar. */}
      {live && (
        <p className="flex items-baseline justify-between gap-2 bg-kesri px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-ink uppercase">
          <span>{copy.bracket.live}</span>
          {match.station !== null && (
            <span className="text-xs tracking-[0.1em]">
              {fill(copy.bracket.station, { n: match.station })}
            </span>
          )}
        </p>
      )}
      <Side
        name={match.homeId ? (names.get(match.homeId) ?? "—") : "—"}
        score={match.homeScore}
        won={!!winner && winner === match.homeId}
        dimmed={!!winner && winner !== match.homeId}
      />
      <div className="h-px bg-line" />
      <Side
        name={match.awayId ? (names.get(match.awayId) ?? "—") : "—"}
        score={match.awayScore}
        won={!!winner && winner === match.awayId}
        dimmed={!!winner && winner !== match.awayId}
      />
    </div>
  );
}

function Side({
  name,
  score,
  won,
  dimmed,
}: {
  name: string;
  score: number | null;
  won: boolean;
  dimmed: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2.5 ${
        dimmed ? "opacity-45" : ""
      }`}
    >
      <span
        className={`truncate text-sm ${won ? "font-bold text-kesri" : "text-body"}`}
      >
        {name}
      </span>
      <span
        className={`font-display w-6 shrink-0 text-right text-sm ${
          won ? "text-kesri" : "text-muted"
        }`}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}
