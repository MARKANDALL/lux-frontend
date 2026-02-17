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
  collapseAICoachDrawer,
} from "./ui-ai-ai-dom.js";

import {
  ensureAICoachAttemptPolicyBound,
  bumpAndApplyAICoachAttemptOpenPolicy,
} from "./ui-ai-ai-logic/attempt-policy.js";

import {
  startQuickMode as startQuickModeCore,
  resetQuickModeState,
} from "./ui-ai-ai-logic/quick-mode.js";

import {
  startDeepMode as startDeepModeCore,
  fetchNextChunk as fetchNextChunkCore,
  refreshFooter as refreshFooterCore,
} from "./ui-ai-ai-logic/deep-mode.js";

import {
  mountAICoachAlwaysOn as mountAICoachAlwaysOnCore,
  onPersonaChanged as onPersonaChangedCore,
  onLanguageChanged as onLanguageChangedCore,
} from "./ui-ai-ai-logic/lifecycle.js";

import { fetchAIFeedback, updateAttempt } from "/src/api/index.js";
import { getLastAttemptId } from "../app-core/runtime.js";
import { bringBoxBottomToViewport } from "../helpers/index.js";

// State
let chunkHistory = [];
let currentArgs = null;
let isFetching = false;

let lastContext = {
  azureResult: null,
  referenceText: "",
  firstLang: "universal",
};

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

  // Practice Skills: attempt-based auto-open / preference
  ensureAICoachAttemptPolicyBound();
  bumpAndApplyAICoachAttemptOpenPolicy();

  // Render Entry with Sidebar Callback
  renderEntryButtons({
    onQuick: (persona) =>
      startQuickMode(azureResult, referenceText, firstLang, persona),
    onDeep: (persona) =>
      startDeepMode(azureResult, referenceText, firstLang, persona),
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
  return mountAICoachAlwaysOnCore(getContext, {
    collapseAICoachDrawer,
    bringBoxBottomToViewport,
    renderEntryButtons,
    clearAIFeedback,
    renderAIFeedbackMarkdown,

    resetState,
    startQuickMode,
    startDeepMode,

    onPersonaChanged,

    getLastContext: () => lastContext,
    setLastContext: (next) => {
      lastContext = next;
    },
  });
}

/**
 * Called when Sidebar "Coach Style" is clicked
 */
function onPersonaChanged(newPersona) {
  return onPersonaChangedCore(newPersona, {
    getLastContext: () => lastContext,
    getCurrentArgs: () => currentArgs,
    setChunkHistory: (next) => {
      chunkHistory = next;
    },
    clearAIFeedback,
    startQuickMode,
    startDeepMode,
  });
}

/**
 * Called when Main L1 Dropdown changes
 */
export function onLanguageChanged(newLang) {
  return onLanguageChangedCore(newLang, {
    getLastContext: () => lastContext,
    setLastContextFirstLang: (v) => {
      lastContext.firstLang = v;
    },

    getCurrentArgs: () => currentArgs,
    setChunkHistory: (next) => {
      chunkHistory = next;
    },

    clearAIFeedback,
    getCurrentPersona,

    startQuickMode,
    startDeepMode,

    renderEntryButtons,
    onPersonaChanged,
  });
}

function resetState() {
  chunkHistory = [];
  isFetching = false;
  currentArgs = null;
  resetQuickModeState();
}

function persistFeedbackToDB(sections) {
  const attemptId = getLastAttemptId();
  if (attemptId) {
    updateAttempt(attemptId, { sections });
  }
}

async function startQuickMode(azureResult, referenceText, firstLang, persona) {
  return startQuickModeCore({
    azureResult,
    referenceText,
    firstLang,
    persona,

    setCurrentArgs: (a) => {
      currentArgs = a;
    },
    getCurrentArgs: () => currentArgs,

    getIsFetching: () => isFetching,
    setIsFetching: (v) => {
      isFetching = v;
    },

    showLoading,
    renderSections,
    updateFooterButtons,
    fetchAIFeedback,
    persistFeedbackToDB,
    showAIFeedbackError,
    handleShowLess,
    normalizeLang,
  });
}

async function startDeepMode(azureResult, referenceText, firstLang, persona) {
  return startDeepModeCore({
    azureResult,
    referenceText,
    firstLang,
    persona,

    setCurrentArgs: (a) => {
      currentArgs = a;
    },
    getCurrentArgs: () => currentArgs,

    getChunkHistory: () => chunkHistory,
    setChunkHistory: (next) => {
      chunkHistory = next;
    },

    getIsFetching: () => isFetching,
    setIsFetching: (v) => {
      isFetching = v;
    },

    showLoading,
    renderSections,
    updateFooterButtons,
    fetchAIFeedback,
    persistFeedbackToDB,
    showAIFeedbackError,
    getLastAttemptId,
    normalizeLang,
    onShowLess: () => handleShowLess(),
  });
}

function fetchNextChunk() {
  return fetchNextChunkCore({
    getCurrentArgs: () => currentArgs,

    getChunkHistory: () => chunkHistory,
    setChunkHistory: (next) => {
      chunkHistory = next;
    },

    getIsFetching: () => isFetching,
    setIsFetching: (v) => {
      isFetching = v;
    },

    showLoading,
    renderSections,
    updateFooterButtons,
    fetchAIFeedback,
    persistFeedbackToDB,
    showAIFeedbackError,
    getLastAttemptId,
    onShowLess: () => handleShowLess(),
  });
}

function refreshFooter() {
  return refreshFooterCore({
    getChunkHistory: () => chunkHistory,
    getIsFetching: () => isFetching,
    updateFooterButtons,
    onShowMore: () => fetchNextChunk(),
    onShowLess: () => handleShowLess(),
  });
}

function handleShowLess() {
  if (chunkHistory.length > 0) chunkHistory.pop();

  if (chunkHistory.length === 0) {
    clearAIFeedback();
    currentArgs = null;

    // Go back to entry buttons
    renderEntryButtons({
      onQuick: (p) =>
        startQuickMode(
          lastContext.azureResult,
          lastContext.referenceText,
          lastContext.firstLang,
          p
        ),
      onDeep: (p) =>
        startDeepMode(
          lastContext.azureResult,
          lastContext.referenceText,
          lastContext.firstLang,
          p
        ),
      onPersonaChange: (p) => onPersonaChanged(p),
    });
  } else {
    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);
    refreshFooter();
  }
}

function normalizeLang(l) {
  return !l || !String(l).trim() ? "universal" : String(l).trim();
}

export const getAIFeedback = promptUserForAI;
