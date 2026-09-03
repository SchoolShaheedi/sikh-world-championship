"use client";

import { useState } from "react";
import {
  lockDrawList,
  unlockDrawList,
  previewExternalDraw,
  commitExternal,
} from "@/app/admin/actions";
import type { Ballot } from "@/lib/external-draw";

/**
 * Running the draw somewhere else.
 *
 * THE SHAPE OF THE PAGE IS THE SHAPE OF THE AUDIT. Three steps in a fixed order, and step
 * one cannot be skipped, because a number only means something if the mapping from number
 * to person was written down BEFORE the draw. Numbers drawn against a mapping invented
 * afterwards are indistinguishable from picking the winners by hand.
 *
 * WHAT GOES TO THE SERVICE IS INTEGERS. No names, no ages, no references. So there is no
 * processor agreement to sign, no children's names in somebody else's logs, and a picker
 * that could not favour a name if it wanted to. The page says this out loud because it is
 * the answer to the obvious worry about using an outside site at all.
 *
 * THE INSTRUCTION IS WRITTEN OUT FOR THEM. "Ask for 27 numbers between 1 and 145, no
 * repeats" is exactly what random.org's form wants, and somebody doing this in front of an
 * audience should be reading a sentence rather than working out which box is which.
 */
export function ExternalDrawPanel({
  slug,
  ballot,
}: {
  slug: string;
  ballot: Ballot | null;
}) {
  const [service, setService] = useState("");
  const [winners, setWinners] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<null | {
    warnings: string[];
    numbers: number[];
    automatic: number;
    drawn: number;
    names: string[];
    skipped: { number: number; reference: string; fullName: string; status: string }[];
  }>(null);

  async function run(
    fn: (fd: FormData) => Promise<unknown>,
    extra: Record<string, string> = {},
  ) {
    setBusy(true);
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.set("slug", slug);
    for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    const r = (await fn(fd)) as {
      error?: string;
      message?: string;
      drawPreview?: typeof preview;
    };
    if (r?.error) setError(r.error);
    if (r?.message) setMessage(r.message);
    if (r?.drawPreview !== undefined) setPreview(r.drawPreview);
    setBusy(false);
  }

  const poolLabel =
    ballot?.pool === "referred" ? "referred applicants" : "everyone not referred";

  return (
    <div className="mt-8 rounded-2xl border border-line bg-ink/20 p-5">
      <h3 className="font-display text-lg text-kesri">Draw with an outside service</h3>
      <p className="mt-1 text-sm text-muted">
        For a draw people can watch rather than take on trust. The service is only ever
        given <span className="text-body">numbers</span> — never a name, an age or a
        reference — so nobody&apos;s details leave us and the picker could not favour
        somebody if it tried.
      </p>

      {/* ---------- STEP 1 ---------- */}
      {!ballot ? (
        <div className="mt-5">
          <p className="text-sm text-muted">
            <span className="text-body">Step 1.</span> Give every applicant a number and
            record it. This has to happen first: a winning number means nothing unless the
            mapping was written down before the draw.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(lockDrawList)}
            className="mt-3 rounded-xl bg-kesri px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
          >
            {busy ? "Locking…" : "Lock the list"}
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          <div className="rounded-xl border border-line bg-surface/50 p-4">
            <p className="text-sm">
              <span className="text-body">List locked</span>{" "}
              <span className="text-muted">
                {new Date(ballot.lockedAt).toLocaleString("en-GB")}
              </span>
            </p>
            {ballot.automatic.length > 0 && (
              <p className="mt-2 text-sm text-muted">
                <span className="text-body">
                  {ballot.automatic.length} referred applicant
                  {ballot.automatic.length === 1 ? "" : "s"} already have a place
                </span>{" "}
                — referred applicants take priority for every place, so while there is room
                they are not in the draw at all.
              </p>
            )}
            {ballot.appliedSinceLock > 0 && (
              <p className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-200">
                {ballot.appliedSinceLock} {ballot.appliedSinceLock === 1 ? "person has" : "people have"}{" "}
                applied since this list was locked, so {ballot.appliedSinceLock === 1 ? "they are" : "they are"}{" "}
                not in it. Draw from this list, or clear it and lock a new one.
              </p>
            )}
            {ballot.entries.some((e) => !e.stillApplied) && (
              <p className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-200">
                Somebody in this list has withdrawn or been decided since it was locked. If
                their number comes up it is skipped and said so — the place stays open.
              </p>
            )}
          </div>

          {/* ---------- STEP 2 ---------- */}
          <div>
            <p className="text-sm text-muted">
              <span className="text-body">Step 2.</span> Run the draw wherever you like.
              This is the whole instruction:
            </p>
            {ballot.places === 0 ? (
              <p className="mt-3 rounded-xl border border-line bg-surface/50 p-4 text-sm text-muted">
                There are no places left to draw for — the referred applicants fill them
                all. Nothing to give a draw service.
              </p>
            ) : (
              <>
                <p className="font-display mt-3 rounded-xl border border-kesri/40 bg-kesri/[0.07] p-4 text-lg text-body">
                  Ask for {ballot.places} number{ballot.places === 1 ? "" : "s"} between 1
                  and {ballot.entries.length}, with no repeats.
                </p>
                <p className="mt-2 text-xs text-muted">
                  That is {ballot.places} place{ballot.places === 1 ? "" : "s"} among{" "}
                  {ballot.entries.length} {poolLabel}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const list = ballot.entries.map((e) => e.number).join("\n");
                    navigator.clipboard?.writeText(list).then(
                      () => setCopied(true),
                      () => setCopied(false),
                    );
                  }}
                  className="mt-3 rounded-xl border border-line px-4 py-2 text-sm text-muted hover:text-body"
                >
                  {copied ? "Copied" : `Copy the numbers 1–${ballot.entries.length}`}
                </button>
                <p className="mt-1 text-xs text-muted">
                  For a wheel or a picker that wants the entries pasted in.
                </p>
              </>
            )}

            {/* The mapping, for reading the result out and for anybody who asks later. */}
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-muted hover:text-body">
                Show the numbered list ({ballot.entries.length})
              </summary>
              <ol className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {ballot.entries.map((e) => (
                  <li key={e.number} className="flex gap-2">
                    <span className="w-8 shrink-0 text-right font-mono text-muted">
                      {e.number}
                    </span>
                    <span className={e.stillApplied ? "text-body" : "text-muted line-through"}>
                      {e.fullName}
                    </span>
                  </li>
                ))}
              </ol>
              {ballot.automatic.length > 0 && (
                <>
                  <p className="mt-4 text-muted">
                    Referred, place already theirs, not in the draw:
                  </p>
                  <ul className="mt-1 text-body">
                    {ballot.automatic.map((e) => (
                      <li key={e.reference}>{e.fullName}</li>
                    ))}
                  </ul>
                </>
              )}
            </details>
          </div>

          {/* ---------- STEP 3 ---------- */}
          <div>
            <p className="text-sm text-muted">
              <span className="text-body">Step 3.</span> Paste what came back. Any format —
              commas, new lines, a screenful of text with the numbers in it.
            </p>

            <label className="mt-3 block text-sm text-muted">
              Which service ran it
              <input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="random.org"
                className="mt-1.5 w-full rounded-xl border border-line bg-ink/40 px-4 py-2.5 text-body placeholder:text-muted/70 focus:border-kesri focus:outline-none"
              />
            </label>
            <p className="mt-1 text-xs text-muted">
              Recorded with the draw. &ldquo;It was random&rdquo; is not an audit trail.
            </p>

            <label className="mt-4 block text-sm text-muted">
              The winning numbers
              <textarea
                value={winners}
                onChange={(e) => {
                  setWinners(e.target.value);
                  setPreview(null);
                  setConfirming(false);
                }}
                rows={4}
                placeholder="7, 12, 19, 23…"
                className="mt-1.5 w-full rounded-xl border border-line bg-ink/40 px-4 py-3 font-mono text-body placeholder:text-muted/70 focus:border-kesri focus:outline-none"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !winners.trim()}
                onClick={() => run(previewExternalDraw, { winners })}
                className="rounded-xl border border-kesri/60 px-5 py-2.5 text-sm font-bold text-kesri transition-colors hover:bg-kesri/10 disabled:opacity-40"
              >
                {busy ? "Checking…" : "Show me who that is"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(unlockDrawList)}
                className="text-sm text-muted underline hover:text-body disabled:opacity-40"
              >
                Clear this list and start again
              </button>
            </div>
          </div>

          {/* The preview. Never skippable — see previewExternalDraw. */}
          {preview && (
            <div className="rounded-xl border border-line bg-surface/50 p-4">
              <p className="font-display text-lg">
                {preview.names.length} place{preview.names.length === 1 ? "" : "s"} would be
                filled
              </p>
              <p className="mt-1 text-sm text-muted">
                {preview.automatic} referred automatically, {preview.drawn} drawn from the
                numbers {preview.numbers.join(", ")}.
              </p>
              {preview.warnings.map((w) => (
                <p key={w} className="mt-2 text-sm text-amber-200">
                  {w}
                </p>
              ))}
              {preview.skipped.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <p className="font-semibold">Skipped, because they are no longer applying:</p>
                  <ul className="mt-1">
                    {preview.skipped.map((s) => (
                      <li key={s.reference}>
                        #{s.number} {s.fullName} — {s.status}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1">
                    Those places stay open. Draw again for them once this is committed.
                  </p>
                </div>
              )}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted hover:text-body">
                  Read the names
                </summary>
                <ol className="mt-2 list-decimal space-y-0.5 pl-6 text-body">
                  {preview.names.map((n, i) => (
                    <li key={`${n}-${i}`}>{n}</li>
                  ))}
                </ol>
              </details>

              {!confirming ? (
                <button
                  type="button"
                  disabled={busy || !service.trim()}
                  onClick={() => setConfirming(true)}
                  className="mt-4 rounded-xl bg-kesri px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
                >
                  Give these people their places
                </button>
              ) : (
                <div className="mt-4 rounded-xl border border-kesri/50 bg-kesri/[0.07] p-4">
                  <p className="text-sm text-body">
                    This creates {preview.names.length} accounts and emails{" "}
                    {preview.names.length} people, several of them children. The emails
                    cannot be recalled.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(commitExternal, { winners, service }).then(() => {
                          setConfirming(false);
                          setPreview(null);
                          setWinners("");
                        })
                      }
                      className="rounded-xl bg-kesri px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-40"
                    >
                      {busy ? "Sending…" : "Yes — commit and email them"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="text-sm text-muted underline"
                    >
                      Not yet
                    </button>
                  </div>
                </div>
              )}
              {!service.trim() && (
                <p className="mt-2 text-xs text-amber-300">
                  Say which service ran the draw first.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-xl border border-emerald-400/50 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-rose-400/50 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
