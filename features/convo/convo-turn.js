// features/convo/convo-turn.js
// One-line: Manages a full user turn → persistence → assistant response.

import { getAudioMode } from "../recorder/audio-mode.js";
import { persistConvoAttempt } from "./convo-persistence.js";
import { setLastRecording } from "../../app-core/runtime.js";

export function createConvoTurn({
  SCENARIOS,
  state,
  input,
  root,

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
        setLastRecording(audioBlob, {
          mode,
          type: audioBlob?.type || "",
          size: audioBlob?.size || 0,
          ts: Date.now(),
          scope: "convo",
        });
      } catch (err) { globalThis.warnSwallow("features/convo/convo-turn.js", err); }

      if (window.__attachLearnerBlob) window.__attachLearnerBlob(audioBlob);
    }

    // show user msg in chat immediately (natural flow)
    state.messages.push({ role: "user", content: userText });
    renderMessages();
    input.value = "";

    // Portrait state: AI is thinking (make it visible)
    const root = document.getElementById("convoApp");
    const thinkingStart = performance.now();
    if (root) {
      root.dataset.speaker = "assistant";
      root.dataset.speakerState = "thinking";
    }

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
    } catch (err) { globalThis.warnSwallow("features/convo/convo-turn.js", err); }

    // refresh Conversation Skills progress (if present)
    if (window.refreshConvoProgress) {
      try {
        await window.refreshConvoProgress();
      } catch (err) { globalThis.warnSwallow("features/convo/convo-turn.js", err); }
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

    // Portrait state: it's now the user's turn (but keep "thinking" visible briefly)
    if (root) {
      const dt = performance.now() - thinkingStart;
      const minMs = 700; // makes dots/ring actually noticeable
      const wait = Math.max(0, minMs - dt);

      window.setTimeout(() => {
        root.dataset.speaker = "user";
        root.dataset.speakerState = "ready";
      }, wait);
    }

    renderSuggestions(rsp.suggested_replies);
  }

  return { sendTurn };
}