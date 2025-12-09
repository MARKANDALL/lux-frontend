// features/passages/index.js
// Controller: Manages passage state and orchestrates DOM updates.

// UPDATED IMPORTS:
import { passages } from "../../src/data/index.js"; 
import {
  setCustom,
  setPassageKey,
  setPartIdx,
  setParts,
  currentParts,
  currentPartIdx,
  currentPassageKey,
  isCustom,
} from "../../app-core/state.js"; // Point back to app-core

import * as DOM from "./dom.js"; // Sibling import

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

  if (!isMulti) {
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
    const txt = currentParts?.[0] ?? "";
    
    DOM.renderPartState({
      text: "",
      progressText: "Part 1 of 1",
      labelText: "Your text:",
      showLabel: true,
      preserveInput: preserveExistingInput
    });
    
    if (!preserveExistingInput && DOM.getInputValue() !== txt) {
       DOM.qs("#referenceText").value = txt; 
    }

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
      const empty = !DOM.qs("#suggestedSentence")?.textContent?.trim();
      if (empty && !isCustom) showCurrentPart();
    }
  });

  DOM.wireInputEvents({
    onInput: (val) => {
      if (!isCustom) {
        DOM.forceSelectCustom();
        setPassage("custom", { clearInputForCustom: false });
      }
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
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  togglePartNav(total > 1);
  updatePartsInfoTip();
}