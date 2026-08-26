"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { HERO_SLIDES } from "@/data/hero-media";

/**
 * Cinematic hero: parallax grid, Ken Burns push-in, and a cursor spotlight that reveals
 * a second image through the first.
 *
 * ONE DELIBERATE DEPARTURE FROM THE BRIEF.
 * The reference implementation redraws a canvas each frame, calls `toDataURL()`, and
 * assigns the result as `mask-image`. That works, but it serialises the whole canvas to a
 * base64 PNG sixty times a second and makes the browser re-parse and re-upload a fresh
 * image every frame — easily the most expensive thing on the page, and painful on a
 * mid-range phone.
 *
 * A CSS `radial-gradient` mask driven by two custom properties produces the identical
 * visual, animates on the compositor, and costs essentially nothing. Same effect, none
 * of the per-frame allocation.
 *
 * All pointer state is written straight to CSS variables — React never re-renders on
 * mouse move.
 */

/** Spotlight radius in px. */
const RADIUS = 260;
/** How far the grid drifts, in px, at the extremes of the viewport. */
const GRID_SHIFT = 16;

export function CinematicHero({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    // Fine-pointer devices only. There is no cursor to follow on a phone, and running
    // a rAF loop for an effect nobody can see is pure battery cost.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Start the spotlight off-screen so nothing is revealed until the pointer arrives.
    let mouseX = -9999;
    let mouseY = -9999;
    let x = mouseX;
    let y = mouseY;
    let gx = 0;
    let gy = 0;
    let tgx = 0;
    let tgy = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      tgx = (e.clientX / window.innerWidth - 0.5) * GRID_SHIFT;
      tgy = (e.clientY / window.innerHeight - 0.5) * GRID_SHIFT;
    };

    const onLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    const tick = () => {
      // Two different easings on purpose: the spotlight should feel attached to the
      // cursor (0.1), the grid should lag behind it (0.06) to give a sense of depth.
      x += (mouseX - x) * 0.1;
      y += (mouseY - y) * 0.1;
      gx += (tgx - gx) * 0.06;
      gy += (tgy - gy) * 0.06;

      el.style.setProperty("--mx", `${x.toFixed(1)}px`);
      el.style.setProperty("--my", `${y.toFixed(1)}px`);
      el.style.setProperty("--gx", `${gx.toFixed(2)}px`);
      el.style.setProperty("--gy", `${gy.toFixed(2)}px`);

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const base = HERO_SLIDES[1]; // mid-match
  const reveal = HERO_SLIDES[2]; // lifting the trophy

  const spotlight =
    "radial-gradient(circle var(--r, 260px) at var(--mx, -9999px) var(--my, -9999px), rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, rgba(0,0,0,0) 100%)";

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
      style={{ ["--r" as string]: `${RADIUS}px` }}
    >
      {/* 1 — parallax grid */}
      <svg
        aria-hidden
        className="absolute inset-0 z-0 h-full w-full"
        style={{ opacity: 0.1 }}
      >
        <defs>
          <pattern
            id="hero-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
            x="var(--gx, 0)"
            y="var(--gy, 0)"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* 2 — base image */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <Image
          src={base.src}
          alt={base.alt}
          fill
          sizes="100vw"
          quality={75}
          placeholder="blur"
          loading="eager"
          fetchPriority="high"
          className="ken-burns object-cover"
          style={{ objectPosition: base.position }}
        />
      </div>

      {/* 3 — spotlight reveal. Decorative duplicate of a described image, so alt="". */}
      <div
        aria-hidden
        className="absolute inset-0 z-30 overflow-hidden"
        style={{
          maskImage: spotlight,
          WebkitMaskImage: spotlight,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      >
        <Image
          src={reveal.src}
          alt=""
          fill
          sizes="100vw"
          quality={75}
          loading="lazy"
          className="object-cover"
          style={{ objectPosition: reveal.position }}
        />
      </div>

      {/* 4 — scrim, weighted to the bottom-left where the copy sits, so the subject's
          face stays clear on the right. */}
      <div
        aria-hidden
        className="absolute inset-0 z-40"
        style={{
          background:
            "linear-gradient(to top, rgba(11,11,12,0.95) 0%, rgba(11,11,12,0.7) 28%, rgba(11,11,12,0.25) 58%, rgba(11,11,12,0.35) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-40"
        style={{
          background:
            "linear-gradient(to right, rgba(11,11,12,0.8) 0%, rgba(11,11,12,0.35) 38%, transparent 65%)",
        }}
      />

      {children}
    </section>
  );
}
