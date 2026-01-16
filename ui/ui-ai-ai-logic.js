// ui/ui-ai-ai-logic.js
// Handles Logic for AI Feedback (Quick/Deep modes + Auto-Updates).

import {
  showLoading,
  hideAI,
  renderSections,
  renderEntryButtons,
  updateFooterButtons,
  showAIFeedbackError,
  clearAIFeedback,
  getCurrentPersona, // <--- NEW IMPORT
  renderAIFeedbackMarkdown,
  openAICoachDrawer,
  collapseAICoachDrawer,
} from "./ui-ai-ai-dom.js";

import { fetchAIFeedback, updateAttempt } from "/src/api/index.js";

// State
let chunkHistory = [];
let currentArgs = null;
let isFetching = false;

let lastContext = {
  azureResult: null,
  referenceText: "",
  firstLang: "universal",
};

// NEW: QuickTip paging state
let quickTipState = { index: 0, count: 3, cache: [] };

/**
 * Entry Point
 */
export function promptUserForAI(azureResult, referenceText, firstLang) {
  const nb = azureResult?.NBest?.[0];
  const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();

  if (!nb || !saidText) {
    hideAI();
    return;
  }

  // Save context
  lastContext = { azureResult, referenceText, firstLang };
  resetState();

  // Practice Skills: auto-open after first usable result
  openAICoachDrawer();

  // Render Entry with Sidebar Callback
  renderEntryButtons({
    onQuick: (persona) => startQuickMode(azureResult, referenceText, firstLang, persona),
    onDeep: (persona) => startDeepMode(azureResult, referenceText, firstLang, persona),
    onPersonaChange: (newPersona) => onPersonaChanged(newPersona), // <--- Wire this up
  });
}

/**
 * Always-on AI Coach shell (for AI Conversations chat mode).
 * Renders the panel UI immediately, even before any attempt exists.
 *
 * getContext() should return:
 *   { azureResult, referenceText, firstLang }
 */
export function mountAICoachAlwaysOn(getContext) {
  const section = document.getElementById("aiFeedbackSection");
  if (!section) return;

  // Idempotent mount (don’t rebuild every render tick)
  if (section.dataset.convoMounted === "1") return;
  section.dataset.convoMounted = "1";

  // Keep collapsed on initial load (bubble bar only)
  collapseAICoachDrawer();

  renderEntryButtons({
    onQuick: (persona) => {
      const ctx = (typeof getContext === "function" ? getContext() : null) || {};
      const azureResult = ctx.azureResult;
      const referenceText = ctx.referenceText || "";
      const firstLang = ctx.firstLang || "universal";

      const nb = azureResult?.NBest?.[0];
      const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();
      if (!nb || !saidText) {
        clearAIFeedback();
        renderAIFeedbackMarkdown(
          `### AI Coach is ready\nRecord **one** reply in the conversation, then click **Quick Tips** (or **Deep Dive**).`
        );
        return;
      }

      lastContext = { azureResult, referenceText, firstLang };
      resetState();
      startQuickMode(azureResult, referenceText, firstLang, persona);
    },
    onDeep: (persona) => {
      const ctx = (typeof getContext === "function" ? getContext() : null) || {};
      const azureResult = ctx.azureResult;
      const referenceText = ctx.referenceText || "";
      const firstLang = ctx.firstLang || "universal";

      const nb = azureResult?.NBest?.[0];
      const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();
      if (!nb || !saidText) {
        clearAIFeedback();
        renderAIFeedbackMarkdown(
          `### AI Coach is ready\nRecord **one** reply in the conversation, then click **Deep Dive** for a full breakdown.`
        );
        return;
      }

      lastContext = { azureResult, referenceText, firstLang };
      resetState();
      startDeepMode(azureResult, referenceText, firstLang, persona);
    },
    onPersonaChange: (newPersona) => onPersonaChanged(newPersona),
  });
}

/**
 * Called when Sidebar "Coach Style" is clicked
 */
function onPersonaChanged(newPersona) {
  if (!lastContext.azureResult) return;
  console.log(`[AI Logic] Persona changed to ${newPersona}. Refreshing...`);

  if (currentArgs) {
    // If we are already viewing results, refresh immediately
    const { referenceText, firstLang, mode } = currentArgs;

    chunkHistory = [];
    clearAIFeedback(); // Clears content area, keeps sidebar

    if (mode === "simple") {
      startQuickMode(lastContext.azureResult, referenceText, firstLang, newPersona);
    } else {
      startDeepMode(lastContext.azureResult, referenceText, firstLang, newPersona);
    }
  } else {
    // Just sitting at menu, no fetch needed, but we keep the buttons active
    // The visual state 'active' class is handled by the DOM module
  }
}

/**
 * Called when Main L1 Dropdown changes
 */
export function onLanguageChanged(newLang) {
  if (!lastContext.azureResult) return;
  console.log(`[AI Logic] Language changed to ${newLang}. Refreshing...`);

  lastContext.firstLang = newLang;

  // Get currently selected sidebar persona to maintain consistency
  const currentPersona = getCurrentPersona();

  if (currentArgs) {
    const { mode } = currentArgs;
    chunkHistory = [];
    clearAIFeedback();

    if (mode === "simple") {
      startQuickMode(lastContext.azureResult, lastContext.referenceText, newLang, currentPersona);
    } else {
      startDeepMode(lastContext.azureResult, lastContext.referenceText, newLang, currentPersona);
    }
  } else {
    // Re-render to ensure any internal language state in closures is fresh
    renderEntryButtons({
      onQuick: (p) => startQuickMode(lastContext.azureResult, lastContext.referenceText, newLang, p),
      onDeep: (p) => startDeepMode(lastContext.azureResult, lastContext.referenceText, newLang, p),
      onPersonaChange: (p) => onPersonaChanged(p),
    });
  }
}

