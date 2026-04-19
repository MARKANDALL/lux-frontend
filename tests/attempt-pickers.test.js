// tests/attempt-pickers.test.js
// Smoke + edge-case tests for features/progress/attempt-pickers.js (13 inbound imports).

import { describe, it, expect } from "vitest";
import {
  pickTS,
  pickPassageKey,
  pickSessionId,
  pickSummary,
  pickAzure,
} from "../features/progress/attempt-pickers.js";

describe("features/progress/attempt-pickers.js", () => {
  it("exports all five pickers as functions", () => {
    expect(typeof pickTS).toBe("function");
    expect(typeof pickPassageKey).toBe("function");
    expect(typeof pickSessionId).toBe("function");
    expect(typeof pickSummary).toBe("function");
    expect(typeof pickAzure).toBe("function");
  });

  // ---- null / undefined safety ----
  it("all pickers survive null and undefined", () => {
    for (const fn of [pickTS, pickPassageKey, pickSessionId, pickSummary, pickAzure]) {
      expect(() => fn(null)).not.toThrow();
      expect(() => fn(undefined)).not.toThrow();
    }
  });

  it("pickTS returns null on empty input", () => {
    expect(pickTS(null)).toBe(null);
    expect(pickTS({})).toBe(null);
  });

  it("pickPassageKey / pickSessionId return '' on empty input", () => {
    expect(pickPassageKey(null)).toBe("");
    expect(pickPassageKey({})).toBe("");
    expect(pickSessionId(null)).toBe("");
    expect(pickSessionId({})).toBe("");
  });

  it("pickSummary / pickAzure return null on empty input", () => {
    expect(pickSummary(null)).toBe(null);
    expect(pickSummary({})).toBe(null);
    expect(pickAzure(null)).toBe(null);
    expect(pickAzure({})).toBe(null);
  });

  // ---- precedence (schema drift) ----
  it("pickTS precedence: ts > created_at > createdAt > time > localTime", () => {
    expect(pickTS({ ts: 1, created_at: 2, createdAt: 3 })).toBe(1);
    expect(pickTS({ created_at: 2, createdAt: 3 })).toBe(2);
    expect(pickTS({ createdAt: 3, time: 4 })).toBe(3);
    expect(pickTS({ time: 4, localTime: 5 })).toBe(4);
    expect(pickTS({ localTime: 5 })).toBe(5);
  });

  it("pickPassageKey precedence: passage_key > passageKey > passage", () => {
    expect(pickPassageKey({ passage_key: "a", passageKey: "b", passage: "c" })).toBe("a");
    expect(pickPassageKey({ passageKey: "b", passage: "c" })).toBe("b");
    expect(pickPassageKey({ passage: "c" })).toBe("c");
  });

  it("pickSessionId precedence: session_id > sessionId", () => {
    expect(pickSessionId({ session_id: "a", sessionId: "b" })).toBe("a");
    expect(pickSessionId({ sessionId: "b" })).toBe("b");
  });

  it("pickSummary precedence: summary > summary_json > sum", () => {
    expect(pickSummary({ summary: "a", summary_json: "b", sum: "c" })).toBe("a");
    expect(pickSummary({ summary_json: "b", sum: "c" })).toBe("b");
    expect(pickSummary({ sum: "c" })).toBe("c");
  });

  it("pickAzure precedence: azureResult > azure_result > azure > result", () => {
    const obj = { azureResult: 1, azure_result: 2, azure: 3, result: 4 };
    expect(pickAzure(obj)).toBe(1);
    expect(pickAzure({ azure_result: 2, azure: 3, result: 4 })).toBe(2);
    expect(pickAzure({ azure: 3, result: 4 })).toBe(3);
    expect(pickAzure({ result: 4 })).toBe(4);
  });

  // ---- falsy passthrough ----
  // TODO: verify this test — current implementation uses `||`, so falsy legitimate
  // values (e.g., ts: 0, passage: "") fall through to the next candidate. These
  // tests document that behavior; they're not necessarily "correct" product-wise.
  it("pickTS with ts=0 falls through (|| semantics)", () => {
    expect(pickTS({ ts: 0, created_at: 99 })).toBe(99);
  });

  it("pickPassageKey with empty passage_key falls through", () => {
    expect(pickPassageKey({ passage_key: "", passageKey: "b" })).toBe("b");
  });
});