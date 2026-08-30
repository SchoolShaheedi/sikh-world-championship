import type { Metadata } from "next";
import { SupportForm } from "@/components/SupportForm";

export const metadata: Metadata = {
  title: "Support & report a problem",
  description:
    "Report a problem, raise a safety concern, or ask us anything. Open to players, parents and guardians — no account needed.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display-xl text-[clamp(2.2rem,5vw,3.6rem)]">Support</h1>
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

      {/* Common answers, so people don't have to wait for a reply to simple questions.

          EVERY ONE OF THESE MUST BE TRUE OF THE SITE AS IT STANDS. The previous set
          described a product we do not run: blocking people on a board that is switched
          off, a waitlist that no longer exists, and account deletion "that actually
          deletes" when deletion is a person editing records by hand. */}
      <section className="mt-16">
        <h2 className="font-display text-2xl">Quick answers</h2>
        <div className="mt-6 space-y-4">
          {[
            {
              q: "I filled in the form — do I have a place?",
              a: "Not yet. There are more applications than places, so places are decided by a draw after applications close. We'll email you either way, so you don't need to chase us.",
            },
            {
              q: "How are places decided?",
              a: "Applicants referred by one of our partner organisations are drawn first; the remaining places are drawn from everyone else. Within each group it's random — nobody is judged or ranked.",
            },
            {
              q: "My child is under 16 — do I need to stay?",
              a: "Yes. Players aged 12 to 15 need a parent or guardian at the venue for the whole event. You don't have to sit with them. Players aged 16 and 17 can come on their own if you give permission when they apply.",
            },
            {
              q: "Something's wrong, or I'm worried about a young person",
              a: "Use the form above and pick the safety option. It goes to the top of the queue and a moderator reads it. You can send it without an account and without giving your name.",
            },
            {
              q: "I've got a place but can't make it",
              a: "Tell us as soon as you can. Places are limited and we can offer yours to someone else.",
            },
            {
              q: "Can you delete my details?",
              a: "Yes — ask us through the form and we'll delete everything we hold about you. Tell us the email address you applied with so we can find it.",
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
        This form is the way to reach us. Anything about a young person&apos;s safety jumps
        to the top of the queue and is read by a moderator. You can send it without an
        account and without giving your name.
      </p>
    </div>
  );
}
