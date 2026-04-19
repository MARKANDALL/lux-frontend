// tests/scoring.test.js
// Smoke + edge-case tests for core/scoring/index.js (24 inbound imports — #1 untested target).

import { describe, it, expect } from "vitest";
import {
  fmtPct,
  scoreClass,
  coachingLevel,
  coachingPreface,
  cefrBand,
  cefrClass,
  fmtPctCefr,
  getAzureScores,
  deriveFallbackScores,
  COACHING_POLISH_THRESHOLD,
  CEFR_BANDS,
} from "../core/scoring/index.js";
import scoreClassDefault from "../core/scoring/index.js";

describe("core/scoring/index.js", () => {
  // ---- smoke: exports ----
  it("exports expected named members", () => {
    expect(typeof fmtPct).toBe("function");
    expect(typeof scoreClass).toBe("function");
    expect(typeof coachingLevel).toBe("function");
    expect(typeof coachingPreface).toBe("function");
    expect(typeof cefrBand).toBe("function");
    expect(typeof cefrClass).toBe("function");
    expect(typeof fmtPctCefr).toBe("function");
    expect(typeof getAzureScores).toBe("function");
    expect(typeof deriveFallbackScores).toBe("function");
    expect(COACHING_POLISH_THRESHOLD).toBe(85);
    expect(CEFR_BANDS).toBeInstanceOf(Array);
  });

  it("default export is scoreClass", () => {
    expect(scoreClassDefault).toBe(scoreClass);
  });

  // ---- fmtPct ----
  it("fmtPct returns dash for null/undefined/NaN", () => {
    expect(fmtPct(null)).toBe("–");
    expect(fmtPct(undefined)).toBe("–");
    expect(fmtPct("not-a-number")).toBe("–");
  });

  it("fmtPct integer formatting", () => {
    expect(fmtPct(80)).toBe("80%");
    expect(fmtPct(0)).toBe("0%");
  });

  it("fmtPct non-integer gets one decimal", () => {
    expect(fmtPct(82.5)).toBe("82.5%");
  });

  // ---- scoreClass ----
  it("scoreClass thresholds (80/60 constitution)", () => {
    expect(scoreClass(null)).toBe("");
    expect(scoreClass(80)).toBe("score-good");
    expect(scoreClass(79)).toBe("score-warn");
    expect(scoreClass(60)).toBe("score-warn");
    expect(scoreClass(59)).toBe("score-bad");
    expect(scoreClass(100)).toBe("score-good");
    expect(scoreClass(0)).toBe("score-bad");
  });

  // ---- coachingLevel ----
  it("coachingLevel buckets: none/polish/coach/urgent", () => {
    expect(coachingLevel(95)).toBe("none");
    expect(coachingLevel(85)).toBe("none");
    expect(coachingLevel(84)).toBe("polish");
    expect(coachingLevel(80)).toBe("polish");
    expect(coachingLevel(79)).toBe("coach");
    expect(coachingLevel(60)).toBe("coach");
    expect(coachingLevel(59)).toBe("urgent");
  });

  it("coachingLevel defaults to 'coach' on non-finite input", () => {
    // Note: Number(null) === 0 (finite), so null falls into the < 60 'urgent'
    // branch rather than the non-finite fallback. Only undefined / NaN-producing
    // strings trip the guard.
    expect(coachingLevel(undefined)).toBe("coach");
    expect(coachingLevel("nope")).toBe("coach");
    expect(coachingLevel(NaN)).toBe("coach");
  });

  // ---- coachingPreface ----
  it("coachingPreface returns empty for non-finite", () => {
    // Same Number(null) === 0 caveat as above: only undefined / NaN qualify.
    expect(coachingPreface(undefined)).toBe("");
    expect(coachingPreface("x")).toBe("");
    expect(coachingPreface(NaN)).toBe("");
  });

  it("coachingPreface acknowledges green for 80–84", () => {
    const s = coachingPreface(82);
    expect(s).toContain("green");
  });

  it("coachingPreface returns a non-empty string for each tier", () => {
    expect(coachingPreface(95).length).toBeGreaterThan(0);
    expect(coachingPreface(82).length).toBeGreaterThan(0);
    expect(coachingPreface(70).length).toBeGreaterThan(0);
    expect(coachingPreface(40).length).toBeGreaterThan(0);
  });

  // ---- CEFR ----
  it("cefrBand thresholds", () => {
    expect(cefrBand(95)).toBe("C2");
    expect(cefrBand(90)).toBe("C1");
    expect(cefrBand(85)).toBe("B2");
    expect(cefrBand(75)).toBe("B1");
    expect(cefrBand(60)).toBe("A2");
    expect(cefrBand(59)).toBe("A1");
    expect(cefrBand(0)).toBe("A1");
  });

  it("cefrBand empty for null/undefined/NaN", () => {
    expect(cefrBand(null)).toBe("");
    expect(cefrBand(undefined)).toBe("");
    expect(cefrBand("nope")).toBe("");
  });

  it("cefrClass lowercases band", () => {
    expect(cefrClass(95)).toBe("cefr-c2");
    expect(cefrClass(70)).toBe("cefr-a2");
    expect(cefrClass(null)).toBe("");
  });

  it("fmtPctCefr combines pct and band", () => {
    expect(fmtPctCefr(87)).toBe("87% · B2");
    expect(fmtPctCefr(null)).toBe("–");
  });

  // ---- getAzureScores ----
  it("getAzureScores handles null/undefined input", () => {
    const z = getAzureScores(null);
    expect(z.accuracy).toBe(null);
    expect(z.fluency).toBe(null);
    expect(z.overall).toBe(null);
    expect(z.content).toEqual({ vocab: null, grammar: null, topic: null });
  });

  it("getAzureScores reads from NBest[0]", () => {
    const data = {
      NBest: [
        {
          AccuracyScore: 88,
          FluencyScore: 77,
          CompletenessScore: 90,
          PronScore: 85,
          ProsodyScore: 70,
        },
      ],
    };
    const z = getAzureScores(data);
    expect(z.accuracy).toBe(88);
    expect(z.fluency).toBe(77);
    expect(z.completeness).toBe(90);
    expect(z.overall).toBe(85);
    expect(z.prosody).toBe(70);
  });

  it("getAzureScores falls back to PronunciationAssessment", () => {
    const data = {
      PronunciationAssessment: { AccuracyScore: 50, PronScore: 55 },
    };
    const z = getAzureScores(data);
    expect(z.accuracy).toBe(50);
    expect(z.overall).toBe(55);
  });

  // ---- deriveFallbackScores ----
  it("deriveFallbackScores handles empty data", () => {
    const z = deriveFallbackScores({});
    expect(z.accuracy).toBe(null);
    expect(z.completeness).toBe(null);
    expect(z.overall).toBe(null);
  });

  it("deriveFallbackScores averages word accuracies", () => {
    const data = {
      NBest: [
        {
          Words: [
            { AccuracyScore: 90, ErrorType: "None" },
            { AccuracyScore: 80, ErrorType: "None" },
            { AccuracyScore: 70, ErrorType: "Mispronunciation" },
          ],
        },
      ],
    };
    const z = deriveFallbackScores(data);
    expect(z.accuracy).toBe(80); // avg of 90,80,70
    expect(z.completeness).toBe(67); // 2/3 ok rounded
  });

  // TODO: verify this test — depends on globalThis.getSpeakingRate being unset.
  it("deriveFallbackScores fluency fallback is null without getSpeakingRate", () => {
    const z = deriveFallbackScores({ NBest: [{ Words: [] }] });
    expect(z.fluency).toBe(null);
  });
});