import type { StaticImageData } from "next/image";
import standing from "../../public/hero/cod1.png";
import playing from "../../public/hero/fifa2.png";
import winning from "../../public/hero/fifa3.png";

/**
 * The hero sequence — a three-beat story: turn up, compete, win.
 *
 * Statically imported rather than referenced by path, which buys three things:
 * intrinsic width/height (so there's no layout shift), an automatic blurred
 * placeholder, and Next's image optimiser converting these 1.9MB PNGs to sized WebP
 * or AVIF at request time. The source files stay big; nobody downloads them at that size.
 *
 * `alt` is written for each image, not left empty. These carry the meaning of the hero,
 * and plenty of people will never see them — slow connections, screen readers, or
 * images-off.
 */
export interface HeroSlide {
  src: StaticImageData;
  alt: string;
  /**
   * object-position. The three source images have different aspect ratios (square,
   * 3:2, 5:4) and all get cropped to the same wide frame, so each needs its own
   * anchor point or heads get cut off.
   */
  position: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    src: standing,
    alt: "A Sikh esports player in a navy and gold team jacket, arms folded, wearing a dark blue dastaar.",
    position: "50% 28%",
  },
  {
    src: playing,
    alt: "A Sikh player mid-match, controller in hand, focused on the screen with a trophy lit behind him.",
    position: "38% 40%",
  },
  {
    src: winning,
    alt: "A Sikh champion lifting a gold trophy under stadium lights as confetti falls.",
    position: "55% 38%",
  },
];

/** How long each slide holds before crossfading. */
export const HERO_SLIDE_MS = 4200;
