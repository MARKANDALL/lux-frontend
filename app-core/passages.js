// app-core/passages.js
// Controller: Manages passage state and orchestrates DOM updates.

import { passages } from "../src/data/index.js";
import {
  setCustom,
  setPassageKey,
  setPartIdx,
  setParts,
  currentParts,
  currentPartIdx,
  currentPassageKey,
  isCustom,
} from "./state.js";

import * as DOM from "./passages-dom.js";

/* ---------------- Logic / Helpers ---------------- */

const TIPS = {
  curated: `These built-in texts were designed to cover most English sounds. 
Practicing them gives a balanced baseline and helps reveal strengths & weaknesses.`,
  custom: `Type anything you want to practice—speeches, interviews, tricky words, 
or everyday phrases. We’ll score words & phonemes and add prosody feedback. 
Tip: shorter sentences (≈10–15 s) give the clearest results.`
};

export function ensureCustomOption() {
  DOM.ensureCustomOptionInDOM();
  if (isCustom) {
    DOM.forceSelectCustom();
  }
}

export function isCustomMode() {
  // Prefer state, fallback to DOM check
  if (typeof isCustom === "boolean") return isCustom;
  return DOM.isSelectCustom();
}

export function updatePartsInfoTip() {
  const hasText = !!DOM.getInputValue().trim();
  const hasSelection = !!DOM.getSelectValue();
  const custom = isCustomMode();

  DOM.renderInfoTip({
    visible: hasText || hasSelection,
    textHTML: custom ? TIPS.custom : TIPS.curated
  });
}

/**
 * Calculates navigation state and updates UI.
 */
export function togglePartNav(enabled) {
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  const isMulti = enabled && total > 1;

  // 1. Tip Visibility handled by updatePartsInfoTip usually, 
  // but we might want to hide it if not multi? 
  // (Original logic hid it if !isMulti).
  if (!isMulti) {
    DOM.updateNavVisibility({ 
      showNext: false, 
      enableNext: false, 
      nextMsgText: "",
      showSummary: true // Default to showing summary btn if single part
    });
    return;
  }

  const atLast = currentPartIdx >= total - 1;

  // 2. Navigation UI
  DOM.updateNavVisibility({
    showNext: !atLast,
    enableNext: !atLast, // Enabled if not at last
    nextMsgText: !atLast ? "Record to continue." : "",
    nextMsgColor: "#666",
    showSummary: false // Hidden until completion
  });
}

/* ---------------- Core Actions ---------------- */

export function showCurrentPart({ preserveExistingInput = false } = {}) {
  const total = Array.isArray(currentParts) ? currentParts.length : 0;

  if (isCustom) {
    const txt = currentParts?.[0] ?? "";
    
    DOM.renderPartState({
      text: "", // Custom mode clears "suggested" text
      progressText: "Part 1 of 1",
      labelText: "Your text:",
      showLabel: true,
      preserveInput: preserveExistingInput // Don't overwrite what user is typing
    });
    
    // Ensure input has value if we aren't preserving it
    if (!preserveExistingInput && DOM.getInputValue() !== txt) {
       // logic handled by renderPartState usually, but custom logic specific here:
       // actually renderPartState does: if (!preserve) input.value = text
       // For custom, text is passed as "" above to 'suggested', wait.
       // Let's fix the call:
       DOM.qs("#referenceText").value = txt; 
    }

    togglePartNav(false);
  } else {
    // Curated Mode
    const text = currentParts[currentPartIdx];
    const name = passages[currentPassageKey]?.name || "Passage";
    
    DOM.renderPartState({
      text: text,
      progressText: `Part ${currentPartIdx + 1} of ${total}`,
      labelText: `${name}:`,
      showLabel: currentPartIdx === 0,
      preserveInput: false
    });
    
    togglePartNav(total > 1);
  }
}

export function setPassage(key, { clearInputForCustom = false } = {}) {
  setCustom(key === "custom");
  setPassageKey(key);
  setPartIdx(0);

  if (isCustom) {
    const nextText = clearInputForCustom ? "" : DOM.getInputValue();
    setParts([nextText]);
    showCurrentPart({ preserveExistingInput: !clearInputForCustom });
  } else {
    const p = passages[key]?.parts || [];
    setParts(p);
    showCurrentPart();
  }

  DOM.clearResultsUI();
}

export function goToNextPart() {
  if (isCustom) return;
  if (currentPartIdx < currentParts.length - 1) {
    setPartIdx(currentPartIdx + 1);
    showCurrentPart();
    DOM.clearResultsUI();
  }
}

export function markPartCompleted() {
  if (isCustom) return;

  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  if (total <= 1) return;

  const atLast = currentPartIdx >= total - 1;

  if (!atLast) {
    // Middle parts: Unlock Next, Show Success Msg
    DOM.updateNavVisibility({
      showNext: true,
      enableNext: true,
      nextMsgText: "Finished: Ready for your next one?",
      nextMsgColor: "#15803d", // Success Green
      showSummary: false
    });
  } else {
    // Final part: Hide Next, Show Summary
    DOM.updateNavVisibility({
      showNext: false,
      enableNext: false,
      nextMsgText: "",
      showSummary: true
    });
  }
}

/* ---------------- Wiring ---------------- */

export function wirePassageSelect() {
  DOM.wireSelectEvents({
    onChange: (val) => {
      setPassage(val, { clearInputForCustom: val === "custom" });
      updatePartsInfoTip();
    },
    onClick: () => {
      // If suggested text is empty but we aren't custom, refresh UI
      // (Handles edge case where UI might be stale)
      const empty = !DOM.qs("#suggestedSentence")?.textContent?.trim();
      if (empty && !isCustom) showCurrentPart();
    }
  });

  DOM.wireInputEvents({
    onInput: (val) => {
      // Auto-switch to custom if typing
      if (!isCustom) {
        DOM.forceSelectCustom();
        setPassage("custom", { clearInputForCustom: false });
      }
      // Update state
      setParts([val]);
      setPartIdx(0);
      DOM.renderPartState({ 
        text: "", 
        progressText: "Part 1 of 1", 
        labelText: "Your text:", 
        showLabel: true,
        preserveInput: true 
      });
      updatePartsInfoTip();
    }
  });
}

export function wireNextBtn() {
  DOM.wireNextBtnEvent(goToNextPart);

  // Initial Sync
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  togglePartNav(total > 1);
  updatePartsInfoTip();
}