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
    practiceMeta,
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
    meChip,
    aiChip,
    meImg,
    aiImg,
    mePanel,
    aiPanel,
    mePanelClose,
    aiPanelClose,
    mePanelImg,
    aiPanelImg,
    mePanelTitle,
    aiPanelTitle,
    mePanelDesc,
    aiPanelDesc,
  } = view;

  const profilePanels = { me: false, ai: false };

  function getConvoRolePair() {
    const scenario = SCENARIOS[state.scenarioIdx];
    const roles = scenario?.roles || [];

    const meRoleIdx = state.roleIdx ?? 0;
    const meRole = roles[meRoleIdx] || roles[0] || null;

    const aiRole =
      roles.find((_, i) => i !== meRoleIdx) ||
      roles[1] ||
      roles[0] ||
      null;

    return { scenario, meRole, aiRole };
  }

  function getPortraitSrc(scenario, role) {
    return scenario && role
      ? `/assets/characters/${scenario.id}-${role.id}.jpg`
      : "";
  }

  function setPortraitSrc(imgEl, src, alt) {
    if (!imgEl) return;
    imgEl.alt = alt || "";
    imgEl.src = src || "";
    imgEl.onerror = () => {
      if (src) console.warn("[Lux] Missing portrait:", src);
      imgEl.style.visibility = "hidden";
    };
    imgEl.style.visibility = src ? "" : "hidden";
  }

  function syncProfilePanels() {
    const { scenario, meRole, aiRole } = getConvoRolePair();

    const meSrc = getPortraitSrc(scenario, meRole);
    const aiSrc = getPortraitSrc(scenario, aiRole);

    if (mePanelTitle) mePanelTitle.textContent = meRole?.label || "You";
    if (aiPanelTitle) aiPanelTitle.textContent = aiRole?.label || "AI";

    if (mePanelDesc) mePanelDesc.textContent = meRole?.npc || "";
    if (aiPanelDesc) aiPanelDesc.textContent = aiRole?.npc || "";

    setPortraitSrc(mePanelImg, meSrc, meRole?.label || "You");
    setPortraitSrc(aiPanelImg, aiSrc, aiRole?.label || "AI");

    if (mePanel) {
      mePanel.classList.toggle("is-open", !!profilePanels.me);
      mePanel.setAttribute("aria-hidden", profilePanels.me ? "false" : "true");
    }

    if (aiPanel) {
      aiPanel.classList.toggle("is-open", !!profilePanels.ai);
      aiPanel.setAttribute("aria-hidden", profilePanels.ai ? "false" : "true");
    }

    if (meChip) meChip.setAttribute("aria-expanded", profilePanels.me ? "true" : "false");
    if (aiChip) aiChip.setAttribute("aria-expanded", profilePanels.ai ? "true" : "false");
  }

  function setProfilePanelOpen(side, open) {
    profilePanels[side] = !!open;
    syncProfilePanels();
  }

  function toggleProfilePanel(side) {
    setProfilePanelOpen(side, !profilePanels[side]);
  }

  function syncConvoPortraits() {
    const { scenario, meRole, aiRole } = getConvoRolePair();

    setPortraitSrc(meImg, getPortraitSrc(scenario, meRole), meRole?.label || "You");
    setPortraitSrc(aiImg, getPortraitSrc(scenario, aiRole), aiRole?.label || "AI");

    syncProfilePanels();
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

  function syncPracticeMeta() {
    if (!practiceMeta) return;

    const phRaw = state.nextActivity?.targets?.phoneme?.ipa || "";
    const ph = String(phRaw).trim().replace(/^\/|\/$/g, "");
    const words = (state.nextActivity?.targets?.words || [])
      .map((x) => x?.word || x)
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 6);

    practiceMeta.innerHTML = "";

    if (!ph && !words.length) {
      practiceMeta.hidden = true;
      return;
    }

    if (ph) {
      const soundRow = el("div", "lux-practiceMetaRow");
      const soundLabel = el("div", "lux-practiceMetaLabel", "Sound");
      const soundValue = el("div", "lux-practiceMetaValue");
      soundValue.append(el("span", "lux-hl2", `/${ph}/`));
      soundRow.append(soundLabel, soundValue);
      practiceMeta.append(soundRow);
    }

    if (words.length) {
      const wordsRow = el("div", "lux-practiceMetaRow");
      const wordsLabel = el("div", "lux-practiceMetaLabel", "Words");
      const wordsValue = el("div", "lux-practiceMetaValue");

      words.forEach((word, idx) => {
        wordsValue.append(el("span", "lux-hl", word));
        if (idx < words.length - 1) {
          wordsValue.append(document.createTextNode(", "));
        }
      });

      wordsRow.append(wordsLabel, wordsValue);
      practiceMeta.append(wordsRow);
    }

    practiceMeta.hidden = false;
  }

  syncPracticeMeta();

  function render() {
    renderAICoachShell(state);
    syncPracticeMeta();
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

  if (meChip) {
    meChip.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleProfilePanel("me");
    });
  }

  if (aiChip) {
    aiChip.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleProfilePanel("ai");
    });
  }

  if (mePanelClose) {
    mePanelClose.addEventListener("click", () => setProfilePanelOpen("me", false));
  }

  if (aiPanelClose) {
    aiPanelClose.addEventListener("click", () => setProfilePanelOpen("ai", false));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!profilePanels.me && !profilePanels.ai) return;
    setProfilePanelOpen("me", false);
    setProfilePanelOpen("ai", false);
  });

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

  if (state.nextActivity) {
    const autoStart = async () => {
      if (state.mode !== "chat") {
        await warpSwap(() => setMode("chat", { replace: true, push: false }), {
          outMs: 120,
          inMs: 160,
        });
      } else {
        setMode("chat", { replace: true, push: false });
      }

      syncConvoPortraits();
      coach.maybeShowStartTip();
      await startScenario();
    };

    autoStart().catch((e) => console.error("[NextPractice] auto-start failed", e));
    return;
  }

  // If we landed directly in chat without a saved Next Practice plan,
  // keep the normal manual chat entry behavior.
  if (state.mode === "chat") {
    syncConvoPortraits();
  }
}