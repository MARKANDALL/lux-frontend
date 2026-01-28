// features/streaming/transport/transport-controller.js
import { ACTIONS } from "../state/schema.js";
import { createRealtimeWebRTCTransport } from "./realtime-webrtc.js";
import { createRealtimeWebSocketTransport } from "./realtime-websocket.js";

function makeProvider({ transport, onEvent }) {
  const t = String(transport || "").toLowerCase();
  if (t === "websocket" || t === "ws") return createRealtimeWebSocketTransport({ onEvent });
  return createRealtimeWebRTCTransport({ onEvent }); // default
}

export function createTransportController({ store, route }) {
  const provider = makeProvider({
    transport: route?.transport,
    onEvent: (evt) => handleProviderEvent(evt),
  });

  function setConnection(patch) {
    store.dispatch({ type: ACTIONS.CONNECTION_SET, connection: patch });
  }

  function handleProviderEvent(evt) {
    const e = evt || {};
    if (e.type === "connected") {
      setConnection({ status: "live", error: null });
      return;
    }
    if (e.type === "disconnected") {
      setConnection({ status: "disconnected", error: null });
      return;
    }
    if (e.type === "assistant_text") {
      const id = `a_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      store.dispatch({
        type: ACTIONS.THREAD_ADD_TURN,
        turn: { id, role: "assistant", kind: "text", text: e.text || "", ts: Date.now() },
      });
      return;
    }
  }

  async function connect() {
    const cur = store.getState().connection.status;
    if (cur === "connecting" || cur === "live") return;
    setConnection({ status: "connecting", error: null });
    try {
      await provider.connect();
    } catch (err) {
      console.error(err);
      setConnection({ status: "error", error: err?.message || String(err) });
    }
  }

  async function disconnect() {
    try { await provider.disconnect(); } catch (_) {}
    setConnection({ status: "disconnected", error: null });
  }

  async function sendUserText(text) {
    try {
      await provider.sendUserText(text);
    } catch (err) {
      console.error(err);
      setConnection({ status: "error", error: err?.message || String(err) });
    }
  }

  async function sendUserAudio(blob) {
    try {
      await provider.sendUserAudio({ blob });
    } catch (err) {
      console.error(err);
      setConnection({ status: "error", error: err?.message || String(err) });
    }
  }

  return { connect, disconnect, sendUserText, sendUserAudio };
}
