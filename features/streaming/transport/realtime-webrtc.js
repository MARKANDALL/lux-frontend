// FILE: features/streaming/transport/realtime-webrtc.js
// PURPOSE: WebRTC TransportController that connects to OpenAI Realtime (SDP via backend + datachannel events), manages mic meter/health, and emits UI events via onEvent({type: ...}).

// Implements the TransportController contract: emits events via onEvent({type: ...})

import { getWebRTCAnswerSDP } from "./session-bootstrap.js";
import { handleOaiEventsMessage } from "./realtime-webrtc/message-handler.js";
import { startMicMeter as startMicMeterModule, stopMicMeter as stopMicMeterModule } from "./realtime-webrtc/mic-meter.js";
import {
  updateSession as updateSessionModule,
  flushPendingSessionUpdate as flushPendingSessionUpdateModule,
  setTurnTaking as setTurnTakingModule,
} from "./realtime-webrtc/session-controls.js";
import { connectWebRTC, disconnectWebRTC } from "./realtime-webrtc/connection-lifecycle.js";

export function createRealtimeWebRTCTransport({ onEvent } = {}) {
  let pc = null;
  let dc = null;
  let micStream = null;
  let audioEl = null;
  let mutedByInterrupt = false;

  // Mic meter (WebAudio)
  let micMeterState = {
    micAC: null,          // AudioContext
    micAnalyser: null,    // AnalyserNode
    micSrc: null,         // MediaStreamAudioSourceNode
    micTick: null,        // interval id
  };

  // near top
  let inputMode = "tap";
  let pendingSessionUpdateRef = { value: null };

  // Debug + health state
  let DEBUG = false;
  const health = {
    pc: "—",
    ice: "—",
    dc: "—",
    mode: "tap",
    lastCommitAt: 0,
    lastReplyAt: 0,
    activeResponse: false,
    activeResponseId: null,
    debug: false,
    phase: "disconnected", // connecting | listening | thinking | speaking | disconnected
    micLevel: 0,           // 0..1 (UI meter)
  };

  function debugLog(...args) {
    if (!DEBUG) return;
    console.log(...args);
  }

  function pushHealth(patch = {}) {
    Object.assign(health, patch);
    emit("health", { health: { ...health } });
  }

  function setPhase(phase) {
    if (!phase) return;
    if (health.phase === phase) return;
    pushHealth({ phase });
  }

  function startMicMeter() {
    return startMicMeterModule({
      getMicStream: () => micStream,
      stopMicMeter,
      getMeterState: () => micMeterState,
      setMeterState: (patch) => { micMeterState = { ...micMeterState, ...(patch || {}) }; },
      pushHealth,
    });
  }

  function stopMicMeter() {
    return stopMicMeterModule({
      getMeterState: () => micMeterState,
      setMeterState: (patch) => { micMeterState = { ...micMeterState, ...(patch || {}) }; },
      pushHealth,
    });
  }

  // TAP determinism: wait for committed before response.create
  let _tapAwaitingCommit = false;
  let _tapCommitTimeout = null;

  function emit(type, extra) {
    try { onEvent?.({ type, ...(extra || {}) }); } catch {}
  }

  function sendEvent(evt) {
    if (!dc || dc.readyState !== "open") return false;
    dc.send(JSON.stringify(evt));
    return true;
  }

  /**
   * Updates the session configuration live over the data channel.
   * @param {Object} sessionParams - The session object parameters to update.
   */
  function updateSession(sessionParams = {}) {
    return updateSessionModule(sessionParams, {
      dc,
      pendingSessionUpdateRef,
      debugLog,
      pushHealth,
      inputMode,
      sendEvent,
    });
  }

  function flushPendingSessionUpdate() {
    return flushPendingSessionUpdateModule({
      dc,
      pendingSessionUpdateRef,
      debugLog,
      pushHealth,
      inputMode,
      sendEvent,
    });
  }

  function setTurnTaking({ mode } = {}) {
    return setTurnTakingModule({ mode }, {
      dc,
      pendingSessionUpdateRef,
      debugLog,
      pushHealth,
      sendEvent,
      inputMode,
      setInputMode: (m) => { inputMode = m; },
    });
  }

  function getMessageHandlerArgs() {
    return {
      DEBUG,
      inputMode,
      debugLog,
      setPhase,
      pushHealth,
      sendEvent,
      emit,
      getTapAwaitingCommit: () => _tapAwaitingCommit,
      setTapAwaitingCommit: (v) => { _tapAwaitingCommit = !!v; },
      getTapCommitTimeout: () => _tapCommitTimeout,
      setTapCommitTimeout: (v) => { _tapCommitTimeout = v; },
    };
  }

  function requestReply() {
    if (inputMode !== "tap") {
      console.warn("[WebRTC] requestReply() ignored (not in TAP mode).");
      return;
    }

    if (_tapAwaitingCommit) {
      debugLog("[WebRTC] requestReply() already awaiting commit; ignoring extra tap.");
      return;
    }

    debugLog("[WebRTC] requestReply() -> commit, then wait for input_audio_buffer.committed");

    _tapAwaitingCommit = true;
    setPhase("thinking");

    const ok = sendEvent({ type: "input_audio_buffer.commit" });
    if (!ok) {
      _tapAwaitingCommit = false;
      console.warn("[WebRTC] Data channel not ready; could not commit audio buffer.");
      return;
    }

    if (_tapCommitTimeout) clearTimeout(_tapCommitTimeout);
    _tapCommitTimeout = setTimeout(() => {
      if (!_tapAwaitingCommit) return;
      console.warn("[WebRTC] No committed event observed; falling back to response.create.");
      _tapAwaitingCommit = false;
      sendEvent({ type: "response.create" });
    }, 1200);
  }

  async function connect() {
    return connectWebRTC({
      getPc: () => pc,
      setPc: (v) => { pc = v; },
      getDc: () => dc,
      setDc: (v) => { dc = v; },
      getMicStream: () => micStream,
      setMicStream: (v) => { micStream = v; },
      getAudioEl: () => audioEl,
      setAudioEl: (v) => { audioEl = v; },
      getInputMode: () => inputMode,
      getPendingSessionUpdateRef: () => pendingSessionUpdateRef,
      getDEBUG: () => DEBUG,
      pushHealth,
      setPhase,
      emit,
      sendEvent,
      startMicMeter,
      flushPendingSessionUpdate,
      setTurnTaking,
      handleOaiEventsMessage,
      getMessageHandlerArgs,
      getWebRTCAnswerSDP,
    });
  }

  async function disconnect() {
    return disconnectWebRTC({
      getPc: () => pc,
      setPc: (v) => { pc = v; },
      getDc: () => dc,
      setDc: (v) => { dc = v; },
      getMicStream: () => micStream,
      setMicStream: (v) => { micStream = v; },
      getAudioEl: () => audioEl,
      setAudioEl: (v) => { audioEl = v; },
      stopMicMeter,
      setPhase,
      emit,
      setMutedByInterrupt: (v) => { mutedByInterrupt = !!v; },
      setInputMode: (v) => { inputMode = v; },
    });
  }

  function unmuteIfNeeded() {
    if (!audioEl) return;
    if (!mutedByInterrupt) return;
    try {
      audioEl.muted = false;
      // don’t force play()—autoplay should resume as new audio arrives
      audioEl.play?.().catch(() => {});
    } catch {}
    mutedByInterrupt = false;
  }

  // Streaming signature: instant local stop + canonical cancel→clear ordering.
  // UI should feel instant even if the server takes a moment.
  async function stopSpeaking() {
    // 1) Instant UX: locally mute/stop playback immediately
    if (audioEl) {
      try {
        audioEl.muted = true;
        audioEl.pause();
      } catch {}
      mutedByInterrupt = true;
    }

    // 2) Canonical Realtime order: cancel generation, then clear queued audio.
    // These are best-effort (don’t throw if not connected).
    const okCancel = sendEvent({ type: "response.cancel" });
    const okClear = sendEvent({ type: "output_audio_buffer.clear" });

    emit("stop_speaking", { okCancel, okClear });
    return okCancel && okClear;
  }

  // Patch: Modified sendUserText to accept options object and conditionally create response.
  async function sendUserText(text, { createResponse = true } = {}) {
    if (!text) return;
    unmuteIfNeeded();

    const ok1 = sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });

    // NEW: only auto-create a response in Auto mode
    const ok2 = createResponse ? sendEvent({ type: "response.create" }) : true;

    if (!ok1 || !ok2) throw new Error("Transport not connected");
  }

  // Your current PTT records blobs; WebRTC realtime uses live mic tracks instead.
  async function sendUserAudio({ blob } = {}) {
    const kb = blob ? Math.round(blob.size / 1024) : 0;
    throw new Error(
      `WebRTC transport uses live mic audio (tracks). sendUserAudio(blob) not supported (~${kb} KB).`
    );
  }

  function setDebug(enabled) {
    DEBUG = !!enabled;
    pushHealth({ debug: DEBUG });
  }

  return {
    connect,
    disconnect,
    sendUserText,
    sendUserAudio,
    stopSpeaking,
    setTurnTaking,
    setDebug,
    requestReply,
    updateSession, // Added to expose the updateSession method
  };
}
