# Avatar artwork

Drop your avatar images in this folder, then set the `image` field for the matching entry
in `src/data/avatars.ts` to the filename. Example:

    { id: "kesri-1", label: "Kesri Dastaar", ..., image: "kesri-1.png" },

Until `image` is set, the site draws a placeholder avatar in code, so nothing breaks
while the artwork is in progress. You can add them one at a time.

## Export settings

- **Format:** PNG with transparency, or WebP. SVG also works if your artwork is vector.
- **Size:** 512×512px. They display at up to 132px, so 512 covers retina screens and
  print with room to spare.
- **Shape:** square canvas, subject centred, head near the top. The card crops to a
  circle, so keep important detail away from the corners.
- **Background:** transparent. The card supplies its own background colour, and a white
  box behind every avatar would look wrong on the bronze/silver/gold cards.
- **Weight:** aim under 150KB each. Sixteen of these load on the sign-up page at once.

## Worth covering in the set

The current placeholder list is 8 dastaar and 8 patka. When you make the real artwork,
consider adding:

- **Chunni / dupatta options.** As it stands there is nothing in the set that a girl
  would pick, and roughly half your potential players are girls. This is the biggest gap.
- **A range of skin tones** — the diaspora is not one colour.
- **Beard variety** — full, short, and none, so a 12-year-old and a 40-year-old both
  find themselves.

If you add entries beyond the current 16, add them to the `AVATARS` array with new ids.
Nothing else needs changing.
