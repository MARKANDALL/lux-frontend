// FILE: features/streaming/transport/realtime-webrtc/connection-lifecycle.js
// PURPOSE: Owns connect/disconnect lifecycle for the Realtime WebRTC transport (PeerConnection + DataChannel + SDP exchange + remote audio element).

export async function connectWebRTC(ctx = {}) {
  const {
    getPc,
    setPc,
    getDc,
    setDc,
    getMicStream,
    setMicStream,
    getAudioEl,
    setAudioEl,
    getInputMode,
    getPendingSessionUpdateRef,
    getDEBUG,
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
  } = ctx;

  if (getPc?.()) return;

  let pc = new RTCPeerConnection();
  setPc?.(pc);
  pushHealth?.({
    pc: "new",
    ice: pc.iceConnectionState || "new",
    dc: "connecting",
    mode: getInputMode?.(),
    debug: getDEBUG?.(),
  });
  setPhase?.("connecting");

  pc.addEventListener("connectionstatechange", () => {
    pushHealth?.({ pc: pc.connectionState || "—" });
  });
  pc.addEventListener("iceconnectionstatechange", () => {
    pushHealth?.({ ice: pc.iceConnectionState || "—" });
  });

  // Remote audio playback (element created lazily on first track)
  let audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  audioEl.playsInline = true;

  // ✅ make it discoverable for devtools + debugging
  audioEl.id = "lux-remote-audio";
  audioEl.style.display = "none";
  document.body.appendChild(audioEl);
  setAudioEl?.(audioEl);

  // Try to "unlock" playback during the user gesture that triggered connect()
  audioEl.play().catch(() => {});

  pc.ontrack = (e) => {
    try { audioEl.srcObject = e.streams[0]; } catch {}
    audioEl?.play?.().catch(() => {});
  };

  pc.onconnectionstatechange = () => {
    const s = pc?.connectionState || "disconnected";
    if (s === "connected") emit?.("connected");
    if (s === "failed" || s === "disconnected" || s === "closed") emit?.("disconnected");
  };

  // Live mic track (always-on for now)
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  setMicStream?.(micStream);
  for (const t of micStream.getTracks()) pc.addTrack(t, micStream);

  // Start mic meter (UI-only; best-effort)
  startMicMeter?.();

  // Data channel for events + text
  let dc = pc.createDataChannel("oai-events");
  setDc?.(dc);

  dc.addEventListener("open", () => {
    pushHealth?.({ dc: "open" });
    // best-effort cleanup
    sendEvent?.({ type: "response.cancel" });

    // ✅ Apply whatever session.update was requested before dc opened
    const pendingRef = getPendingSessionUpdateRef?.();
    const hadQueued = !!pendingRef?.value;
    flushPendingSessionUpdate?.();
    if (!hadQueued) {
      // Ensure we at least apply the current mode (defaults to "tap")
      setTurnTaking?.({ mode: getInputMode?.() });
    }

    // Once channel is open, we’re ready to listen.
    setPhase?.("listening");
    emit?.("connected");
  });

  dc.addEventListener("close", () => {
    pushHealth?.({ dc: "closed" });
    setPhase?.("disconnected");
    emit?.("disconnected");
  });

  dc.addEventListener("message", (e) => {
    handleOaiEventsMessage?.(e, getMessageHandlerArgs?.());
  });

  // SDP exchange via your backend
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const answerSDP = await getWebRTCAnswerSDP?.(offer.sdp);
  await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });

  emit?.("connected"); // best-effort so UI doesn't hang
}

export async function disconnectWebRTC(ctx = {}) {
  const {
    getPc,
    setPc,
    getDc,
    setDc,
    getMicStream,
    setMicStream,
    getAudioEl,
    setAudioEl,
    stopMicMeter,
    setPhase,
    emit,
    setMutedByInterrupt,
    setInputMode,
  } = ctx;

  const dc = getDc?.();
  const pc = getPc?.();
  const micStream = getMicStream?.();
  const audioEl = getAudioEl?.();

  try { dc?.close(); } catch {}
  try { pc?.close(); } catch {}

  if (micStream) {
    for (const t of micStream.getTracks()) {
      try { t.stop(); } catch {}
    }
  }

  stopMicMeter?.();

  setPc?.(null);
  setDc?.(null);
  setMicStream?.(null);
  setMutedByInterrupt?.(false);
  setInputMode?.("tap");
  setPhase?.("disconnected");

  try {
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    }
  } catch {}
  setAudioEl?.(null);

  emit?.("disconnected");
}
