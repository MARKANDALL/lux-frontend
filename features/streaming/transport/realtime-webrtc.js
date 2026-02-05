// Implements the TransportController contract: emits events via onEvent({type: ...})

import { getWebRTCAnswerSDP } from "./session-bootstrap.js";

export function createRealtimeWebRTCTransport({ onEvent } = {}) {
  let pc = null;
  let dc = null;
  let micStream = null;
  let audioEl = null;
  let mutedByInterrupt = false;

  // Mic meter (WebAudio)
  let micAC = null;          // AudioContext
  let micAnalyser = null;    // AnalyserNode
  let micSrc = null;         // MediaStreamAudioSourceNode
  let micTick = null;        // interval id

  // near top
  let inputMode = "tap";
  let pendingSessionUpdate = null;

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
    try {
      if (!micStream) return;
      stopMicMeter();

      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;

      micAC = new AC();
      // Attempt to resume immediately (connect is user gesture)
      micAC.resume?.().catch(() => {});

      micAnalyser = micAC.createAnalyser();
      micAnalyser.fftSize = 512;
      micAnalyser.smoothingTimeConstant = 0.6;

      micSrc = micAC.createMediaStreamSource(micStream);
      micSrc.connect(micAnalyser);

      const buf = new Uint8Array(micAnalyser.fftSize);

      micTick = window.setInterval(() => {
        if (!micAnalyser) return;
        micAnalyser.getByteTimeDomainData(buf);

        // RMS on centered [-1..1]
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);

        // Map to a friendly 0..1 range (tweakable)
        const level = Math.max(0, Math.min(1, rms * 3.2));
        pushHealth({ micLevel: level });
      }, 100);
    } catch {
      // never fail connect because of a meter
    }
  }

  function stopMicMeter() {
    try { if (micTick) window.clearInterval(micTick); } catch {}
    micTick = null;

    try { micSrc?.disconnect?.(); } catch {}
    micSrc = null;

    try { micAnalyser?.disconnect?.(); } catch {}
    micAnalyser = null;

    try { micAC?.close?.(); } catch {}
    micAC = null;

    // reset UI calm
    pushHealth({ micLevel: 0 });
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
    if (!dc || dc.readyState !== "open") {
      pendingSessionUpdate = sessionParams; // keep only the latest patch
      debugLog("[WebRTC] Queuing session.update (data channel not ready yet).");
      pushHealth({ dc: dc?.readyState || "—" });
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

    debugLog("[WebRTC] Sending session.update:", payload);
    pushHealth({ mode: inputMode });
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
    pushHealth({ mode: inputMode });
    const isAuto = inputMode === "auto";

    debugLog(
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
    if (pc) return;

    pc = new RTCPeerConnection();
    pushHealth({
      pc: "new",
      ice: pc.iceConnectionState || "new",
      dc: "connecting",
      mode: inputMode,
      debug: DEBUG,
    });
    setPhase("connecting");

    pc.addEventListener("connectionstatechange", () => {
      pushHealth({ pc: pc.connectionState || "—" });
    });
    pc.addEventListener("iceconnectionstatechange", () => {
      pushHealth({ ice: pc.iceConnectionState || "—" });
    });

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

    // Start mic meter (UI-only; best-effort)
    startMicMeter();

    // Data channel for events + text
    dc = pc.createDataChannel("oai-events");
    dc.addEventListener("open", () => {
      pushHealth({ dc: "open" });
      // best-effort cleanup
      sendEvent({ type: "response.cancel" });

      // ✅ Apply whatever session.update was requested before dc opened
      const hadQueued = !!pendingSessionUpdate;
      flushPendingSessionUpdate();
      if (!hadQueued) {
        // Ensure we at least apply the current mode (defaults to "tap")
        setTurnTaking({ mode: inputMode });
      }

      // Once channel is open, we’re ready to listen.
      setPhase("listening");
      emit("connected");
    });
    dc.addEventListener("close", () => {
      pushHealth({ dc: "closed" });
      setPhase("disconnected");
      emit("disconnected");
    });
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
          if (DEBUG || t === "error") console.log("[oai-events]", t, msg);
        }
      } catch {}

      let evt = null;
      try { evt = JSON.parse(e.data); } catch { return; }
      if (evt?.type === "error" && evt?.error?.code === "response_cancel_not_active") {
        // ignore or console.debug
        return;
      }

      // --- Turn-phase signals (AUTO + general) ---
      if (evt?.type === "input_audio_buffer.speech_started") {
        // user began talking; we are “listening”
        setPhase("listening");
      }
      if (evt?.type === "input_audio_buffer.speech_stopped") {
        // in AUTO, the system is about to think/respond; in TAP it stays listening until you tap
        if (inputMode === "auto") setPhase("thinking");
      }

      if (evt?.type === "input_audio_buffer.committed") {
        pushHealth({ lastCommitAt: Date.now() });
        // In AUTO, commit implies we should be thinking until response starts.
        if (inputMode === "auto") setPhase("thinking");
        if (_tapAwaitingCommit) {
          if (_tapCommitTimeout) clearTimeout(_tapCommitTimeout);
          _tapCommitTimeout = null;
          _tapAwaitingCommit = false;
          debugLog("[WebRTC] input_audio_buffer.committed -> response.create (TAP)");
          const ok = sendEvent({ type: "response.create" });
          // This “reply requested” timestamp gates the TAP button (fresh commit required again)
          if (ok) pushHealth({ lastReplyAt: Date.now() });
          setPhase("thinking");
        }
      }

      if (evt?.type === "response.created") {
        const id = evt?.response?.id || evt?.response_id || null;
        pushHealth({ activeResponse: true, activeResponseId: id });
        setPhase("speaking");
      }
      if (evt?.type === "response.done") {
        pushHealth({ activeResponse: false, activeResponseId: null });
        // When a response completes, we’re ready for next user input.
        setPhase("listening");
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

    stopMicMeter();

    pc = null;
    dc = null;
    micStream = null;
    mutedByInterrupt = false;
    inputMode = "tap";
    setPhase("disconnected");

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
