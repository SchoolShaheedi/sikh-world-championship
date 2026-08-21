import { describe, expect, it } from "vitest";
import { QUALITIES, qualityFor, getQuality } from "./qualities";

describe("the 32 Qualities", () => {
  it("has exactly 32, all unique", async () => {
    expect(QUALITIES).toHaveLength(32);
    expect(new Set(QUALITIES.map((q) => q.id)).size).toBe(32);
  });

  it("gives every quality Gurmukhi, a name, an English word and a meaning", () => {
    for (const q of QUALITIES) {
      expect(q.gurmukhi.trim()).not.toBe("");
      expect(q.name.trim()).not.toBe("");
      expect(q.english.trim()).not.toBe("");
      expect(q.meaning.length).toBeGreaterThan(15);
    }
  });

  it("includes the ones that were specifically asked for", () => {
    const names = QUALITIES.map((q) => q.name);
    for (const n of ["Sat", "Santokh", "Dharam", "Sidak", "Pyaar", "Daya", "Shanti", "Sant Sipahi"]) {
      expect(names).toContain(n);
    }
  });
});

describe("quality assignment", () => {
  it("always gives the same player the same quality", () => {
    // A card that changed on refresh would be worthless to collect or share.
    const first = qualityFor("SWC-A1B2");
    for (let i = 0; i < 100; i++) {
      expect(qualityFor("SWC-A1B2").id).toBe(first.id);
    }
  });

  it("spreads evenly across all 32, with none unused", () => {
    const counts = new Map<string, number>();
    const n = 32000;
    for (let i = 0; i < n; i++) {
      const q = qualityFor(`SWC-${i.toString(16)}`);
      counts.set(q.id, (counts.get(q.id) ?? 0) + 1);
    }
    expect(counts.size).toBe(32);

    const expected = n / 32;
    for (const c of counts.values()) {
      // No quality should be more than 25% off an even share — nothing is secretly rare.
      expect(Math.abs(c - expected) / expected).toBeLessThan(0.25);
    }
  });

  it("looks up a quality by id, and returns nothing for a bad one", () => {
    expect(getQuality("sat")?.english).toBe("Truth");
    expect(getQuality("not-a-quality")).toBeUndefined();
    expect(getQuality(null)).toBeUndefined();
  });
});
