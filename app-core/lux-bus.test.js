// app-core/lux-bus.test.js
// Phase C protection ring: tests for the shared pub/sub state bus.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { luxBus } from "../app-core/lux-bus.js";

beforeEach(() => {
  // Clear internal state between tests by overwriting known keys
  // (lux-bus has no public reset, so we just set keys to undefined)
  luxBus.set('_test_', undefined);
});

describe("luxBus core contract", () => {

  // ── set / get ──

  it("set() stores a value retrievable by get()", () => {
    luxBus.set('testKey', 42);
    expect(luxBus.get('testKey')).toBe(42);
  });

  it("get() returns undefined for unset keys", () => {
    expect(luxBus.get('never_set_key_xyz')).toBeUndefined();
  });

  it("set() overwrites previous value", () => {
    luxBus.set('overwrite', "first");
    luxBus.set('overwrite', "second");
    expect(luxBus.get('overwrite')).toBe("second");
  });

  it("set() can store objects, arrays, and null", () => {
    luxBus.set('obj', { a: 1 });
    expect(luxBus.get('obj')).toEqual({ a: 1 });

    luxBus.set('arr', [1, 2, 3]);
    expect(luxBus.get('arr')).toEqual([1, 2, 3]);

    luxBus.set('nul', null);
    expect(luxBus.get('nul')).toBeNull();
  });

  // ── update (shallow merge) ──

  it("update() shallow-merges into existing object", () => {
    luxBus.set('merge', { a: 1, b: 2 });
    luxBus.update('merge', { b: 99, c: 3 });
    expect(luxBus.get('merge')).toEqual({ a: 1, b: 99, c: 3 });
  });

  it("update() on unset key uses patch as the value", () => {
    luxBus.update('fresh_merge', { x: 10 });
    expect(luxBus.get('fresh_merge')).toEqual({ x: 10 });
  });

  it("update() does not mutate the previous object", () => {
    const original = { a: 1 };
    luxBus.set('immut', original);
    luxBus.update('immut', { b: 2 });
    expect(original).toEqual({ a: 1 }); // original unchanged
    expect(luxBus.get('immut')).toEqual({ a: 1, b: 2 });
  });

  // ── on (subscribe) ──

  it("on() fires callback when key is set", () => {
    const cb = vi.fn();
    luxBus.on('notify', cb);
    luxBus.set('notify', "hello");
    expect(cb).toHaveBeenCalledWith("hello");
  });

  it("on() fires callback when key is updated", () => {
    luxBus.set('notify2', { a: 1 });
    const cb = vi.fn();
    luxBus.on('notify2', cb);
    luxBus.update('notify2', { b: 2 });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ a: 1, b: 2 });
  });

  it("on() returns an unsubscribe function that stops notifications", () => {
    const cb = vi.fn();
    const unsub = luxBus.on('unsub_test', cb);
    luxBus.set('unsub_test', 1);
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    luxBus.set('unsub_test', 2);
    expect(cb).toHaveBeenCalledTimes(1); // no second call
  });

  it("on() does not fire for other keys", () => {
    const cb = vi.fn();
    luxBus.on('keyA', cb);
    luxBus.set('keyB', "nope");
    expect(cb).not.toHaveBeenCalled();
  });

  // ── watch ──

  it("watch() fires immediately with current value, then on changes", () => {
    luxBus.set('watched', "initial");
    const cb = vi.fn();
    luxBus.watch('watched', cb);

    // Immediate call with current value
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("initial");

    // Subsequent change
    luxBus.set('watched', "updated");
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenCalledWith("updated");
  });

  it("watch() does not fire immediately if key has no value", () => {
    const cb = vi.fn();
    luxBus.watch('no_value_yet', cb);
    expect(cb).not.toHaveBeenCalled();

    luxBus.set('no_value_yet', "now");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  // ── error isolation ──

  it("a throwing subscriber does not break other subscribers", () => {
    const bad = vi.fn(() => { throw new Error("boom"); });
    const good = vi.fn();

    luxBus.on('err_test', bad);
    luxBus.on('err_test', good);
    luxBus.set('err_test', "val");

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled(); // still fires despite bad throwing
  });
});