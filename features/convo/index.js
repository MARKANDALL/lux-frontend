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
import { highlightHtml, stripMarks } from "./convo-highlight.js";
import { createConvoCoach } from "./convo-coach.js";

export function bootConvo() {
  const root = document.getElementById("convoApp");
  if (!root) return;

  // Prevent duplicate listeners on hot reload
  if (root.dataset.luxBooted === "1") return;
  root.dataset.luxBooted = "1";

  const KNOBS_KEY = "lux_knobs_v1";
  const KNOBS_DEFAULTS = { tone: "friendly", stress: "low", pace: "normal" };

  function loadKnobs() {
    try {
      const raw = localStorage.getItem(KNOBS_KEY);
      if (!raw) return { ...KNOBS_DEFAULTS };
      const parsed = JSON.parse(raw);
      return { ...KNOBS_DEFAULTS, ...(parsed || {}) };
    } catch {
      return { ...KNOBS_DEFAULTS };
    }
  }

  function saveKnobs(knobs) {
    try {
      localStorage.setItem(KNOBS_KEY, JSON.stringify(knobs));
    } catch {}
  }

  function knobsSummaryText(knobs) {
    const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
    return `Tone: ${cap(knobs.tone)} • Stress: ${cap(knobs.stress)} • Pace: ${cap(knobs.pace)}`;
  }

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

  function warpToPicker() {
    // intro -> picker gets the warp treatment
    if (state.mode !== "intro") return setMode("picker");
    warpSwap(() => setMode("picker"), { outMs: 200, inMs: 240 });
  }

  // Intro click => picker (Edge-like “push”)
  intro.addEventListener("click", warpToPicker);
  heroNext.addEventListener("click", (e) => {
    e.stopPropagation();
    warpToPicker();
  });

  // Chat header buttons
  scenBtn.addEventListener("click", () =>
    warpSwap(() => setMode("picker"), { outMs: 170, inMs: 220 })
  );
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

  // Helpers (for rendering / highlight inputs)
  function getWordBank() {
    return (state.nextActivity?.targets?.words || [])
      .map((x) => x?.word || x)
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean);
  }

  function getFocusIpa() {
    return state.nextActivity?.targets?.phoneme?.ipa || "";
  }

  // --- Chat rendering ---
  function renderMessages() {
    msgs.innerHTML = "";
    const focusIpa = getFocusIpa();
    const wb = getWordBank();

    for (const m of state.messages) {
      const bubble = el("div", "msg " + (m.role === "user" ? "user" : "assistant"));
      bubble.innerHTML = highlightHtml(m.content, {
        wordBank: wb,
        focusIpa,
        autoBlue: m.role !== "user",
      });
      msgs.append(bubble);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderSuggestions(list) {
    sugs.innerHTML = "";
    const focusIpa = getFocusIpa();
    const wb = getWordBank();

    (list || []).forEach((t) => {
      const raw = stripMarks(t);
      const b = el("button", "sug");
      b.dataset.raw = raw;
      b.innerHTML = highlightHtml(t, { wordBank: wb, focusIpa, autoBlue: true });
      b.addEventListener("click", () => {
        input.value = raw;
        input.focus();
      });
      sugs.append(b);
    });

    // Tiny, always-light label (not overwhelming)
    if (state.nextActivity && (list || []).length) {
      const t = coach.targetsInline(state.nextActivity);
      sugsNote.textContent = t
        ? `Suggested replies are tuned to: ${t}`
        : "Suggested replies are tuned to your targets.";
    } else {
      sugsNote.textContent = "";
    }

    coach.noteSuggestionsRendered(list);
  }

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
