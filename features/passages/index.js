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
Tip: shorter sentences (≈10–15 s) give the clearest results.`,
};

const MAX_CUSTOM_PARTS = 15;

export function ensureCustomOption() {
  DOM.ensureCustomOptionInDOM();
  if (isCustom) DOM.forceSelectCustom();
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
    textHTML: custom ? TIPS.custom : TIPS.curated,
  });
}

export function togglePartNav(enabled) {
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  const isMulti = enabled && total > 1;

  // Curated single-part: no Next, show Summary
  if (!isMulti && !isCustomMode()) {
    DOM.updateNavVisibility({
      showNext: false,
      enableNext: false,
      nextMsgText: "",
      nextMsgColor: "",
      showSummary: true,
    });
    return;
  }

  const atLast = currentPartIdx >= total - 1;

  DOM.updateNavVisibility({
    showNext: !atLast,
    enableNext: !atLast,
    nextMsgText: !atLast ? "Record to continue." : "",
    nextMsgColor: "#666",
    showSummary: false,
  });
}

/* ---------------- Core Actions ---------------- */

export function showCurrentPart({ preserveExistingInput = false } = {}) {
  const total = Array.isArray(currentParts) ? currentParts.length : 0;

  if (isCustomMode()) {
    const txt = currentParts?.[currentPartIdx] ?? "";

    DOM.renderPartState({
      text: txt,
      progressText: `Custom Part ${currentPartIdx + 1}`,
      labelText: "Your text:",
      showLabel: true,
      preserveInput: preserveExistingInput,
    });

    // Custom: Fill based on count vs MAX
    updateBalloon(currentParts.length, MAX_CUSTOM_PARTS);

    // Custom nav typically managed by markPartCompleted()
    togglePartNav(false);
    return;
  }

  // Curated
  const text = currentParts[currentPartIdx] ?? "";
  const name = passages[currentPassageKey]?.name || "Passage";

  DOM.renderPartState({
    text,
    progressText: `Part ${currentPartIdx + 1} of ${total}`,
    labelText: `${name}:`,
    showLabel: currentPartIdx === 0,
    preserveInput: false,
  });

  // Curated: progress should start at 1 on part 1
  updateBalloon(currentPartIdx + 1, total);

  togglePartNav(total > 1);
}

export function setPassage(key, { clearInputForCustom = false } = {}) {
  setCustom(key === "custom");
  setPassageKey(key);
  setPartIdx(0);

  if (isCustomMode()) {
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
  if (isCustomMode()) {
    if (currentParts.length >= MAX_CUSTOM_PARTS) {
      alert(
        `Memory Full! You have reached the limit of ${MAX_CUSTOM_PARTS} recordings. Please view your summary now.`
      );
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

  if (isCustomMode()) {
    const isFull = currentParts.length >= MAX_CUSTOM_PARTS;

    DOM.updateNavVisibility({
      showNext: !isFull,
      enableNext: !isFull,
      nextMsgText: isFull ? "Memory Full (Limit 15)" : "",
      nextMsgColor: isFull ? "#ef4444" : "",
      showSummary: true,
      customMode: true,
    });

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
      showSummary: false,
    });

    updateBalloon(currentPartIdx + 1, total);
  } else {
    DOM.updateNavVisibility({
      showNext: false,
      enableNext: false,
      nextMsgText: "",
      nextMsgColor: "",
      showSummary: true,
    });

    updateBalloon(total, total);
  }
}

/* ---------------- Wiring ---------------- */

export function wirePassageSelect() {
  // Idempotent guard: prevents double-wiring if boot happens twice
  if (wirePassageSelect._wired) return;
  wirePassageSelect._wired = true;

  // NOTE: DOM module already targets #passageSelect internally. :contentReference[oaicite:2]{index=2}
  DOM.wireSelectEvents({
    onChange: (val) => {
      // Interceptor: command values vs data values

      // UI command: enter custom mode
      if (val === "write-own") {
        setPassage("custom", { clearInputForCustom: false });
        updatePartsInfoTip();
        return;
      }

      // UI command: clear custom input
      if (val === "clear") {
        setPassage("custom", { clearInputForCustom: true });
        DOM.forceSelectCustom();
        updatePartsInfoTip();
        return;
      }

      // Normal path: curated key or "custom"
      setPassage(val, { clearInputForCustom: val === "custom" });
      updatePartsInfoTip();
    },

    onClick: () => {
      const el = document.querySelector("#suggestedSentence");
      const empty = !el?.textContent?.trim();
      if (empty && !isCustomMode()) showCurrentPart();
    },
  });

  DOM.wireInputEvents({
    onInput: (val) => {
      // Typing forces custom mode (but does not clear)
      if (!isCustomMode()) {
        DOM.forceSelectCustom();
        setPassage("custom", { clearInputForCustom: false });
      }

      const updatedParts = Array.isArray(currentParts) ? [...currentParts] : [""];
      updatedParts[currentPartIdx] = val;
      setParts(updatedParts);

      // Keep label/progress correct while typing
      DOM.renderPartState({
        text: "",
        progressText: `Custom Part ${currentPartIdx + 1}`,
        labelText: "Your text:",
        showLabel: true,
        preserveInput: true,
      });

      updatePartsInfoTip();
    },
  });

  // Balloon pop on Summary button (guarded to avoid duplicate listeners)
  const summaryBtn = document.getElementById("showSummaryBtn");
  if (summaryBtn && !summaryBtn.dataset.balloonWired) {
    summaryBtn.dataset.balloonWired = "1";
    summaryBtn.addEventListener("click", () => popBalloon());
  }
}

export function wireNextBtn() {
  DOM.wireNextBtnEvent(goToNextPart);
  const total = Array.isArray(currentParts) ? currentParts.length : 0;
  togglePartNav(total > 1);
  updatePartsInfoTip();
}
