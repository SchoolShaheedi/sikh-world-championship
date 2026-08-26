import type { Metadata } from "next";
import { ORG } from "@/data/org";

export const metadata: Metadata = { title: "Safety & safeguarding" };

/**
 * This page is not decoration. It is:
 *   - what parents read before letting their child sign up (biggest conversion factor)
 *   - a hard requirement for the app stores when the native app ships
 *   - the document you rely on if something ever goes wrong
 * The TBCs must be filled in with real named people before any under-18 event runs.
 *
 * EVERY LINE HERE MUST BE TRUE OF THE CODE AS IT STANDS.
 *
 * It previously claimed free-text chat for 16+, retained messages, report and block "on
 * every conversation", and that messages were filtered for phone numbers and links. None
 * of that existed: there is no chat, there are no messages, and no filtering was ever
 * written. A parent deciding whether to let their child sign up was reading a description
 * of a different product.
 *
 * Round 25: chat is off for everyone, indefinitely. So the honest version of this section
 * is short — and being short is the point. Claims about things we might build later
 * belong in 00_Docs/NEXT-STEPS.md, not on the page a parent trusts.
 *
 * Statements about the event day are written as commitments ("will be") because the event
 * has not happened yet. Statements about the platform are written in the present tense
 * only where the code already does them.
 */
export default function SafeguardingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="display-xl text-[clamp(2.1rem,4.8vw,3.4rem)]">Keeping players safe</h1>
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
          Named, DBS-checked safeguarding leads will be on site and identifiable. Any
          player or parent can approach them at any time.
        </li>
        <li>
          A qualified first aider will be present. We ask for medical, allergy and dietary
          details at sign-up so they are known in advance rather than discovered on the day.
        </li>
        <li>
          Players under 12 must have a parent or guardian at the venue for the whole event.
          Players aged 12 to 15 must be dropped off and collected, and may not leave on
          their own. Players aged 16 and 17 may come and go independently, with their
          parent or guardian&apos;s permission recorded at sign-up.
        </li>
        <li>Every entrant gives us an emergency contact we can reach on the day.</li>
        <li>
          Photography and filming are opt-in. If a player hasn&apos;t consented, our
          photographers are told, and they are not filmed.
        </li>
      </Section>

      <Section title="On the platform">
        <li>
          <strong className="text-body">There is no chat, for anyone, at any age.</strong>{" "}
          Nobody can type a message to another player. Not adults, not 16-year-olds, not
          anyone. We would rather offer less than run something we cannot moderate
          properly.
        </li>
        <li>
          Finding someone to play with works from fixed menus instead. You pick a game, a
          platform, when you&apos;re free, and one note from a short list we wrote. There is
          no box to type into, so there is nothing a stranger can say to your child.
        </li>
        <li>
          Under-16s and 16-plus are kept completely separate. An adult cannot see, contact,
          or be contacted by an under-16 — that separation is built into how the data is
          stored, not just hidden in the app.
        </li>
        <li>
          Under-16s need a parent or guardian to switch the board on for them, and you can
          withdraw that permission at any time. It takes effect immediately.
        </li>
        <li>
          When an under-16 swaps PlayStation IDs with another player, both children&apos;s
          parents are emailed and told who, from where, and what game.
        </li>
        <li>
          PlayStation IDs are never shown on the open board. They are released only to two
          players who have both agreed to a game.
        </li>
        <li>
          Profiles never show a full surname, a school, a home address or an exact age. Age
          shows as a band; location shows as a region.
        </li>
        <li>
          Report and block are on every post and every profile, and every report goes to a
          real person in a queue with a name against it.
        </li>
        <li>
          Ask us to delete your account and we will delete it, along with your
          registrations. Use the form on{" "}
          <a href="/support" className="text-kesri hover:underline">
            Support
          </a>
          .
        </li>
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
