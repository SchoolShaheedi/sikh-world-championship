import type { Metadata } from "next";
import Link from "next/link";
import { currentPlayer, canUseBoard } from "@/lib/session";
import { boardFor, myPost, requestsFor, gamertagsVisible } from "@/lib/play-store";
import { ensureSeeded } from "@/lib/play-seed";
import { PostComposer } from "@/components/play/PostComposer";
import { PostCard } from "@/components/play/PostCard";
import { takeDownMyPost, answerRequest } from "./actions";
import { approvalFor } from "@/lib/guardian-store";
import { AskGuardianButton } from "@/components/play/AskGuardianButton";
import { boardOpen } from "@/lib/features";

export const metadata: Metadata = { title: "Find a game" };

export default async function PlayPage() {
  // Checked before touching the store, which is the thing that cannot work on a host
  // with no writable filesystem. Also honest: the board is built but not launched —
  // guardian notification emails do not send yet, and that is a promise made on
  // a promise we make to guardians, which has to be true before an under-16 is here.
  if (!boardOpen()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <h1 className="font-display text-3xl">Find a game</h1>
        <p className="mt-4 text-muted">
          This is built, but it isn&apos;t switched on yet. It lets you find another Sikh
          player to practise against — you pick a game, a platform and when you&apos;re
          free, and other players send you a request.
        </p>
        <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-6">
          <h2 className="font-display text-lg text-kesri">How it will work</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>— No messaging and no typing, for anyone. Everything is built from set options.</li>
            <li>— Under-16s and over-16s never mix, and adults cannot reach an under-16.</li>
            <li>— Under-16s need a parent or guardian to switch it on, and they can switch it off again at any time.</li>
            <li>— Gamertags are only shared once two players have both agreed to a game.</li>
            <li>— Report and block on every post, with real moderators behind them.</li>
          </ul>
        </div>
        <p className="mt-6 text-sm text-muted">
          We&apos;re waiting on the parent and guardian notification emails before this
          opens. That promise has to work before anyone under 16 is here, not after.
        </p>
      </div>
    );
  }

  const me = await currentPlayer();

  // Signed out. The board shows names, regions and age bands of real players — including
  // children — so it is not something to render to an anonymous visitor.
  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <h1 className="font-display text-3xl">Find a game</h1>
        <p className="mt-4 text-muted">
          Sign in to see the board. It shows other players&apos; first names and regions, so
          it isn&apos;t public.
        </p>
        <div className="mt-8">
          <Link
            href="/signin"
            className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">
          You get an account automatically when you enter an event — there&apos;s no separate
          sign-up.
        </p>
      </div>
    );
  }

  // Under-16s need a guardian to switch the board on. They get an explanation and a
  // way to get it sorted, not a locked door.
  if (!canUseBoard(me)) {
    const approval = await approvalFor(me.id);
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <h1 className="font-display text-3xl">Find a game</h1>
        <p className="mt-4 text-muted">
          You&apos;re under 16, so a parent or guardian needs to switch this on for you
          first. We&apos;ll email them and they can turn it on in one click.
        </p>
        <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-6">
          <h2 className="font-display text-lg text-kesri">
            What they&apos;ll be agreeing to
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li>— You&apos;ll only ever see, and be seen by, other under-16 players. Adults cannot reach you here at all.</li>
            <li>— There&apos;s no messaging and no typing. Posts and requests are built from set options.</li>
            <li>— Your gamertag is only shared when you both agree to a game.</li>
            <li>— They&apos;ll get an email telling them each time you connect with someone.</li>
            <li>— They can switch it off again whenever they want.</li>
          </ul>
        </div>
        {(approval?.status === "declined" || approval?.status === "revoked") && (
          <p className="mt-8 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            Your parent or guardian has said no for now. Talk to them — they can
            change their mind at any time using the link we sent them.
          </p>
        )}

        <div className="mt-8 space-y-4">
          <AskGuardianButton status={approval?.status ?? null} />

        </div>
      </div>
    );
  }

  await ensureSeeded();

  const [posts, mine, reqs] = await Promise.all([
    boardFor(me.id, me.ageBand),
    myPost(me.id),
    requestsFor(me.id),
  ]);

  const pending = reqs.incoming.filter((r) => r.status === "pending");
  const accepted = [...reqs.incoming, ...reqs.outgoing].filter(
    (r) => r.status === "accepted",
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl">Find a game</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Sikh players looking for someone to play with. Say what you play and when
        you&apos;re free, send a request, and swap gamertags once you both agree.
      </p>

      {me.ageBand === "U16" && (
        <p className="mt-6 rounded-xl border border-ok/40 bg-ok/[0.08] p-4 text-sm text-body">
          <strong className="font-bold">You&apos;re in the under-16 board.</strong> Everyone
          here is under 16 too — adults can&apos;t see you or contact you. Your parent or
          guardian gets an email whenever you connect with someone.
        </p>
      )}

      {/* Accepted — the payoff. Gamertags appear only here. */}
      {accepted.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ok">Ready to play</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {accepted.map((r) => {
              const theirTag =
                r.fromPlayerId === me.id ? r.toGamertag : r.fromGamertag;
              const theirName =
                r.fromPlayerId === me.id ? "Your opponent" : r.fromDisplayName;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-ok/40 bg-ok/[0.07] p-5"
                >
                  <p className="font-display text-lg text-body">{theirName}</p>
                  <p className="mt-1 text-sm text-muted">{r.proposedWindow}</p>
                  {gamertagsVisible(r, me.id) && (
                    <p className="mt-3 rounded-lg border border-line bg-ink/50 px-3 py-2 font-mono text-sm text-kesri">
                      {theirTag}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted">
                    Add each other on PlayStation and play from there.
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Incoming requests */}
      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-kesri">
            Requests for you ({pending.length})
          </h2>
          <div className="mt-4 space-y-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/70 p-5"
              >
                <div>
                  <p className="font-display text-body">{r.fromDisplayName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {r.proposedWindow} · &ldquo;{r.note}&rdquo;
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={answerRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="answer" value="accept" />
                    <button className="rounded-xl bg-kesri px-4 py-2.5 text-sm font-bold text-ink">
                      Accept
                    </button>
                  </form>
                  <form action={answerRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="answer" value="decline" />
                    <button className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted">
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My post */}
      <section className="mt-10">
        {mine && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-kesri/40 bg-kesri/[0.06] p-5">
            <div>
              <p className="text-xs tracking-[0.16em] text-kesri uppercase">
                Your post is up
              </p>
              <p className="mt-1.5 text-body">
                {mine.game} · {mine.platform} · {mine.windows.join(", ")}
              </p>
              <p className="mt-1 text-xs text-muted">
                Expires{" "}
                {new Date(mine.expiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <form action={takeDownMyPost}>
              <input type="hidden" name="postId" value={mine.id} />
              <button className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted">
                Take it down
              </button>
            </form>
          </div>
        )}
        <PostComposer hasPost={!!mine} />
      </section>

      {/* The board */}
      <section className="mt-12">
        <h2 className="font-display text-xl">Players looking for a game</h2>
        {posts.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            Nobody&apos;s posted yet. Put yours up and you&apos;ll be first.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-12 rounded-2xl border border-line bg-surface/50 p-5 text-sm text-muted">
        <strong className="text-body">How we keep this safe:</strong> under-16s and over-16s
        are kept completely separate, there&apos;s no free typing at strangers, and
        gamertags are only shared once you both agree to a game. Report and block are on
        every post, a moderator reads every report, and under-16s need a guardian&apos;s
        permission to be here at all.
      </p>
    </div>
  );
}
