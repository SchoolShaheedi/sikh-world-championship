import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/session";
import { getAvatar } from "@/data/avatars";
import { Avatar } from "@/components/Avatar";
import { signOut } from "./actions";
import { boardOpen } from "@/lib/features";
import { PROFILE_BENEFITS } from "@/data/profile-benefits";
import { publicName } from "@/lib/players";
import { copy, fill } from "@/copy";

export const metadata: Metadata = { title: copy.profile.title };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const me = await currentPlayer();
  if (!me) redirect("/signin");

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="flex items-center gap-5">
        <Avatar avatarId={me.avatarId} size={72} />
        <div>
          <h1 className="font-display text-3xl">{me.displayName}</h1>
          <p className="mt-1 text-muted">
            {me.region || copy.profile.regionNotSet} ·{" "}
            {me.ageBand === "U16"
              ? copy.profile.ageBandU16
              : copy.profile.ageBandAdult}
            {me.eventVerified && (
              <span className="ml-2 rounded-full border border-ok/50 bg-ok/10 px-2 py-0.5 text-xs text-ok">
                {copy.profile.eventVerified}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* What other players can see. Stated plainly because the whole safeguarding case
          rests on it being true, and a player should be able to check it themselves. */}
      <section className="mt-10 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg text-kesri">
          {copy.profile.visibilityTitle}
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li>
            — {copy.profile.visibilityBracket}{" "}
            <span className="text-body">{publicName(me)}</span>
          </li>
          <li>
            — {copy.profile.visibilityFirstName}{" "}
            <span className="text-body">{me.displayName}</span>
          </li>
          <li>
            — {copy.profile.visibilityAvatar}{" "}
            <span className="text-body">{getAvatar(me.avatarId).label}</span>
          </li>
          <li>
            — {copy.profile.visibilityRegion}{" "}
            <span className="text-body">
              {me.region || copy.profile.visibilityRegionUnset}
            </span>
          </li>
          <li>
            — {copy.profile.visibilityAgeGroup}{" "}
            <span className="text-body">
              {me.ageBand === "U16"
                ? copy.profile.visibilityAgeU16
                : copy.profile.visibilityAgeAdult}
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted">{copy.profile.visibilityNever}</p>
      </section>

      {me.ageBand === "U16" && (
        <section className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
          <h2 className="font-display text-lg text-kesri">
            {copy.profile.guardianTitle}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {me.guardianEmail
              ? fill(copy.profile.guardianContact, {
                  email: me.guardianEmail,
                })
              : copy.profile.guardianMissing}
          </p>
          {/* Only while the board exists. Telling a child that a feature nobody can reach
              is "switched off for you" invites them to ask a parent to switch on something
              that is not there. */}
          {boardOpen() && (
            <p className="mt-2 text-sm text-muted">
              {copy.profile.boardOnPrefix}{" "}
              <span className="text-body">
                {me.guardianApprovedForBoard
                  ? copy.profile.boardOn
                  : copy.profile.boardOff}
              </span>{" "}
              {copy.profile.boardOnSuffix}
            </p>
          )}
        </section>
      )}

      {/* What the profile is for, in the same words as /join — so what someone was told
          when they registered is what they see once they have one. */}
      <section className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg text-kesri">
          {copy.profile.benefitsTitle}
        </h2>
        <ul className="mt-4 space-y-3">
          {PROFILE_BENEFITS.map((b) => (
            <li key={b.title} className="text-sm">
              <span className="font-semibold text-body">{b.title}</span>
              {!b.live && (
                <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] tracking-wide text-muted uppercase">
                  {copy.join.benefitComing}
                </span>
              )}
              <span className="mt-0.5 block text-muted">{b.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg text-kesri">
          {copy.profile.trophiesTitle}
        </h2>
        <p className="mt-3 text-sm text-muted">{copy.profile.trophiesEmpty}</p>
      </section>

      <form action={signOut} className="mt-10">
        <button
          type="submit"
          className="rounded-xl border border-line px-6 py-3 font-semibold text-body transition-colors hover:border-kesri/60"
        >
          {copy.profile.signOut}
        </button>
      </form>
    </div>
  );
}
