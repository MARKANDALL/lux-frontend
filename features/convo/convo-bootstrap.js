// features/convo/convo-bootstrap.js
// Boots the AI conversation UI: builds layout, wires drawers/nav/flow, and initializes picker + state.

import { SCENARIOS } from "./scenarios.js";
import { assessPronunciation } from "../../api/assess.js";
import { convoReport } from "../../api/convo-report.js";
import { saveAttempt } from "../../api/index.js";
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
import { openCharsDrawer, closeCharsDrawer, peekCharsDrawer, unpeekCharsDrawer, isCharsDrawerOpen, swapCharsDrawerContent } from "./characters-drawer.js";
import { installConvoTtsContext } from "./convo-tts-context.js";
import { luxBus } from '../../app-core/lux-bus.js';

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
    pickerCharsBtn,
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
    levelSel,
    toneSel,
    lengthSel,
    meImg,
    aiImg,
  } = view;

  function syncConvoPortraits() {
    const s = SCENARIOS[state.scenarioIdx];
    const roles = s?.roles || [];

    const meRoleIdx = state.roleIdx ?? 0;
    const meRole = roles[meRoleIdx] || roles[0];

    // Pick the “other” role as AI (works for 2+ roles; prefers first non-me)
    const aiRole =
      roles.find((r, i) => i !== meRoleIdx) ||
      roles[1] ||
      roles[0];

    const meSrc = (s && meRole) ? `/assets/characters/${s.id}-${meRole.id}.jpg` : "";
    const aiSrc = (s && aiRole) ? `/assets/characters/${s.id}-${aiRole.id}.jpg` : "";

    if (meImg) {
      meImg.src = meSrc;
      meImg.onerror = () => {
        console.warn("[Lux] Missing portrait:", meSrc);
        meImg.style.visibility = "hidden";
      };
      meImg.style.visibility = "";
    }

    if (aiImg) {
      aiImg.src = aiSrc;
      aiImg.onerror = () => {
        console.warn("[Lux] Missing portrait:", aiSrc);
        aiImg.style.visibility = "hidden";
      };
      aiImg.style.visibility = "";
    }
  }

  // ✅ Give the global TTS drawer a convo-aware source (AI/Me/Selection) + character-matched voices
  installConvoTtsContext({ state, input, msgs, SCENARIOS });

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

  const setKnobs = createSetKnobs({ state, stage, levelSel, toneSel, lengthSel });

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
  const { renderAllSummaries } = wireConvoKnobsUI({
    state,
    setKnobs,
    knobsBtn,
    pickerKnobsBtn,
    pickerKnobsSummary,
    closeDrawer,
    scrim,
    levelSel,
    toneSel,
    lengthSel,
    knobsSummaryText,
    saveKnobs,
    SCENARIOS,
  });

  // --- Characters drawer wiring ---
  if (pickerCharsBtn) {
    pickerCharsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openCharsDrawer({
        scenarioIdx: state.scenarioIdx,
        roleIdx: state.roleIdx ?? 0,
        onRoleSelect: (idx) => {
          state.roleIdx = idx;
          renderAllSummaries();
          syncConvoPortraits();
luxBus.set('ttsContext', { changed: true });
        },
      });
    });
  }

  // Removed the duplicate hover event wiring:
  // if (pickerCharsBtn) {
  //   pickerCharsBtn.addEventListener("mouseenter", () => peekCharsDrawer());
  //   pickerCharsBtn.addEventListener("mouseleave", () => unpeekCharsDrawer());
  // }

  // Reset role selection when scenario changes (reads from bus, window mirror kept as fallback)
  luxBus.on('scenario', () => {
    state.roleIdx = 0;
    if (isCharsDrawerOpen()) {
      swapCharsDrawerContent(state.scenarioIdx, state.roleIdx);
    }
    renderAllSummaries();
    syncConvoPortraits();
luxBus.set('ttsContext', { changed: true });
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
    // Ensure we're in chat mode and start immediately
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
    pickerCharsBtn,
    pickerKnobsBtn,  // Added pickerKnobsBtn to the parameters
  });

  tryConsumeStoredNextActivityPlan(state);

  applyInitialConvoMode({ normalizeMode, setMode });

  syncConvoPortraits();

  // If we landed directly in chat (e.g., from "Generate my next practice"),
  // show the start tip immediately.
  if (state.mode === "chat" && state.nextActivity) {
    coach.maybeShowStartTip();
  }
}