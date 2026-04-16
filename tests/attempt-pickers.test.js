// tests/attempt-pickers.test.js
// Smoke + edge-case tests for features/progress/attempt-pickers.js (13 inbound imports).
// Run: node tests/attempt-pickers.test.js

import assert from "node:assert/strict";
import {
  pickTS,
  pickPassageKey,
  pickSessionId,
  pickSummary,
  pickAzure,
} from "../features/progress/attempt-pickers.js";

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

console.log("features/progress/attempt-pickers.js");

t("exports all five pickers as functions", () => {
  assert.equal(typeof pickTS, "function");
  assert.equal(typeof pickPassageKey, "function");
  assert.equal(typeof pickSessionId, "function");
  assert.equal(typeof pickSummary, "function");
  assert.equal(typeof pickAzure, "function");
});

// ---- null / undefined safety ----
t("all pickers survive null and undefined", () => {
  for (const fn of [pickTS, pickPassageKey, pickSessionId, pickSummary, pickAzure]) {
    fn(null);
    fn(undefined);
  }
});

t("pickTS returns null on empty input", () => {
  assert.equal(pickTS(null), null);
  assert.equal(pickTS({}), null);
});

t("pickPassageKey / pickSessionId return '' on empty input", () => {
  assert.equal(pickPassageKey(null), "");
  assert.equal(pickPassageKey({}), "");
  assert.equal(pickSessionId(null), "");
  assert.equal(pickSessionId({}), "");
});

t("pickSummary / pickAzure return null on empty input", () => {
  assert.equal(pickSummary(null), null);
  assert.equal(pickSummary({}), null);
  assert.equal(pickAzure(null), null);
  assert.equal(pickAzure({}), null);
});

// ---- precedence (schema drift) ----
t("pickTS precedence: ts > created_at > createdAt > time > localTime", () => {
  assert.equal(pickTS({ ts: 1, created_at: 2, createdAt: 3 }), 1);
  assert.equal(pickTS({ created_at: 2, createdAt: 3 }), 2);
  assert.equal(pickTS({ createdAt: 3, time: 4 }), 3);
  assert.equal(pickTS({ time: 4, localTime: 5 }), 4);
  assert.equal(pickTS({ localTime: 5 }), 5);
});

t("pickPassageKey precedence: passage_key > passageKey > passage", () => {
  assert.equal(pickPassageKey({ passage_key: "a", passageKey: "b", passage: "c" }), "a");
  assert.equal(pickPassageKey({ passageKey: "b", passage: "c" }), "b");
  assert.equal(pickPassageKey({ passage: "c" }), "c");
});

t("pickSessionId precedence: session_id > sessionId", () => {
  assert.equal(pickSessionId({ session_id: "a", sessionId: "b" }), "a");
  assert.equal(pickSessionId({ sessionId: "b" }), "b");
});

t("pickSummary precedence: summary > summary_json > sum", () => {
  assert.equal(pickSummary({ summary: "a", summary_json: "b", sum: "c" }), "a");
  assert.equal(pickSummary({ summary_json: "b", sum: "c" }), "b");
  assert.equal(pickSummary({ sum: "c" }), "c");
});

t("pickAzure precedence: azureResult > azure_result > azure > result", () => {
  const obj = { azureResult: 1, azure_result: 2, azure: 3, result: 4 };
  assert.equal(pickAzure(obj), 1);
  assert.equal(pickAzure({ azure_result: 2, azure: 3, result: 4 }), 2);
  assert.equal(pickAzure({ azure: 3, result: 4 }), 3);
  assert.equal(pickAzure({ result: 4 }), 4);
});

// ---- falsy passthrough ----
// TODO: verify this test — current implementation uses `||`, so falsy legitimate
// values (e.g., ts: 0, passage: "") fall through to the next candidate. These
// tests document that behavior; they're not necessarily "correct" product-wise.
t("pickTS with ts=0 falls through (|| semantics)", () => {
  assert.equal(pickTS({ ts: 0, created_at: 99 }), 99);
});

t("pickPassageKey with empty passage_key falls through", () => {
  assert.equal(pickPassageKey({ passage_key: "", passageKey: "b" }), "b");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
