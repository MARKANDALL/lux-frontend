// tests/helpers-core.test.js
// Smoke + edge-case tests for helpers/core.js (12 inbound imports).
// Run: node tests/helpers-core.test.js
//
// SIDE EFFECTS ON IMPORT:
//   - helpers/core.js calls getUID() at module eval, which is guarded by
//     `typeof window !== "undefined"`. In Node this no-ops and LUX_USER_ID
//     is set to null — so import is safe.
//   - Transitive imports: _api/identity.js, core/scoring/index.js.
//     None of these perform network or DOM work when `window` is undefined.

import assert from "node:assert/strict";
import {
  LUX_USER_ID,
  buildYouglishUrl,
  isCorrupt,
  encouragingLine,
  clamp,
  shuffleInPlace,
} from "../helpers/core.js";

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

console.log("helpers/core.js");

// ---- smoke ----
t("module exports expected members", () => {
  assert.equal(typeof buildYouglishUrl, "function");
  assert.equal(typeof isCorrupt, "function");
  assert.equal(typeof encouragingLine, "function");
  assert.equal(typeof clamp, "function");
  assert.equal(typeof shuffleInPlace, "function");
});

t("LUX_USER_ID is null in Node (no window)", () => {
  // In a browser this would be a UUID; in Node it must be null.
  assert.equal(LUX_USER_ID, null);
});

// ---- buildYouglishUrl ----
t("buildYouglishUrl produces expected URL", () => {
  assert.equal(
    buildYouglishUrl("hello"),
    "https://youglish.com/pronounce/hello/english"
  );
});

t("buildYouglishUrl percent-encodes special characters", () => {
  assert.equal(
    buildYouglishUrl("hello world"),
    "https://youglish.com/pronounce/hello%20world/english"
  );
  assert.equal(
    buildYouglishUrl("café"),
    "https://youglish.com/pronounce/caf%C3%A9/english"
  );
});

t("buildYouglishUrl tolerates empty string", () => {
  assert.equal(buildYouglishUrl(""), "https://youglish.com/pronounce//english");
});

// ---- isCorrupt ----
t("isCorrupt flags replacement and smart-punct characters", () => {
  assert.equal(isCorrupt("�"), true);
  assert.equal(isCorrupt("don\u2019t"), true); // curly apostrophe
  assert.equal(isCorrupt("a — b"), true); // em dash
});

t("isCorrupt returns false for clean ASCII", () => {
  assert.equal(isCorrupt("hello"), false);
  assert.equal(isCorrupt(""), false);
});

t("isCorrupt handles null/undefined without throwing", () => {
  assert.equal(isCorrupt(null), false);
  assert.equal(isCorrupt(undefined), false);
});

// ---- encouragingLine ----
t("encouragingLine returns non-empty string for a score", () => {
  const s = encouragingLine(85);
  assert.equal(typeof s, "string");
  assert.ok(s.length > 0);
});

t("encouragingLine returns a string with no score argument", () => {
  const s = encouragingLine();
  assert.equal(typeof s, "string");
  assert.ok(s.length > 0);
});

t("encouragingLine for a green score mentions 'green'", () => {
  // 80–84 branch must explicitly acknowledge "green" (product requirement).
  const s = encouragingLine(82);
  assert.ok(s.includes("green"), `expected 'green' acknowledgement, got: ${s}`);
});

// ---- clamp ----
t("clamp bounds values within [lo, hi]", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(10, 0, 10), 10);
});

// ---- shuffleInPlace ----
t("shuffleInPlace mutates and returns same array with same members", () => {
  const arr = [1, 2, 3, 4, 5];
  const out = shuffleInPlace(arr);
  assert.equal(out, arr); // same reference
  assert.deepEqual([...arr].sort(), [1, 2, 3, 4, 5]);
});

t("shuffleInPlace handles empty array", () => {
  const arr = [];
  assert.deepEqual(shuffleInPlace(arr), []);
});

t("shuffleInPlace handles single-element array", () => {
  assert.deepEqual(shuffleInPlace([42]), [42]);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
