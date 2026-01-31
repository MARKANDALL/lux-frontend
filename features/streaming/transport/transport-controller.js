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

  // --- NEW: streaming assistant coalescer (prevents “one word per bubble” + duplicates)
  let asstId = null;
  let asstBuf = "";
  let lastChunk = "";
  let lastAt = 0;

  function newId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function resetAssistantBuffer() {
    asstId = null;
    asstBuf = "";
    lastChunk = "";
    lastAt = 0;
  }

  function appendSmart(cur, chunk) {
    const c = String(chunk || "");
    if (!c) return cur;

    // If the new chunk looks like a full “snapshot” that starts with what we already have, replace.
    if (c.length >= cur.length && cur && c.startsWith(cur)) return c;

    // Otherwise append with minimal spacing rules.
    const needsSpace =
      cur &&
      !/\s$/.test(cur) &&
      !/^[\s\.\,\!\?\:\;\)\]]/.test(c);

    return cur + (needsSpace ? " " : "") + c;
  }

  function handleProviderEvent(evt) {
    const e = evt || {};
    if (e.type === "connected") {
      setConnection({ status: "live", error: null });
      resetAssistantBuffer();
      return;
    }
    if (e.type === "disconnected") {
      setConnection({ status: "disconnected", error: null });
      resetAssistantBuffer();
      return;
    }
    if (e.type === "assistant_text") {
      const chunk = String(e.text || "");
      if (!chunk) return;

      const now = Date.now();

      // Dedupe exact repeats
      if (chunk === lastChunk) return;
      lastChunk = chunk;

      // Start a new assistant bubble if none exists or if we’ve been idle a bit
      const idleMs = now - (lastAt || 0);
      if (!asstId || idleMs > 2500) {
        asstId = newId("a");
        asstBuf = chunk;
        store.dispatch({
          type: ACTIONS.THREAD_ADD_TURN,
          turn: { id: asstId, role: "assistant", kind: "text", text: asstBuf, ts: now },
        });
        lastAt = now;
        return;
      }

      // Otherwise patch the existing assistant bubble (word-by-word becomes one sentence)
      asstBuf = appendSmart(asstBuf, chunk);
      store.dispatch({
        type: ACTIONS.THREAD_PATCH_TURN,
        id: asstId,
        patch: { text: asstBuf, ts: now },
      });
      lastAt = now;
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
    try {
      await provider.disconnect();
    } catch (_) {}
    setConnection({ status: "disconnected", error: null });
  }

  async function sendUserText(text) {
    const t = String(text || "").trim();
    if (!t) return;

    // NEW: show user text immediately in the thread
    store.dispatch({
      type: ACTIONS.THREAD_ADD_TURN,
      turn: { id: newId("u"), role: "user", kind: "text", text: t, ts: Date.now() },
    });

    // reset assistant buffer so the next assistant output starts fresh
    resetAssistantBuffer();

    try {
      await provider.sendUserText(t);
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
