import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, resetRateLimits, LIMITS } from "./rate-limit";

beforeEach(resetRateLimits);

describe("rateLimit", () => {
  it("allows up to the limit, then refuses", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 60_000).ok).toBe(true);
    expect(rateLimit("k", 3, 60_000).ok).toBe(false);
  });

  it("keeps buckets separate, so one player cannot exhaust another's budget", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    expect(rateLimit("a", 3, 60_000).ok).toBe(false);
    expect(rateLimit("b", 3, 60_000).ok).toBe(true);
  });

  it("tells the caller how long to wait", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 60_000);
    const r = rateLimit("k", 3, 60_000);
    expect(r.retryAfter).toBeGreaterThan(0);
    expect(r.retryAfter).toBeLessThanOrEqual(60);
  });

  it("forgives once the window has passed", () => {
    // Fake timers, not a real sleep. The first version used a 1ms window and a setTimeout,
    // which meant the window could elapse *between* the two calls that assert refusal —
    // so the test failed roughly one run in three. Controlling the clock makes it exact.
    vi.useFakeTimers();
    try {
      expect(rateLimit("k", 1, 60_000).ok).toBe(true);
      expect(rateLimit("k", 1, 60_000).ok).toBe(false);

      vi.advanceTimersByTime(60_001);
      expect(rateLimit("k", 1, 60_000).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the support limit loose enough for a worried parent to double-submit", () => {
    // If this ever drops low enough that a handful of submissions is refused, that is a
    // safeguarding regression, not a tuning choice.
    expect(LIMITS.supportTicket.limit).toBeGreaterThanOrEqual(5);
  });

  it("keeps the guardian limit high enough for a genuine retry", () => {
    expect(LIMITS.guardianApproval.limit).toBeGreaterThanOrEqual(2);
  });
});
