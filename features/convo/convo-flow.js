// features/convo/convo-flow.js
import { buildConvoTargetOverlay } from "../next-activity/next-activity.js";

export function wireConvoFlow({
  SCENARIOS,
  state,

  // DOM
  root,
  input,
  talkBtn,
  endBtn,

  // render hooks
  renderMessages,
  renderSuggestions,

  // APIs + helpers
  convoTurn,
  assessPronunciation,
  saveAttempt,
  uid,
  convoReport,
  showConvoReportOverlay,
}) {
  function scenarioForTurn() {
    const s = SCENARIOS[state.scenarioIdx];
    const overlay = buildConvoTargetOverlay(state.nextActivity);
    return {
      id: s.id,
      title: s.title,
      desc: overlay ? `${s.desc}\n\n${overlay}` : s.desc,
    };
  }

  function showNetErrorBubble(err) {
    const msg = err && err.message ? err.message : "Unknown error";

    // Visible bubble, but keep it OUT of model history by using role:"system"
    state.messages.push({
      role: "system",
      content: `⚠️ AI turn failed: ${msg}. Try again.`,
    });
    renderMessages();
    renderSuggestions([]);
  }

  function modelMessagesSlice() {
    // Never send "system" bubbles back to the model
    return state.messages
      .filter((m) => m.role === "assistant" || m.role === "user")
      .slice(-24);
  }

  async function startScenario() {
    // reset convo
    state.messages = [];
    state.turns = [];
    renderMessages();
    renderSuggestions([]);

    const scenario = scenarioForTurn();

    // ask backend for opening line + suggestions
    try {
      const rsp = await convoTurn({ scenario, knobs: state.knobs, messages: [] });
      state.messages.push({ role: "assistant", content: rsp.assistant });
      renderMessages();
      renderSuggestions(rsp.suggested_replies);
    } catch (err) {
      console.warn("[convo] startScenario failed", err);
      showNetErrorBubble(err);
    }
  }

  // --- Recording helpers ---
  async function startRecording() {
    state.chunks = [];
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recorder = new MediaRecorder(state.stream);

    state.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.chunks.push(e.data);
    };

    state.recorder.start();
  }

  async function stopRecordingAndGetBlob() {
    return new Promise((resolve) => {
      if (!state.recorder) return resolve(null);

      const rec = state.recorder;
      rec.onstop = () => {
        try {
          state.stream?.getTracks()?.forEach((t) => t.stop());
        } catch (_) {}
        state.stream = null;

        const blob = new Blob(state.chunks, { type: rec.mimeType || "audio/webm" });
        state.chunks = [];
        state.recorder = null;
        resolve(blob);
      };

      rec.stop();
    });
  }

  // --- Turn send (assess -> attempt -> convoTurn) ---
  async function sendTurn({ audioBlob }) {
    const s = SCENARIOS[state.scenarioIdx];
    const scenario = scenarioForTurn();
    const userText = (input.value || "").trim();
    if (!userText) return;

    // Hand the finished learner audio to the Self Playback drawer (if present)
    if (audioBlob) {
      if (window.__attachLearnerBlob) window.__attachLearnerBlob(audioBlob);
    }

    // show user msg in chat immediately (natural flow)
    state.messages.push({ role: "user", content: userText });
    renderMessages();
    input.value = "";

    // Azure assessment (silent) - only if we actually have audio
    let azureResult = null;
    try {
      if (audioBlob && audioBlob.size > 0) {
        azureResult = await assessPronunciation({ audioBlob, text: userText });
      }
    } catch (e) {
      console.error("[Convo] assess failed", e);
    }

    // save attempt (always)
    try {
      const saved = await saveAttempt({
        uid: uid(),
        passageKey: `convo:${s.id}`,
        partIndex: state.turns.length,
        text: userText,
        azureResult,
        sessionId: state.sessionId,
        localTime: new Date().toISOString(),
      });

      // Keep AI Coach wired to the latest convo attempt (Practice Skills parity)
      window.lastAttemptId = saved?.id || null;

      state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: saved?.id });
    } catch (e) {
      console.error("[Convo] saveAttempt failed", e);
      state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: null });
    }

    // refresh Conversation Skills progress (if present)
    if (window.refreshConvoProgress) {
      try {
        await window.refreshConvoProgress();
      } catch (_) {}
    }

    // next AI response + suggestions
    let rsp;
    try {
      rsp = await convoTurn({
        scenario,
        knobs: state.knobs,
        messages: modelMessagesSlice(),
      });
    } catch (err) {
      console.warn("[convo] convo-turn failed", err);
      showNetErrorBubble(err);
      return;
    }

    state.messages.push({ role: "assistant", content: rsp.assistant });
    renderMessages();
    renderSuggestions(rsp.suggested_replies);
  }

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

  return { startScenario };
}
