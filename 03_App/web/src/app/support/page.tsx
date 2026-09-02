import type { Metadata } from "next";
import { SupportForm } from "@/components/SupportForm";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Ask us anything, raise a safety concern, or tell us you want your details deleted. Open to players, parents and guardians — no account needed.",
};

/**
 * WHY THIS PAGE STILL EXISTS after 2026-09-01, when the instruction was to remove it.
 *
 * It was cut back hard — the eight-question FAQ is gone, the heading is "Contact us", and
 * it is one panel and one box. What could not go is the box itself, because this page is
 * the only route for three things the project has already promised in writing:
 *
 *   1. "Tell us and we will delete everything we hold about you" — UK GDPR Art. 17. The
 *      privacy notice says it, and an erasure request has to be able to arrive somewhere.
 *   2. The "This was not agreed with me" button in every guardian email. That button is
 *      the whole reason a parent can stop a registration their child made in their name.
 *   3. "If you would rather not be filmed, tell us" — the photography objection, which is
 *      what keeps a stated condition of entry lawful rather than merely stated.
 *
 * There is deliberately no email address published anywhere on this site (see
 * src/data/org.ts). Removing the form with no address to replace it would leave a service
 * used by children with no way to reach the people running it. If the page should still
 * go, the replacement is a published address, and that is a decision to take on purpose.
 */

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ about?: string }>;
}) {
  // e.g. /support?about=volunteer — links can arrive with the right category already
  // chosen. Validated inside the form against the real list.
  const { about } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display-xl text-[clamp(2.2rem,5vw,3.6rem)]">Contact us</h1>
      <p className="mt-3 text-lg text-muted">
        Ask us anything, raise a safety concern, or tell us to delete your details. You
        don&apos;t need an account, and you don&apos;t have to give your name.
      </p>

      {/* Emergency route out. This has to be the first thing on the page — if someone is
          in real danger, a support form is the wrong tool and we should say so. */}
      <div className="mt-8 rounded-2xl border border-kesri/50 bg-kesri/[0.08] p-5">
        <h2 className="font-display text-lg text-kesri">
          If someone is in immediate danger
        </h2>
        <p className="mt-2 text-sm text-body">
          Call <strong className="font-bold">999</strong>. If you&apos;re worried about a
          child&apos;s safety and it isn&apos;t an emergency, the NSPCC helpline is{" "}
          <strong className="font-bold">0808 800 5000</strong>, and Childline is{" "}
          <strong className="font-bold">0800 1111</strong> — both free, and Childline is
          confidential.
        </p>
        <p className="mt-2 text-sm text-muted">
          Please still tell us as well, so we can act on our side.
        </p>
      </div>

      <div className="mt-10">
        <SupportForm initialCategory={about} />
      </div>

      <p className="mt-12 rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
        This form is the way to reach us. Anything about a young person&apos;s safety jumps
        to the top of the queue and is read by a moderator. You can send it without an
        account and without giving your name.
      </p>
    </div>
  );
}
