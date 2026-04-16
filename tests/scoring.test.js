// tests/scoring.test.js
// Smoke + edge-case tests for core/scoring/index.js (24 inbound imports — #1 untested target).
// Run: node tests/scoring.test.js

import assert from "node:assert/strict";
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

let passed = 0;
let failed = 0;
function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL ${name}: ${e.message}`);
  }
}

console.log("core/scoring/index.js");

// ---- smoke: exports ----
t("exports expected named members", () => {
  assert.equal(typeof fmtPct, "function");
  assert.equal(typeof scoreClass, "function");
  assert.equal(typeof coachingLevel, "function");
  assert.equal(typeof coachingPreface, "function");
  assert.equal(typeof cefrBand, "function");
  assert.equal(typeof cefrClass, "function");
  assert.equal(typeof fmtPctCefr, "function");
  assert.equal(typeof getAzureScores, "function");
  assert.equal(typeof deriveFallbackScores, "function");
  assert.equal(COACHING_POLISH_THRESHOLD, 85);
  assert.ok(Array.isArray(CEFR_BANDS));
});

t("default export is scoreClass", () => {
  assert.equal(scoreClassDefault, scoreClass);
});

// ---- fmtPct ----
t("fmtPct returns dash for null/undefined/NaN", () => {
  assert.equal(fmtPct(null), "–");
  assert.equal(fmtPct(undefined), "–");
  assert.equal(fmtPct("not-a-number"), "–");
});

t("fmtPct integer formatting", () => {
  assert.equal(fmtPct(80), "80%");
  assert.equal(fmtPct(0), "0%");
});

t("fmtPct non-integer gets one decimal", () => {
  assert.equal(fmtPct(82.5), "82.5%");
});

// ---- scoreClass ----
t("scoreClass thresholds (80/60 constitution)", () => {
  assert.equal(scoreClass(null), "");
  assert.equal(scoreClass(80), "score-good");
  assert.equal(scoreClass(79), "score-warn");
  assert.equal(scoreClass(60), "score-warn");
  assert.equal(scoreClass(59), "score-bad");
  assert.equal(scoreClass(100), "score-good");
  assert.equal(scoreClass(0), "score-bad");
});

// ---- coachingLevel ----
t("coachingLevel buckets: none/polish/coach/urgent", () => {
  assert.equal(coachingLevel(95), "none");
  assert.equal(coachingLevel(85), "none");
  assert.equal(coachingLevel(84), "polish");
  assert.equal(coachingLevel(80), "polish");
  assert.equal(coachingLevel(79), "coach");
  assert.equal(coachingLevel(60), "coach");
  assert.equal(coachingLevel(59), "urgent");
});

t("coachingLevel defaults to 'coach' on non-finite input", () => {
  // Note: Number(null) === 0 (finite), so null falls into the < 60 'urgent'
  // branch rather than the non-finite fallback. Only undefined / NaN-producing
  // strings trip the guard.
  assert.equal(coachingLevel(undefined), "coach");
  assert.equal(coachingLevel("nope"), "coach");
  assert.equal(coachingLevel(NaN), "coach");
});

// ---- coachingPreface ----
t("coachingPreface returns empty for non-finite", () => {
  // Same Number(null) === 0 caveat as above: only undefined / NaN qualify.
  assert.equal(coachingPreface(undefined), "");
  assert.equal(coachingPreface("x"), "");
  assert.equal(coachingPreface(NaN), "");
});

t("coachingPreface acknowledges green for 80–84", () => {
  const s = coachingPreface(82);
  assert.ok(s.includes("green"), `expected green acknowledgement, got: ${s}`);
});

t("coachingPreface returns a non-empty string for each tier", () => {
  assert.ok(coachingPreface(95).length > 0);
  assert.ok(coachingPreface(82).length > 0);
  assert.ok(coachingPreface(70).length > 0);
  assert.ok(coachingPreface(40).length > 0);
});

// ---- CEFR ----
t("cefrBand thresholds", () => {
  assert.equal(cefrBand(95), "C2");
  assert.equal(cefrBand(90), "C1");
  assert.equal(cefrBand(85), "B2");
  assert.equal(cefrBand(75), "B1");
  assert.equal(cefrBand(60), "A2");
  assert.equal(cefrBand(59), "A1");
  assert.equal(cefrBand(0), "A1");
});

t("cefrBand empty for null/undefined/NaN", () => {
  assert.equal(cefrBand(null), "");
  assert.equal(cefrBand(undefined), "");
  assert.equal(cefrBand("nope"), "");
});

t("cefrClass lowercases band", () => {
  assert.equal(cefrClass(95), "cefr-c2");
  assert.equal(cefrClass(70), "cefr-a2");
  assert.equal(cefrClass(null), "");
});

t("fmtPctCefr combines pct and band", () => {
  assert.equal(fmtPctCefr(87), "87% · B2");
  assert.equal(fmtPctCefr(null), "–");
});

// ---- getAzureScores ----
t("getAzureScores handles null/undefined input", () => {
  const z = getAzureScores(null);
  assert.equal(z.accuracy, null);
  assert.equal(z.fluency, null);
  assert.equal(z.overall, null);
  assert.deepEqual(z.content, { vocab: null, grammar: null, topic: null });
});

t("getAzureScores reads from NBest[0]", () => {
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
  assert.equal(z.accuracy, 88);
  assert.equal(z.fluency, 77);
  assert.equal(z.completeness, 90);
  assert.equal(z.overall, 85);
  assert.equal(z.prosody, 70);
});

t("getAzureScores falls back to PronunciationAssessment", () => {
  const data = {
    PronunciationAssessment: { AccuracyScore: 50, PronScore: 55 },
  };
  const z = getAzureScores(data);
  assert.equal(z.accuracy, 50);
  assert.equal(z.overall, 55);
});

// ---- deriveFallbackScores ----
t("deriveFallbackScores handles empty data", () => {
  const z = deriveFallbackScores({});
  assert.equal(z.accuracy, null);
  assert.equal(z.completeness, null);
  assert.equal(z.overall, null);
});

t("deriveFallbackScores averages word accuracies", () => {
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
  assert.equal(z.accuracy, 80); // avg of 90,80,70
  assert.equal(z.completeness, 67); // 2/3 ok rounded
});

// TODO: verify this test — depends on globalThis.getSpeakingRate being unset.
t("deriveFallbackScores fluency fallback is null without getSpeakingRate", () => {
  const z = deriveFallbackScores({ NBest: [{ Words: [] }] });
  assert.equal(z.fluency, null);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
