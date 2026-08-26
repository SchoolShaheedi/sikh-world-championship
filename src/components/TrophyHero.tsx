"use client";

import { useEffect, useRef, useState } from "react";
import type { TrophyHandle } from "./trophy-scene";

/**
 * The 3D trophy in the homepage hero.
 *
 * Three.js is ~170KB gzipped, and the audience for this site is teenagers on whatever
 * phone they own, at an all-day event where battery matters. So:
 *   - the SVG below renders first and always; the 3D is an upgrade, never a requirement
 *   - Three.js is dynamically imported, so it never blocks first paint
 *   - weak devices, reduced-motion users and data-saver users keep the SVG
 *   - the render loop pauses off-screen and in background tabs (see trophy-scene.ts)
 *
 * If the 3D fails for any reason, the page looks finished anyway. That's the whole design.
 */

interface NetworkInformation {
  saveData?: boolean;
}

/**
 * Is this device worth handing a WebGL context to?
 * Deliberately conservative — a static trophy is a fine outcome, a crashed tab is not.
 */
function shouldRender3D(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: NetworkInformation;
  };

  if (nav.connection?.saveData) return false;
  // deviceMemory is Chromium-only; when it's missing we don't hold that against the device.
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) {
    return false;
  }

  try {
    const c = document.createElement("canvas");
    if (!c.getContext("webgl2")) return false;
  } catch {
    return false;
  }

  return true;
}

export function TrophyHero({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!shouldRender3D()) return;

    let handle: TrophyHandle | null = null;
    let cancelled = false;

    const isPhone = window.matchMedia("(max-width: 767px)").matches;

    // Idle-time load: the trophy is decoration, so it waits until the browser has
    // nothing more important to do.
    const idle =
      window.requestIdleCallback?.(load, { timeout: 2500 }) ??
      window.setTimeout(load, 400);

    function load() {
      import("./trophy-scene")
        .then(({ createTrophyScene }) => {
          if (cancelled || !canvasRef.current) return;
          return createTrophyScene(canvasRef.current, {
            // Capping DPR is the single biggest performance lever on mobile —
            // a 3x device would otherwise render 9x the pixels.
            dpr: Math.min(window.devicePixelRatio || 1, isPhone ? 1.5 : 2),
            antialias: !isPhone,
          });
        })
        .then((h) => {
          if (cancelled) {
            h?.destroy();
            return;
          }
          if (h) {
            handle = h;
            setLive(true);
          }
        })
        .catch((err) => {
          // The SVG is already on screen, so the page is fine either way — but never
          // swallow this silently in development, or a broken scene looks identical to
          // a device that was correctly filtered out.
          if (process.env.NODE_ENV !== "production") {
            console.error("[TrophyHero] 3D scene failed to start:", err);
          }
        });
    }

    return () => {
      cancelled = true;
      if (typeof idle === "number") {
        window.cancelIdleCallback?.(idle);
        clearTimeout(idle);
      }
      handle?.destroy();
    };
  }, []);

  return (
    <div className={`relative aspect-square w-full ${className}`}>
      {/* Glow behind the trophy, in both modes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[12%] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--swc-kesri), transparent 70%)" }}
      />

      <StaticTrophy
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          live ? "opacity-0" : "opacity-100"
        }`}
      />

      <canvas
        ref={canvasRef}
        aria-hidden
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          live ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/**
 * The fallback, and the first thing every visitor sees.
 * Held to the same standard as the 3D version — for a lot of people it IS the version.
 */
function StaticTrophy({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Championship trophy"
      className={className}
    >
      <defs>
        <linearGradient id="tr-gold" x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#F6DF9A" />
          <stop offset="45%" stopColor="#D8B45A" />
          <stop offset="100%" stopColor="#8A6A22" />
        </linearGradient>
        <linearGradient id="tr-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Handles */}
      <path
        d="M62 62H44a26 26 0 0 0 26 34M138 62h18a26 26 0 0 1-26 34"
        fill="none"
        stroke="url(#tr-gold)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Cup */}
      <path d="M60 48h80v34c0 24-18 42-40 42S60 106 60 82V48Z" fill="url(#tr-gold)" />
      <path d="M60 48h80v10H60z" fill="#F6DF9A" opacity="0.55" />
      {/* Specular sweep */}
      <path d="M78 52h12v66h-12z" fill="url(#tr-shine)" opacity="0.5" />
      {/* Stem + base */}
      <rect x="92" y="124" width="16" height="22" fill="url(#tr-gold)" />
      <path d="M74 146h52l6 12H68l6-12Z" fill="url(#tr-gold)" />
      <rect x="62" y="158" width="76" height="12" rx="3" fill="url(#tr-gold)" />
      <rect x="56" y="170" width="88" height="10" rx="3" fill="#16203A" />
    </svg>
  );
}
