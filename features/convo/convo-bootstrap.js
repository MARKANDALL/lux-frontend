// features/convo/convo-bootstrap.js
import { SCENARIOS } from "./scenarios.js";
import { assessPronunciation } from "../../api/assess.js";
import { convoReport } from "../../api/convo-report.js";
import { saveAttempt } from "/src/api/index.js";
import { warpSwap } from "../../ui/warp-core.js";

import { convoTurnWithUi } from "./convo-api.js";
import { buildConvoLayout } from "./convo-layout.js";

import { initSceneAtmo } from "./scene-atmo.js";
import { wireConvoFlow } from "./convo-flow.js";

import { applyMediaSizingVars, uid, el, showConvoReportOverlay } from "./convo-shared.js";

import { createConvoCoach } from "./convo-coach.js";

import { mountAudioModeSwitch } from "../recorder/audio-mode-switch.js";

import { saveKnobs, knobsSummaryText } from "./convo-knobs.js";

import { initConvoRender, renderMessages, renderSuggestions } from "./convo-render.js";

import { wireConvoNav } from "./convo-nav.js";

import { wireConvoKnobsUI } from "./convo-knobs-ui.js";

import { renderAICoachShell } from "./convo-ai-coach-shell.js";

import { createConvoState, tryConsumeStoredNextActivityPlan } from "./convo-state.js";

import { initConvoModeSystem, applyInitialConvoMode } from "./convo-mode-system.js";

import { createBeginScenario, initConvoPickerSystem } from "./convo-picker-system.js";

import { createSetKnobs } from "./convo-knobs-system.js";

export function bootConvo() {
  const root = document.getElementById("convoApp");
  if (!root) return;

  // Prevent duplicate listeners on hot reload
  if (root.dataset.luxBooted === "1") return;
  root.dataset.luxBooted = "1";

  const state = createConvoState();

  const view = buildConvoLayout({
    root,
    el,
    mode: state.mode,
    sessionId: state.sessionId,
  });

  // ✅ Audio Mode Switch (Normal / Pro) on AI Conversations
  mountAudioModeSwitch({ scope: "convo" });

  const {
    atmo,
    intro,
    guidedBtn,
    streamLink,
    lifeLink,
    deckActive,
    deckPreview,
    thumbs,
    pickerKnobsBtn,
    pickerKnobsSummary,
    backBtn,
    nextBtn,
    scenBtn,
    knobsBtn,
    endBtn,
    msgs,
    sugs,
    sugsNote,
    coachBar,
    input,
    talkBtn,
    closeDrawer,
    scrim,
    stage,
    toneSel,
    stressSel,
    paceSel,
  } = view;

  const { applySceneVisuals, setParallaxEnabled } = initSceneAtmo({
    root,
    atmo,
    state,
    scenarios: SCENARIOS,
  });

  // Coach controller (after coachBar + input exist)
  const coach = createConvoCoach({ state, coachBar, input, el });
  coach.wireTypeTip();

  // ✅ Render helpers now live in convo-render.js
  initConvoRender({ state, msgs, sugs, sugsNote, input, el, coach });

  function render() {
    renderAICoachShell(state);
  }

  const setKnobs = createSetKnobs({ state, stage, toneSel, stressSel, paceSel });

  const { normalizeMode, setMode } = initConvoModeSystem({
    root,
    state,
    setParallaxEnabled,
    setKnobs,
    render,
    warpSwap,
  });

  // ✅ Intro/picker/chat navigation wiring now lives in convo-nav.js
  wireConvoNav({ state, guidedBtn, scenBtn, setMode, warpSwap });

  // ✅ Knobs drawer wiring now lives in convo-knobs-ui.js
  wireConvoKnobsUI({
    state,
    setKnobs,
    knobsBtn,
    pickerKnobsBtn,
    pickerKnobsSummary,
    closeDrawer,
    scrim,
    toneSel,
    stressSel,
    paceSel,
    knobsSummaryText,
    saveKnobs,
  });

  // --- Convo flow (extracted) ---
  const { startScenario } = wireConvoFlow({
    SCENARIOS,
    state,
    root,
    input,
    talkBtn,
    endBtn,
    renderMessages,
    renderSuggestions,
    convoTurn: convoTurnWithUi,
    assessPronunciation,
    saveAttempt,
    uid,
    convoReport,
    showConvoReportOverlay,
  });

  if (state.nextActivity) {
    // Ensure we’re in chat mode and start immediately
    warpSwap(() => setMode("chat", { replace: true, push: false }), { outMs: 120, inMs: 160 })
      .then(() => startScenario())
      .catch((e) => console.error("[NextPractice] auto-start failed", e));
  }

  const beginScenario = createBeginScenario({ warpSwap, setMode, startScenario });

  initConvoPickerSystem({
    scenarios: SCENARIOS,
    state,
    thumbs,
    deckActive,
    deckPreview,
    backBtn,
    nextBtn,
    el,
    applyMediaSizingVars,
    applySceneVisuals,
    onBeginScenario: beginScenario,
  });

  tryConsumeStoredNextActivityPlan(state);

  applyInitialConvoMode({ normalizeMode, setMode });

  // If we landed directly in chat (e.g., from "Generate my next practice"),
  // show the start tip immediately.
  if (state.mode === "chat" && state.nextActivity) {
    coach.maybeShowStartTip();
  }
}
