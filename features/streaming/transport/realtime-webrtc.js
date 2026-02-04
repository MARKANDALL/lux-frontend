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
  let pendingSessionUpdate = null;

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
    if (!dc || dc.readyState !== "open") {
      pendingSessionUpdate = sessionParams; // keep only the latest patch
      console.log("[WebRTC] Queuing session.update (data channel not ready yet).");
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

    console.log("[WebRTC] Sending session.update:", payload);
    return sendEvent(payload);
  }

  function flushPendingSessionUpdate() {
    if (!pendingSessionUpdate) return;
    const patch = pendingSessionUpdate;
    pendingSessionUpdate = null;
    updateSession(patch);
  }

  function setTurnTaking({ mode } = {}) {
    const m = String(mode || "tap").toLowerCase();
    inputMode = (m === "auto") ? "auto" : "tap";
    const isAuto = inputMode === "auto";

    console.log(
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

    updateSession({
      audio: {
        input: { turn_detection: turnDetection },
      },
    });
  }

  function requestReply() {
    console.log("[WebRTC] requestReply() -> committing + response.create");
    // Helps avoid the “one turn behind” feel in TAP.
    sendEvent({ type: "input_audio_buffer.commit" });
    sendEvent({ type: "response.create" });
  }

  async function connect() {
    if (pc) return;

    pc = new RTCPeerConnection();

    // Remote audio playback (element created lazily on first track)
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.playsInline = true;

    // ✅ make it discoverable for devtools + debugging
    audioEl.id = "lux-remote-audio";
    audioEl.style.display = "none";
    document.body.appendChild(audioEl);

    // Try to "unlock" playback during the user gesture that triggered connect()
    audioEl.play().catch(() => {});

    pc.ontrack = (e) => {
      try { audioEl.srcObject = e.streams[0]; } catch {}
      audioEl?.play?.().catch(() => {});
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
      sendEvent({ type: "response.cancel" });

      // ✅ Apply whatever session.update was requested before dc opened
      const hadQueued = !!pendingSessionUpdate;
      flushPendingSessionUpdate();
      if (!hadQueued) {
        // Ensure we at least apply the current mode (defaults to "tap")
        setTurnTaking({ mode: inputMode });
      }

      emit("connected");
    });
    dc.addEventListener("close", () => emit("disconnected"));
    dc.addEventListener("message", (e) => {
      try {
        const msg = JSON.parse(e.data);
        const t = msg?.type || "(no type)";
        if (
          t.includes("turn") ||
          t.includes("speech") ||
          t.includes("response") ||
          t.includes("input_audio") ||
          t.includes("error")
        ) {
          if (t === "error" && msg?.error?.code === "response_cancel_not_active") {
            return;
          }
          console.log("[oai-events]", t, msg);
        }
      } catch {}

      let evt = null;
      try { evt = JSON.parse(e.data); } catch { return; }
      if (evt?.type === "error" && evt?.error?.code === "response_cancel_not_active") {
        // ignore or console.debug
        return;
      }
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
