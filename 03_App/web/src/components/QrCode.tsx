import { qrSvgPath } from "@/lib/qr";

/**
 * A QR code as inline SVG. Server-rendered, no client JavaScript.
 *
 * Black on white, always, whatever the site theme is doing. These are printed and then
 * read by a camera under strip lighting, and a decoder wants maximum contrast — a code
 * rendered in the brand's off-white on the brand's near-black scans, until somebody prints
 * it and the printer renders the dark ink as a grey wash.
 *
 * `shapeRendering="crispEdges"` turns off anti-aliasing. A blurred module edge is exactly
 * the ambiguity error correction then has to spend itself on.
 */
export function QrCode({
  value,
  className,
  title,
}: {
  value: string;
  className?: string;
  /** For screen readers, and for anybody inspecting the page. Never the raw token. */
  title?: string;
}) {
  const { path, size } = qrSvgPath(value);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? "Check-in code"}
      /**
       * Immune to the viewer's colour settings, not merely opinionated about them.
       *
       * `forcedColorAdjust` because Windows High Contrast and macOS "Increase contrast"
       * replace author colours with system ones, and a code repainted in a system palette
       * is a code with no quiet zone and no contrast. `colorScheme` because Chrome's
       * auto-dark-mode inverts a white region inside a dark page, which turns the modules
       * white and the ground black — still a valid image to look at, and unreadable once
       * printed on white paper.
       */
      style={{ forcedColorAdjust: "none", colorScheme: "light" }}
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
