"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Holographic 3D tilt wrapper — the FIFA Ultimate Team foil effect.
 *
 * Technique follows simeydotme/pokemon-cards-css: pointer (or device tilt) position is
 * written to CSS custom properties, and layered gradients with blend modes do the rest in
 * the compositor. No WebGL, no 3D library, ~2KB — which matters because this runs on
 * whatever phone a 14-year-old happens to own.
 *
 * Three inputs, in priority order:
 *   1. device orientation (phone tilt) once permission is granted
 *   2. touch drag
 *   3. mouse
 *
 * Honours prefers-reduced-motion by rendering completely flat — the card must still look
 * finished with every effect off, because for some people that's the only version.
 */

const MAX_TILT = 14; // degrees. Beyond ~16 it stops reading as a card and starts as a gimmick.

export function HoloCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  /** Write through a rAF so a fast pointer can't queue up more style writes than frames. */
  const apply = useCallback((rx: number, ry: number, mx: number, my: number) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--mx", `${mx.toFixed(1)}%`);
      el.style.setProperty("--my", `${my.toFixed(1)}%`);
    });
  }, []);

  const fromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      // Tilt toward the pointer: moving right lifts the left edge.
      apply(
        (0.5 - py) * MAX_TILT * 2,
        (px - 0.5) * MAX_TILT * 2,
        px * 100,
        py * 100,
      );
    },
    [apply],
  );

  const reset = useCallback(() => {
    setActive(false);
    apply(0, 0, 50, 50);
  }, [apply]);

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      className={`holo-scene ${className}`}
      onMouseEnter={() => setActive(true)}
      onMouseMove={(e) => fromPoint(e.clientX, e.clientY)}
      onMouseLeave={reset}
      onTouchStart={() => setActive(true)}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) fromPoint(t.clientX, t.clientY);
      }}
      onTouchEnd={reset}
    >
      <div ref={ref} className={`holo-card ${active ? "is-active" : ""}`}>
        {children}
        {/* Glare — a soft highlight that follows the pointer. */}
        <div className="holo-glare" aria-hidden />
        {/* Foil — the iridescent sweep, in color-dodge so it reads as light not paint. */}
        <div className="holo-foil" aria-hidden />
      </div>
    </div>
  );
}

/**
 * Opt-in device-tilt control.
 *
 * iOS requires a user gesture before it will hand over motion data, so this cannot be
 * automatic — hence a button. Android grants it without asking, so the button
 * self-hides there once enabled.
 */
export function TiltToggle() {
  // Support is checked on CLICK, not during render. Reading `window` in a render or a
  // lazy initialiser makes the server and client disagree about what to draw, which is a
  // hydration error — the server has no `window`, so it would always render the
  // unsupported branch while the client rendered the button.
  const [state, setState] = useState<"idle" | "on" | "denied" | "unsupported">(
    "idle",
  );

  useEffect(() => {
    if (state !== "on") return;

    const handler = (e: DeviceOrientationEvent) => {
      // gamma: left/right tilt, beta: front/back. Clamped so the card can't flip over.
      const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
      const ry = clamp(e.gamma ?? 0, MAX_TILT * 2);
      const rx = clamp(((e.beta ?? 0) - 45) * 0.6, MAX_TILT * 2);

      for (const el of document.querySelectorAll<HTMLElement>(".holo-card")) {
        el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-rx).toFixed(2)}deg`);
        el.style.setProperty("--mx", `${50 + (ry / (MAX_TILT * 2)) * 50}%`);
        el.style.setProperty("--my", `${50 + (rx / (MAX_TILT * 2)) * 50}%`);
        el.classList.add("is-active");
      }
    };

    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [state]);

  if (state === "unsupported") return null;

  if (state === "on") {
    return (
      <p className="text-xs text-muted">Tilt your phone to catch the light.</p>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-xs text-muted">
        Motion access was turned down — drag the card with your finger instead.
      </p>
    );
  }

  return (
    <button
      onClick={async () => {
        if (!("DeviceOrientationEvent" in window)) {
          setState("unsupported");
          return;
        }
        type MotionCtor = {
          requestPermission?: () => Promise<PermissionState | "granted" | "denied">;
        };
        const ctor = window.DeviceOrientationEvent as unknown as MotionCtor;
        // iOS 13+ gates motion behind an explicit prompt; elsewhere it just works.
        if (typeof ctor?.requestPermission === "function") {
          try {
            const res = await ctor.requestPermission();
            setState(res === "granted" ? "on" : "denied");
          } catch {
            setState("denied");
          }
        } else {
          setState("on");
        }
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-kesri hover:text-kesri"
    >
      Tilt to shine
    </button>
  );
}
