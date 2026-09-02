"use client";

import { useEffect, useState } from "react";
import { BracketView } from "./BracketView";
import type { KnockoutBracket } from "@/lib/bracket";

interface Payload {
  bracket: KnockoutBracket | null;
  names: Record<string, string>;
  version: string;
}

/**
 * The bracket, kept current by asking.
 *
 * POLLING, NOT WEBSOCKETS — decided 2026-09-01, reasoning in src/lib/match-store.ts. The
 * things that actually go wrong in a hall are the wifi dropping for ten seconds and the
 * laptop lid closing, and polling survives both by doing nothing special: the next request
 * either works or does not, and the screen keeps the last good bracket either way.
 *
 * THREE RULES THIS FOLLOWS, all learned from screens that misbehave in public:
 *
 *   1. Never blank on failure. A fetch that throws leaves the previous bracket on the
 *      screen and quietly notes the time of the last success. A hall staring at a spinner
 *      is worse than a hall staring at a bracket that is thirty seconds old.
 *   2. Only re-render when the version changes, so a quiet afternoon costs one small
 *      request every few seconds and no layout work at all.
 *   3. Say when it was last updated, small and in the corner. Somebody will ask whether
 *      the screen is stuck, and the answer should be on the screen.
 */
export function LiveBracket({
  slug,
  intervalMs = 4000,
  showStatus = true,
}: {
  slug: string;
  /** How often to ask. Four seconds is fast enough that nobody notices the delay. */
  intervalMs?: number;
  showStatus?: boolean;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [lastOk, setLastOk] = useState<Date | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let live = true;
    let version = "";

    async function tick() {
      try {
        const res = await fetch(`/api/events/${slug}/bracket`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const payload: Payload = await res.json();
        if (!live) return;
        // Rule 2: same version, nothing to do.
        if (payload.version !== version) {
          version = payload.version;
          setData(payload);
        }
        setLastOk(new Date());
        setStale(false);
      } catch {
        // Rule 1: keep what is on the screen.
        if (live) setStale(true);
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [slug, intervalMs]);

  if (!data) {
    return (
      <p className="text-muted">Loading the bracket…</p>
    );
  }

  if (!data.bracket) {
    return (
      <div className="rounded-3xl border border-line bg-surface/60 p-8">
        <h2 className="font-display text-2xl text-kesri">The bracket goes live on the day</h2>
        <p className="mt-4 text-muted">
          Once places are drawn and the first round is set, it appears here and updates as
          scores come in — on the big screen in the hall, and on this page for anyone
          following from home.
        </p>
      </div>
    );
  }

  return (
    <div>
      <BracketView
        bracket={data.bracket}
        names={new Map(Object.entries(data.names))}
      />
      {showStatus && (
        <p className="mt-4 text-xs text-muted">
          {stale ? (
            <span className="text-kesri">
              Reconnecting — showing the last bracket we had
              {lastOk ? `, from ${lastOk.toLocaleTimeString("en-GB")}` : ""}.
            </span>
          ) : (
            <>Updated {lastOk ? lastOk.toLocaleTimeString("en-GB") : "just now"}.</>
          )}
        </p>
      )}
    </div>
  );
}
