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
import { copy, fill } from "@/copy";

export const metadata: Metadata = { title: copy.play.title };

export default async function PlayPage() {
  // Checked before touching the store, which is the thing that cannot work on a host
  // with no writable filesystem. Also honest: the board is built but not launched —
  // guardian notification emails do not send yet, and that is a promise made on
  // a promise we make to guardians, which has to be true before an under-16 is here.
  if (!boardOpen()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <h1 className="font-display text-3xl">{copy.play.title}</h1>
        <p className="mt-4 text-muted">{copy.play.closedBody}</p>
        <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-6">
          <h2 className="font-display text-lg text-kesri">
            {copy.play.closedHowTitle}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {[
              copy.play.closedHow1,
              copy.play.closedHow2,
              copy.play.closedHow3,
              copy.play.closedHow4,
              copy.play.closedHow5,
            ].map((line) => (
              <li key={line}>— {line}</li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-sm text-muted">{copy.play.closedFootnote}</p>
      </div>
    );
  }

  const me = await currentPlayer();

  // Signed out. The board shows names, regions and age bands of real players — including
  // children — so it is not something to render to an anonymous visitor.
  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <h1 className="font-display text-3xl">{copy.play.title}</h1>
        <p className="mt-4 text-muted">{copy.play.signedOutBody}</p>
        <div className="mt-8">
          <Link
            href="/signin"
            className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            {copy.play.signedOutCta}
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">
          {copy.play.signedOutFootnote}
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
        <h1 className="font-display text-3xl">{copy.play.title}</h1>
        <p className="mt-4 text-muted">{copy.play.needsGuardianBody}</p>
        <div className="mt-8 rounded-2xl border border-line bg-surface/60 p-6">
          <h2 className="font-display text-lg text-kesri">
            {copy.play.needsGuardianTitle}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {[
              copy.play.needsGuardian1,
              copy.play.needsGuardian2,
              copy.play.needsGuardian3,
              copy.play.needsGuardian4,
              copy.play.needsGuardian5,
            ].map((line) => (
              <li key={line}>— {line}</li>
            ))}
          </ul>
        </div>
        {(approval?.status === "declined" || approval?.status === "revoked") && (
          <p className="mt-8 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            {copy.play.guardianDeclined}
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
      <h1 className="font-display text-4xl">{copy.play.title}</h1>
      <p className="mt-3 max-w-2xl text-muted">{copy.play.boardIntro}</p>

      {me.ageBand === "U16" && (
        <p className="mt-6 rounded-xl border border-ok/40 bg-ok/[0.08] p-4 text-sm text-body">
          <strong className="font-bold">{copy.play.u16NoticeStrong}</strong>{" "}
          {copy.play.u16NoticeRest}
        </p>
      )}

      {/* Accepted — the payoff. Gamertags appear only here. */}
      {accepted.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ok">
            {copy.play.readyTitle}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {accepted.map((r) => {
              const theirTag =
                r.fromPlayerId === me.id ? r.toGamertag : r.fromGamertag;
              const theirName =
                r.fromPlayerId === me.id
                  ? copy.play.readyOpponent
                  : r.fromDisplayName;
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
                    {copy.play.readyFootnote}
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
            {fill(copy.play.requestsTitle, { n: pending.length })}
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
                      {copy.play.requestAccept}
                    </button>
                  </form>
                  <form action={answerRequest}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="answer" value="decline" />
                    <button className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted">
                      {copy.play.requestDecline}
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
                {copy.play.myPostLabel}
              </p>
              <p className="mt-1.5 text-body">
                {mine.game} · {mine.platform} · {mine.windows.join(", ")}
              </p>
              <p className="mt-1 text-xs text-muted">
                {copy.play.myPostExpires}{" "}
                {new Date(mine.expiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            <form action={takeDownMyPost}>
              <input type="hidden" name="postId" value={mine.id} />
              <button className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted">
                {copy.play.myPostTakeDown}
              </button>
            </form>
          </div>
        )}
        <PostComposer hasPost={!!mine} />
      </section>

      {/* The board */}
      <section className="mt-12">
        <h2 className="font-display text-xl">{copy.play.boardTitle}</h2>
        {posts.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            {copy.play.boardEmpty}
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
        <strong className="text-body">{copy.play.safetyStrong}</strong>{" "}
        {copy.play.safetyRest}
      </p>
    </div>
  );
}
