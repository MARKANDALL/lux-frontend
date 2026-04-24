// tests/convo-core.test.js
// Smoke + edge-case tests for features/convo/ — renderer behavior, scenario-bus
// events, knobs (level/tone/length), practiceMeta helpers, and pure helpers.
// Style mirrors _api/identity.test.js + app-core/lux-bus.test.js — no new
// frameworks, fixtures, or helpers introduced.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── convo-api.js exercises _api/convo.js; mock so no real fetch is made.
// All other tests don't touch the module, so this mock is a no-op for them.
vi.mock("../_api/convo.js", () => ({
  convoTurn: vi.fn(async () => ({
    assistant: "hi",
    suggested_replies: ["a", "b", "c"],
  })),
}));

// ── Minimal localStorage mock (same shape as api/identity.test.js)
function makeStorageMock() {
  const store = new Map();
  return {
    getItem: vi.fn((k) => store.get(k) ?? null),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn((k) => store.delete(k)),
    clear: vi.fn(() => store.clear()),
    _store: store,
  };
}

let storageMock;

beforeEach(() => {
  storageMock = makeStorageMock();
  globalThis.localStorage = storageMock;
  globalThis.sessionStorage = makeStorageMock();
  // Several transitively-loaded modules (audio-inspector, etc.) call
  // globalThis.warnSwallow at import time in a catch branch.
  globalThis.warnSwallow = vi.fn();
});

afterEach(() => {
  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
  delete globalThis.warnSwallow;
});

// ──────────────────────────────────────────────────────────────────────────
// convo-highlight.js  —  pure helpers used by the renderer
// ──────────────────────────────────────────────────────────────────────────
describe("convo-highlight: stripMarks", () => {
  it("removes {~ ~} (yellow) and {^ ^} (blue) mark wrappers", async () => {
    const { stripMarks } = await import("../features/convo/convo-highlight.js");
    expect(stripMarks("hello {~coffee~} and {^tea^}")).toBe("hello coffee and tea");
  });

  it("coerces null / undefined / empty to a string", async () => {
    const { stripMarks } = await import("../features/convo/convo-highlight.js");
    expect(stripMarks(null)).toBe("");
    expect(stripMarks(undefined)).toBe("");
    expect(stripMarks("")).toBe("");
  });
});

