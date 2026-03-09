// app-core/lux-bus.js
// Tiny pub/sub service bus for cross-module state.
// Replaces window globals as the primary source of truth.
// Window globals are kept as backward-compatible mirrors only.
//
// Usage:
//   import { luxBus } from '../app-core/lux-bus.js';
//   luxBus.set('karaoke', { source: 'tts', timings: [...] });
//   luxBus.get('karaoke');                        // → { source: 'tts', timings: [...] }
//   const unsub = luxBus.on('karaoke', (val) => { ... });
//   unsub();  // stop listening
//
//   luxBus.update('tts', { autoVoice: true });    // shallow-merge into existing value

const _store = new Map();
const _subs  = new Map();   // key → Set<fn>

function _notify(key, val) {
  const fns = _subs.get(key);
  if (!fns || fns.size === 0) return;
  for (const fn of fns) {
    try { fn(val); }
    catch (err) { globalThis.warnSwallow?.("app-core/lux-bus.js", err); }
  }
}

/**
 * Set a value (full replace) and notify subscribers.
 */
export function set(key, val) {
  _store.set(key, val);
  _notify(key, val);
  return val;
}

/**
 * Shallow-merge a patch into the current value (like Object.assign).
 * If the key has no current value, the patch becomes the value.
 */
export function update(key, patch) {
  const prev = _store.get(key);
  const next = (prev && typeof prev === "object" && !Array.isArray(prev))
    ? Object.assign({}, prev, patch)
    : patch;
  return set(key, next);
}

/**
 * Get the current value for a key (undefined if never set).
 */
export function get(key) {
  return _store.get(key);
}

/**
 * Subscribe to changes on a key.  Returns an unsubscribe function.
 */
export function on(key, fn) {
  if (typeof fn !== "function") return () => {};
  if (!_subs.has(key)) _subs.set(key, new Set());
  _subs.get(key).add(fn);
  return () => _subs.get(key)?.delete(fn);
}

/**
 * Convenience: read current value, and also subscribe to future changes.
 * Calls fn immediately with current value (if any), then on every change.
 */
export function watch(key, fn) {
  const cur = _store.get(key);
  if (cur !== undefined) {
    try { fn(cur); }
    catch (err) { globalThis.warnSwallow?.("app-core/lux-bus.js", err); }
  }
  return on(key, fn);
}

// Named export as an object too, for callers who prefer `luxBus.set(...)`.
export const luxBus = { set, get, on, update, watch };