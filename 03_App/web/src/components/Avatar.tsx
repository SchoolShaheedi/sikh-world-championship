import { getAvatar } from "@/data/avatars";

/**
 * Avatar rendering, in priority order:
 *   1. a player's own uploaded photo (optional, never required)
 *   2. the artwork file for the chosen avatar, if one has been added
 *   3. a drawn SVG placeholder, so the site works before the artwork exists
 *
 * Once real artwork is in public/avatars/, branch 3 stops being used — but keep it,
 * because it's what stops a missing file from leaving a hole in someone's card.
 */
export function Avatar({
  avatarId,
  photoUrl,
  size = 96,
  alt = "",
}: {
  avatarId: string | null;
  photoUrl?: string | null;
  size?: number;
  alt?: string;
}) {
  const a = getAvatar(avatarId);
  const src = photoUrl ?? (a.image ? `/avatars/${a.image}` : null);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || a.label}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const isPatka = a.headwear === "patka";
  const uid = `av-${a.id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={alt || a.label}
    >
      <defs>
        <linearGradient id={`${uid}-cloth`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={a.cloth} />
          <stop offset="100%" stopColor={a.cloth} stopOpacity="0.74" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        <circle cx="50" cy="50" r="50" fill={a.kit} opacity="0.22" />

        {/* Shoulders */}
        <path d="M15 100c0-19 16-30 35-30s35 11 35 30H15Z" fill={a.kit} />
        {/* Neck */}
        <path d="M43 60h14v12c0 4-3 6-7 6s-7-2-7-6V60Z" fill={a.skin} />
        <path d="M43 60h14v6c-4 3-10 3-14 0v-6Z" fill="#000" fillOpacity="0.13" />

        {/* Ears */}
        <ellipse cx="31.5" cy="50" rx="3.5" ry="4.5" fill={a.skin} />
        <ellipse cx="68.5" cy="50" rx="3.5" ry="4.5" fill={a.skin} />

        {/* Face */}
        <path
          d="M32 42c0-11 8-19 18-19s18 8 18 19v6c0 12-8 21-18 21s-18-9-18-21v-6Z"
          fill={a.skin}
        />

        {/* Beard */}
        {a.beard && (
          <>
            <path
              d="M32 48c0 5 .6 13 2.6 19.5C37.2 76 42.6 82 50 82s12.8-6 15.4-14.5C67.4 61 68 53 68 48c-2 8-7.5 12-18 12s-16-4-18-12Z"
              fill="#2B2119"
            />
            <path d="M43 56.5c2-1.6 4.6-2 7-2s5 .4 7 2c-2 2.2-4.4 2.8-7 2.8s-5-.6-7-2.8Z" fill="#1F1712" />
          </>
        )}

        {/* Brows */}
        <path
          d="M39.5 43.4c1.9-1.3 4.6-1.3 6.4 0M54.1 43.4c1.9-1.3 4.6-1.3 6.4 0"
          stroke="#241A12" strokeWidth="1.9" strokeLinecap="round" fill="none"
        />
        {/* Eyes */}
        <ellipse cx="42.8" cy="48.5" rx="2.6" ry="1.9" fill="#F3EDE6" />
        <ellipse cx="57.2" cy="48.5" rx="2.6" ry="1.9" fill="#F3EDE6" />
        <circle cx="43.2" cy="48.6" r="1.35" fill="#2A1D14" />
        <circle cx="57.6" cy="48.6" r="1.35" fill="#2A1D14" />
        <path d="M40.2 47.2c1.6-1.1 3.6-1.1 5.2 0M54.6 47.2c1.6-1.1 3.6-1.1 5.2 0"
          stroke="#2A1D14" strokeWidth="1.1" strokeLinecap="round" fill="none" />

        {/* Nose */}
        <path d="M50 50v5.5c0 .9-.7 1.5-1.8 1.7" stroke="#000" strokeOpacity="0.2"
          strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Mouth, when no beard covers it */}
        {!a.beard && (
          <path d="M45.5 60.5c2.6 2.6 6.4 2.6 9 0" stroke="#5A2E22" strokeWidth="1.9"
            strokeLinecap="round" fill="none" />
        )}

        {/* Headwear */}
        {isPatka ? (
          <>
            <path d="M30 44c0-13.5 9-21.5 20-21.5S70 30.5 70 44c-5.5-6-12.5-8.4-20-8.4S35.5 38 30 44Z"
              fill={`url(#${uid}-cloth)`} />
            <path d="M46 22.5c1.7 3.6 6.3 3.6 8 0" stroke={a.cloth} strokeWidth="6"
              fill="none" strokeLinecap="round" />
            <path d="M30.5 43c1.8-3 4.2-5.4 7-7.2M69.5 43c-1.8-3-4.2-5.4-7-7.2"
              stroke="#000" strokeOpacity="0.16" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M37 27.5c3.6-2.6 8-4 13-4" stroke="#fff" strokeOpacity="0.2"
              strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            {/* Flat-topped, angular — a tied dastaar, not a dome */}
            <path d="M25.5 45C24 32 26 20 33 14c5-4.4 11-6.2 17-6.2S62 9.6 67 14c7 6 9 18 7.5 31-4.5-11-13-16.5-24.5-16.5S30 34 25.5 45Z"
              fill={`url(#${uid}-cloth)`} />
            {/* Front nok */}
            <path d="M50 8.6 64 25.5l-14 4.6-14-4.6L50 8.6Z" fill="#000" fillOpacity="0.16" />
            <path d="M50 8.6 64 25.5l-14 4.6V8.6Z" fill="#fff" fillOpacity="0.09" />
            <path d="M50 8.6v21.5" stroke="#000" strokeOpacity="0.22" strokeWidth="1.4" />
            {/* Wraps */}
            <path d="M26.5 38.5C33 29 67 29 73.5 38.5" stroke="#000" strokeOpacity="0.18"
              strokeWidth="2.6" fill="none" />
            <path d="M28 30C34.5 21.5 65.5 21.5 72 30" stroke="#000" strokeOpacity="0.13"
              strokeWidth="2.3" fill="none" />
            <path d="M31.5 24c2.6-6 7-9.8 12.5-11" stroke="#fff" strokeOpacity="0.24"
              strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </>
        )}
      </g>
    </svg>
  );
}
