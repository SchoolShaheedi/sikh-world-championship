import Link from "next/link";
import type { ChampionshipEvent } from "@/lib/types";
import { formatEventDate, statusLabel } from "@/lib/format";

export function EventCard({ event }: { event: ChampionshipEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block rounded-2xl border border-line bg-surface/70 p-5 transition-colors hover:border-kesri/60"
    >
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-kesri/15 px-2 py-1 text-[11px] font-bold tracking-wider text-kesri uppercase">
          {statusLabel(event.status)}
        </span>
        {event.entryFee === 0 && (
          <span className="rounded-md bg-ok/15 px-2 py-1 text-[11px] font-bold tracking-wider text-ok uppercase">
            Free entry
          </span>
        )}
      </div>

      <h3 className="font-display mt-3 text-xl text-body group-hover:text-kesri">
        {event.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{event.tagline}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 text-sm">
        <div>
          <dt className="text-[11px] tracking-wider text-muted uppercase">Date</dt>
          <dd className="mt-0.5 text-body">{formatEventDate(event.date)}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wider text-muted uppercase">Places</dt>
          <dd className="mt-0.5 text-body">{event.capacity}</dd>
        </div>
      </dl>
    </Link>
  );
}
