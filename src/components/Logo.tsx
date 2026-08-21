/**
 * Placeholder wordmark + emblem. A khanda-derived mark is deliberately NOT used as a
 * decorative logo — the khanda is a religious symbol and putting it on merch, trophies
 * and social avatars invites objection. This uses a shield/globe motif instead:
 * "world" + "championship", no religious iconography to misuse.
 * Replace with the commissioned logo when it exists.
 */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Sikh World Championship"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="swc-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--swc-kesri-soft)" />
          <stop offset="100%" stopColor="var(--swc-kesri)" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path
        d="M24 3.5 42 10v14.5c0 10.4-7.2 17.9-18 20.9C13.2 42.4 6 34.9 6 24.5V10L24 3.5Z"
        fill="url(#swc-mark)"
      />
      {/* Globe meridians */}
      <g stroke="var(--swc-ink)" strokeWidth="1.9" fill="none" opacity="0.9">
        <circle cx="24" cy="23" r="10.5" />
        <ellipse cx="24" cy="23" rx="4.4" ry="10.5" />
        <path d="M13.8 19.4h20.4M13.8 26.6h20.4" />
      </g>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo />
      <span className="font-display leading-none">
        <span className="block text-[15px] tracking-tight">Sikh World</span>
        <span className="block text-[11px] font-semibold tracking-[0.22em] text-kesri">
          CHAMPIONSHIP
        </span>
      </span>
    </span>
  );
}
