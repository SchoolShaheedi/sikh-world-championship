"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  scanPass,
  checkInManually,
  undoOne,
  markDobSeen,
  refreshRoster,
  type DeskResponse,
} from "@/app/admin/checkin/actions";
import type { RosterEntry, CheckInResult } from "@/lib/check-in";
import { ID_ACCEPTED, ID_NO_DOCUMENT_RULE } from "@/data/id-check";

/**
 * The arrival desk, as one screen.
 *
 * WRITTEN FOR THE SITUATION, which is a volunteer standing up, in a noisy hall, with a
 * queue, holding a laptop or a phone. Everything below follows from that:
 *
 *   1. THE CAMERA IS NEVER THE ONLY WAY IN. The manual list is on the same page, always
 *      visible, never behind a tab. A camera that will not start, a slip that will not
 *      scan and somebody who left their slip at home are three routine events, not edge
 *      cases, and a page that has to be navigated at that moment is a page that gets
 *      abandoned for a paper list.
 *   2. THE RESULT IS ENORMOUS AND COLOURED. It is read from arm's length, at an angle, by
 *      somebody who is also talking to a parent. Green, amber, red — and a sentence, because
 *      colour alone is no good to whoever is colourblind and no good in a photograph of the
 *      screen either.
 *   3. IT MAKES A NOISE. A short beep on a good scan and a lower one on anything else. The
 *      volunteer is looking at the person, not the screen, and this is what lets them stay
 *      that way.
 *   4. THE SAME CODE TWICE IS IGNORED FOR A FEW SECONDS. The decode loop runs ten times a
 *      second and a slip is held up for two, so without this one arrival fires twenty
 *      writes and the screen flickers through twenty identical answers.
 *   5. THE DATE-OF-BIRTH CHECK NEVER BLOCKS THE DOOR. Everyone must bring something showing
 *      their date of birth (src/data/id-check.ts, decided 2026-09-03), and some will not.
 *      So the scan checks them in regardless and the ID prompt appears next to the result as
 *      a separate one-tap step. Who is in the building is a safeguarding fact and has to be
 *      right even while the ID question is unresolved; a desk that refuses to admit somebody
 *      standing in the hall produces a register that is simply wrong. Unchecked rows get
 *      their own filter so the lead can work through them, which is what
 *      `ID_NO_DOCUMENT_RULE` asks for.
 *   6. THE COUNT COMES FROM THE SERVER, EVERY TIME. Each action returns the whole list, so
 *      "31 of 64 arrived" is a fact and not this tab's opinion — which matters the moment
 *      two volunteers are working two devices.
 */

type Filter = "all" | "waiting" | "arrived" | "no-id";

/** What the big card says, and what colour it is. */
function describe(r: CheckInResult): {
  tone: "good" | "warn" | "bad" | "neutral";
  heading: string;
  detail: string;
  name?: string;
} {
  switch (r.kind) {
    case "checked-in":
      return { tone: "good", heading: "Checked in", detail: "Send them through.", name: r.entry.publicName };
    case "already":
      return {
        tone: "warn",
        heading: "Already checked in",
        // The time is the whole message. A minute ago is a double scan and means nothing;
        // half an hour ago means this slip has been used by somebody else.
        detail: r.entry.checkedInAt
          ? `Marked present at ${new Date(r.entry.checkedInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. If that was not them, find a steward.`
          : "Marked present already.",
        name: r.entry.publicName,
      };
    case "not-eligible":
      return {
        tone: "bad",
        heading: "Not on the list for today",
        detail: `This entry is “${r.entry.status}”. Do not send them through — find a steward.`,
        name: r.entry.publicName,
      };
    case "wrong-event":
      return {
        tone: "bad",
        heading: "Pass for another event",
        detail: `That is a valid pass for ${r.eventSlug}, not today.`,
      };
    case "not-a-pass":
      return {
        tone: "neutral",
        heading: "Not one of our passes",
        detail: "That is some other QR code. Try again with the slip from the table.",
      };
    case "unknown":
      return {
        tone: "bad",
        heading: "Pass not recognised",
        detail: "It is one of ours but it is not on today's list. Find a steward.",
      };
  }
}

