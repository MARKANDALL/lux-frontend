// api/util.test.js
// Phase C protection ring: tests for apiFetch and jsonOrThrow.

import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();

  // Mock fetch globally
  globalThis.fetch = vi.fn();

  // Force API_BASE deterministic
  globalThis.API_BASE = "";

  // Mock storage for getAdminToken
  const store = new Map();
  store.set("lux_admin_token", "test-token-123");
  globalThis.sessionStorage = {
    getItem: vi.fn((k) => store.get(k) ?? null),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn(),
  };
  globalThis.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
  globalThis.window = globalThis;
  globalThis.warnSwallow = vi.fn();
});

// Helper: create a mock Response
function mockResponse(body, { ok = true, status = 200 } = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    text: vi.fn(async () => text),
    json: vi.fn(async () => (typeof body === "string" ? JSON.parse(body) : body)),
    blob: vi.fn(async () => new Blob([text])),
  };
}

describe("apiFetch", () => {

  it("attaches x-admin-token header from storage", async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ ok: true }));

    const { apiFetch } = await import("../api/util.js");
    await apiFetch("/api/test");

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers["x-admin-token"]).toBeTruthy();
  });

  it("auto-sets Content-Type for JSON string body", async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ ok: true }));

    const { apiFetch } = await import("../api/util.js");
    await apiFetch("/api/test", {
      method: "POST",
      body: JSON.stringify({ key: "val" }),
    });

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("does NOT set Content-Type for FormData body", async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ ok: true }));

    const { apiFetch } = await import("../api/util.js");
    const fd = new FormData();
    fd.append("file", "data");
    await apiFetch("/api/upload", { method: "POST", body: fd });

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers["Content-Type"]).toBeUndefined();
  });

  it("returns parsed JSON by default (responseType json)", async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ rows: [1, 2, 3] }));

    const { apiFetch } = await import("../api/util.js");
    const data = await apiFetch("/api/data");
    expect(data).toEqual({ rows: [1, 2, 3] });
  });

  it("throws on non-ok response with error message from body", async () => {
    globalThis.fetch.mockResolvedValue(
      mockResponse({ error: "Not found" }, { ok: false, status: 404 })
    );

    const { apiFetch } = await import("../api/util.js");
    await expect(apiFetch("/api/missing")).rejects.toThrow("Not found");
  });

  it("responseType 'text' returns raw text", async () => {
    globalThis.fetch.mockResolvedValue(mockResponse("hello plain text"));

    const { apiFetch } = await import("../api/util.js");
    const result = await apiFetch("/api/text", { responseType: "text" });
    expect(result).toBe("hello plain text");
  });

  it("responseType 'blob' returns a Blob", async () => {
    const resp = mockResponse("binary-data");
    globalThis.fetch.mockResolvedValue(resp);

    const { apiFetch } = await import("../api/util.js");
    const result = await apiFetch("/api/audio", { responseType: "blob" });
    expect(result).toBeInstanceOf(Blob);
  });

  it("responseType 'response' returns the raw Response", async () => {
    const resp = mockResponse({ ok: true });
    globalThis.fetch.mockResolvedValue(resp);

    const { apiFetch } = await import("../api/util.js");
    const result = await apiFetch("/api/raw", { responseType: "response" });
    expect(result).toBe(resp);
  });

  it("passes through extra options like method and signal", async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ ok: true }));
    const ctrl = new AbortController();

    const { apiFetch } = await import("../api/util.js");
    await apiFetch("/api/cancel", { method: "DELETE", signal: ctrl.signal });

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.method).toBe("DELETE");
    expect(opts.signal).toBe(ctrl.signal);
  });

  it("caller headers merge with (but don't override) token header", async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({ ok: true }));

    const { apiFetch } = await import("../api/util.js");
    await apiFetch("/api/custom", {
      headers: { "X-Custom": "yes" },
    });

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers["X-Custom"]).toBe("yes");
    expect(opts.headers["x-admin-token"]).toBeTruthy();
  });
});

describe("jsonOrThrow", () => {

  it("parses valid JSON from ok response", async () => {
    const { jsonOrThrow } = await import("../api/util.js");
    const resp = { ok: true, status: 200, text: async () => '{"a":1}' };
    const data = await jsonOrThrow(resp);
    expect(data).toEqual({ a: 1 });
  });

  it("throws with message from error body on non-ok", async () => {
    const { jsonOrThrow } = await import("../api/util.js");
    const resp = {
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => '{"error":"Access denied"}',
    };
    await expect(jsonOrThrow(resp)).rejects.toThrow("Access denied");
  });

  it("throws on invalid JSON with snippet of response", async () => {
    const { jsonOrThrow } = await import("../api/util.js");
    const resp = {
      ok: true,
      status: 200,
      text: async () => "this is not json",
    };
    await expect(jsonOrThrow(resp)).rejects.toThrow("Bad JSON");
  });
});