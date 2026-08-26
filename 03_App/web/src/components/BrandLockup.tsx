import Image from "next/image";

/**
 * The full logo lockup (mark + wordmark), rendered at its natural aspect ratio.
 *
 * Separate from <Logo /> for a specific reason: Logo renders a SQUARE box, which is right
 * for a compact mark and wrong for a wide lockup. Squeezing a 3:2 lockup into a 34px
 * square turns it into an unreadable smudge — so wide artwork gets its own component and
 * only ever appears where there is room for it.
 *
 * Goes through next/image, which matters here: the source is a 1.6MB PNG and nobody
 * should download that for a footer logo.
 */
export function BrandLockup({
  src,
  width = 220,
  className = "",
  priority = false,
}: {
  src: string;
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt="Sikh World Championship"
      width={width}
      // 3:2, matching the supplied artwork. next/image needs both dimensions for a
      // non-static import so it can reserve space and avoid layout shift.
      height={Math.round((width * 2) / 3)}
      sizes={`${width}px`}
      /* Next 16 restricts the optimiser to the qualities listed in next.config
         (default: [75] only) so it can't be abused as a general image service.
         Anything else returns a 400. */
      quality={75}
      loading={priority ? "eager" : "lazy"}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ maxWidth: width }}
    />
  );
}
