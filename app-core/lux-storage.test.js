// app-core/lux-storage.test.js
// Phase C protection ring: tests for the storage helpers + key registry.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage and sessionStorage before importing the module
const localStore = new Map();
const sessionStore = new Map();

globalThis.localStorage = {
  getItem: vi.fn((k) => localStore.get(k) ?? null),
  setItem: vi.fn((k, v) => localStore.set(k, String(v))),
  removeItem: vi.fn((k) => localStore.delete(k)),
};

globalThis.sessionStorage = {
  getItem: vi.fn((k) => sessionStore.get(k) ?? null),
  setItem: vi.fn((k, v) => sessionStore.set(k, String(v))),
  removeItem: vi.fn((k) => sessionStore.delete(k)),
};

globalThis.warnSwallow = vi.fn();

import {
  getString, setString, remove,
  getBool, setBool,
  getJSON, setJSON,
  sessionGet, sessionSet, sessionRemove,
  sessionGetNum, sessionSetNum,
  K_IDENTITY_UID, K_ADMIN_TOKEN, K_CONVO_KNOBS,
} from "../app-core/lux-storage.js";

beforeEach(() => {
  localStore.clear();
  sessionStore.clear();
  vi.clearAllMocks();
});

describe("localStorage helpers", () => {

  it("setString + getString round-trips", () => {
    setString("test_key", "hello");
    expect(getString("test_key")).toBe("hello");
  });

  it("getString returns null for missing key", () => {
    expect(getString("nonexistent")).toBeNull();
  });

  it("remove deletes a key", () => {
    setString("del_me", "value");
    remove("del_me");
    expect(getString("del_me")).toBeNull();
  });

  it("setBool + getBool round-trips", () => {
    setBool("flag", true);
    expect(getBool("flag")).toBe(true);

    setBool("flag", false);
    expect(getBool("flag")).toBe(false);
  });

  it("getBool treats '1' and 'true' as true, everything else as false", () => {
    localStore.set("b1", "1");
    expect(getBool("b1")).toBe(true);

    localStore.set("b2", "true");
    expect(getBool("b2")).toBe(true);

    localStore.set("b3", "0");
    expect(getBool("b3")).toBe(false);

    localStore.set("b4", "yes");
    expect(getBool("b4")).toBe(false);

    expect(getBool("missing")).toBe(false);
  });

  it("setJSON + getJSON round-trips objects", () => {
    const obj = { level: "B2", tone: "friendly" };
    setJSON("knobs", obj);
    expect(getJSON("knobs")).toEqual(obj);
  });

  it("getJSON returns fallback on missing key", () => {
    expect(getJSON("nope", { default: true })).toEqual({ default: true });
  });

  it("getJSON returns fallback on corrupt JSON", () => {
    localStore.set("bad", "not{json");
    expect(getJSON("bad", [])).toEqual([]);
  });
});

describe("sessionStorage helpers", () => {

  it("sessionSet + sessionGet round-trips", () => {
    sessionSet("sk", "val");
    expect(sessionGet("sk")).toBe("val");
  });

  it("sessionGet returns null for missing key", () => {
    expect(sessionGet("miss")).toBeNull();
  });

  it("sessionRemove deletes a key", () => {
    sessionSet("rm", "x");
    sessionRemove("rm");
    expect(sessionGet("rm")).toBeNull();
  });

  it("sessionSetNum + sessionGetNum round-trips numbers", () => {
    sessionSetNum("count", 42);
    expect(sessionGetNum("count")).toBe(42);
  });

  it("sessionGetNum returns 0 for missing key", () => {
    expect(sessionGetNum("no_count")).toBe(0);
  });
});

describe("key registry constants", () => {

  it("K_IDENTITY_UID is the canonical UID key", () => {
    expect(K_IDENTITY_UID).toBe("LUX_USER_ID");
  });

  it("K_ADMIN_TOKEN matches the bare string used in admin pages", () => {
    expect(K_ADMIN_TOKEN).toBe("lux_admin_token");
  });

  it("K_CONVO_KNOBS is the knobs v3 key", () => {
    expect(K_CONVO_KNOBS).toBe("lux_knobs_v3");
  });
});

describe("error resilience", () => {

  it("getString swallows storage errors gracefully", () => {
    const orig = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = vi.fn(() => { throw new Error("quota"); });

    // Should return null, not throw
    expect(getString("anything")).toBeNull();

    globalThis.localStorage.getItem = orig;
  });

  it("setString swallows storage errors gracefully", () => {
    const orig = globalThis.localStorage.setItem;
    globalThis.localStorage.setItem = vi.fn(() => { throw new Error("quota"); });

    // Should not throw
    expect(() => setString("anything", "val")).not.toThrow();

    globalThis.localStorage.setItem = orig;
  });
});