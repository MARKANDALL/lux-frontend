// C:\dev\LUX_GEMINI\features\streaming\transport\realtime-webrtc\message-handler.js
// One-line: Handles WebRTC data-channel inbound "oai-events" messages + assistant text extraction (moved verbatim; minimal glue only).

export function handleOaiEventsMessage(e, ctx) {
  const {
    DEBUG,
    inputMode,
    debugLog,
    setPhase,
    pushHealth,
    sendEvent,
    emit,
    getTapAwaitingCommit,
    setTapAwaitingCommit,
    getTapCommitTimeout,
    setTapCommitTimeout,
  } = ctx;

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
    if (getTapAwaitingCommit()) {
      const t = getTapCommitTimeout();
      if (t) clearTimeout(t);
      setTapCommitTimeout(null);

      setTapAwaitingCommit(false);
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
}

export function extractAssistantText(evt) {
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
