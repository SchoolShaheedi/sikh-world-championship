/**
 * Player card avatars.
 *
 * IMAGE-FIRST. Each entry can point at an image file in `public/avatars/`. When `image`
 * is set, the card renders that image; when it's null, it falls back to the procedural
 * SVG in components/Avatar.tsx so the site always works.
 *
 * TO ADD YOUR ARTWORK: drop the files into `public/avatars/` and set `image` to the
 * filename. Nothing else changes — ids stay stable, so nobody's saved choice breaks.
 * See public/avatars/README.md for the size and format to export at.
 *
 * Photos remain OPTIONAL for players. The default is an avatar: it removes photo-consent
 * friction for under-18 sign-ups and includes families who'd rather their child's face
 * wasn't online.
 */

export interface AvatarDef {
  id: string;
  label: string;
  headwear: "dastaar" | "patka";
  /** Turban / patka colour — used by the SVG fallback. */
  cloth: string;
  /** Shirt colour behind the portrait. */
  kit: string;
  skin: string;
  beard: boolean;
  /** Filename in public/avatars/. Null = use the drawn fallback. */
  image: string | null;
}

export const AVATARS: AvatarDef[] = [
  { id: "kesri-1",  label: "Kesri Dastaar",   headwear: "dastaar", cloth: "#F2842B", kit: "#0F2A4A", skin: "#C68642", beard: true,  image: null },
  { id: "navy-1",   label: "Navy Dastaar",    headwear: "dastaar", cloth: "#123A6B", kit: "#F2842B", skin: "#8D5524", beard: true,  image: null },
  { id: "white-1",  label: "White Dastaar",   headwear: "dastaar", cloth: "#EFEBE2", kit: "#123A6B", skin: "#E0AC69", beard: true,  image: null },
  { id: "royal-1",  label: "Royal Blue",      headwear: "dastaar", cloth: "#1D5FD0", kit: "#EFEBE2", skin: "#C68642", beard: false, image: null },
  { id: "maroon-1", label: "Maroon Dastaar",  headwear: "dastaar", cloth: "#7B1E3A", kit: "#D8B45A", skin: "#8D5524", beard: true,  image: null },
  { id: "black-1",  label: "Black Dastaar",   headwear: "dastaar", cloth: "#1A1A20", kit: "#F2842B", skin: "#E0AC69", beard: true,  image: null },
  { id: "gold-1",   label: "Gold Dastaar",    headwear: "dastaar", cloth: "#D8B45A", kit: "#0F2A4A", skin: "#C68642", beard: false, image: null },
  { id: "green-1",  label: "Green Dastaar",   headwear: "dastaar", cloth: "#1F6B4A", kit: "#EFEBE2", skin: "#8D5524", beard: true,  image: null },

  { id: "patka-1",  label: "Kesri Patka",     headwear: "patka",   cloth: "#F2842B", kit: "#123A6B", skin: "#C68642", beard: false, image: null },
  { id: "patka-2",  label: "Navy Patka",      headwear: "patka",   cloth: "#123A6B", kit: "#F2842B", skin: "#E0AC69", beard: false, image: null },
  { id: "patka-3",  label: "White Patka",     headwear: "patka",   cloth: "#EFEBE2", kit: "#7B1E3A", skin: "#8D5524", beard: false, image: null },
  { id: "patka-4",  label: "Royal Patka",     headwear: "patka",   cloth: "#1D5FD0", kit: "#D8B45A", skin: "#C68642", beard: false, image: null },
  { id: "patka-5",  label: "Green Patka",     headwear: "patka",   cloth: "#1F6B4A", kit: "#EFEBE2", skin: "#E0AC69", beard: false, image: null },
  { id: "patka-6",  label: "Maroon Patka",    headwear: "patka",   cloth: "#7B1E3A", kit: "#D8B45A", skin: "#8D5524", beard: false, image: null },
  { id: "patka-7",  label: "Black Patka",     headwear: "patka",   cloth: "#1A1A20", kit: "#EFEBE2", skin: "#C68642", beard: false, image: null },
  { id: "patka-8",  label: "Sky Patka",       headwear: "patka",   cloth: "#4FA3E3", kit: "#0F2A4A", skin: "#E0AC69", beard: false, image: null },
];

export function getAvatar(id: string | null): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
