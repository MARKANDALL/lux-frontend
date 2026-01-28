// features/streaming/transport/realtime-websocket.js
// Fallback transport: Realtime over WebSocket.
// Foundation stub; wire it later behind the same controller contract.

export function createRealtimeWebSocketTransport({ onEvent }) {
  let _connected = false;

  async function connect() {
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
    onEvent?.({ type: "assistant_text", text: `WS mock: ${String(text || "").slice(0, 120)}` });
  }

  async function sendUserAudio({ blob }) {
    if (!_connected) throw new Error("Transport not connected");
    const kb = blob ? Math.round(blob.size / 1024) : 0;
    await new Promise((r) => setTimeout(r, 260));
    onEvent?.({ type: "assistant_text", text: `WS mock voice reply (~${kb} KB).` });
  }

  return { connect, disconnect, sendUserText, sendUserAudio };
}
