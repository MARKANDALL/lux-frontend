// features/convo/convo-handlers.js

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
      alert(`Recording failed: ${e?.message || e}`);
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

      // Keep the old debug dump too (harmless + useful)
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
    } catch (e) {
      console.error("[Convo] convo-report failed", e);
      alert(`End Session report failed: ${e?.message || e}`);
    }
  });
}
