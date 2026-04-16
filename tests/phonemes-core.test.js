// tests/phonemes-core.test.js
// Smoke + edge-case tests for src/data/phonemes/core.js (13 inbound imports).
// Run: node tests/phonemes-core.test.js

import assert from "node:assert/strict";
import {
  norm,
  getCodesForIPA,
  normalizePhoneSequence,
} from "../src/data/phonemes/core.js";

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

console.log("src/data/phonemes/core.js");

// ---- smoke ----
t("exports norm, getCodesForIPA, normalizePhoneSequence", () => {
  assert.equal(typeof norm, "function");
  assert.equal(typeof getCodesForIPA, "function");
  assert.equal(typeof normalizePhoneSequence, "function");
});

// ---- norm ----
t("norm returns null/undefined/empty unchanged", () => {
  assert.equal(norm(null), null);
  assert.equal(norm(undefined), undefined);
  assert.equal(norm(""), "");
});

t("norm maps Azure vowel codes → IPA", () => {
  assert.equal(norm("iy"), "i");
  assert.equal(norm("ih"), "ɪ");
  assert.equal(norm("ae"), "æ");
  assert.equal(norm("ax"), "ə");
  assert.equal(norm("er"), "ɝ");
});

t("norm maps Azure consonant codes → IPA", () => {
  assert.equal(norm("th"), "θ");
  assert.equal(norm("dh"), "ð");
  assert.equal(norm("sh"), "ʃ");
  assert.equal(norm("ng"), "ŋ");
  assert.equal(norm("ch"), "tʃ");
  assert.equal(norm("jh"), "dʒ");
});

t("norm is case-insensitive for ASCII codes but preserves IPA", () => {
  assert.equal(norm("IY"), "i");
  assert.equal(norm("AE"), "æ");
  // IPA stays as-is
  assert.equal(norm("ʃ"), "ʃ");
});

t("norm trims whitespace", () => {
  assert.equal(norm("  iy  "), "i");
});

t("norm handles legacy single-codepoint affricates", () => {
  assert.equal(norm("ʧ"), "tʃ");
  assert.equal(norm("ʤ"), "dʒ");
});

t("norm strips tie bars (U+0361, U+035C)", () => {
  assert.equal(norm("t\u0361ʃ"), "tʃ");
  assert.equal(norm("d\u035Cʒ"), "dʒ");
});

t("norm returns unknown symbols unchanged (after lowercase/trim)", () => {
  assert.equal(norm("zzz"), "zzz");
});

t("norm handles asset aliases schwa / u_short", () => {
  assert.equal(norm("schwa"), "ə");
  assert.equal(norm("u_short"), "ʊ");
});

// ---- getCodesForIPA ----
t("getCodesForIPA returns array of ASCII codes for IPA", () => {
  const codes = getCodesForIPA("ə");
  assert.ok(Array.isArray(codes));
  assert.ok(codes.includes("ax"), `expected 'ax' in ${JSON.stringify(codes)}`);
  assert.ok(codes.includes("schwa"));
});

t("getCodesForIPA returns empty array for unknown symbol", () => {
  const codes = getCodesForIPA("zzz");
  assert.deepEqual(codes, []);
});

t("getCodesForIPA dedupes results", () => {
  const codes = getCodesForIPA("ʃ");
  const unique = new Set(codes);
  assert.equal(codes.length, unique.size);
});

// ---- normalizePhoneSequence ----
t("normalizePhoneSequence returns [] for non-array", () => {
  assert.deepEqual(normalizePhoneSequence(null), []);
  assert.deepEqual(normalizePhoneSequence(undefined), []);
  assert.deepEqual(normalizePhoneSequence("iy"), []);
});

t("normalizePhoneSequence maps each symbol through norm()", () => {
  assert.deepEqual(normalizePhoneSequence(["iy", "ng"]), ["i", "ŋ"]);
});

t("normalizePhoneSequence coalesces schwa + r → ɚ", () => {
  assert.deepEqual(normalizePhoneSequence(["ax", "r"]), ["ɚ"]);
  // Also with already-IPA symbols
  assert.deepEqual(normalizePhoneSequence(["ə", "ɹ"]), ["ɚ"]);
});

t("normalizePhoneSequence leaves non-rhotic schwas alone", () => {
  assert.deepEqual(normalizePhoneSequence(["ax", "n"]), ["ə", "n"]);
});

t("normalizePhoneSequence handles empty array", () => {
  assert.deepEqual(normalizePhoneSequence([]), []);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
