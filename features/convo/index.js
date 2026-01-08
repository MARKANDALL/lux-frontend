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

import { promptUserForAI } from "../../ui/ui-ai-ai-logic.js";
import { highlightHtml, stripMarks } from "./convo-highlight.js";
import { createConvoCoach } from "./convo-coach.js";

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
    knobs: { tone: "friendly", stress: "low", pace: "normal" },

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
    backBtn,
    nextBtn,
    scenBtn,
    knobsBtn,
    coachBtn,
    endBtn,
    msgs,
    sugs,
    sugsNote,
    coachBar,
    input,
    talkBtn,
    closeDrawer,
    scrim,
    toneSel,
    stressSel,
    paceSel,
  } = view;

  const { applySceneVisuals, setParallaxEnabled } = initSceneAtmo({ root, atmo, state });

  // Coach controller (after coachBar + input exist)
  const coach = createConvoCoach({ state, coachBar, input, el });
  coach.wireTypeTip();

  function render() {}

  function setKnobs(open) {
    state.knobsOpen = !!open;
    root.classList.toggle("knobs-open", state.knobsOpen);
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
  knobsBtn.addEventListener("click", () => setKnobs(true));
  coachBtn.addEventListener("click", () => {
    const section = document.getElementById("aiFeedbackSection");
    if (!section) {
      alert("AI Coach mount not found (aiFeedbackSection).");
      return;
    }

    // Find most recent analyzed turn
    const t = [...(state.turns || [])]
      .reverse()
      .find((x) => x?.azureResult?.NBest?.[0]);

    if (!t) {
      alert("No analyzed turns yet. Record a reply first.");
      return;
    }

    // Persist coaching onto THIS attempt (same mechanism as Practice Skills)
    window.lastAttemptId = t.attemptId || null;

    // For convo, referenceText == what the learner intended to say
    promptUserForAI(t.azureResult, t.userText || "", "universal");

    section.scrollIntoView?.({ behavior: "smooth", block: "start" });
  });
  closeDrawer.addEventListener("click", () => setKnobs(false));
  scrim.addEventListener("click", () => setKnobs(false));

  // Knob wiring
  toneSel.sel.value = state.knobs.tone;
  stressSel.sel.value = state.knobs.stress;
  paceSel.sel.value = state.knobs.pace;

  toneSel.sel.addEventListener("change", () => (state.knobs.tone = toneSel.sel.value));
  stressSel.sel.addEventListener("change", () => (state.knobs.stress = stressSel.sel.value));
  paceSel.sel.addEventListener("change", () => (state.knobs.pace = paceSel.sel.value));

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
