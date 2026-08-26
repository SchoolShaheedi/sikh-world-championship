import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Finds the brand assets in public/brand/.
 *
 * SERVER ONLY — read at build time (per-request in dev). Until a file exists the site
 * falls back to the placeholder mark, so nothing is broken mid-design.
 *
 * Detection prefers the conventional names but falls back to scanning the folder, so a
 * sensibly-named file works without anyone having to remember an exact filename.
 */

const DIR = () => path.join(process.cwd(), "public", "brand");

function firstExisting(names: string[]): string | null {
  for (const f of names) {
    if (existsSync(path.join(DIR(), f))) return `/brand/${f}`;
  }
  return null;
}

function scan(exts: string[], mustInclude?: string): string | null {
  try {
    const file = readdirSync(DIR())
      .filter((f) => exts.includes(path.extname(f).toLowerCase()))
      .filter((f) => (mustInclude ? f.toLowerCase().includes(mustInclude) : true))
      .sort()[0];
    return file ? `/brand/${file}` : null;
  } catch {
    return null;
  }
}

/** The full logo lockup. Used at larger sizes — footer, cards. */
export function findLogo(): string | null {
  return (
    firstExisting(["logo.svg", "logo.png", "logo.webp"]) ??
    scan([".svg", ".png", ".webp"], "logo")
  );
}

/**
 * A square, simplified mark for small sizes.
 *
 * Deliberately does NOT fall back to the full lockup: the nav renders at 22px, and a
 * wide lockup squeezed into a 22px square becomes an unreadable smudge. Better to keep
 * the clean placeholder mark than to render the real logo badly.
 */
export function findLogoMark(): string | null {
  return firstExisting(["logo-mark.svg", "logo-mark.png", "logo-mark.webp"]);
}

/** The 3D logo, as glTF. */
export function findLogo3D(): string | null {
  return firstExisting(["logo-3d.glb", "logo-3d.gltf"]) ?? scan([".glb", ".gltf"]);
}
