// features/streaming/transport/realtime-webrtc.js

import { getWebRTCAnswerSDP } from "./session-bootstrap.js";

export function createRealtimeWebRTCTransport({
  onStatus,
  onServerEvent,
  onError,
} = {}) {
  let pc = null;
  let dc = null;
  let micStream = null;
  let audioEl = null;

  function emitStatus(s) {
    try { onStatus?.(s); } catch {}
  }
  function emitEvent(evt) {
    try { onServerEvent?.(evt); } catch {}
  }
  function emitError(err) {
    try { onError?.(err); } catch {}
  }

  async function connect() {
    if (pc) return;

    emitStatus("connecting");

    pc = new RTCPeerConnection();

    // Remote audio playback (assistant voice)
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.playsInline = true;
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    pc.onconnectionstatechange = () => {
      const s = pc?.connectionState || "disconnected";
      emitStatus(s === "connected" ? "live" : s);
    };

    // Mic input (needed for true voice mode)
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const t of micStream.getTracks()) pc.addTrack(t, micStream);

    // Data channel for events
    dc = pc.createDataChannel("oai-events");
    dc.addEventListener("open", () => emitStatus("live"));
    dc.addEventListener("close", () => emitStatus("disconnected"));
    dc.addEventListener("message", (e) => {
      try {
        const evt = JSON.parse(e.data);
        emitEvent(evt);
      } catch {
        // ignore non-json
      }
    });

    // SDP handshake via your server (no secrets in browser)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const answerSDP = await getWebRTCAnswerSDP(offer.sdp);
    await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });

    emitStatus("live");
  }

  function disconnect() {
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

    try {
      if (audioEl) {
        audioEl.pause();
        audioEl.srcObject = null;
        audioEl.remove();
      }
    } catch {}
    audioEl = null;

    emitStatus("disconnected");
  }

  function sendEvent(evt) {
    if (!dc || dc.readyState !== "open") return false;
    dc.send(JSON.stringify(evt));
    return true;
  }

  // Text-only test helper (great for Milestone 1 validation)
  function sendText(text) {
    const ok1 = sendEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });

    const ok2 = sendEvent({ type: "response.create" });
    return ok1 && ok2;
  }

  return {
    connect,
    disconnect,
    sendEvent,
    sendText,
    _debug: () => ({ pc, dc }),
  };
}
