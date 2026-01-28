// features/streaming/transport/realtime-webrtc.js
// Primary transport target: Realtime over WebRTC.
// NOTE: This is a FOUNDATION stub to prove the page architecture.
// Replace the mock connect() with session-bootstrap + RTCPeerConnection in Milestone 1.

export function createRealtimeWebRTCTransport({ onEvent }) {
  let _connected = false;

  async function connect() {
    // --- MOCK: pretend to connect quickly ---
    await new Promise((r) => setTimeout(r, 240));
    _connected = true;
    onEvent?.({ type: "connected" });
  }

  async function disconnect() {
    _connected = false;
    onEvent?.({ type: "disconnected" });
  }

  async function sendUserText(text) {
    if (!_connected) throw new Error("Transport not connected");
    await new Promise((r) => setTimeout(r, 220));
    onEvent?.({
      type: "assistant_text",
      text: `(${new Date().toLocaleTimeString()}) Mock reply to: ${String(text || "").slice(0, 120)}`,
    });
  }

  async function sendUserAudio({ blob }) {
    if (!_connected) throw new Error("Transport not connected");
    const kb = blob ? Math.round(blob.size / 1024) : 0;
    await new Promise((r) => setTimeout(r, 260));
    onEvent?.({
      type: "assistant_text",
      text: `Mock voice reply (received ~${kb} KB of audio).`,
    });
  }

  return { connect, disconnect, sendUserText, sendUserAudio };
}
