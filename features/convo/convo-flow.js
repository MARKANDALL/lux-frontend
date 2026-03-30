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
    const overlay = buildConvoTargetOverlay(state.nextActivity);

    // ✅ If a custom scene was supplied (Life Journey), use it.
    const custom = state.nextActivity?.scene;
    if (custom && custom.title && custom.desc) {
      return {
        id: custom.id || "custom",
        title: custom.title,
        desc: overlay ? `${custom.desc}\n\n${overlay}` : custom.desc,
      };
    }

    // Default: regular scenario list
    const list = Array.isArray(SCENARIOS) ? SCENARIOS : [];

    let idx = Number(state.scenarioIdx);
    if (!Number.isFinite(idx)) idx = 0;
    idx = Math.trunc(idx);

    if (idx < 0 || idx >= list.length) {
      console.warn(`[Lux] Invalid scenarioIdx=${state.scenarioIdx} (len=${list.length}); resetting to 0.`);
      idx = 0;
      state.scenarioIdx = 0;
      state.roleIdx = 0;
    }

    const s = list[idx];

    // If scenarios somehow failed to load, don't crash the whole page
    if (!s) {
      return {
        id: "missing",
        title: "AI Conversation",
        desc: overlay || "",
        more: "",
        role: null,
        otherRole: null,
      };
    }

    // ✅ Resolve the selected role (default to first role)
    const roleIdx = state.roleIdx ?? 0;
    const role = s.roles?.[roleIdx] || s.roles?.[0] || null;

    // The OTHER role — the one the AI plays
    const otherIdx = roleIdx === 0 ? 1 : 0;
    const otherRole = s.roles?.[otherIdx] || null;

    return {
      id: s.id,
      title: s.title,
      desc: overlay ? `${s.desc}\n\n${overlay}` : s.desc,
      more: s.more || "",
      role: role,
      otherRole: otherRole,
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
    const thinkingStart = performance.now();

    // Opening state: AI always starts, so show thinking immediately
    if (root) {
      root.dataset.speaker = "assistant";
      root.dataset.speakerState = "thinking";
      root.classList.remove("is-recording");
    }

    // ask backend for opening line + suggestions
    try {
      const rsp = await convoTurn({ scenario, knobs: state.knobs, messages: [] });
      state.messages.push({ role: "assistant", content: rsp.assistant });
      renderMessages();

      // Hand turn to the user, but keep the opening thinking state
      // visible briefly if the backend responds very fast.
      if (root) {
        const dt = performance.now() - thinkingStart;
        const minMs = 700;
        const wait = Math.max(0, minMs - dt);

        window.setTimeout(() => {
          root.dataset.speaker = "user";
          root.dataset.speakerState = "ready";
        }, wait);
      }

      renderSuggestions(rsp.suggested_replies);
    } catch (err) {
      // Avoid leaving the AI stuck in "thinking" if the opener fails
      if (root) {
        root.dataset.speaker = "user";
        root.dataset.speakerState = "ready";
      }

      console.warn("[convo] startScenario failed", err);
      showNetErrorBubble(err);
    }
  }

  const { startRecording, stopRecordingAndGetBlob } = createConvoRecording({ state });

  const { sendTurn } = createConvoTurn({
    SCENARIOS,
    state,
    input,
    root,
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