// ... (Rest of logic: resetState, persistFeedbackToDB, startQuickMode, startDeepMode, fetchNextChunk, handleShowLess, refreshFooter)
// [Use previous logic, just ensure startQuickMode/DeepMode use the passed persona]

function resetState() {
  chunkHistory = [];
  isFetching = false;
  currentArgs = null;
  quickTipState = { index: 0, count: 3, cache: [] };
}

function persistFeedbackToDB(sections) {
  if (window.lastAttemptId) {
    updateAttempt(window.lastAttemptId, { sections: sections });
  }
}

async function startQuickMode(azureResult, referenceText, firstLang, persona) {
  const lang = normalizeLang(firstLang);
  currentArgs = { azureResult, referenceText, firstLang: lang, persona, mode: "simple" };

  quickTipState = { index: 0, count: 3, cache: [] };
  await showQuickTipAt(0);
}

async function showQuickTipAt(i) {
  if (isFetching) return;
  isFetching = true;
  showLoading();

  try {
    // cached?
    if (quickTipState.cache[i]) {
      hideLoadingAndRenderQuick(i);
      return;
    }

    const res = await fetchAIFeedback({
      ...currentArgs,
      mode: "simple",
      tipIndex: i,
      tipCount: quickTipState.count,
    });

    const sections = res.sections || res.fallbackSections || [];
    const meta = res.meta || {};

    if (Number.isFinite(meta.tipCount)) quickTipState.count = meta.tipCount;

    quickTipState.cache[i] = sections;
    hideLoadingAndRenderQuick(i);

    // OPTIONAL: prefetch next tip to make Next feel instant
    const next = i + 1;
    if (next < quickTipState.count && !quickTipState.cache[next]) {
      fetchAIFeedback({ ...currentArgs, mode: "simple", tipIndex: next, tipCount: quickTipState.count })
        .then((r) => {
          quickTipState.cache[next] = r.sections || r.fallbackSections || [];
        })
        .catch(() => {});
    }

    // Persist only the first viewed tip (keeps DB clean + fast)
    if (i === 0) persistFeedbackToDB(sections);
  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load Quick Tip.");
  } finally {
    isFetching = false;
  }
}

function hideLoadingAndRenderQuick(i) {
  const sections = quickTipState.cache[i] || [];
  quickTipState.index = i;

  renderSections(sections, sections.length);

  updateFooterButtons({
    canShowMore: i < quickTipState.count - 1,
    canShowLess: true,
    moreLabel: "Next Tip ➡",
    lessLabel: i === 0 ? "Back to Options ⬅" : "Previous Tip ⬅",
    onShowMore: () => showQuickTipAt(i + 1),
    onShowLess: () => (i === 0 ? handleShowLess() : showQuickTipAt(i - 1)),
  });
}

async function startDeepMode(azureResult, referenceText, firstLang, persona) {
  const lang = normalizeLang(firstLang);
  currentArgs = { azureResult, referenceText, firstLang: lang, persona, mode: "detailed" };
  chunkHistory = [];
  await fetchNextChunk();
}

async function fetchNextChunk() {
  if (isFetching) return;
  const nextChunkId = chunkHistory.length + 1;
  if (nextChunkId > 3) return;

  isFetching = true;
  if (nextChunkId === 1) showLoading();
  else refreshFooter();

  try {
    // DeepDive: includeHistory ~1/3 of the time deterministically on chunk 1
    const attemptIdNum = Number(window.lastAttemptId);
    const includeHistory =
      nextChunkId === 1 && Number.isFinite(attemptIdNum) ? attemptIdNum % 3 === 0 : undefined;

    const res = await fetchAIFeedback({
      ...currentArgs,
      chunk: nextChunkId,
      includeHistory,
    });

    const newSections = res.sections || res.fallbackSections || [];
    chunkHistory.push(newSections);

    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);

    persistFeedbackToDB(allSections);
  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load next section.");
  } finally {
    isFetching = false;
    refreshFooter();
  }
}

function handleShowLess() {
  if (chunkHistory.length > 0) chunkHistory.pop();

  if (chunkHistory.length === 0) {
    clearAIFeedback();
    currentArgs = null;

    // Go back to entry buttons
    renderEntryButtons({
      onQuick: (p) =>
        startQuickMode(lastContext.azureResult, lastContext.referenceText, lastContext.firstLang, p),
      onDeep: (p) =>
        startDeepMode(lastContext.azureResult, lastContext.referenceText, lastContext.firstLang, p),
      onPersonaChange: (p) => onPersonaChanged(p),
    });
  } else {
    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);
    refreshFooter();
  }
}

function refreshFooter() {
  const currentCount = chunkHistory.length;
  updateFooterButtons({
    onShowMore: () => fetchNextChunk(),
    onShowLess: () => handleShowLess(),
    canShowMore: currentCount < 3,
    canShowLess: true,
    isLoading: isFetching,
  });
}

function normalizeLang(l) {
  return !l || !String(l).trim() ? "universal" : String(l).trim();
}

export const getAIFeedback = promptUserForAI;
