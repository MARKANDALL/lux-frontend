// tests/escape-html.test.js
// Smoke + edge-case tests for helpers/escape-html.js (17 inbound imports — XSS prevention).
// Run: node tests/escape-html.test.js

import assert from "node:assert/strict";
import { escapeHtml } from "../helpers/escape-html.js";

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

console.log("helpers/escape-html.js");

t("module exports escapeHtml function", () => {
  assert.equal(typeof escapeHtml, "function");
});

t("escapes the five HTML-sensitive characters", () => {
  assert.equal(
    escapeHtml(`<script>alert("x&y")</script>`),
    "&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;"
  );
});

t("escapes single quotes as &#39;", () => {
  assert.equal(escapeHtml("it's"), "it&#39;s");
});

t("ampersand-first ordering avoids double-escape", () => {
  // If < were replaced before &, the resulting &lt; would become &amp;lt;
  assert.equal(escapeHtml("<"), "&lt;");
  assert.equal(escapeHtml("&lt;"), "&amp;lt;");
});

t("null and undefined become empty string", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

t("numbers coerce to string", () => {
  assert.equal(escapeHtml(42), "42");
  assert.equal(escapeHtml(0), "0");
});

t("empty string stays empty", () => {
  assert.equal(escapeHtml(""), "");
});

t("plain text passes through unchanged", () => {
  assert.equal(escapeHtml("hello world"), "hello world");
});

t("non-ASCII / unicode passes through (not escaped)", () => {
  assert.equal(escapeHtml("café — ɚ"), "café — ɚ");
});

t("escapes all instances, not just the first", () => {
  assert.equal(escapeHtml("<<>>"), "&lt;&lt;&gt;&gt;");
});

t("handles object coercion safely (toString)", () => {
  // Falls through to String(s ?? "") — objects become "[object Object]"
  assert.equal(escapeHtml({}), "[object Object]");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
