// tests/escape-html.test.js
// Smoke + edge-case tests for helpers/escape-html.js (17 inbound imports — XSS prevention).

import { describe, it, expect } from "vitest";
import { escapeHtml } from "../helpers/escape-html.js";

describe("helpers/escape-html.js", () => {
  it("module exports escapeHtml function", () => {
    expect(typeof escapeHtml).toBe("function");
  });

  it("escapes the five HTML-sensitive characters", () => {
    expect(escapeHtml(`<script>alert("x&y")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;"
    );
  });

  it("escapes single quotes as &#39;", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("ampersand-first ordering avoids double-escape", () => {
    // If < were replaced before &, the resulting &lt; would become &amp;lt;
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("null and undefined become empty string", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("numbers coerce to string", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(0)).toBe("0");
  });

  it("empty string stays empty", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("plain text passes through unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });

  it("non-ASCII / unicode passes through (not escaped)", () => {
    expect(escapeHtml("café — ɚ")).toBe("café — ɚ");
  });

  it("escapes all instances, not just the first", () => {
    expect(escapeHtml("<<>>")).toBe("&lt;&lt;&gt;&gt;");
  });

  it("handles object coercion safely (toString)", () => {
    // Falls through to String(s ?? "") — objects become "[object Object]"
    expect(escapeHtml({})).toBe("[object Object]");
  });
});