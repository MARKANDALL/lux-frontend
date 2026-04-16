import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, id: 123 }),
    text: async () => JSON.stringify({ ok: true, id: 123 }),
  });

  // Force API_BASE deterministic for tests (important because it's computed at import time)
  globalThis.API_BASE = "";
});

describe("api/attempts contract (frontend)", () => {
  it("saveAttempt POSTs JSON to /api/attempt", async () => {
    const { saveAttempt } = await import("../_api/attempts.js");

    await saveAttempt({
      uid: "u_test",
      passageKey: "harvard01",
      partIndex: 0,
      text: "Hello",
      sessionId: "s1",
      summary: { overallScore: 80 },
    });

    expect(globalThis.fetch).toHaveBeenCalled();
    const [url, opts] = globalThis.fetch.mock.calls[0];

    expect(url).toContain("/api/attempt");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(opts.body);
    expect(body.uid).toBe("u_test");
  });
});