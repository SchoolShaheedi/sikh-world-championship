import Link from "next/link";
import type { Metadata } from "next";
import { copy } from "@/copy";

export const metadata: Metadata = { title: copy.volunteer.title };

/**
 * The jobs on the day. Name and detail are separate so the em dash is not part of the
 * copy — a role with no detail (langar, photography) renders as just the name.
 */
const ROLES = [
  { name: copy.volunteer.role1Name, detail: copy.volunteer.role1Detail },
  { name: copy.volunteer.role2Name, detail: copy.volunteer.role2Detail },
  { name: copy.volunteer.role3Name, detail: copy.volunteer.role3Detail },
  { name: copy.volunteer.role4Name, detail: copy.volunteer.role4Detail },
  { name: copy.volunteer.role5Name, detail: copy.volunteer.role5Detail },
  { name: copy.volunteer.role6Name, detail: copy.volunteer.role6Detail },
  { name: copy.volunteer.role7Name, detail: copy.volunteer.role7Detail },
];

export default function VolunteerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">{copy.volunteer.title}</h1>
      <p className="mt-5 text-lg text-muted">{copy.volunteer.intro}</p>

      <h2 className="font-display mt-12 text-2xl">{copy.volunteer.rolesTitle}</h2>
      <ul className="mt-4 space-y-3 text-muted">
        {ROLES.map((r) => (
          <li key={r.name}>
            <strong className="text-body">{r.name}</strong>
            {r.detail ? ` — ${r.detail}` : ""}
          </li>
        ))}
      </ul>

      {/* Deep-links to the support form with "I'd like to volunteer" already selected.
          Until round 43 this pointed at bare /support, which had no volunteering option at
          all — so the one call to action on the page sent people to a form that did not
          fit what they came to say, and they had to file it under "Something else".

          TODO: a real volunteer sign-up form (same form engine as event registration — see
          src/lib/types.ts FormField). It needs the DBS question, availability and a
          reference, none of which belong in a general support message. */}
      <div className="mt-10 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-xl text-kesri">
          {copy.volunteer.howTitle}
        </h2>
        <p className="mt-3 text-muted">{copy.volunteer.howBody}</p>
        <Link
          href="/support?about=volunteer"
          className="mt-5 inline-block rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
        >
          {copy.volunteer.cta}
        </Link>
      </div>
    </div>
  );
}
