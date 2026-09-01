import type { ChampionshipEvent } from "@/lib/types";

/**
 * Decorative stat arcs sweeping in from the left of the frame.
 *
 * Geometry: concentric arcs centred off-canvas at (-110, 300) so they appear to radiate
 * out from behind the subject rather than from a visible point. Each arc fades out at
 * both ends via a per-arc gradient, which is what stops them reading as hard rings.
 *
 * Purely decorative — `pointer-events-none`, and hidden on small screens where there is
 * no room for it beside the copy.
 */

const CX = -110;
const CY = 300;

interface Arc {
  r: number;
  /** Degrees. */
  from: number;
  to: number;
  at: number;
  value: string;
  suffix?: string;
  label: string;
}

const polar = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

export function HeroArcs({ event }: { event: ChampionshipEvent }) {
  // Pulled from the event rather than hardcoded, so these can never drift out of date.
  const arcs: Arc[] = [
    {
      r: 330,
      from: -92,
      to: 16,
      at: -46,
      value: String(event.capacity),
      label: "Places",
    },
    {
      r: 395,
      from: -56,
      to: 60,
      at: 2,
      value: String(Math.ceil(Math.log2(Math.max(2, event.capacity)))),
      label: "Rounds to win it",
    },
    {
      r: 460,
      from: -14,
      to: 72,
      at: 44,
      value: event.entryFee === 0 ? "£0" : `£${event.entryFee}`,
      label: "To enter",
    },
  ];

  return (
    // z-50 matters: the scrim layers sit at z-40, and without an explicit index the
    // arcs paint underneath them and vanish.
    <div className="pointer-events-none absolute inset-y-0 right-0 z-50 hidden sm:block">
      <svg
        /* Wider than the arcs need (they reach x=350) so the labels to their right have
           room. At 380 the longest label ran past the edge and was clipped. */
        viewBox="0 0 480 700"
        preserveAspectRatio="xMaxYMid meet"
        className="h-full w-auto"
        aria-hidden
      >
        <defs>
          {arcs.map((a, i) => {
            const s = polar(a.r, a.from);
            const e = polar(a.r, a.to);
            return (
              <linearGradient
                key={i}
                id={`arc-grad-${i}`}
                gradientUnits="userSpaceOnUse"
                x1={s.x}
                y1={s.y}
                x2={e.x}
                y2={e.y}
              >
                <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                <stop offset="22%" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="55%" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="85%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            );
          })}
        </defs>

        {arcs.map((a, i) => {
          const s = polar(a.r, a.from);
          const e = polar(a.r, a.to);
          const dot = polar(a.r, a.at);
          // Arc length, so the dash reveal matches the path exactly.
          const len = a.r * (((a.to - a.from) * Math.PI) / 180);
          const lineDelay = 0.4 + i * 0.22;
          const markDelay = lineDelay + 0.9;

          return (
            <g key={i}>
              <path
                d={`M ${s.x} ${s.y} A ${a.r} ${a.r} 0 0 1 ${e.x} ${e.y}`}
                fill="none"
                stroke={`url(#arc-grad-${i})`}
                strokeWidth="1.1"
                className="arc-line"
                style={
                  {
                    "--len": len,
                    animationDelay: `${lineDelay}s`,
                  } as React.CSSProperties
                }
              />

              <circle
                cx={dot.x}
                cy={dot.y}
                r="7"
                fill="none"
                stroke="#fff"
                strokeOpacity="0.35"
                className="arc-ring"
                style={{ animationDelay: `${markDelay + 0.3}s` }}
              />
              <circle
                cx={dot.x}
                cy={dot.y}
                r="3.4"
                fill="#fff"
                className="arc-dot"
                style={{ animationDelay: `${markDelay}s` }}
              />

              <text
                x={dot.x + 16}
                y={dot.y + 4}
                fill="#fff"
                fontSize="30"
                fontWeight="700"
                letterSpacing="-1"
                className="arc-text font-mono-num"
                style={{ animationDelay: `${markDelay + 0.15}s` }}
              >
                {a.value}
                {a.suffix && (
                  <tspan fontSize="19" dy="-10">
                    {a.suffix}
                  </tspan>
                )}
              </text>
              <text
                x={dot.x + 18}
                y={dot.y + 22}
                fill="#fff"
                fillOpacity="0.8"
                fontSize="8.5"
                fontWeight="500"
                letterSpacing="2"
                className="arc-text font-mono-num"
                style={{ animationDelay: `${markDelay + 0.3}s` }}
              >
                {a.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
