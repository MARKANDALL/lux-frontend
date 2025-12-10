// features/passages/index.js
// Controller: Manages passage state and orchestrates DOM updates.
// UPDATED: Supports Multi-Part Custom Mode (Add + Summarize).

// 1. DATA IMPORT
import { passages } from "../../src/data/index.js"; 

// 2. STATE IMPORT
import {
  setCustom,
  setPassageKey,
  setPartIdx,
  setParts,
  currentParts,
  currentPartIdx,
  currentPassageKey,
  isCustom,
} from "../../app-core/state.js"; 

// 3. DOM IMPORT
import * as DOM from "./dom.js"; 

/* ---------------- Logic / Helpers ---------------- */

const TIPS = {
  curated: `These built-in texts were designed to cover most English sounds. 
Practicing them gives a balanced baseline and helps reveal strengths & weaknesses.`,
  custom: `Type anything you want to practice. We’ll score words & phonemes and add prosody feedback. 
Tip: shorter sentences (≈10–15 s) give the clearest results.`
};

export function ensureCustomOption() {
  DOM.ensureCustomOptionInDOM();
  if (isCustom) {
    DOM.forceSelectCustom();
  }
}

export function isCustomMode() {
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

export function togglePartNav(enabled) {
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  const isMulti = enabled && total > 1;

  if (!isMulti && !isCustom) {
    DOM.updateNavVisibility({ 
      showNext: false, 
      enableNext: false, 
      nextMsgText: "",
      showSummary: true
    });
    return;
  }

  const atLast = currentPartIdx >= total - 1;

  DOM.updateNavVisibility({
    showNext: !atLast,
    enableNext: !atLast,
    nextMsgText: !atLast ? "Record to continue." : "",
    nextMsgColor: "#666",
    showSummary: false
  });
}

/* ---------------- Core Actions ---------------- */

export function showCurrentPart({ preserveExistingInput = false } = {}) {
  const total = Array.isArray(currentParts) ? currentParts.length : 0;

  if (isCustom) {
    const txt = currentParts?.[currentPartIdx] ?? "";
    
    DOM.renderPartState({
      text: txt,
      progressText: `Custom Part ${currentPartIdx + 1}`,
      labelText: "Your text:",
      showLabel: true,
      preserveInput: preserveExistingInput
    });
    
    // In Custom mode, we normally hide nav until recording finishes
    togglePartNav(false);
  } else {
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
    // If switching to custom, start fresh or keep typing
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

// --- UPDATED: Handle "Next" for both Fixed and Custom passages ---
export function goToNextPart() {
  const CAP = 10; // Cap custom parts to prevent memory abuse

  // 1. Custom Mode: "Add Another Section" behavior
  if (isCustom) {
      if (currentParts.length >= CAP) {
          alert("Maximum parts reached. Please view summary.");
          return;
      }
      
      // Push new empty slot
      const newParts = [...currentParts, ""];
      setParts(newParts);
      setPartIdx(currentPartIdx + 1);
      
      // Clear UI for new entry
      showCurrentPart({ preserveExistingInput: false });
      DOM.clearResultsUI();
      
      // Auto-focus input for flow
      const input = document.querySelector("#referenceText");
      if(input) input.focus();
      return;
  }

  // 2. Standard Mode: "Next Part" behavior
  if (currentPartIdx < currentParts.length - 1) {
    setPartIdx(currentPartIdx + 1);
    showCurrentPart();
    DOM.clearResultsUI();
  }
}

// --- UPDATED: Handle Completion logic for Custom Mode ---
export function markPartCompleted() {
  // If Custom, we ALWAYS show controls to Add More or Finish
  if (isCustom) {
      DOM.updateNavVisibility({
          showNext: true,
          enableNext: true,
          nextMsgText: "", // "Add Section" label handled by DOM.js or CSS
          showSummary: true,
          customMode: true // Signal to DOM to change button labels
      });
      return;
  }

  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  if (total <= 1) return;

  const atLast = currentPartIdx >= total - 1;

  if (!atLast) {
    DOM.updateNavVisibility({
      showNext: true,
      enableNext: true,
      nextMsgText: "Finished: Ready for your next one?",
      nextMsgColor: "#15803d",
      showSummary: false
    });
  } else {
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
      const el = document.querySelector("#suggestedSentence");
      const empty = !el?.textContent?.trim();
      if (empty && !isCustom) showCurrentPart();
    }
  });

  DOM.wireInputEvents({
    onInput: (val) => {
      // Auto-switch to Custom mode if typing on a fixed passage
      if (!isCustom) {
        DOM.forceSelectCustom();
        setPassage("custom", { clearInputForCustom: false });
      }
      
      // --- CRITICAL FIX: Update ONLY the current index ---
      // Do not wipe the whole array. Use functional update to be safe.
      const updatedParts = [...currentParts];
      updatedParts[currentPartIdx] = val;
      setParts(updatedParts);
      
      DOM.renderPartState({ 
        text: "", 
        progressText: `Custom Part ${currentPartIdx + 1}`, 
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
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  togglePartNav(total > 1);
  updatePartsInfoTip();
}