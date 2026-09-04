import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentPlayer } from "@/lib/session";
import { EVENTS, getEvent } from "@/data/events";
import { entryDetail } from "@/lib/entry-detail";
import { EntryReveal } from "@/components/EntryReveal";

export const metadata: Metadata = {
  title: "Entry",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

/** A label/value pair. `null` renders an em dash rather than disappearing — an absent answer
 *  is information, and a row that vanishes makes the reader wonder whether they misread. */
function Fact({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] gap-3 border-b border-linesoft py-2">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className="text-sm text-body break-words">{v || "—"}</dd>
    </div>
  );
}

/**
 * Everything about one entrant that a moderator might need in order to decide something.
 *
 * The contact details and the medical notes are masked until asked for, and the masking is
 * done on the server — see `src/lib/entry-detail.ts`. Everything else is here plainly,
 * because the reason this page exists is that it was all being collected and none of it
 * could be read.
 */
export default async function EntryPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const me = await currentPlayer();
  if (!me?.isModerator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Moderators only</h1>
      </div>
    );
  }

  const { reference } = await params;
  const event = getEvent(EVENTS[0]?.slug ?? "");
  const e = await entryDetail(decodeURIComponent(reference), event?.date ?? null);
  if (!e) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin/entries" className="text-sm text-muted hover:text-body">
        ← All entries
      </Link>

      <h1 className="font-display mt-3 text-3xl text-body">{e.fullName}</h1>
      <p className="mt-1 text-sm text-muted">
        <span className="font-mono">{e.reference}</span> · on the screen as{" "}
        <span className="text-body">{e.publicName}</span> · {e.status}
      </p>

      {e.under18 && (
        <p className="mt-4 rounded-xl border border-kesri/40 bg-kesri/[0.07] p-3 text-sm text-body">
          <strong>
            Under 18 — {e.ageOnEventDay} on the day of the event.
          </strong>{" "}
          {e.under16
            ? "A parent or guardian stays at the venue all day."
            : e.mayLeaveUnaccompanied
              ? "Their guardian agreed they may leave on their own at the end."
              : "Must be collected — their guardian did NOT agree to them leaving alone."}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg text-kesri">Why they are here</h2>
        <dl className="mt-3">
          <Fact k="Referred by" v={e.referralOrg} />
          {e.referralDetail && <Fact k="Which one" v={e.referralDetail} />}
          <Fact k="City" v={e.region} />
          <Fact k="Self-rating" v={e.selfRating} />
          <Fact k="Favourite team" v={e.favouriteTeam} />
          <Fact k="Own controller" v={e.ownController ? "Bringing one" : "Needs one provided"} />
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-kesri">Where they are in the process</h2>
        <dl className="mt-3">
          <Fact k="Age on the day" v={e.ageOnEventDay === null ? null : String(e.ageOnEventDay)} />
          <Fact k="Division" v={e.divisionId} />
          <Fact k="Applied" v={when(e.createdAt)} />
          <Fact k="Decided" v={when(e.decidedAt)} />
          <Fact k="Arrived" v={when(e.checkedInAt)} />
          <Fact
            k="Date of birth seen"
            v={e.dobVerifiedAt ? when(e.dobVerifiedAt) : "Not checked yet"}
          />
        </dl>
      </section>

      <EntryReveal
        reference={e.reference}
        masked={e.masked}
        hasMedical={e.hasMedical}
        medicalPurged={e.medicalPurged}
      />

      <p className="mt-8 text-sm text-muted">
        To delete this entry, use <span className="text-body">Entries</span> on{" "}
        <Link href="/admin" className="underline decoration-dotted hover:text-body">
          /admin
        </Link>
        . It is deliberately not a button on this page — the most destructive control in the
        app should not sit next to the one people browse.
      </p>
    </div>
  );
}
