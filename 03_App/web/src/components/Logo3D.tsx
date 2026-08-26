"use client";

import { useEffect, useRef, useState } from "react";
import type { Logo3DHandle } from "./logo3d-scene";
import { Logo } from "./Logo";

/**
 * The animated 3D logo.
 *
 * Same protections as the trophy: Three.js loads only on capable devices, only at idle,
 * and the 2D mark renders underneath the whole time. If the model is missing, too heavy,
 * or the device is weak, the page still looks finished.
 */

interface NetworkInformation {
  saveData?: boolean;
}

function shouldRender3D(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: NetworkInformation;
  };
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) {
    return false;
  }
  try {
    if (!document.createElement("canvas").getContext("webgl2")) return false;
  } catch {
    return false;
  }
  return true;
}

export function Logo3D({
  url,
  fallbackSrc = null,
  size = 240,
  className = "",
}: {
  /** Path to the .glb. When null, only the 2D mark renders. */
  url: string | null;
  fallbackSrc?: string | null;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!url) return;
    if (!shouldRender3D()) return;

    let handle: Logo3DHandle | null = null;
    let cancelled = false;
    const isPhone = window.matchMedia("(max-width: 767px)").matches;

    const load = () => {
      import("./logo3d-scene")
        .then(({ createLogo3DScene }) => {
          if (cancelled || !canvasRef.current) return;
          return createLogo3DScene(canvasRef.current, url, {
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
          // Never silent in development: a broken model must not look identical to a
          // device that was correctly filtered out.
          if (process.env.NODE_ENV !== "production") {
            console.error("[Logo3D] failed to load", url, err);
          }
        });
    };

    const idle =
      window.requestIdleCallback?.(load, { timeout: 2500 }) ??
      window.setTimeout(load, 400);

    return () => {
      cancelled = true;
      if (typeof idle === "number") {
        window.cancelIdleCallback?.(idle);
        clearTimeout(idle);
      }
      handle?.destroy();
    };
  }, [url]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute inset-0 grid place-items-center transition-opacity duration-700 ${
          live ? "opacity-0" : "opacity-100"
        }`}
      >
        <Logo size={size * 0.6} src={fallbackSrc} />
      </div>

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
