// app-core/runtime.js
// Runtime contract: single source of truth for cross-feature "current run" state.
// Scope (for now):
//  - lastAttemptId
//  - lastRecording blob/meta + lux:lastRecording event
//
// Back-compat: keeps legacy window globals in sync:
//  - window.lastAttemptId
//  - window.LuxLastRecordingBlob / window.LuxLastRecordingMeta

let _lastAttemptId = null;
let _lastRecordingBlob = null;
let _lastRecordingMeta = null;

function hasWindow() {
  return typeof window !== "undefined";
}

// ---------- Attempt ----------
export function setLastAttemptId(id) {
  _lastAttemptId = id ?? null;
  if (hasWindow()) window.lastAttemptId = _lastAttemptId;
  return _lastAttemptId;
}

export function getLastAttemptId() {
  if (_lastAttemptId != null) return _lastAttemptId;
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
      } catch (_) {}
    }
  }

  return { blob: _lastRecordingBlob, meta: _lastRecordingMeta };
}

export function getLastRecording() {
  if (_lastRecordingBlob) {
    return { blob: _lastRecordingBlob, meta: _lastRecordingMeta };
  }

  if (hasWindow() && window.LuxLastRecordingBlob) {
    return {
      blob: window.LuxLastRecordingBlob,
      meta: window.LuxLastRecordingMeta || null,
    };
  }

  return { blob: null, meta: null };
}
