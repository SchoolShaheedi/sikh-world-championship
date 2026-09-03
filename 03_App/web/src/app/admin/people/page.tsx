import type { Metadata } from "next";
import Link from "next/link";
import { currentPlayer } from "@/lib/session";
import { staffList, staffGrants } from "@/lib/staff";
import { StaffPanel } from "@/components/StaffPanel";

export const metadata: Metadata = {
  title: "People",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Who can do what.
 *
 * WHY THIS PAGE EXISTS AT ALL, given that CLAUDE.md invariant 6 has said since round 24
 * that moderator is a database grant with no button anywhere in the app.
 *
 * That invariant was right and is still right about the SIZE of the moderator grant. What
 * changed on 2026-09-03 is that the arrival desk needed two or three volunteers on a door,
 * and with one flag, staffing a door meant handing out the safeguarding queue. The fix was
 * not to make the big grant easier — it was to add a small one (`is_desk`) that the desk
 * actually needs, so the big one stops being the only way to help.
 *
 * So the invariant is narrowed rather than dropped: moderator is now grantable from here,
 * by an existing moderator, with every grant and revocation recorded in `staff_grants`,
 * with a page that states what each role can see, and with two refusals in `staff.ts` that
 * stop somebody locking the whole team out mid-event. That is a deliberate weakening with
 * compensating controls, written down in DECISIONS.md — not an oversight.
 */
export default async function PeoplePage() {
  const me = await currentPlayer();
  if (!me?.isModerator) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Moderators only</h1>
        <p className="mt-3 text-muted">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  const [staff, grants] = await Promise.all([staffList(), staffGrants(20)]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-muted">
        <Link href="/admin" className="hover:text-body">
          ← Admin
        </Link>
      </p>
      <h1 className="font-display mt-2 text-4xl">People</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Two levels, and the difference matters. <span className="text-body">Desk</span> can
        check people in and nothing else. <span className="text-body">Moderator</span> can
        see every applicant&apos;s contact details and every safeguarding message, run the
        draw, and delete accounts. Give people the smaller one unless they need the larger.
      </p>

      <div className="mt-8">
        <StaffPanel staff={staff} grants={grants} meEmail={me.email} />
      </div>
    </div>
  );
}
