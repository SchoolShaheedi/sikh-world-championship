import type { Metadata } from "next";
import { ORG } from "@/data/org";

export const metadata: Metadata = { title: "Safety & safeguarding" };

/**
 * This page is not decoration. It is:
 *   - what parents read before letting their child sign up (biggest conversion factor)
 *   - a hard requirement for the app stores when the native app ships
 *   - the document you rely on if something ever goes wrong
 * The TBCs must be filled in with real named people before any under-18 event runs.
 */
export default function SafeguardingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">Keeping players safe</h1>
      <p className="mt-5 text-lg text-muted">
        Most of our players are young. Here&apos;s exactly what we do about that — written
        plainly, so parents can read it in two minutes and decide.
      </p>

      <Section title="At our events">
        <li>Every player under 18 needs a parent or guardian&apos;s permission to enter.</li>
        <li>
          We collect a guardian&apos;s name, phone and email at sign-up, and we keep them
          reachable for the whole day.
        </li>
        <li>
          Named, DBS-checked safeguarding leads are on site and identifiable. Any player or
          parent can approach them at any time.
        </li>
        <li>A qualified first aider is present, and we hold medical and allergy details.</li>
        <li>
          Photography and filming are opt-in. If a player hasn&apos;t consented, our
          photographers are told, and they are not filmed.
        </li>
      </Section>

      <Section title="On the platform">
        <li>
          Profiles never show a full surname, a school, a home address or an exact age. Age
          shows as a band; location shows as a region.
        </li>
        <li>
          Free-text chat is for players aged 16 and over. Under-16s can still find people to
          play with through the Looking For Game board and set quick messages.
        </li>
        <li>Report and block are on every profile and every conversation.</li>
        <li>
          Messages are retained so that reports can actually be investigated rather than
          just filed.
        </li>
        <li>
          Messages are filtered for phone numbers, addresses and external links — the things
          used to move a young person off a moderated platform.
        </li>
        <li>You can delete your account, and deletion actually deletes.</li>
      </Section>

      <Section title="Who's responsible">
        <li>Safeguarding lead: <strong className="text-body">{ORG.safeguarding.leadName}</strong></li>
        <li>Contact: <strong className="text-body">{ORG.safeguarding.leadEmail}</strong></li>
        <li>
          Moderators: <strong className="text-body">{ORG.safeguarding.moderators.join(", ")}</strong>
        </li>
        <li>We aim to respond to every report within 24 hours.</li>
      </Section>

      <p className="mt-12 rounded-2xl border border-kesri/40 bg-kesri/10 p-5 text-sm text-kesrisoft">
        <strong className="font-bold">Parents:</strong> if anything here concerns you, or
        you want to talk to someone before your child signs up, email{" "}
        {ORG.safeguarding.leadEmail}. We&apos;d rather have the conversation.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-kesri">{title}</h2>
      <ul className="mt-4 space-y-3 text-muted">{children}</ul>
    </section>
  );
}
