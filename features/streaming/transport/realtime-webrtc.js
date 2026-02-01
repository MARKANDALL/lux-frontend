// Implements the TransportController contract: emits events via onEvent({type: ...})

import { getWebRTCAnswerSDP } from "./session-bootstrap.js";

export function createRealtimeWebRTCTransport({ onEvent } = {}) {
  let pc = null;
  let dc = null;
  let micStream = null;
  let audioEl = null;
  let mutedByInterrupt = false;

  // near top
  let inputMode = "tap";

  function emit(type, extra) {
    try { onEvent?.({ type, ...(extra || {}) }); } catch {}
  }

  function sendEvent(evt) {
    if (!dc || dc.readyState !== "open") return false;
    dc.send(JSON.stringify(evt));
    return true;
  }

  function setTurnTaking({ mode } = {}) {
    const m = String(mode || "tap").toLowerCase();
    inputMode = m === "auto" ? "auto" : "tap";
    const isAuto = inputMode === "auto";

    // VAD config: server_vad is default; we explicitly set create_response / interrupt_response
    // so Tap vs Auto is deterministic.
    console.log(`[WebRTC] Switching Input Mode: ${inputMode.toUpperCase()} (create_response: ${isAuto})`);

    // Only send `turn_detection` if necessary
    if (transport && transport.isConnected) {
      sendEvent({
        type: "session.update",
        session: {
          // Only send 'turn_detection' if isAuto is true
          ...(isAuto ? {
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
              create_response: true,
              interrupt_response: true,
            },
          } : {}),
        },
      });
    }
  }

  /**
   * Updates the session configuration live over the data channel.
   * @param {Object} sessionParams - The session object parameters to update.
   */
  function updateSession(sessionParams) {
    if (!dc || dc.readyState !== 'open') {
      console.warn("[WebRTC] Data channel not ready for update.");
      return;
    }

    const event = {
      type: "session.update",
      session: sessionParams
    };

    console.log("[WebRTC] Sending session.update:", event);
    dc.send(JSON.stringify(event));
  }

  function requestReply() {
    const ok = sendEvent({ type: "response.create" });
    if (!ok) throw new Error("Transport not connected");
  }

  async function connect() {
    if (pc) return;

    pc = new RTCPeerConnection();

    // Remote audio playback
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.playsInline = true;

    pc.ontrack = (e) => {
      try { audioEl.srcObject = e.streams[0]; } catch {}
    };

    pc.onconnectionstatechange = () => {
      const s = pc?.connectionState || "disconnected";
      if (s === "connected") emit("connected");
      if (s === "failed" || s === "disconnected" || s === "closed") emit("disconnected");
    };

    // Live mic track (always-on for now)
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const t of micStream.getTracks()) pc.addTrack(t, micStream);

    // Data channel for events + text
    dc = pc.createDataChannel("oai-events");
    dc.addEventListener("open", () => {
      emit("connected");
      // ✅ FIX: Immediately cancel any race-condition response
      sendEvent({ type: "response.cancel" });

      // Default streaming contract: Tap mode unless UI switches it later.
      setTurnTaking({ mode: "tap" });
    });
    dc.addEventListener("close", () => emit("disconnected"));
    dc.addEventListener("message", (e) => {
      let evt = null;
      try { evt = JSON.parse(e.data); } catch { return; }
      const text = extractAssistantText(evt);
      if (text) emit("assistant_text", { text });
    });

    // SDP exchange via your backend
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const answerSDP = await getWebRTCAnswerSDP(offer.sdp);
    await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });

    emit("connected"); // best-effort so UI doesn't hang
  }

  async function disconnect() {
    try { dc?.close(); } catch {}
    try { pc?.close(); } catch {}

    if (micStream) {
      for (const t of micStream.getTracks()) {
        try { t.stop(); } catch {}
      }
    }

    pc = null;
    dc = null;
    micStream = null;
    mutedByInterrupt = false;
    inputMode = "tap";

    try {
      if (audioEl) {
        audioEl.pause();
        audioEl.srcObject = null;
        audioEl.remove();
      }
    } catch {}
    audioEl = null;

    emit("disconnected");
  }

  function unmuteIfNeeded() {
    if (!audioEl) return;
    if (!mutedByInterrupt) return;
    try {
      audioEl.muted = false;
      // don’t force play()—autoplay should resume as new audio arrives
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

  return {
    connect,
    disconnect,
    sendUserText,
    sendUserAudio,
    stopSpeaking,
    setTurnTaking,
    requestReply,
    updateSession, // Added to expose the updateSession method
  };
}

function extractAssistantText(evt) {
  if (!evt || typeof evt !== "object") return "";

  if (typeof evt.delta === "string" && evt.delta) return evt.delta;
  if (typeof evt.text === "string" && evt.text) return evt.text;

  const content = evt?.item?.content;
  if (Array.isArray(content)) {
    for (const c of content) {
      if (c && typeof c.text === "string" && c.text) return c.text;
      if (c && typeof c.transcript === "string" && c.transcript) return c.transcript;
    }
  }
  return "";
}
