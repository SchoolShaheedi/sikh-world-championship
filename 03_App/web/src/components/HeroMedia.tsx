"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HERO_SLIDES, HERO_SLIDE_MS } from "@/data/hero-media";

/**
 * The hero image — three shots crossfading: turn up, compete, win.
 *
 * Framed in its own column rather than full-bleed behind the text. The first attempt was
 * full-bleed and it failed for a reason worth remembering: the whole point of these
 * images is that the player is visibly Sikh, and a scrim heavy enough to keep a headline
 * readable also buried his face. Give the person their own space and both jobs get done.
 *
 * Only the first slide loads eagerly; it's the Largest Contentful Paint. The other two
 * load lazily and join the rotation once decoded, so a slow connection still gets a
 * working hero.
 *
 * Under prefers-reduced-motion the rotation never starts and slide one stays put.
 */
export function HeroMedia() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % HERO_SLIDES.length),
      HERO_SLIDE_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] border border-line">
      {HERO_SLIDES.map((slide, i) => (
        <Image
          key={slide.src.src}
          src={slide.src}
          // Only the visible slide is described. Announcing three alternating
          // descriptions of the same region would be noise for a screen reader.
          alt={i === index ? slide.alt : ""}
          fill
          sizes="(max-width: 1024px) 100vw, 480px"
          quality={75}
          placeholder="blur"
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "auto"}
          className="object-cover transition-opacity duration-[1200ms] ease-in-out"
          style={{
            objectPosition: slide.position,
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}

      {/* A light bottom fade only — just enough to seat the frame on the dark ground
          without dimming the subject. No scrim over the face. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/4"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(11,11,12,0.55))",
        }}
      />

      {/* Slide indicator — makes the sequence read as deliberate rather than as a glitch. */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {HERO_SLIDES.map((s, i) => (
          <span
            key={s.src.src}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === index ? "w-6 bg-kesri" : "w-1.5 bg-body/35"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
