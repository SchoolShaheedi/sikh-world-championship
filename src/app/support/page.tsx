import type { Metadata } from "next";
import Link from "next/link";
import { ORG } from "@/data/org";
import { SupportForm } from "@/components/SupportForm";

export const metadata: Metadata = {
  title: "Support & report a problem",
  description:
    "Report a problem, raise a safety concern, or ask us anything. Open to players, parents and guardians — no account needed.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">Support</h1>
      <p className="mt-3 text-lg text-muted">
        Report a problem, raise a safety concern, or just ask us something. You don&apos;t
        need an account, and you don&apos;t have to give your name.
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
        <SupportForm />
      </div>

      {/* Common answers, so people don't have to wait for a reply to simple questions. */}
      <section className="mt-16">
        <h2 className="font-display text-2xl">Quick answers</h2>
        <div className="mt-6 space-y-4">
          {[
            {
              q: "How do I stop someone contacting me?",
              a: "Tap Block on their post. They disappear from your board and you disappear from theirs — they aren't told, so there's nothing to retaliate to. If they've done something wrong, report them too.",
            },
            {
              q: "My child is under 16 — how do I switch the board on or off?",
              a: "Under-16s can't use the board until a parent or guardian turns it on, and you can turn it off again at any time. Email us and we'll sort it, or use the form above.",
            },
            {
              q: "Who can see my child on the board?",
              a: "Only other under-16s. The under-16 and over-16 boards are entirely separate — an adult account cannot see, contact, or be contacted by an under-16 at all.",
            },
            {
              q: "How long will a report take?",
              a: "Safety concerns and player reports go to the top of the moderators' queue and we aim to look at them within 24 hours. Everything else, usually a few days.",
            },
            {
              q: "Can I delete my account?",
              a: "Yes, and deletion actually deletes. Use the form above and pick 'Account or sign-up problem'.",
            },
            {
              q: "I signed up for an event but can't make it",
              a: "Tell us as soon as you can — places are limited and someone on the waitlist would love yours.",
            },
          ].map((f) => (
            <details
              key={f.q}
              className="rounded-2xl border border-line bg-surface/60 p-5"
            >
              <summary className="cursor-pointer font-semibold text-body">
                {f.q}
              </summary>
              <p className="mt-3 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-12 rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
        You can also email us directly at{" "}
        <span className="text-kesri">{ORG.email}</span>. For anything about a young
        person&apos;s safety, our safeguarding lead is{" "}
        <span className="text-body">{ORG.safeguarding.leadName}</span> —{" "}
        <span className="text-kesri">{ORG.safeguarding.leadEmail}</span>. More detail on{" "}
        <Link href="/safeguarding" className="text-kesri hover:underline">
          how we keep players safe
        </Link>
        .
      </p>
    </div>
  );
}
