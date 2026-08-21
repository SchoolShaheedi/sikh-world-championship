import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS, getEvent } from "@/data/events";
import { SignupForm } from "@/components/SignupForm";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Sign up · ${getEvent(slug)?.title ?? "Event"}` };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Sign up</h1>
      <p className="mt-2 text-xl text-kesri">{event.title}</p>
      <p className="mt-4 text-muted">
        Free to enter, {event.capacity} places. Takes about two minutes — and you get your
        player card at the end.
      </p>

      {!event.detailsConfirmed && (
        <p className="mt-6 rounded-xl border border-kesri/40 bg-kesri/10 p-4 text-sm text-kesrisoft">
          Date and venue are being finalised. Sign up now to hold your place — we&apos;ll
          email you the details as soon as they&apos;re confirmed.
        </p>
      )}

      <div className="mt-10">
        <SignupForm event={event} />
      </div>
    </div>
  );
}
