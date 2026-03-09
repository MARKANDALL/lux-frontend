// app-core/runtime.js
// Runtime contract: single source of truth for cross-feature "current run" state.
// Scope (for now):
//  - lastAttemptId
//  - lastRecording blob/meta + lux:lastRecording event
//
// Back-compat: keeps legacy window globals in sync:
//  - window.lastAttemptId
//  - window.LuxLastRecordingBlob / window.LuxLastRecordingMeta

import { luxBus } from './lux-bus.js';

let _lastAttemptId = null;
let _lastRecordingBlob = null;
let _lastRecordingMeta = null;

function hasWindow() {
  return typeof window !== "undefined";
}

// ---------- Attempt ----------
export function setLastAttemptId(id) {
  _lastAttemptId = id ?? null;
  luxBus.set('lastAttemptId', _lastAttemptId);
  if (hasWindow()) window.lastAttemptId = _lastAttemptId;
  return _lastAttemptId;
}

export function getLastAttemptId() {
  if (_lastAttemptId != null) return _lastAttemptId;
  const busVal = luxBus.get('lastAttemptId');
  if (busVal != null) return busVal;
  if (hasWindow() && window.lastAttemptId != null) return window.lastAttemptId;
  return null;
}

export function clearLastAttemptId() {
  return setLastAttemptId(null);
}

// ---------- Recording ----------
export function setLastRecording(blob, meta) {
  _lastRecordingBlob = blob || null;
  _lastRecordingMeta = meta || null;
  luxBus.set('lastRecording', { blob: _lastRecordingBlob, meta: _lastRecordingMeta });

  if (hasWindow()) {
    window.LuxLastRecordingBlob = _lastRecordingBlob;
    window.LuxLastRecordingMeta = _lastRecordingMeta;

    if (_lastRecordingBlob) {
      try {
        window.dispatchEvent(
          new CustomEvent("lux:lastRecording", {
            detail: { blob: _lastRecordingBlob, meta: _lastRecordingMeta },
          })
        );
      } catch (err) { globalThis.warnSwallow("./app-core/runtime.js", err); }
    }
  }

  return { blob: _lastRecordingBlob, meta: _lastRecordingMeta };
}

export function getLastRecording() {
  if (_lastRecordingBlob) {
    return { blob: _lastRecordingBlob, meta: _lastRecordingMeta };
  }

  const busVal = luxBus.get('lastRecording');
  if (busVal?.blob) return busVal;

  if (hasWindow() && window.LuxLastRecordingBlob) {
    return {
      blob: window.LuxLastRecordingBlob,
      meta: window.LuxLastRecordingMeta || null,
    };
  }

  return { blob: null, meta: null };
}