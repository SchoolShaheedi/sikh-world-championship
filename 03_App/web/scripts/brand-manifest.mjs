/**
 * Resolve public/brand/ into a manifest, at build time.
 *
 * brand-assets.ts used to scan the folder with node:fs on every render. That worked
 * locally and silently returned null on Cloudflare Workers, so the logo vanished from the
 * deployed site — no error, just no logo. Workers has no filesystem to scan.
 *
 * Detection still happens, so dropping a sensibly-named file into public/brand/ still
 * works with nobody remembering an exact filename. It just happens once, at build, and
 * the result is bundled.
 */
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "brand");
const files = existsSync(DIR) ? readdirSync(DIR) : [];

const has = (name) => (files.includes(name) ? `/brand/${name}` : null);

const firstExisting = (names) => names.map(has).find(Boolean) ?? null;

const scan = (exts, mustInclude) => {
  const f = files
    .filter((n) => exts.includes(path.extname(n).toLowerCase()))
    .filter((n) => (mustInclude ? n.toLowerCase().includes(mustInclude) : true))
    .sort()[0];
  return f ? `/brand/${f}` : null;
};

const manifest = {
  logo:
    firstExisting(["logo.svg", "logo.png", "logo.webp"]) ??
    scan([".svg", ".png", ".webp"], "logo"),
  // Deliberately no fallback to the full lockup: the nav renders at 22px, and a wide
  // lockup squeezed into a 22px square is an unreadable smudge.
  logoMark: firstExisting(["logo-mark.svg", "logo-mark.png", "logo-mark.webp"]),
  logo3d: firstExisting(["logo-3d.glb", "logo-3d.gltf"]) ?? scan([".glb", ".gltf"]),
};

const out = path.join(process.cwd(), "src", "lib", "brand-manifest.json");
writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log("brand manifest:", manifest);
