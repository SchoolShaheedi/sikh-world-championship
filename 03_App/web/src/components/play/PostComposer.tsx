"use client";

import { useState } from "react";
import { GAMES, PLATFORMS, WINDOWS, INTENSITY, PRESET_NOTES } from "@/lib/play-types";
import { postToBoard } from "@/app/play/actions";
import { copy } from "@/copy";

const field =
  "mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-body focus:border-kesri focus:outline-none";

export function PostComposer({ hasPost }: { hasPost: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-kesri/50 bg-kesri/[0.06] px-6 py-5 text-left transition-colors hover:bg-kesri/10"
      >
        <p className="font-display text-lg text-kesri">
          {hasPost
            ? copy.play.composerOpenUpdate
            : copy.play.composerOpenNew}
        </p>
        <p className="mt-1 text-sm text-muted">
          {copy.play.composerOpenHint}
        </p>
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        const res = await postToBoard(fd);
        if (res && "error" in res && res.error) setError(res.error);
        else {
          setError(null);
          setOpen(false);
        }
      }}
      className="rounded-2xl border border-line bg-surface/70 p-6"
    >
      <h2 className="font-display text-lg text-kesri">
        {copy.play.composerTitle}
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-body">
            {copy.play.composerGame}
          </span>
          <select name="game" className={field} defaultValue={GAMES[0]}>
            {GAMES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-body">
            {copy.play.composerPlatform}
          </span>
          <select name="platform" className={field} defaultValue={PLATFORMS[0]}>
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-body">
          {copy.play.composerWindowsLegend}
        </legend>
        <p className="mt-1 text-xs text-muted">
          {copy.play.composerWindowsHint}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WINDOWS.map((w) => (
            <label
              key={w}
              className="cursor-pointer rounded-full border border-line px-3 py-2 text-sm text-body has-checked:border-kesri has-checked:bg-kesri/15 has-checked:text-kesri"
            >
              <input type="checkbox" name="windows" value={w} className="sr-only" />
              {w}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-body">
            {copy.play.composerIntensity}
          </span>
          <select name="intensity" className={field} defaultValue={INTENSITY[2]}>
            {INTENSITY.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-body">
            {copy.play.composerNote}
          </span>
          <select name="note" className={field} defaultValue={PRESET_NOTES[5]}>
            {PRESET_NOTES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <span className="mt-1.5 block text-xs text-muted">
            {copy.play.composerNoteHint}
          </span>
        </label>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-kesri/40 bg-kesri/10 p-3 text-sm text-kesrisoft">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          className="rounded-xl bg-kesri px-6 py-3 font-bold text-ink hover:bg-kesrisoft"
        >
          {hasPost
            ? copy.play.composerSubmitUpdate
            : copy.play.composerSubmitNew}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-line px-6 py-3 font-semibold text-body"
        >
          {copy.play.composerCancel}
        </button>
      </div>
    </form>
  );
}
