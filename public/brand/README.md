# Brand assets

## What's here now

| File | What it is | Used for |
|---|---|---|
| `swc-logo-texture.png` | Full lockup, 1536×1024 (original, kept as master) | Footer lockup |
| `swc-logo-texture.jpg` | Same artwork, 1024px JPEG (137KB) | Texture inside the GLB |
| `logo-mark.png` | Emblem only — arch + SWC + Nishan Sahib, cropped from the master | Header/nav |
| `swc-logo-3d.glb` | 3D model, 144KB | Animated logo in the CTA closer |
| `create_swc_glb.py` | Builds the GLB from the texture | Re-run after changing the texture |

## Compression

The GLB was **1.6MB and is now 144KB** — an 11x reduction with no visible difference at
logo scale. Nearly all the weight was an embedded full-size PNG. The fix: re-encode the
texture as a 1024px JPEG and point the build script at it.

JPEG rather than PNG because the artwork is photographic (gradients, glow, bevels) and
has no transparency. glTF supports `image/jpeg` natively, so no extension is needed.

**If you update the artwork**, redo both steps:

```bash
sips -s format jpeg -s formatOptions 82 -Z 1024 swc-logo-texture.png --out swc-logo-texture.jpg
python3 create_swc_glb.py
```

## Notes on the current artwork

- **It's a stacked lockup, not a square mark.** That's why the header uses a cropped
  emblem (`logo-mark.png`) rather than the whole thing — a 3:2 lockup at 40px tall would
  make the wordmark illegible.
- **The background is baked in**, not transparent. It sits fine on the site's near-black
  ground; it would not work on a light surface, print, or a white social avatar.
  **A transparent-background version is the single most useful thing to add next.**
- **The wordmark reads "CHAMPIONSHIPS" (plural)**; the site, the docs and the intended
  domain all use the singular. Worth settling.

## Still worth supplying

- A **transparent PNG or SVG** of the lockup and of the emblem alone
- A **light-background variant**, for print and anywhere that isn't dark
- A **square social avatar** crop (Instagram, YouTube)