const TONE: Record<string, string> = {
  good: "border-emerald-400/70 bg-emerald-500/15 text-emerald-200",
  warn: "border-amber-400/70 bg-amber-500/15 text-amber-200",
  bad: "border-rose-400/70 bg-rose-500/15 text-rose-200",
  neutral: "border-line bg-ink/40 text-muted",
};

/** A short tone. Two notes, no assets, no autoplay policy to fight — the camera start is
 *  the user gesture that unlocks it. */
function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = ok ? 880 : 300;
    gain.gain.value = 0.14;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.28));
    osc.onended = () => ctx.close();
  } catch {
    // A desk without sound is a desk that works. Never let this break a check-in.
  }
}

export function CheckInDesk({
  slug,
  eventTitle,
  capacity,
  initialRoster,
}: {
  slug: string;
  eventTitle: string;
  capacity: number;
  initialRoster: RosterEntry[];
}) {
  const [roster, setRoster] = useState(initialRoster);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("waiting");
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  /** Guards against the decode loop firing the same arrival twenty times (rule 4). */
  const lastScan = useRef<{ raw: string; at: number }>({ raw: "", at: 0 });
  const inFlight = useRef(false);

  const arrived = roster.filter((r) => r.status === "checked-in").length;
  const dobChecked = roster.filter((r) => r.dobVerifiedAt).length;
  /** Arrived, but nobody has confirmed a date of birth. The list the lead works through. */
  const arrivedNoId = roster.filter(
    (r) => r.status === "checked-in" && !r.dobVerifiedAt,
  ).length;

  const absorb = useCallback((r: DeskResponse) => {
    setRoster(r.roster);
    setError(r.error ?? null);
    setResult(r.result);
    if (r.result) beep(r.result.kind === "checked-in");
    else if (r.error) beep(false);
  }, []);

  /** One arrival, from a decoded code. */
  const submitScan = useCallback(
    async (raw: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        absorb(await scanPass(slug, raw));
      } catch {
        setError("That did not reach the server. Check the wifi, then use the list below.");
      } finally {
        inFlight.current = false;
      }
    },
    [slug, absorb],
  );

  /**
   * The camera.
   *
   * jsQR is imported here rather than at the top of the file so the 40kB decoder is
   * fetched when somebody actually starts the camera — a moderator opening /admin on their
   * phone in September should not pay for it.
   */
  useEffect(() => {
    if (!scanning) return;
    let live = true;
    let stream: MediaStream | null = null;
    let timer: number | null = null;

    (async () => {
      try {
        const { default: jsQR } = await import("jsqr");
        stream = await navigator.mediaDevices.getUserMedia({
          // The back camera on a phone; ignored by a laptop, which has only one.
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!live) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("no canvas");

        const tick = () => {
          if (!live) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const found = jsQR(image.data, image.width, image.height, {
              inversionAttempts: "dontInvert",
            });
            if (found?.data) {
              const now = Date.now();
              const same = found.data === lastScan.current.raw;
              if (!same || now - lastScan.current.at > 4000) {
                lastScan.current = { raw: found.data, at: now };
                void submitScan(found.data);
              } else {
                lastScan.current.at = now;
              }
            }
          }
          // Ten decodes a second. Every frame is wasted work: a slip is in front of the
          // lens for a second or two, and this laptop may also be driving the big screen.
          timer = window.setTimeout(tick, 100);
        };
        tick();
      } catch (e) {
        if (!live) return;
        const name = e instanceof Error ? e.name : "";
        setCameraError(
          name === "NotAllowedError"
            ? "The browser blocked the camera. Allow it in the address bar, or use the list below."
            : name === "NotFoundError"
              ? "No camera on this device. Use the list below."
              : "The camera would not start. Use the list below — it does exactly the same thing.",
        );
        setScanning(false);
      }
    })();

    return () => {
      live = false;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, submitScan]);

  async function run(fn: () => Promise<DeskResponse>) {
    setBusy(true);
    try {
      absorb(await fn());
    } catch {
      setError("That did not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const q = query.trim().toLowerCase();
  const visible = roster.filter((r) => {
    if (filter === "waiting" && r.status === "checked-in") return false;
    if (filter === "arrived" && r.status !== "checked-in") return false;
    if (filter === "no-id" && (r.status !== "checked-in" || r.dobVerifiedAt)) return false;
    if (!q) return true;
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.publicName.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q.replace(/\s/g, ""))
    );
  });

  const card = result ? describe(result) : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Arrivals</h1>
          <p className="mt-1 text-muted">{eventTitle}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-kesri">
            {arrived}
            <span className="text-lg text-muted"> of {roster.length} arrived</span>
          </p>
          <p className="text-sm text-muted">
            {dobChecked} date{dobChecked === 1 ? "" : "s"} of birth checked
            {arrivedNoId > 0 && (
              <span className="text-amber-300"> · {arrivedNoId} here without one</span>
            )}
          </p>
          {roster.length !== capacity && (
            <p className="text-xs text-muted">
              {capacity} places · {roster.length} with a place
            </p>
          )}
        </div>
      </div>

      {/* THE RESULT. Above the camera, not below it: the volunteer's eyes come up from the
          slip to the person, and this is what has to be in the way. */}
      <div
        aria-live="assertive"
        className={`mt-6 rounded-3xl border-2 p-6 transition-colors ${
          card ? TONE[card.tone] : "border-line bg-ink/30 text-muted"
        }`}
      >
        {error ? (
          <>
            <p className="font-display text-2xl text-rose-200">Something went wrong</p>
            <p className="mt-1 text-sm text-rose-200/80">{error}</p>
          </>
        ) : card ? (
          <>
            {card.name && <p className="font-display text-4xl leading-tight">{card.name}</p>}
            <p className="font-display mt-1 text-2xl">{card.heading}</p>
            <p className="mt-1 text-sm opacity-80">{card.detail}</p>
            {result && "entry" in result && result.entry.under18 && result.entry.leaving && (
              <p className="mt-3 inline-block rounded-lg border border-current/40 px-3 py-1.5 text-sm">
                Under 18 · {result.entry.leaving}
              </p>
            )}

            {/* THE ID STEP, next to the result rather than in front of it (rule 5).
                They are already checked in by the time this appears — this only records
                that a date of birth was seen, and the person with no document still gets
                through the door. */}
            {result?.kind === "checked-in" &&
              (result.entry.dobVerifiedAt ? (
                <p className="mt-4 text-sm">✓ Date of birth checked</p>
              ) : (
                <div className="mt-4 rounded-2xl border border-current/40 bg-ink/30 p-4">
                  <p className="font-display text-lg">Now check their date of birth</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => markDobSeen(slug, result.entry.reference, true))}
                    className="mt-2 rounded-xl bg-kesri px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
                  >
                    I have seen their date of birth
                  </button>
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer opacity-80">
                      They have not got anything
                    </summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-left opacity-80">
                      {ID_NO_DOCUMENT_RULE.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              ))}
          </>
        ) : (
          <p className="font-display text-2xl">Ready</p>
        )}
      </div>

      {/* THE CAMERA. Off until asked: a page that grabs the camera on load gets its
          permission prompt dismissed by whoever opened it to look at something else, and
          then the camera is blocked for the day. */}
      <section className="mt-6">
        {!scanning ? (
          <button
            type="button"
            onClick={() => {
              setCameraError(null);
              setScanning(true);
            }}
            className="rounded-xl bg-kesri px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft"
          >
            Start the camera
          </button>
        ) : (
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-line bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="mx-auto block max-h-[42vh] w-full object-contain"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-kesri/70"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setScanning(false)}
                className="rounded-xl border border-line px-4 py-2 text-sm text-muted hover:text-body"
              >
                Stop the camera
              </button>
              <p className="text-sm text-muted">
                Hold the slip inside the box. It reads itself — there is nothing to press.
              </p>
            </div>
          </div>
        )}

        {cameraError && (
          <p className="mt-3 rounded-xl border border-amber-400/50 bg-amber-500/10 p-4 text-sm text-amber-200">
            {cameraError}
          </p>
        )}
      </section>

      {/* THE LIST. Not a fallback bolted on — the same operation, recorded identically, and
          the only route that works for somebody whose slip is at home. */}
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">By name</h2>
          <p className="text-sm text-muted">
            Works for a slip that will not scan, and for anyone who never got one.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or reference"
            aria-label="Search by name or reference"
            className="min-w-[16rem] flex-1 rounded-xl border border-line bg-ink/40 px-4 py-3 text-body placeholder:text-muted/70 focus:border-kesri focus:outline-none"
          />
          <div className="flex gap-1 rounded-xl border border-line p-1">
            {(
              [
                ["waiting", `Still to arrive (${roster.length - arrived})`],
                ["arrived", `Arrived (${arrived})`],
                ["no-id", `No date of birth (${arrivedNoId})`],
                ["all", "Everyone"],
              ] as [Filter, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  filter === id ? "bg-kesri font-semibold text-ink" : "text-muted hover:text-body"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-4 divide-y divide-line/60 rounded-2xl border border-line">
          {visible.length === 0 && (
            <li className="p-5 text-sm text-muted">
              {q ? `Nobody matching “${query}”.` : "Nobody in this list."}
            </li>
          )}
          {visible.map((r) => (
            <li key={r.reference} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-[12rem] flex-1">
                <p className="font-semibold text-body">
                  {r.fullName}
                  {r.under18 && (
                    <span className="ml-2 rounded bg-kesri/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-kesri uppercase">
                      U18
                    </span>
                  )}
                </p>
                <p className="font-mono text-xs text-muted">{r.reference}</p>
                {r.leaving && <p className="text-xs text-muted">{r.leaving}</p>}
              </div>

              {/* The date-of-birth step, per row, so it can be done before somebody is
                  scanned in as well as after — a parent usually has the passport out
                  while the volunteer is still finding the slip. */}
              {r.dobVerifiedAt ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => markDobSeen(slug, r.reference, false))}
                  title="Recorded in error? This clears it."
                  className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs text-emerald-300 disabled:opacity-40"
                >
                  ✓ DOB
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => markDobSeen(slug, r.reference, true))}
                  className="rounded-lg border border-amber-400/50 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                >
                  DOB seen
                </button>
              )}

              {r.status === "checked-in" ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-emerald-300">
                    In
                    {r.checkedInAt &&
                      ` · ${new Date(r.checkedInAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => undoOne(slug, r.reference))}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-body disabled:opacity-40"
                  >
                    Undo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => checkInManually(slug, r.reference))}
                  className="rounded-lg bg-kesri px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-kesrisoft disabled:opacity-40"
                >
                  Check in
                </button>
              )}
            </li>
          ))}
        </ul>

        <details className="mt-6 rounded-2xl border border-line p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-body">
            What counts as proof of date of birth
          </summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            {ID_ACCEPTED.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-3 text-muted">
            <span className="text-body">A photo of any of these on a phone is fine.</span>{" "}
            Look at it, hand it straight back, and record nothing from it — we keep only
            that a date of birth was seen.
          </p>

          {/* The rule for somebody with nothing, HERE as well as on the result card.
              The card only exists after a scan, and the volunteer who needs this is often
              talking to a parent before the slip has even been found. */}
          <p className="mt-4 font-semibold text-body">If they have not got anything</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {ID_NO_DOCUMENT_RULE.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => refreshRoster(slug))}
          className="mt-4 text-sm text-muted underline hover:text-body disabled:opacity-40"
        >
          Refresh the list
        </button>
        <p className="mt-1 text-xs text-muted">
          Only needed if somebody else is checking people in on another device.
        </p>
      </section>
    </div>
  );
}
