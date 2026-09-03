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
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
