// features/convo/convo-handlers.js
// One-line: Handles user interactions like recording, stop/send, and end-session reporting in AI Conversations.

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
  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });
  setTimeout(() => {
    el.style.opacity = "0";
    el.addEventListener("transitionend", () => el.remove(), { once: true });
  }, duration);
}

function setTalkBtnLabel(talkBtn, text) {
  const label = talkBtn?.querySelector(".lux-recLabel");
  if (label) {
    label.textContent = text;
    return;
  }
  if (talkBtn) talkBtn.textContent = text;
}

function setTalkBtnIdle(talkBtn) {
  if (!talkBtn) return;
  talkBtn.classList.remove("record-glow", "record-stopflash", "record-sending");
  delete talkBtn.dataset.stopLabel;
  setTalkBtnLabel(talkBtn, "🎙 Record");
}

function setTalkBtnRecording(talkBtn) {
  if (!talkBtn) return;
  talkBtn.classList.remove("record-stopflash", "record-sending");
  delete talkBtn.dataset.stopLabel;
  talkBtn.classList.add("record-glow");
  setTalkBtnLabel(talkBtn, "■ Stop & Send");
}

function setTalkBtnSending(talkBtn, text = "Sending…") {
  if (!talkBtn) return;
  talkBtn.classList.remove("record-glow", "record-stopflash");
  talkBtn.classList.add("record-sending");
  delete talkBtn.dataset.stopLabel;
  setTalkBtnLabel(talkBtn, text);
}

function flashTalkBtnStopping(talkBtn) {
  if (!talkBtn) return;
  talkBtn.dataset.stopLabel = "Stopping…";
  talkBtn.classList.remove("record-glow", "record-stopflash", "record-sending");
  void talkBtn.offsetWidth;
  talkBtn.classList.add("record-stopflash");
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
      flashTalkBtnStopping(talkBtn);

      try {
        const blob = await stopRecordingAndGetBlob();
        state.isRecording = false;
        root.dataset.speaker = "assistant";
        root.dataset.speakerState = "thinking";
        root.classList.remove("is-recording");

        // Let the white burst + snap-in label read, but keep it brief.
        await waitMs(115);

        // Then settle into a quieter neutral send state.
        setTalkBtnSending(talkBtn, "Sending…");

        if (blob) await sendTurn({ audioBlob: blob });
      } finally {
        setTalkBtnIdle(talkBtn);
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
      root.dataset.speaker = "user";
      root.dataset.speakerState = "recording";
      root.classList.add("is-recording");
      setTalkBtnRecording(talkBtn);
    } catch (e) {
      console.error("[Convo] start recording failed", e);
      setTalkBtnIdle(talkBtn);
      luxToast(`Recording failed: ${e?.message || e}`, { type: "error" });
    } finally {
      state.busy = false;
      talkBtn.disabled = false;
    }
  });

  endBtn.addEventListener("click", async () => {
    try {
      const report = await convoReport({
        uid: uid(),
        sessionId: state.sessionId,
        scenarioId: SCENARIOS[state.scenarioIdx]?.id || "unknown",
        messages: state.messages,
        turns: state.turns,
      });

      showConvoReportOverlay(report);
    } catch (err) {
      console.error("[Convo] end/report failed", err);
      luxToast(`Could not generate report: ${err?.message || err}`, {
        type: "error",
      });
    }
  });
}