import Link from "next/link";
import type { ChampionshipEvent } from "@/lib/types";
import { formatEventDate, statusLabel } from "@/lib/format";
import { copy } from "@/copy";

export function EventCard({ event }: { event: ChampionshipEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="lift group block rounded-[20px] border border-line bg-surface p-5"
    >
      <div className="flex items-center gap-2">
        <span className="pill inline-block bg-kesri/15 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-kesri uppercase">
          {statusLabel(event.status)}
        </span>
        {event.entryFee === 0 && (
          <span className="pill inline-block bg-ok/15 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-ok uppercase">
            {copy.common.freeEntry}
          </span>
        )}
      </div>

      <h3 className="display-xl mt-4 text-xl text-body group-hover:text-kesri">
        {event.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{event.tagline}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 text-sm">
        <div>
          <dt className="text-[11px] tracking-wider text-muted uppercase">
            {copy.common.date}
          </dt>
          <dd className="mt-0.5 text-body">{formatEventDate(event.date)}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wider text-muted uppercase">
            {copy.common.places}
          </dt>
          <dd className="mt-0.5 text-body">{event.capacity}</dd>
        </div>
      </dl>
    </Link>
  );
}
