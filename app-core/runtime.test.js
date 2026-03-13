// app-core/runtime.test.js
// One-line: Tests the shared runtime contract for last attempt ID and last recording sync across module state, luxBus, and window fallbacks.

import { describe, it, expect, vi, beforeEach } from "vitest";

async function fresh() {
  vi.resetModules();
  globalThis.window = {};

  const runtime = await import("../app-core/runtime.js");
  const { luxBus } = await import("../app-core/lux-bus.js");

  return { ...runtime, luxBus };
}

beforeEach(() => {
  vi.resetModules();
  globalThis.window = {};
});

describe("app-core/runtime contract", () => {
  it("setLastAttemptId syncs runtime, bus, and window", async () => {
    const { setLastAttemptId, getLastAttemptId, luxBus } = await fresh();

    expect(setLastAttemptId("attempt_1")).toBe("attempt_1");
    expect(getLastAttemptId()).toBe("attempt_1");
    expect(luxBus.get("lastAttemptId")).toBe("attempt_1");
    expect(globalThis.window.lastAttemptId).toBe("attempt_1");
  });

  it("getLastAttemptId falls back to bus when local module state is empty", async () => {
    vi.resetModules();
    globalThis.window = {};

    const { luxBus } = await import("../app-core/lux-bus.js");
    luxBus.set("lastAttemptId", "attempt_bus");

    const { getLastAttemptId } = await import("../app-core/runtime.js");
    expect(getLastAttemptId()).toBe("attempt_bus");
  });

  it("getLastAttemptId falls back to window when bus/local are empty", async () => {
    vi.resetModules();
    globalThis.window = { lastAttemptId: "attempt_win" };

    const { getLastAttemptId } = await import("../app-core/runtime.js");
    expect(getLastAttemptId()).toBe("attempt_win");
  });

  it("clearLastAttemptId clears bus and window mirrors", async () => {
    const { setLastAttemptId, clearLastAttemptId, getLastAttemptId, luxBus } = await fresh();

    setLastAttemptId("attempt_2");
    expect(clearLastAttemptId()).toBe(null);
    expect(getLastAttemptId()).toBe(null);
    expect(luxBus.get("lastAttemptId")).toBe(null);
    expect(globalThis.window.lastAttemptId).toBe(null);
  });

  it("setLastRecording syncs runtime, bus, and window", async () => {
    const { setLastRecording, getLastRecording, luxBus } = await fresh();
    const blob = { size: 1234, type: "audio/webm" };
    const meta = { scope: "practice", ts: 111 };

    expect(setLastRecording(blob, meta)).toEqual({ blob, meta });
    expect(getLastRecording()).toEqual({ blob, meta });
    expect(luxBus.get("lastRecording")).toEqual({ blob, meta });
    expect(globalThis.window.LuxLastRecordingBlob).toBe(blob);
    expect(globalThis.window.LuxLastRecordingMeta).toEqual(meta);
  });

  it("getLastRecording falls back to bus when local module state is empty", async () => {
    vi.resetModules();
    globalThis.window = {};

    const { luxBus } = await import("../app-core/lux-bus.js");
    const blob = { size: 77, type: "audio/mp3" };
    const meta = { scope: "convo", ts: 222 };
    luxBus.set("lastRecording", { blob, meta });

    const { getLastRecording } = await import("../app-core/runtime.js");
    expect(getLastRecording()).toEqual({ blob, meta });
  });

  it("getLastRecording falls back to window when bus/local are empty", async () => {
    vi.resetModules();
    const blob = { size: 55, type: "audio/wav" };
    const meta = { scope: "window", ts: 333 };
    globalThis.window = {
      LuxLastRecordingBlob: blob,
      LuxLastRecordingMeta: meta,
    };

    const { getLastRecording } = await import("../app-core/runtime.js");
    expect(getLastRecording()).toEqual({ blob, meta });
  });
});