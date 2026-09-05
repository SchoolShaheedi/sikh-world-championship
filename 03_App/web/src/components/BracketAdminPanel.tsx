"use client";

import { useState } from "react";
import {
  buildBracket,
  wipeBracket,
  enterScore,
  putOnStations,
  moveStation,
} from "@/app/admin/actions";
import { roundName, type Match } from "@/lib/bracket";

export interface BracketAdminData {
  rounds: number;
  matches: Match[];
  names: Record<string, string>;
  placesFilled: number;
}

/**
 * Running the tournament: build the bracket, then enter scores as matches finish.
 *
 * DESIGNED FOR THE ACTUAL SITUATION, which is somebody standing at a desk with a
 * clipboard and a hall waiting:
 *
 *   - Matches that can be played are at the top, on their own, with the score boxes
 *     already open. Everything else is behind a summary line. Scrolling past 63 matches
 *     to find the one that just finished is how a bracket falls behind the room.
 *   - Two number boxes and one button. No dropdowns, no confirmation dialog — a wrong
 *     score is fixed by typing the right one, which recomputes the rounds after it.
 *   - The result of every action is a sentence on the screen, because the person doing
 *     this is not going to open a console.
 */
export function BracketAdminPanel({
  slug,
  data,
}: {
  slug: string;
  data: BracketAdminData | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  /**
   * How many consoles are actually working, typed in on the day.
   *
   * Not stored on the event: eight were promised, one has a dead HDMI port, so it is
   * seven — and that is discovered at 09:15, not at deploy time. A number somebody has to
   * remember to change in a data file is a number that is wrong on the morning.
   */
  const [stations, setStations] = useState(8);

  async function run(fn: (fd: FormData) => Promise<{ ok?: true; message?: string; error?: string }>, fd: FormData) {
    setBusy(true);
    setMessage(null);
    setError(null);
    const r = await fn(fd);
    if (r.error) setError(r.error);
    else if (r.message) setMessage(r.message);
    setBusy(false);
  }

  function name(id: string | null): string {
    if (!id) return "—";
    return data?.names[id] ?? "(deleted)";
  }

  const playable = (data?.matches ?? []).filter(
    (m) => m.status !== "complete" && m.homeId && m.awayId,
  );
  const rest = (data?.matches ?? []).filter((m) => !playable.includes(m));

  return (
    <div className="mt-8">
      <h3 className="font-display text-lg text-kesri">The bracket</h3>

      {!data ? (
        <>
          <p className="mt-1 text-sm text-muted">
            No bracket yet. Build it from the {data === null ? "players who have places" : ""} —
            run the draw first, then this pairs them up and the big screen starts showing
            it.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData();
              fd.set("slug", slug);
              run(buildBracket, fd);
            }}
          >
            <button
              type="submit"
              disabled={busy}
              className="mt-3 rounded-xl bg-kesri px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
            >
              {busy ? "Building…" : "Build the bracket"}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">
            {data.matches.length} matches across {data.rounds} rounds,{" "}
            {data.placesFilled} players. The big screen is at{" "}
            <a
              href={`/events/${slug}/tv`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-kesri hover:underline"
            >
              /events/{slug}/tv
            </a>{" "}
            — open it on the laptop plugged into the television and leave it.
          </p>

          {/* CALLING MATCHES TO STATIONS.
              The `station` column has existed since migration 0009 and nothing ever wrote
              to it, while rule 9 forfeits a player who does not reach their station within
              five minutes of being called. A forfeit rule enforced against information
              nobody was given is a trap, so this is the button that gives it. */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink/20 p-3">
            <label className="text-sm text-muted">
              Working stations
              <input
                type="number"
                min={1}
                max={32}
                value={stations}
                onChange={(e) => setStations(Number(e.target.value))}
                className="ml-2 w-16 rounded-lg border border-line bg-ink/40 px-2 py-1 text-center text-sm text-body"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const fd = new FormData();
                fd.set("slug", slug);
                fd.set("stations", String(stations));
                run(putOnStations, fd);
              }}
              className="rounded-lg bg-kesri px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
            >
              Call the next matches
            </button>
            <span className="text-xs text-muted">
              Fills whatever is free, lowest number first. A finished match frees its
              station on its own.
            </span>
          </div>

          {playable.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">
                Ready to play
              </p>
              {playable.map((m) => (
                <form
                  key={m.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    fd.set("slug", slug);
                    fd.set("matchId", m.id);
                    run(enterScore, fd);
                  }}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-ink/20 p-3"
                >
                  {/* One control that both assigns and clears, because the reason to
                      touch it by hand is a console breaking and the answer is "move them
                      to 5" or "take them off". A select cannot be typed wrong. */}
                  <select
                    aria-label={`Station for ${name(m.homeId)} against ${name(m.awayId)}`}
                    value={m.station ?? ""}
                    disabled={busy}
                    onChange={(e) => {
                      const fd = new FormData();
                      fd.set("slug", slug);
                      fd.set("matchId", m.id);
                      fd.set("station", e.target.value);
                      run(moveStation, fd);
                    }}
                    className={`w-16 shrink-0 rounded-lg border px-1.5 py-1 text-center text-xs ${
                      m.station === null
                        ? "border-line bg-ink/40 text-muted"
                        : "border-kesri bg-kesri/15 font-bold text-kesri"
                    }`}
                  >
                    <option value="">—</option>
                    {Array.from({ length: stations }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="w-24 shrink-0 text-[11px] text-muted">
                    {roundName(m.round, data.rounds)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-body">
                    {name(m.homeId)}
                  </span>
                  <input
                    name="home"
                    type="number"
                    min={0}
                    max={99}
                    required
                    className="w-14 rounded-lg border border-line bg-ink/40 px-2 py-1 text-center text-sm text-body"
                  />
                  <span className="text-muted">–</span>
                  <input
                    name="away"
                    type="number"
                    min={0}
                    max={99}
                    required
                    className="w-14 rounded-lg border border-line bg-ink/40 px-2 py-1 text-center text-sm text-body"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-body">
                    {name(m.awayId)}
                  </span>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-kesri px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
                  >
                    Save
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-line bg-ink/20 p-3 text-sm text-muted">
              Nothing is waiting for a score. Either every match played so far is in, or
              the next round is still waiting on results above it.
            </p>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted hover:text-body">
              All {data.matches.length} matches, including finished ones
            </summary>
            <ul className="mt-3 space-y-1.5 text-xs">
              {rest.map((m) => (
                <li key={m.id} className="flex flex-wrap gap-x-3 text-muted">
                  <span className="w-24 shrink-0">{roundName(m.round, data.rounds)}</span>
                  <span className="text-body">
                    {name(m.homeId)} {m.homeScore ?? "–"} : {m.awayScore ?? "–"}{" "}
                    {name(m.awayId)}
                  </span>
                  {m.status === "complete" && <span>done</span>}
                </li>
              ))}
            </ul>
          </details>

          {/* Behind a confirmation, because pressing it during an event erases results
              the room has already seen. */}
          <div className="mt-4">
            {!confirmWipe ? (
              <button
                type="button"
                onClick={() => setConfirmWipe(true)}
                className="text-xs text-muted hover:text-body"
              >
                Clear the bracket
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData();
                  fd.set("slug", slug);
                  run(wipeBracket, fd);
                  setConfirmWipe(false);
                }}
                className="flex flex-wrap items-center gap-3"
              >
                <span className="text-xs text-kesri">
                  This deletes every match and every score. Sure?
                </span>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg border border-kesri px-3 py-1 text-xs font-bold text-kesri disabled:opacity-40"
                >
                  Clear it
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmWipe(false)}
                  className="text-xs text-muted hover:text-body"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </>
      )}

      {message && <p className="mt-3 text-sm text-kesri">{message}</p>}
      {error && <p className="mt-3 text-sm text-kesri">{error}</p>}
    </div>
  );
}