describe("convo-highlight: highlightHtml", () => {
  it("escapes HTML-sensitive characters in the output", async () => {
    const { highlightHtml } = await import("../features/convo/convo-highlight.js");
    const out = highlightHtml("<script>x</script>", { wordBank: [], autoBlue: false });
    expect(out).toContain("&lt;script&gt;");
    expect(out).not.toContain("<script>");
  });

  it("wraps word-bank matches in a lux-hl span (yellow)", async () => {
    const { highlightHtml } = await import("../features/convo/convo-highlight.js");
    const out = highlightHtml("I like coffee.", { wordBank: ["coffee"], autoBlue: false });
    expect(out).toBe('I like <span class="lux-hl">coffee</span>.');
  });

  it("wraps {^ ^} marks in a lux-hl2 span (blue) and strips the mark syntax", async () => {
    const { highlightHtml } = await import("../features/convo/convo-highlight.js");
    const out = highlightHtml("say {^thing^} please", { wordBank: [], autoBlue: false });
    expect(out).toBe('say <span class="lux-hl2">thing</span> please');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// convo-knobs.js  —  thin public re-exporter with summary formatter
// ──────────────────────────────────────────────────────────────────────────
describe("convo-knobs: knobsSummaryText", () => {
  it("formats level (UPPERCASE) · tone (capitalized + emoji) · length (capitalized)", async () => {
    const { knobsSummaryText } = await import("../features/convo/convo-knobs.js");
    const out = knobsSummaryText({ level: "b1", tone: "friendly", length: "medium" });
    expect(out).toMatch(/^B1 · .*Friendly · Medium$/);
    expect(out).toContain("😊"); // friendly tone emoji
  });

  it("inserts the role label between level and tone when provided", async () => {
    const { knobsSummaryText } = await import("../features/convo/convo-knobs.js");
    const out = knobsSummaryText({ level: "a2", tone: "neutral", length: "short" }, "Barista");
    const parts = out.split(" · ");
    expect(parts[0]).toBe("A2");
    expect(parts[1]).toBe("Barista");
    expect(parts[2]).toContain("Neutral");
    expect(parts[3]).toBe("Short");
  });
});

// ──────────────────────────────────────────────────────────────────────────
// knobs-drawer.js  —  storage-backed knobs state + scenario-bus emission
// ──────────────────────────────────────────────────────────────────────────
describe("knobs-drawer: formatKnobsSummary", () => {
  it("returns 'Level · Tone · Length' with defaults filled in when fields missing", async () => {
    const { formatKnobsSummary } = await import("../features/convo/knobs-drawer.js");
    expect(formatKnobsSummary({})).toBe("Level: B1 · Tone: Neutral · Length: Medium");
  });
});

describe("knobs-drawer: getKnobs / setKnobs (level/tone/length)", () => {
  it("getKnobs returns defaults when localStorage is empty", async () => {
    const { getKnobs } = await import("../features/convo/knobs-drawer.js");
    expect(getKnobs()).toEqual({ level: "B1", tone: "neutral", length: "medium" });
  });

  it("setKnobs merges a partial patch onto the current stored state", async () => {
    const { getKnobs, setKnobs } = await import("../features/convo/knobs-drawer.js");
    setKnobs({ level: "C1" });
    setKnobs({ tone: "playful" });
    const k = getKnobs();
    expect(k.level).toBe("C1");
    expect(k.tone).toBe("playful");
    expect(k.length).toBe("medium"); // untouched default
  });

  it("setKnobs emits a 'knobs' event on luxBus (scenario-bus smoke)", async () => {
    const { setKnobs } = await import("../features/convo/knobs-drawer.js");
    const { luxBus } = await import("../app-core/lux-bus.js");
    const cb = vi.fn();
    const unsub = luxBus.on("knobs", cb);
    setKnobs({ length: "long" });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toMatchObject({ length: "long" });
    unsub();
  });
});

describe("knobs-drawer: TONE_EMOJI map", () => {
  it("has an entry for every knob tone and each value is a non-empty string", async () => {
    const { TONE_EMOJI } = await import("../features/convo/knobs-drawer.js");
    const required = ["neutral", "formal", "friendly", "enthusiastic", "tired", "angry"];
    for (const tone of required) {
      expect(typeof TONE_EMOJI[tone]).toBe("string");
      expect(TONE_EMOJI[tone].length).toBeGreaterThan(0);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────
// convo-shared.js  —  tiny DOM + id helpers
// ──────────────────────────────────────────────────────────────────────────
describe("convo-shared: el / newSessionId", () => {
  it("el() builds an element with class and textContent, omitting text when null", async () => {
    const created = [];
    globalThis.document = {
      createElement: (tag) => {
        const n = { tagName: tag, className: "", textContent: "", _tag: tag };
        created.push(n);
        return n;
      },
    };

    const { el } = await import("../features/convo/convo-shared.js");
    const withText = el("div", "msg user", "hi");
    expect(withText._tag).toBe("div");
    expect(withText.className).toBe("msg user");
    expect(withText.textContent).toBe("hi");

    const noText = el("span", "bare");
    expect(noText.textContent).toBe(""); // untouched when text arg is null/undefined

    delete globalThis.document;
  });

  it("newSessionId() returns a non-empty string and two calls differ", async () => {
    const { newSessionId } = await import("../features/convo/convo-shared.js");
    const a = newSessionId();
    const b = newSessionId();
    expect(typeof a).toBe("string");
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// convo-coach.js  —  targetsInline helper (practiceMeta-style formatting)
// ──────────────────────────────────────────────────────────────────────────
describe("convo-coach: targetsInline (practiceMeta formatter)", () => {
  it("returns '/ipa/ · word1, word2' when both phoneme and words are provided", async () => {
    const { createConvoCoach } = await import("../features/convo/convo-coach.js");
    const coach = createConvoCoach({
      state: {}, coachBar: {}, input: { addEventListener: () => {} }, el: () => ({}),
    });
    const out = coach.targetsInline({
      targets: { phoneme: { ipa: "θ" }, words: [{ word: "three" }, { word: "think" }] },
    });
    expect(out).toBe("/θ/ · three, think");
  });

  it("returns empty string when plan is null or has no targets", async () => {
    const { createConvoCoach } = await import("../features/convo/convo-coach.js");
    const coach = createConvoCoach({
      state: {}, coachBar: {}, input: { addEventListener: () => {} }, el: () => ({}),
    });
    expect(coach.targetsInline(null)).toBe("");
    expect(coach.targetsInline({ targets: {} })).toBe("");
  });
});

// ──────────────────────────────────────────────────────────────────────────
// convo-api.js  —  UI-friendly wrapper around convoTurn (error envelope)
// ──────────────────────────────────────────────────────────────────────────
describe("convo-api: convoTurnWithUi", () => {
  it("returns a non-throwing UI fallback envelope when convoTurn rejects", async () => {
    // Re-configure the hoisted mock for this test only
    const convoMod = await import("../_api/convo.js");
    convoMod.convoTurn.mockRejectedValueOnce(new Error("network down"));

    const { convoTurnWithUi } = await import("../features/convo/convo-api.js");
    const out = await convoTurnWithUi({ scenario: {}, knobs: {}, messages: [] });

    expect(typeof out.assistant).toBe("string");
    expect(out.assistant).toMatch(/couldn.t get the next AI turn/i);
    expect(Array.isArray(out.suggested_replies)).toBe(true);
    expect(out.suggested_replies.length).toBe(3);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// convo-render.js  —  renderer behavior (messages list)
// ──────────────────────────────────────────────────────────────────────────
describe("convo-render: renderMessages", () => {
  it("clears msgs, appends one bubble per message, and scrolls to the bottom", async () => {
    // Minimal DOM stand-in for `document.createElement` used by escapeHtml inputs.
    globalThis.document = { createElement: () => ({ textContent: "", className: "" }) };

    const { initConvoRender, renderMessages } = await import(
      "../features/convo/convo-render.js"
    );

    const bubbles = [];
    const msgs = {
      _innerHtmlWrites: [],
      set innerHTML(v) { this._innerHtmlWrites.push(v); },
      get innerHTML() { return this._innerHtmlWrites[this._innerHtmlWrites.length - 1] ?? ""; },
      append: (node) => bubbles.push(node),
      scrollHeight: 123,
      scrollTop: 0,
    };
    const fakeEl = (tag, cls) => {
      const n = { tagName: tag, className: cls || "", innerHTML: "" };
      return n;
    };

    initConvoRender({
      state: {
        nextActivity: null,
        messages: [
          { role: "user", content: "hello" },
          { role: "assistant", content: "hi there" },
        ],
      },
      msgs,
      sugs: {},
      sugsNote: {},
      input: {},
      el: fakeEl,
      coach: { targetsInline: () => "", noteSuggestionsRendered: () => {} },
    });

    renderMessages();

    expect(msgs._innerHtmlWrites[0]).toBe(""); // first write clears
    expect(bubbles.length).toBe(2);
    expect(bubbles[0].className).toContain("user");
    expect(bubbles[1].className).toContain("assistant");
    expect(msgs.scrollTop).toBe(msgs.scrollHeight);

    delete globalThis.document;
  });
});

// ──────────────────────────────────────────────────────────────────────────
// scenarios.js  —  data shape smoke test
// ──────────────────────────────────────────────────────────────────────────
describe("scenarios: SCENARIOS data", () => {
  it("is a non-empty array with quick-practice and each item well-shaped", async () => {
    const { SCENARIOS } = await import("../features/convo/scenarios.js");
    expect(Array.isArray(SCENARIOS)).toBe(true);
    expect(SCENARIOS.length).toBeGreaterThan(1);

    const qp = SCENARIOS.find((s) => s.id === "quick-practice");
    expect(qp).toBeTruthy();
    expect(typeof qp.title).toBe("string");

    for (const s of SCENARIOS) {
      expect(typeof s.id).toBe("string");
      expect(typeof s.title).toBe("string");
      expect(typeof s.desc).toBe("string");
      expect(Array.isArray(s.roles)).toBe(true);
      expect(s.roles.length).toBeGreaterThanOrEqual(2);
      for (const r of s.roles) {
        expect(typeof r.id).toBe("string");
        expect(typeof r.label).toBe("string");
      }
    }
  });
});
