// features/convo/convo-turn.js
import { getAudioMode } from "../recorder/audio-mode.js";
import { persistConvoAttempt } from "./convo-persistence.js";

export function createConvoTurn({
  SCENARIOS,
  state,
  input,

  // render hooks
  renderMessages,
  renderSuggestions,

  // APIs + helpers
  convoTurn,
  assessPronunciation,
  saveAttempt,
  uid,

  // closures from flow
  scenarioForTurn,
  modelMessagesSlice,
  showNetErrorBubble,
}) {
  // --- Turn send (assess -> attempt -> convoTurn) ---
  async function sendTurn({ audioBlob }) {
    const s = SCENARIOS[state.scenarioIdx];
    const scenario = scenarioForTurn();
    const userText = (input.value || "").trim();
    if (!userText) return;

    // Hand the finished learner audio to the Self Playback drawer (if present)
    if (audioBlob) {
      // ✅ Store latest recording globally so Self Playback can download it
      try {
        const mode = getAudioMode();
        window.LuxLastRecordingBlob = audioBlob;
        window.LuxLastRecordingMeta = {
          mode,
          type: audioBlob?.type || "",
          size: audioBlob?.size || 0,
          ts: Date.now(),
          scope: "convo",
        };

        window.dispatchEvent(
          new CustomEvent("lux:lastRecording", {
            detail: { blob: audioBlob, meta: window.LuxLastRecordingMeta },
          })
        );
      } catch {}

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

    await persistConvoAttempt({
      saveAttempt,
      uid,
      s,
      state,
      userText,
      azureResult,
    });

    // Auto-open AI Coach after the first saved user turn
    try {
      const d = document.getElementById("aiCoachDrawer");
      if (d && !d.open && state.turns.length === 1) d.open = true;
    } catch (_) {}

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

  return { sendTurn };
}
