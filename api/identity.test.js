// api/identity.test.js
// Phase C protection ring: tests for ensureUID / getUID / setUID.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to isolate each test because identity.js reads localStorage at import time.
// Using vi.resetModules() + dynamic import() per test.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Minimal localStorage/sessionStorage mock
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
  vi.resetModules();
  storageMock = makeStorageMock();

  // Mock browser globals
  globalThis.window = globalThis;
  globalThis.localStorage = storageMock;
  globalThis.document = {
    documentElement: { setAttribute: vi.fn() },
  };
  globalThis.location = { search: "" };
  globalThis.LUX_USER_ID = undefined;
  globalThis.warnSwallow = vi.fn();
});

afterEach(() => {
  delete globalThis.LUX_USER_ID;
  delete globalThis.warnSwallow;
});

describe("ensureUID", () => {

  it("generates a valid UUID when nothing is stored", async () => {
    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(uid).toMatch(UUID_RE);
  });

  it("persists the generated UID to localStorage under both keys", async () => {
    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();

    expect(storageMock.setItem).toHaveBeenCalledWith("LUX_USER_ID", uid);
    expect(storageMock.setItem).toHaveBeenCalledWith("lux_user_id", uid);
  });

  it("sets window.LUX_USER_ID", async () => {
    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(globalThis.LUX_USER_ID).toBe(uid);
  });

  it("sets data-uid attribute on document element", async () => {
    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith("data-uid", uid);
  });

  it("recovers UID from localStorage (canonical key)", async () => {
    const existing = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
    storageMock._store.set("LUX_USER_ID", existing);

    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(uid).toBe(existing);
  });

  it("recovers UID from legacy localStorage key", async () => {
    const legacy = "11111111-2222-4333-a444-555555555555";
    storageMock._store.set("lux_user_id", legacy);

    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(uid).toBe(legacy);
  });

  it("prefers ?uid= query param over localStorage", async () => {
    const fromUrl = "aaaaaaaa-bbbb-4ccc-9ddd-eeeeeeeeeeee";
    globalThis.location = { search: `?uid=${fromUrl}` };
    storageMock._store.set("LUX_USER_ID", "99999999-8888-4777-a666-555555555555");

    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(uid).toBe(fromUrl);
  });

  it("ignores invalid ?uid= and falls through to localStorage", async () => {
    globalThis.location = { search: "?uid=not-a-uuid" };
    const stored = "aaaaaaaa-bbbb-4ccc-9ddd-eeeeeeeeeeee";
    storageMock._store.set("LUX_USER_ID", stored);

    const { ensureUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(uid).toBe(stored);
  });

  it("returns same UID on repeated calls (idempotent)", async () => {
    const { ensureUID } = await import("../api/identity.js");
    const first = ensureUID();
    const second = ensureUID();
    expect(first).toBe(second);
  });
});

describe("getUID", () => {

  it("returns the UID set by ensureUID", async () => {
    const { ensureUID, getUID } = await import("../api/identity.js");
    const uid = ensureUID();
    expect(getUID()).toBe(uid);
  });

  it("lazy-inits if ensureUID was never called", async () => {
    const { getUID } = await import("../api/identity.js");
    const uid = getUID();
    expect(uid).toMatch(UUID_RE);
  });
});

describe("setUID", () => {

  it("overwrites the current UID", async () => {
    const { ensureUID, setUID, getUID } = await import("../api/identity.js");
    ensureUID();
    const newUid = "12345678-abcd-4ef0-9012-abcdef123456";
    setUID(newUid);
    expect(getUID()).toBe(newUid);
  });

  it("persists to localStorage", async () => {
    const { setUID } = await import("../api/identity.js");
    const newUid = "12345678-abcd-4ef0-9012-abcdef123456";
    setUID(newUid);
    expect(storageMock.setItem).toHaveBeenCalledWith("LUX_USER_ID", newUid);
  });
});