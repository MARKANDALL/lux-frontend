// features/convo/convo-handlers.js

// ---------------------------------------------------------------------------
// Tiny self-contained toast — no external deps, respects --z-toast CSS token
// ---------------------------------------------------------------------------
function luxToast(msg, { duration = 4000, type = "error" } = {}) {
  const el = document.createElement("div");
  el.setAttribute("role", "alert");
  el.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-toast, 950);
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: ${type === "error" ? "#dc2626" : "#1e293b"};
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => (el.style.opacity = "1"));
  setTimeout(() => {
    el.style.opacity = "0";
    el.addEventListener("transitionend", () => el.remove(), { once: true });
  }, duration);
}

// ---------------------------------------------------------------------------
// Handler attachment
// ---------------------------------------------------------------------------
export function attachConvoHandlers({
  SCENARIOS,
  state,

  // DOM
  root,
  input,
  talkBtn,
  endBtn,

  // helper fns (defined in convo-flow.js)
  startRecording,
  stopRecordingAndGetBlob,
  sendTurn,

  // report deps (from convo-flow.js args)
  convoReport,
  uid,
  showConvoReportOverlay,
}) {
  // --- Buttons ---
  talkBtn.addEventListener("click", async () => {
    if (state.busy) return;

    // If we're currently recording, STOP and SEND
    if (state.isRecording) {
      state.busy = true;
      talkBtn.disabled = true;
      try {
        const blob = await stopRecordingAndGetBlob();
        state.isRecording = false;
        root.classList.remove("is-recording");
        talkBtn.textContent = "🎙 Record";
        if (blob) await sendTurn({ audioBlob: blob });
      } finally {
        state.busy = false;
        talkBtn.disabled = false;
      }
      return;
    }

    // Not recording yet => start (only if input has text)
    const userText = (input.value || "").trim();
    if (!userText) return;

    state.busy = true;
    talkBtn.disabled = true;
    try {
      await startRecording();
      state.isRecording = true;
      root.classList.add("is-recording");
      talkBtn.textContent = "■ Stop & Send";
    } catch (e) {
      console.error("[Convo] start recording failed", e);
      luxToast(`Recording failed: ${e?.message || "unknown error"}`);
    } finally {
      state.busy = false;
      talkBtn.disabled = false;
    }
  });

  endBtn.addEventListener("click", async () => {
    try {
      const s = SCENARIOS[state.scenarioIdx];
      const report = await convoReport({
        uid: uid(),
        sessionId: state.sessionId,
        passageKey: `convo:${s.id}`,
      });

      console.log("[Convo] convo-report result", report);
      showConvoReportOverlay(report, state.turns, {
        nextActivity: state.nextActivity || null,
        turns: Array.isArray(state.turns) ? state.turns : [],
        sessionId: state.sessionId,
        passageKey: `convo:${s.id}`,
        scenario: { id: s.id, title: s.title },
      });

      // Debug dump: only in dev / when LUX_DEBUG is active
      if (window.LUX_DEBUG) {
        let pre = document.getElementById("luxConvoReportDump");
        if (!pre) {
          pre = document.createElement("pre");
          pre.id = "luxConvoReportDump";
          pre.style.cssText = `
            position: fixed; left: 12px; bottom: 12px; z-index: 99998;
            max-width: min(520px, 92vw);
            max-height: min(320px, 38vh);
            overflow: auto;
            white-space: pre-wrap;
            background: rgba(0,0,0,0.55);
            color: #e5e7eb;
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 12px;
            padding: 10px;
            font-size: 11px;
          `;
          (document.getElementById("convoApp") || document.body).appendChild(pre);
        }
        pre.textContent = JSON.stringify(report, null, 2);
      }
    } catch (e) {
      console.error("[Convo] convo-report failed", e);
      luxToast(`Session report failed — please try again`);
    }
  });
}