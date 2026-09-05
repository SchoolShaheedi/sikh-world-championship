/**
 * A small fixed-window rate limiter.
 *
 * IN-MEMORY, AND THAT IS A REAL LIMIT. Each server instance keeps its own counters, so
 * on a platform that runs several instances (or scales to zero between requests) the
 * effective limit is per-instance and resets on deploy. That is still worth having —
 * it stops the obvious flood from one browser — but it is NOT the limiter to rely on
 * once this is deployed. Move the counters to the database or a KV store at the same
 * time the JSON stores go (00_Docs/DATA-LAYER.md).
 *
 * Deliberately generous. The things being limited here are a guardian-consent email and
 * a safeguarding report form; the cost of throttling a genuine one is far higher than
 * the cost of letting a few extra through, so every limit below is set to stop flooding
 * and nothing tighter.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Stop the map growing forever in a long-running process. */
function sweep(now: number): void {
  if (windows.size < 5000) return;
  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry. 0 when allowed. */
  retryAfter: number;
}

/**
 * Count one attempt against `key`.
 *
 * @param key    Bucket identifier — an IP, a player id, or both. Never log this next to
 *               the content of what was submitted.
 * @param limit  Attempts permitted per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Test-only: forget every window so one test cannot exhaust another's budget. */
export function resetRateLimits(): void {
  windows.clear();
}

/* ---------- The limits themselves, named so they are easy to find and argue about ---------- */

export const LIMITS = {
  /**
   * Support tickets per IP. Generous on purpose: a worried parent who submits, panics,
   * and submits again must never be turned away. This only catches a script.
   */
  supportTicket: { limit: 10, windowMs: 10 * 60 * 1000 },

  /**
   * Guardian approval emails per child per hour. Without a limit a child could click
   * "ask again" repeatedly and fill their parent's inbox — which reads as harassment
   * from us, not from them. Three is enough for a genuine "did that send?" retry.
   */
  guardianApproval: { limit: 3, windowMs: 60 * 60 * 1000 },

  /**
   * Sign-in links per IP. Loose enough for a household sharing a connection — several
   * siblings signing in at once is normal here — while still stopping someone spraying
   * links at an address they do not own.
   */
  signInLink: { limit: 8, windowMs: 15 * 60 * 1000 },

  /**
   * Volunteer sign-ups per IP. Two families on one connection, plus a retry each, and
   * still room to spare. What this actually protects is a table holding a THIRD PARTY's
   * contact details — the referee — which is the thing here worth spamming into.
   */
  volunteerSignup: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;
