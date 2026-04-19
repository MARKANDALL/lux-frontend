// tests/helpers-core.test.js
// Smoke + edge-case tests for helpers/core.js (12 inbound imports).
//
// SIDE EFFECTS ON IMPORT:
//   - helpers/core.js calls getUID() at module eval, which is guarded by
//     `typeof window !== "undefined"`. In Node this no-ops and LUX_USER_ID
//     is set to null — so import is safe.
//   - Transitive imports: _api/identity.js, core/scoring/index.js.
//     None of these perform network or DOM work when `window` is undefined.

import { describe, it, expect } from "vitest";
import {
  LUX_USER_ID,
  buildYouglishUrl,
  isCorrupt,
  encouragingLine,
  clamp,
  shuffleInPlace,
} from "../helpers/core.js";

describe("helpers/core.js", () => {
  // ---- smoke ----
  it("module exports expected members", () => {
    expect(typeof buildYouglishUrl).toBe("function");
    expect(typeof isCorrupt).toBe("function");
    expect(typeof encouragingLine).toBe("function");
    expect(typeof clamp).toBe("function");
    expect(typeof shuffleInPlace).toBe("function");
  });

  it("LUX_USER_ID is null in Node (no window)", () => {
    // In a browser this would be a UUID; in Node it must be null.
    expect(LUX_USER_ID).toBe(null);
  });

  // ---- buildYouglishUrl ----
  it("buildYouglishUrl produces expected URL", () => {
    expect(buildYouglishUrl("hello")).toBe("https://youglish.com/pronounce/hello/english");
  });

  it("buildYouglishUrl percent-encodes special characters", () => {
    expect(buildYouglishUrl("hello world")).toBe(
      "https://youglish.com/pronounce/hello%20world/english"
    );
    expect(buildYouglishUrl("café")).toBe(
      "https://youglish.com/pronounce/caf%C3%A9/english"
    );
  });

  it("buildYouglishUrl tolerates empty string", () => {
    expect(buildYouglishUrl("")).toBe("https://youglish.com/pronounce//english");
  });

  // ---- isCorrupt ----
  it("isCorrupt flags replacement and smart-punct characters", () => {
    expect(isCorrupt("�")).toBe(true);
    expect(isCorrupt("don\u2019t")).toBe(true); // curly apostrophe
    expect(isCorrupt("a — b")).toBe(true); // em dash
  });

  it("isCorrupt returns false for clean ASCII", () => {
    expect(isCorrupt("hello")).toBe(false);
    expect(isCorrupt("")).toBe(false);
  });

  it("isCorrupt handles null/undefined without throwing", () => {
    expect(isCorrupt(null)).toBe(false);
    expect(isCorrupt(undefined)).toBe(false);
  });

  // ---- encouragingLine ----
  it("encouragingLine returns non-empty string for a score", () => {
    const s = encouragingLine(85);
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });

  it("encouragingLine returns a string with no score argument", () => {
    const s = encouragingLine();
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });

  it("encouragingLine for a green score mentions 'green'", () => {
    // 80–84 branch must explicitly acknowledge "green" (product requirement).
    const s = encouragingLine(82);
    expect(s).toContain("green");
  });

  // ---- clamp ----
  it("clamp bounds values within [lo, hi]", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  // ---- shuffleInPlace ----
  it("shuffleInPlace mutates and returns same array with same members", () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffleInPlace(arr);
    expect(out).toBe(arr); // same reference
    expect([...arr].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("shuffleInPlace handles empty array", () => {
    const arr = [];
    expect(shuffleInPlace(arr)).toEqual([]);
  });

  it("shuffleInPlace handles single-element array", () => {
    expect(shuffleInPlace([42])).toEqual([42]);
  });
});