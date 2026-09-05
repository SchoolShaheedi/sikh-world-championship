import type { Metadata } from "next";
import Link from "next/link";
import { currentPlayer } from "@/lib/session";
import { EVENTS, getEvent } from "@/data/events";
import { allVolunteers } from "@/lib/volunteer-store";
import { VOLUNTEER_ROLES } from "@/lib/volunteer-types";
import { VolunteerList } from "@/components/VolunteerList";

export const metadata: Metadata = {
  title: "Volunteers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Everybody who offered to help.
 *
 * A PAGE OF ITS OWN rather than a panel on /admin, for the same reason /admin/entries is:
 * /admin is a page of controls that get pressed on the morning, and this is a list that
 * gets worked through in the fortnight before.
 *
 * THE RETENTION LINE ON THIS PAGE IS NOT DECORATION. Nothing deletes these rows
 * automatically. Invariant 9 says a duration is decided by the team before the code that
 * enforces it exists, and no figure for volunteer records is in the retention policy yet —
 * so the honest thing is to say so where somebody can see it, next to the button that is
 * currently the only way one goes.
 */
export default async function VolunteersPage() {
  const me = await currentPlayer();
  if (!me?.isModerator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Moderators only</h1>
      </div>
    );
  }

  const event = getEvent(EVENTS[0]?.slug ?? "");
  const volunteers = event ? await allVolunteers(event.slug) : [];
  const waiting = volunteers.filter((v) => v.status === "new").length;
  const accepted = volunteers.filter((v) => v.status === "accepted").length;

  /** Roles nobody accepted has put themselves down for — the actual gap in the rota. */
  const covered = new Set(
    volunteers.filter((v) => v.status === "accepted").flatMap((v) => v.roles),
  );
  const uncovered = VOLUNTEER_ROLES.filter((r) => !covered.has(r.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-sm text-muted hover:text-body">
        ← Admin
      </Link>
      <h1 className="font-display mt-3 text-3xl text-body">
        Volunteers — {event?.title ?? "no event"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        <span className="text-body">{volunteers.length}</span> offered ·{" "}
        <span className="text-body">{accepted}</span> confirmed ·{" "}
        <span className="text-body">{waiting}</span> not answered yet. A 64-player event
        needs about fifteen people on the floor.
      </p>

      {accepted > 0 && uncovered.length > 0 && (
        <p className="mt-4 rounded-xl border border-kesri/40 bg-kesri/[0.07] p-3 text-sm text-body">
          <strong>Nobody confirmed for:</strong>{" "}
          {uncovered.map((r) => r.name).join(", ")}.
        </p>
      )}

      <VolunteerList volunteers={volunteers} />

      <p className="mt-10 max-w-2xl border-t border-line pt-6 text-xs text-muted">
        <span className="text-body">Nothing deletes these automatically.</span> How long a
        volunteer&rsquo;s details are kept has not been decided — it is not in{" "}
        <span className="font-mono">04_Legal/RETENTION-POLICY.md</span> yet, and this app
        does not invent retention rules. Until it is, Delete above is the only thing that
        removes one. Each row also holds a third party&rsquo;s name and one contact route,
        given by the volunteer as a reference.
      </p>
    </div>
  );
}
