// tests/phonemes-core.test.js
// Smoke + edge-case tests for src/data/phonemes/core.js (13 inbound imports).

import { describe, it, expect } from "vitest";
import {
  norm,
  getCodesForIPA,
  normalizePhoneSequence,
} from "../src/data/phonemes/core.js";

describe("src/data/phonemes/core.js", () => {
  // ---- smoke ----
  it("exports norm, getCodesForIPA, normalizePhoneSequence", () => {
    expect(typeof norm).toBe("function");
    expect(typeof getCodesForIPA).toBe("function");
    expect(typeof normalizePhoneSequence).toBe("function");
  });

  // ---- norm ----
  it("norm returns null/undefined/empty unchanged", () => {
    expect(norm(null)).toBe(null);
    expect(norm(undefined)).toBe(undefined);
    expect(norm("")).toBe("");
  });

  it("norm maps Azure vowel codes → IPA", () => {
    expect(norm("iy")).toBe("i");
    expect(norm("ih")).toBe("ɪ");
    expect(norm("ae")).toBe("æ");
    expect(norm("ax")).toBe("ə");
    expect(norm("er")).toBe("ɝ");
  });

  it("norm maps Azure consonant codes → IPA", () => {
    expect(norm("th")).toBe("θ");
    expect(norm("dh")).toBe("ð");
    expect(norm("sh")).toBe("ʃ");
    expect(norm("ng")).toBe("ŋ");
    expect(norm("ch")).toBe("tʃ");
    expect(norm("jh")).toBe("dʒ");
  });

  it("norm is case-insensitive for ASCII codes but preserves IPA", () => {
    expect(norm("IY")).toBe("i");
    expect(norm("AE")).toBe("æ");
    // IPA stays as-is
    expect(norm("ʃ")).toBe("ʃ");
  });

  it("norm trims whitespace", () => {
    expect(norm("  iy  ")).toBe("i");
  });

  it("norm handles legacy single-codepoint affricates", () => {
    expect(norm("ʧ")).toBe("tʃ");
    expect(norm("ʤ")).toBe("dʒ");
  });

  it("norm strips tie bars (U+0361, U+035C)", () => {
    expect(norm("t\u0361ʃ")).toBe("tʃ");
    expect(norm("d\u035Cʒ")).toBe("dʒ");
  });

  it("norm returns unknown symbols unchanged (after lowercase/trim)", () => {
    expect(norm("zzz")).toBe("zzz");
  });

  it("norm handles asset aliases schwa / u_short", () => {
    expect(norm("schwa")).toBe("ə");
    expect(norm("u_short")).toBe("ʊ");
  });

  // ---- getCodesForIPA ----
  it("getCodesForIPA returns array of ASCII codes for IPA", () => {
    const codes = getCodesForIPA("ə");
    expect(codes).toBeInstanceOf(Array);
    expect(codes).toContain("ax");
    expect(codes).toContain("schwa");
  });

  it("getCodesForIPA returns empty array for unknown symbol", () => {
    const codes = getCodesForIPA("zzz");
    expect(codes).toEqual([]);
  });

  it("getCodesForIPA dedupes results", () => {
    const codes = getCodesForIPA("ʃ");
    const unique = new Set(codes);
    expect(codes.length).toBe(unique.size);
  });

  // ---- normalizePhoneSequence ----
  it("normalizePhoneSequence returns [] for non-array", () => {
    expect(normalizePhoneSequence(null)).toEqual([]);
    expect(normalizePhoneSequence(undefined)).toEqual([]);
    expect(normalizePhoneSequence("iy")).toEqual([]);
  });

  it("normalizePhoneSequence maps each symbol through norm()", () => {
    expect(normalizePhoneSequence(["iy", "ng"])).toEqual(["i", "ŋ"]);
  });

  it("normalizePhoneSequence coalesces schwa + r → ɚ", () => {
    expect(normalizePhoneSequence(["ax", "r"])).toEqual(["ɚ"]);
    // Also with already-IPA symbols
    expect(normalizePhoneSequence(["ə", "ɹ"])).toEqual(["ɚ"]);
  });

  it("normalizePhoneSequence leaves non-rhotic schwas alone", () => {
    expect(normalizePhoneSequence(["ax", "n"])).toEqual(["ə", "n"]);
  });

  it("normalizePhoneSequence handles empty array", () => {
    expect(normalizePhoneSequence([])).toEqual([]);
  });
});