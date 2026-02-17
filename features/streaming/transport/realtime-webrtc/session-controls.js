// FILE: features/streaming/transport/realtime-webrtc/session-controls.js
// PURPOSE: Session.update plumbing + turn-taking mode (TAP/AUTO) for Realtime WebRTC transport.

export function updateSession(sessionParams = {}, ctx = {}) {
  const { dc, pendingSessionUpdateRef, debugLog, pushHealth, inputMode, sendEvent } = ctx;

  if (!dc || dc.readyState !== "open") {
    pendingSessionUpdateRef.value = sessionParams; // keep only the latest patch
    debugLog?.("[WebRTC] Queuing session.update (data channel not ready yet).");
    pushHealth?.({ dc: dc?.readyState || "—" });
    return false;
  }

  // ✅ Current Realtime schema requires session.type
  const payload = {
    type: "session.update",
    session: {
      type: "realtime",
      ...sessionParams,
    },
  };

  debugLog?.("[WebRTC] Sending session.update:", payload);
  pushHealth?.({ mode: inputMode });
  return sendEvent(payload);
}

export function flushPendingSessionUpdate(ctx = {}) {
  const { pendingSessionUpdateRef } = ctx;
  if (!pendingSessionUpdateRef?.value) return;

  const patch = pendingSessionUpdateRef.value;
  pendingSessionUpdateRef.value = null;
  return updateSession(patch, ctx);
}

export function setTurnTaking({ mode } = {}, ctx = {}) {
  const { setInputMode, inputMode, pushHealth, debugLog } = ctx;

  const m = String(mode || "tap").toLowerCase();
  const nextMode = (m === "auto") ? "auto" : "tap";
  setInputMode(nextMode);
  pushHealth?.({ mode: nextMode });

  const isAuto = nextMode === "auto";

  debugLog?.(
    `[WebRTC] Switching Input Mode: ${isAuto ? "AUTO" : "TAP"} (create_response: ${isAuto})`
  );

  // ✅ Updated schema: audio.input.turn_detection (NOT session.turn_detection)
  const turnDetection = {
    type: "server_vad",
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
    create_response: isAuto,
    interrupt_response: true,
  };

  return updateSession({
    audio: {
      input: { turn_detection: turnDetection },
    },
  }, { ...ctx, inputMode: nextMode });
}
