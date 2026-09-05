import Link from "next/link";
import type { Metadata } from "next";
import { copy } from "@/copy";
import { VOLUNTEER_ROLES } from "@/lib/volunteer-types";
import { VolunteerForm } from "@/components/VolunteerForm";

export const metadata: Metadata = { title: copy.volunteer.title };

/**
 * Volunteering.
 *
 * THE ROLES MOVED OUT OF `en.json` (round 57). They were seven pairs of copy keys, and a
 * role is now a permitted value as well as a label: the form offers these ids and the
 * server accepts only these ids. `src/lib/volunteer-types.ts` is where copy that feeds
 * validation lives — the same rule as support categories and medical conditions.
 *
 * THE PAGE ENDS IN A FORM, NOT A LINK. It used to hand off to /support with the
 * "volunteer" category pre-selected, which meant an offer of help arrived as a paragraph
 * of prose. The three things that decide whether somebody can be given a job — a DBS
 * check, the hours they can give, and whether anybody vouches for them — were never
 * asked. The support link stays underneath for a person who would rather talk first.
 */
export default function VolunteerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">{copy.volunteer.title}</h1>
      <p className="mt-5 text-lg text-muted">{copy.volunteer.intro}</p>

      <h2 className="font-display mt-12 text-2xl">{copy.volunteer.rolesTitle}</h2>
      <p className="mt-2 text-sm text-muted">{copy.volunteer.rolesIntro}</p>
      <ul className="mt-4 space-y-3 text-muted">
        {VOLUNTEER_ROLES.map((r) => (
          <li key={r.id}>
            <strong className="text-body">{r.name}</strong>
            {r.detail ? ` — ${r.detail}` : ""}
          </li>
        ))}
      </ul>

      <h2 className="font-display mt-14 text-2xl">{copy.volunteer.formTitle}</h2>
      <p className="mt-2 mb-8 text-muted">{copy.volunteer.formIntro}</p>
      <VolunteerForm />

      <div className="mt-12 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-xl text-kesri">{copy.volunteer.howTitle}</h2>
        <p className="mt-3 text-muted">{copy.volunteer.howBody}</p>
        <Link
          href="/support?about=volunteer"
          className="mt-5 inline-block rounded-xl border border-line px-6 py-3 font-bold text-body transition-colors hover:border-kesri hover:text-kesri"
        >
          {copy.volunteer.cta}
        </Link>
      </div>
    </div>
  );
}
