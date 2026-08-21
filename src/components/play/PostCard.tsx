"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { PRESET_NOTES, REPORT_REASONS, type LfgPost } from "@/lib/play-types";
import { sendRequest, reportPlayer, blockAndHide } from "@/app/play/actions";

/**
 * One post on the board.
 *
 * Note what is NOT here: no gamertag, no surname, no exact age, no free text, and no way
 * to message the person. The only outbound action is a structured request. Everything
 * about this card is a deliberate absence.
 */
export function PostCard({ post }: { post: LfgPost }) {
  const [panel, setPanel] = useState<"none" | "request" | "report" | "sent">("none");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-line bg-surface/70 p-5">
      <div className="flex items-start gap-4">
        <Avatar avatarId={post.avatarId} size={52} alt={post.displayName} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-display text-lg text-body">{post.displayName}</p>
            <p className="text-sm text-muted">{post.region}</p>
            {post.eventVerified && (
              <span
                title="Came to an SWC event and was checked in by a volunteer"
                className="rounded-md bg-ok/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-ok uppercase"
              >
                ✓ Met at an event
              </span>
            )}
          </div>

          <p className="mt-1 text-sm">
            <span className="font-semibold text-kesri">{post.game}</span>
            <span className="text-muted"> · {post.platform} · {post.intensity}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.windows.map((w) => (
              <span
                key={w}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-muted"
              >
                {w}
              </span>
            ))}
          </div>

          <p className="mt-3 text-sm text-muted italic">&ldquo;{post.note}&rdquo;</p>
        </div>
      </div>

      {panel === "sent" && (
        <p className="mt-4 rounded-xl border border-ok/40 bg-ok/10 p-3 text-sm text-body">
          Request sent. If {post.displayName} accepts, you&apos;ll both get each
          other&apos;s gamertag and can play.
        </p>
      )}

      {panel === "none" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPanel("request")}
            className="rounded-xl bg-kesri px-4 py-2.5 text-sm font-bold text-ink hover:bg-kesrisoft"
          >
            Request a game
          </button>
          <button
            onClick={() => setPanel("report")}
            className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted hover:border-muted hover:text-body"
          >
            Report
          </button>
          <form action={blockAndHide}>
            <input type="hidden" name="targetPlayerId" value={post.playerId} />
            <button
              type="submit"
              className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted hover:border-muted hover:text-body"
            >
              Block
            </button>
          </form>
        </div>
      )}

      {/* Request — structured, no free text */}
      {panel === "request" && (
        <form
          action={async (fd) => {
            const res = await sendRequest(fd);
            if (res && "error" in res && res.error) setError(res.error);
            else {
              setError(null);
              setPanel("sent");
            }
          }}
          className="mt-4 rounded-xl border border-line bg-ink/40 p-4"
        >
          <input type="hidden" name="postId" value={post.id} />

          <label className="block">
            <span className="text-sm font-semibold text-body">
              Which time suits you?
            </span>
            <select
              name="window"
              defaultValue={post.windows[0]}
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-body"
            >
              {post.windows.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-body">Say something</span>
            <select
              name="note"
              defaultValue={PRESET_NOTES[5]}
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-body"
            >
              {PRESET_NOTES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>

          {error && <p className="mt-3 text-sm text-kesrisoft">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-kesri px-4 py-2 text-sm font-bold text-ink"
            >
              Send request
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-body"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Report */}
      {panel === "report" && (
        <form
          action={async (fd) => {
            await reportPlayer(fd);
            setPanel("none");
          }}
          className="mt-4 rounded-xl border border-kesri/40 bg-kesri/[0.06] p-4"
        >
          <input type="hidden" name="targetPlayerId" value={post.playerId} />
          <input type="hidden" name="targetDisplayName" value={post.displayName} />
          <input type="hidden" name="context" value={`post:${post.id}`} />

          <p className="text-sm font-semibold text-body">
            Report {post.displayName}
          </p>
          <p className="mt-1 text-xs text-muted">
            A moderator reads every report. You won&apos;t be named to the person
            you&apos;re reporting.
          </p>

          <select
            name="reason"
            defaultValue={REPORT_REASONS[0]}
            className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-body"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>

          <textarea
            name="detail"
            rows={2}
            placeholder="Anything else we should know? (optional)"
            className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-body placeholder:text-muted/60"
          />

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-kesri px-4 py-2 text-sm font-bold text-ink"
            >
              Send report
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-body"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
