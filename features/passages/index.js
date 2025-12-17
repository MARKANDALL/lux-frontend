// features/passages/index.js
// Controller: Manages passage state and orchestrates DOM updates.
// UPDATED: Universal Balloon Support + Confetti Pop on Summary.

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
} from "../../app-core/state.js";
import * as DOM from "./dom.js";
import { updateBalloon, popBalloon } from "../balloon/index.js";

/* ---------------- Logic / Helpers ---------------- */

const TIPS = {
  curated: `These built-in texts were designed to cover most English sounds. 
Practicing them gives a balanced baseline and helps reveal strengths & weaknesses.`,
  custom: `Type anything you want to practice. We’ll score words & phonemes and add prosody feedback. 
Tip: shorter sentences (≈10–15 s) give the clearest results.`
};

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

    // Custom: Fill based on count vs MAX (15)
    updateBalloon(currentParts.length, MAX_CUSTOM_PARTS);

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

    // Curated: Fill based on current index vs Total Parts
    // We add 1 to index so it starts partially full (Part 1 of 12)
    updateBalloon(currentPartIdx, total);

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
    if (input) input.focus();
    return;
  }

  if (currentPartIdx < currentParts.length - 1) {
    setPartIdx(currentPartIdx + 1);
    showCurrentPart();
    DOM.clearResultsUI();
  }
}

export function markPartCompleted() {
  const total = Array.isArray(currentParts) ? currentParts.length : 0;

  if (isCustom) {
    const isFull = currentParts.length >= MAX_CUSTOM_PARTS;
    DOM.updateNavVisibility({
      showNext: !isFull,
      enableNext: !isFull,
      nextMsgText: isFull ? "Memory Full (Limit 15)" : "",
      nextMsgColor: isFull ? "#ef4444" : "",
      showSummary: true,
      customMode: true
    });
    // Custom: update count
    updateBalloon(currentParts.length, MAX_CUSTOM_PARTS);
    return;
  }

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
    // Curated: Update progress (current part finished)
    updateBalloon(currentPartIdx + 1, total);
  } else {
    DOM.updateNavVisibility({
      showNext: false,
      enableNext: false,
      nextMsgText: "",
      showSummary: true
    });
    // Curated: Full!
    updateBalloon(total, total);
  }
}

/* ---------------- Wiring ---------------- */

// REPLACED: wirePassageSelect now uses the Interceptor Pattern (command vs data values)
export function wirePassageSelect() {
  // FIX #3: Changed selector to match HTML ID (#passageSelect)
  const passageSelect = document.querySelector("#passageSelect");
  if (!passageSelect) return;

  // Wire the select events (single source of truth lives here)
  DOM.wireSelectEvents({
    onChange: (val) => {
      // INTERCEPTOR: Handle "Command" values vs "Data" values

      // 1) "write-own" is a UI command to enter custom mode (do not forcibly clear)
      if (val === "write-own") {
        setPassage("custom", { clearInputForCustom: false });
        updatePartsInfoTip();
        return;
      }

      // 2) "clear" is a UI command to reset the custom input
      if (val === "clear") {
        setPassage("custom", { clearInputForCustom: true });
        // Force the dropdown to visually show "custom" immediately
        DOM.forceSelectCustom();
        updatePartsInfoTip();
        return;
      }

      // 3) Normal Path: Value is a valid passage ID (including "custom" if you use it)
      setPassage(val, { clearInputForCustom: val === "custom" });
      updatePartsInfoTip();
    },
    onClick: () => {
      const el = document.querySelector("#suggestedSentence");
      const empty = !el?.textContent?.trim();
      if (empty && !isCustom) showCurrentPart();
    }
  });

  // Keep existing input wiring behavior (typing forces custom mode)
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

  // GLOBAL POP HANDLER (For both modes)
  const summaryBtn = document.getElementById("showSummaryBtn");
  if (summaryBtn) {
    summaryBtn.addEventListener("click", () => {
      popBalloon();
    });
  }
}

export function wireNextBtn() {
  DOM.wireNextBtnEvent(goToNextPart);
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  togglePartNav(total > 1);
  updatePartsInfoTip();
}