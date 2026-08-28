/**
 * The brand assets found in public/brand/.
 *
 * Resolved at BUILD time by scripts/brand-manifest.mjs, not at render time.
 *
 * This used to scan the folder with node:fs on every render. That worked locally and
 * silently returned null on Cloudflare Workers — which has no filesystem — so the logo
 * disappeared from the deployed site with no error to notice. Detection still happens,
 * once, during the build; drop a sensibly-named file into public/brand/ and rebuild.
 */
import manifest from "./brand-manifest.json";

/** The full logo lockup. Used at larger sizes — footer, cards. */
export function findLogo(): string | null {
  return manifest.logo;
}

/**
 * A square, simplified mark for small sizes.
 *
 * Deliberately does NOT fall back to the full lockup: the nav renders at 22px, and a
 * wide lockup squeezed into a 22px square becomes an unreadable smudge. Better to keep
 * the clean placeholder mark than to render the real logo badly.
 */
export function findLogoMark(): string | null {
  return manifest.logoMark;
}

/** The 3D logo, as glTF. */
export function findLogo3D(): string | null {
  return manifest.logo3d;
}
