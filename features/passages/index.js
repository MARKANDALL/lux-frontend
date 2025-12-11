// features/passages/index.js
// Controller: Manages passage state and orchestrates DOM updates.
// UPDATED: Balloon Integration + Cap of 15.

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

// --- NEW: CAP CONSTANT ---
const MAX_CUSTOM_PARTS = 15;

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
    
    // Update Balloon Visuals
    DOM.updateBalloonUI(currentParts.length, MAX_CUSTOM_PARTS);
    
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
    
    // Hide balloon in standard mode
    DOM.updateBalloonUI(0, MAX_CUSTOM_PARTS);
    
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
  // 1. Custom Mode: Add Section
  if (isCustom) {
      if (currentParts.length >= MAX_CUSTOM_PARTS) {
          alert(`Memory Full! You have reached the limit of ${MAX_CUSTOM_PARTS} recordings. Please view your summary now.`);
          return;
      }
      
      const newParts = [...currentParts, ""];
      setParts(newParts);
      setPartIdx(currentPartIdx + 1);
      
      showCurrentPart({ preserveExistingInput: false });
      DOM.clearResultsUI();
      
      const input = document.querySelector("#referenceText");
      if(input) input.focus();
      return;
  }

  // 2. Standard Mode
  if (currentPartIdx < currentParts.length - 1) {
    setPartIdx(currentPartIdx + 1);
    showCurrentPart();
    DOM.clearResultsUI();
  }
}

export function markPartCompleted() {
  if (isCustom) {
      // Check if Cap Reached
      const isFull = currentParts.length >= MAX_CUSTOM_PARTS;
      
      DOM.updateNavVisibility({
          showNext: !isFull, // Hide "Add" if full
          enableNext: !isFull,
          nextMsgText: isFull ? "Memory Full (Limit 15)" : "",
          nextMsgColor: isFull ? "#ef4444" : "",
          showSummary: true,
          customMode: true 
      });
      
      // Force update balloon to show "Full" state
      DOM.updateBalloonUI(currentParts.length, MAX_CUSTOM_PARTS);
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
      if (!isCustom) {
        DOM.forceSelectCustom();
        setPassage("custom", { clearInputForCustom: false });
      }
      
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