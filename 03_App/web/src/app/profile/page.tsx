import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentPlayer } from "@/lib/session";
import { getAvatar } from "@/data/avatars";
import { Avatar } from "@/components/Avatar";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Your profile" };
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
            {me.region || "Region not set"} · {me.ageBand === "U16" ? "Under 16" : "16 and over"}
            {me.eventVerified && (
              <span className="ml-2 rounded-full border border-ok/50 bg-ok/10 px-2 py-0.5 text-xs text-ok">
                Met at an event
              </span>
            )}
          </p>
        </div>
      </div>

      {/* What other players can see. Stated plainly because the whole safeguarding case
          rests on it being true, and a player should be able to check it themselves. */}
      <section className="mt-10 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg text-kesri">What other players can see</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li>— Your first name: <span className="text-body">{me.displayName}</span></li>
          <li>— Your avatar: <span className="text-body">{getAvatar(me.avatarId).label}</span></li>
          <li>— Your region: <span className="text-body">{me.region || "not set"}</span></li>
          <li>— Your age group: <span className="text-body">{me.ageBand === "U16" ? "under 16" : "16 and over"}</span></li>
        </ul>
        <p className="mt-4 text-sm text-muted">
          Never your surname, your school, your address, your exact age or your email. Your
          PlayStation ID is only shared with someone once you have both agreed to a game.
        </p>
      </section>

      {me.ageBand === "U16" && (
        <section className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
          <h2 className="font-display text-lg text-kesri">Your parent or guardian</h2>
          <p className="mt-3 text-sm text-muted">
            {me.guardianEmail
              ? `We contact ${me.guardianEmail} about your account.`
              : "We don't have a parent or guardian's email for you. Get in touch through Support and we'll add one."}
          </p>
          <p className="mt-2 text-sm text-muted">
            Find a game is{" "}
            <span className="text-body">
              {me.guardianApprovedForBoard ? "switched on" : "switched off"}
            </span>{" "}
            for you. They can change that at any time.
          </p>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg text-kesri">Your trophies</h2>
        <p className="mt-3 text-sm text-muted">
          Nothing yet — the first event hasn&apos;t happened. Trophies you win are saved
          here across every SWC event.
        </p>
      </section>

      <form action={signOut} className="mt-10">
        <button
          type="submit"
          className="rounded-xl border border-line px-6 py-3 font-semibold text-body transition-colors hover:border-kesri/60"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
