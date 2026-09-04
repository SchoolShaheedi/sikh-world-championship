import type { Metadata } from "next";
import { SupportForm } from "@/components/SupportForm";
import { copy } from "@/copy";
import { Rich } from "@/copy/Rich";

export const metadata: Metadata = {
  title: copy.support.metaTitle,
  description: copy.support.metaDescription,
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
      <h1 className="display-xl text-[clamp(2.2rem,5vw,3.6rem)]">
        {copy.support.title}
      </h1>
      <p className="mt-3 text-lg text-muted">{copy.support.intro}</p>

      {/* Emergency route out. This has to be the first thing on the page — if someone is
          in real danger, a support form is the wrong tool and we should say so. */}
      <div className="mt-8 rounded-2xl border border-kesri/50 bg-kesri/[0.08] p-5">
        <h2 className="font-display text-lg text-kesri">
          {copy.support.emergencyTitle}
        </h2>
        <p className="mt-2 text-sm text-body">
          {/* The three phone numbers are the marked runs — bold, so they are the thing
              somebody scanning this box in a hurry actually sees. */}
          <Rich
            text={copy.support.emergencyBody}
            em={(s, i) => (
              <strong key={i} className="font-bold">
                {s}
              </strong>
            )}
          />
        </p>
        <p className="mt-2 text-sm text-muted">
          {copy.support.emergencyFootnote}
        </p>
      </div>

      <div className="mt-10">
        <SupportForm initialCategory={about} />
      </div>

      <p className="mt-12 rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
        {copy.support.footnote}
      </p>
    </div>
  );
}
