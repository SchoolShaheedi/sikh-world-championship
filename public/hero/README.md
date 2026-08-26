# Hero images

The hero runs a **three-beat sequence**: turn up → compete → win.

    cod1.png    standing, arms folded
    fifa2.png   mid-match, controller in hand
    fifa3.png   lifting the trophy

These are wired up explicitly in `src/data/hero-media.ts`, where each one has its own
alt text and its own crop anchor (the three source files are square, 3:2 and 5:4, and all
get cropped to the same wide frame, so each needs a different anchor or heads get cut off).

## To swap or add an image

1. Put the file in this folder.
2. Add or edit its entry in `src/data/hero-media.ts` — `src`, `alt`, and `position`.

`position` is a CSS `object-position`, e.g. `"50% 30%"`. Lower the second number to show
more of the top of the frame.

## Notes on the current files

They're 1.8–2MB PNGs. That's fine — **nobody downloads them at that size.** Next's image
optimiser resizes them and converts to WebP/AVIF per device, and only the first slide
loads eagerly; the other two load lazily and join the rotation once ready.

If you replace them, there's no need to compress first. Do keep the subject away from the
extreme edges, since the frame crops hard on narrow phones.

## Accessibility

The sequence stops entirely under `prefers-reduced-motion` — slide one just stays put.
Only the visible slide is described to screen readers.
