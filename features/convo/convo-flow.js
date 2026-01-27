// features/convo/convo-flow.js
import { buildConvoTargetOverlay } from "../next-activity/next-activity.js";
import { attachConvoHandlers } from "./convo-handlers.js";
import { createConvoRecording } from "./convo-recording.js";
import { createConvoTurn } from "./convo-turn.js";

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

  const { startRecording, stopRecordingAndGetBlob } = createConvoRecording({ state });

  const { sendTurn } = createConvoTurn({
    SCENARIOS,
    state,
    input,
    renderMessages,
    renderSuggestions,
    convoTurn,
    assessPronunciation,
    saveAttempt,
    uid,
    scenarioForTurn,
    modelMessagesSlice,
    showNetErrorBubble,
  });

  attachConvoHandlers({
    SCENARIOS,
    state,
    root,
    input,
    talkBtn,
    endBtn,
    startRecording,
    stopRecordingAndGetBlob,
    sendTurn,
    convoReport,
    uid,
    showConvoReportOverlay,
  });

  return { startScenario };
}
