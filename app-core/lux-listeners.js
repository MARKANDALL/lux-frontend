// app-core/lux-listeners.js
// Guarded listener registry for document/window-level event handlers.
// Prevents duplicate listeners from stacking across hot reloads or
// repeated boot/init calls.
//
// Usage:
//   import { guardedListener } from '../app-core/lux-listeners.js';
//
//   // Register once — second call with same key is a no-op:
//   guardedListener('convo:escapeKey', document, 'keydown', handler);
//   guardedListener('convo:escapeKey', document, 'keydown', handler); // skipped
//
//   // With options:
//   guardedListener('myWords:captureClick', document, 'click', handler, { capture: true });
//
//   // Remove when done:
//   removeGuardedListener('convo:escapeKey');
//
//   // Bulk remove by prefix (e.g. teardown all convo listeners):
//   removeGuardedByPrefix('convo:');

const _registry = new Map();  // key → { target, event, handler, opts }

/**
 * Add a listener only if the key hasn't been registered yet.
 * Returns true if the listener was added, false if it was already present.
 */
export function guardedListener(key, target, event, handler, opts) {
  if (_registry.has(key)) return false;
  target.addEventListener(event, handler, opts);
  _registry.set(key, { target, event, handler, opts });
  return true;
}

/**
 * Remove a previously guarded listener by key.
 */
export function removeGuardedListener(key) {
  const entry = _registry.get(key);
  if (!entry) return false;
  entry.target.removeEventListener(entry.event, entry.handler, entry.opts);
  _registry.delete(key);
  return true;
}

/**
 * Remove all guarded listeners whose key starts with the given prefix.
 * Useful for teardown: removeGuardedByPrefix('convo:') clears all convo listeners.
 */
export function removeGuardedByPrefix(prefix) {
  let count = 0;
  for (const key of [..._registry.keys()]) {
    if (key.startsWith(prefix)) {
      removeGuardedListener(key);
      count++;
    }
  }
  return count;
}

/**
 * Check if a key is currently registered.
 */
export function hasGuardedListener(key) {
  return _registry.has(key);
}