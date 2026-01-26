// features/convo/index.js
import { SCENARIOS } from "./scenarios.js";
import { assessPronunciation } from "../../api/assess.js";
import { convoReport } from "../../api/convo-report.js";
import { saveAttempt } from "/src/api/index.js";
import { warpSwap } from "../../ui/warp-core.js";

import { convoTurnWithUi } from "./convo-api.js";
import { createConvoModeController } from "./convo-modes.js";
import { buildConvoLayout } from "./convo-layout.js";

import { consumeNextActivityPlan } from "../next-activity/next-activity.js";

import { initSceneAtmo } from "./scene-atmo.js";
import { wirePickerDeck } from "./picker-deck.js";
import { wireConvoFlow } from "./convo-flow.js";

import {
  applyMediaSizingVars,
  uid,
  newSessionId,
  el,
  showConvoReportOverlay,
} from "./convo-shared.js";

import { mountAICoachAlwaysOn } from "../../ui/ui-ai-ai-logic.js";
import { createConvoCoach } from "./convo-coach.js";

import { mountAudioModeSwitch } from "../recorder/audio-mode-switch.js";

import { loadKnobs, saveKnobs, knobsSummaryText } from "./convo-knobs.js";

import { initConvoRender, renderMessages, renderSuggestions } from "./convo-render.js";

import { wireConvoNav } from "./convo-nav.js";

export function bootConvo() {
  const root = document.getElementById("convoApp");
  if (!root) return;

  // Prevent duplicate listeners on hot reload
  if (root.dataset.luxBooted === "1") return;
  root.dataset.luxBooted = "1";

  const state = {
    sessionId: newSessionId(),
    scenarioIdx: 0,
    mode: "intro", // intro | picker | chat
    knobsOpen: false,
    knobs: loadKnobs(),

    messages: [], // {role:"user"|"assistant", content:string}
    turns: [], // {turn, userText, azureResult, attemptId?}

    isRecording: false,
    stream: null,
    recorder: null,
    chunks: [],

    busy: false,

    // Next practice (optional)
    nextActivity: null,
    coach: { startTipShown: false, replyTipShown: false, typeTipShown: false },
  };

  const next = consumeNextActivityPlan();
  if (next && next.kind === "ai_conversation") {
    state.nextActivity = next;

    // Choose a base scenario for variety (keeps passageKey pretty: convo:doctor, etc.)
    state.scenarioIdx = Math.floor(Math.random() * SCENARIOS.length);
  }

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
    heroNext,
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
    // Ensure the AI Coach shell exists as soon as we enter chat mode.
    if (state.mode === "chat") {
      mountAICoachAlwaysOn(() => {
        const t = state.turns?.length ? state.turns[state.turns.length - 1] : null;
        return t
          ? { azureResult: t.azureResult, referenceText: t.userText, firstLang: "universal" }
          : null;
      });
    }
  }

  function setKnobs(open) {
    state.knobsOpen = !!open;
    stage.classList.toggle("knobs-open", state.knobsOpen);

    // If opening, ensure drawer UI reflects current state
    if (state.knobsOpen) {
      toneSel.sel.value = state.knobs.tone;
      stressSel.sel.value = state.knobs.stress;
      paceSel.sel.value = state.knobs.pace;
    }
  }

  // Mode controller (extracted)
  const modeCtl = createConvoModeController({
    root,
    state,
    setParallaxEnabled,
    setKnobs,
    render,
  });

  const { normalizeMode, setMode } = modeCtl;
  modeCtl.wirePopstate({ warpSwap });

  // ✅ Intro/picker/chat navigation wiring now lives in convo-nav.js
  wireConvoNav({ state, intro, heroNext, scenBtn, setMode, warpSwap });

  knobsBtn.addEventListener("click", () => setKnobs(!state.knobsOpen));

  if (pickerKnobsBtn) {
    pickerKnobsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // IMPORTANT: don't advance deck / trigger other clicks
      setKnobs(true);
    });
  }

  closeDrawer.addEventListener("click", () => setKnobs(false));
  scrim.addEventListener("click", () => setKnobs(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setKnobs(false);
  });

  // Initialize drawer selects from stored knobs
  toneSel.sel.value = state.knobs.tone;
  stressSel.sel.value = state.knobs.stress;
  paceSel.sel.value = state.knobs.pace;

  // Picker summary (if present)
  function renderPickerKnobsSummary() {
    if (!pickerKnobsSummary) return;
    pickerKnobsSummary.textContent = knobsSummaryText(state.knobs);
  }
  renderPickerKnobsSummary();

  toneSel.sel.addEventListener("change", () => {
    state.knobs.tone = toneSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });

  stressSel.sel.addEventListener("change", () => {
    state.knobs.stress = stressSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });

  paceSel.sel.addEventListener("change", () => {
    state.knobs.pace = paceSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
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

  async function beginScenario() {
    await warpSwap(() => setMode("chat"), { outMs: 200, inMs: 240 });
    await startScenario(); // fetch opening line + suggested replies
  }

  // --- Picker deck (extracted) ---
  const { renderDeck } = wirePickerDeck({
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

  // boot
  applySceneVisuals();
  renderDeck();

  // If a Next Practice plan was stored, consume it once and keep in memory for this session.
  try {
    const plan = consumeNextActivityPlan();
    if (plan) state.nextActivity = plan;
  } catch (_) {}

  // Initial mode: hash (if present) wins, otherwise intro.
  const initialMode =
    normalizeMode(history.state?.luxConvo ? history.state.mode : location.hash) || "intro";

  setMode(initialMode, { replace: true, push: false });

  // If we landed directly in chat (e.g., from "Generate my next practice"),
  // show the start tip immediately.
  if (state.mode === "chat" && state.nextActivity) {
    coach.maybeShowStartTip();
  }
}
