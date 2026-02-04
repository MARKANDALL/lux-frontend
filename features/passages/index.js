// features/passages/index.js
// Controller: Manages passage state and orchestrates DOM updates.
// UPDATED: Universal Balloon Support + Confetti Pop on Summary.

import { passages, PASSAGE_PHONEME_META } from "../../src/data/index.js"; 
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
import { createPassageLibraryModal } from "./library-modal.js";

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
      if(input) input.focus();
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

/* ---------------- Focus Phoneme (Select Passage) ---------------- */

function getPhCountForKey(key, ph) {
  if (!key || !ph) return 0;
  const m = PASSAGE_PHONEME_META?.[String(key)] || null;
  const c = m?.counts?.[String(ph || "").toUpperCase()];
  return Number(c || 0);
}

function getTotalPhonesForKey(key) {
  const m = PASSAGE_PHONEME_META?.[String(key)] || null;
  return Number(m?.totalPhones || 0);
}

function getAllPhonemesFromPassageMeta() {
  const set = new Set();
  const meta = PASSAGE_PHONEME_META || {};
  for (const m of Object.values(meta)) {
    const counts = m?.counts;
    if (!counts || typeof counts !== "object") continue;
    for (const ph of Object.keys(counts)) set.add(String(ph).toUpperCase());
  }
  return Array.from(set).sort();
}

// Given your existing “passage options” list:
// options = [{ key, label, ... }, ...]
function applyFocusPhonemeToOptions(options, activePh, mode) {
  if (!activePh) return options;

  const scored = options
    .map((opt) => ({
      opt,
      score: getPhCountForKey(opt.key, activePh),
      total: getTotalPhonesForKey(opt.key),
    }))
    .filter((x) => (mode === "only" ? x.score > 0 : true))
    .sort((a, b) => {
      // primary: count desc
      if (b.score !== a.score) return b.score - a.score;
      // secondary: percent desc
      const ap = a.total ? a.score / a.total : 0;
      const bp = b.total ? b.score / b.total : 0;
      if (bp !== ap) return bp - ap;
      // stable fallback: label
      return String(a.opt.label).localeCompare(String(b.opt.label));
    })
    .map((x) => x.opt);

  return scored;
}

function buildPassageFocusUI() {
  // Anchor points:
  const harvardNum = document.getElementById("harvardNum");
  const harvardRow = harvardNum?.closest?.(".lux-row") || harvardNum?.parentElement || null;

  // The Select Passage <select> (best-effort)
  const selectEl =
    document.getElementById("passageSelect") ||
    document.getElementById("passagePicker") ||
    document.querySelector('select[name="passage"]') ||
    document.querySelector("select");

  if (!selectEl) return;

  let row = document.getElementById("passageFocusPhRow");
  if (!row) {
    row = document.createElement("div");
    row.id = "passageFocusPhRow";
    row.className = "lux-passage-focusphrow";

    const label = document.createElement("span");
    label.className = "lux-passage-focusphlabel";
    label.textContent = "Focus phoneme:";
    row.appendChild(label);

    const sel = document.createElement("select");
    sel.id = "passageFocusPhSel";
    sel.className = "lux-passage-focusphsel";
    row.appendChild(sel);

    const btnSort = document.createElement("button");
    btnSort.type = "button";
    btnSort.id = "passageFocusModeSort";
    btnSort.className = "lux-passage-focusmode is-active";
    btnSort.textContent = "Sort";
    row.appendChild(btnSort);

    const btnOnly = document.createElement("button");
    btnOnly.type = "button";
    btnOnly.id = "passageFocusModeOnly";
    btnOnly.className = "lux-passage-focusmode";
    btnOnly.textContent = "Only";
    row.appendChild(btnOnly);
  }

  // Insert between Select Passage row and Harvard row (best-effort)
  if (harvardRow && harvardRow.parentElement && !row.isConnected) {
    harvardRow.parentElement.insertBefore(row, harvardRow);
  } else if (!row.isConnected) {
    selectEl.insertAdjacentElement("afterend", row);
  }

  // Populate phoneme select once
  const focusSel = document.getElementById("passageFocusPhSel");
  if (focusSel && focusSel.dataset.populated !== "1") {
    focusSel.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "None";
    focusSel.appendChild(opt0);

    const list = getAllPhonemesFromPassageMeta();
    for (const ph of list) {
      const opt = document.createElement("option");
      opt.value = ph;
      opt.textContent = ph;
      focusSel.appendChild(opt);
    }

    focusSel.dataset.populated = "1";
  }
}

function reorderPassageSelect({ activePh, mode }) {
  const selectEl =
    document.getElementById("passageSelect") ||
    document.getElementById("passagePicker") ||
    document.querySelector('select[name="passage"]') ||
    document.querySelector("select");

  if (!selectEl) return;

  const prevSelected = String(selectEl.value || "");

  const opts = Array.from(selectEl.options || []).map((o) => ({
    key: String(o.value || ""),
    label: String(o.textContent || ""),
    disabled: !!o.disabled,
  }));

  const head = [];
  const rest = [];

  // Keep "custom" at the very top if present
  for (const o of opts) {
    if (o.key === "custom") head.push(o);
    else rest.push(o);
  }

  const nextRest = applyFocusPhonemeToOptions(rest, activePh, mode);

  // Rebuild options in-place (do NOT auto-change current selection)
  selectEl.innerHTML = "";
  for (const o of head.concat(nextRest)) {
    const opt = document.createElement("option");
    opt.value = o.key;
    opt.textContent = o.label;
    opt.disabled = !!o.disabled;
    selectEl.appendChild(opt);
  }

  // Restore selection if still present; otherwise leave whatever browser chooses
  const stillExists = Array.from(selectEl.options).some((o) => String(o.value) === prevSelected);
  if (stillExists) selectEl.value = prevSelected;
}

/* ---------------- Wiring ---------------- */

export function wirePassageSelect() {
  // Build the UI row between Select Passage and Harvard row
  buildPassageFocusUI();

  // Passage Library modal (Browse label next to Select Passage)
  const browse = document.getElementById("passageBrowse");
  if (browse && browse.dataset.wired !== "1") {
    const modal = createPassageLibraryModal({
      onPractice: async (key) => {
        setPassage(key, { clearInputForCustom: key === "custom" });
        updatePartsInfoTip();
        try { document.getElementById("referenceText")?.focus?.(); } catch {}
      },
    });

    const open = () => modal?.open?.();
    browse.addEventListener("click", open);
    browse.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    browse.dataset.wired = "1";
  }

  let focusActivePh = null;
  let focusMode = "sort"; // "sort" | "only"

  const focusSel = document.getElementById("passageFocusPhSel");
  const modeSortBtn = document.getElementById("passageFocusModeSort");
  const modeOnlyBtn = document.getElementById("passageFocusModeOnly");

  const syncFocusModeUI = () => {
    if (modeSortBtn) modeSortBtn.classList.toggle("is-active", focusMode === "sort");
    if (modeOnlyBtn) modeOnlyBtn.classList.toggle("is-active", focusMode === "only");
  };

  if (focusSel) {
    focusSel.addEventListener("change", () => {
      focusActivePh = focusSel.value ? String(focusSel.value).toUpperCase() : null;
      reorderPassageSelect({ activePh: focusActivePh, mode: focusMode });
      syncFocusModeUI();
    });
  }

  if (modeSortBtn) {
    modeSortBtn.addEventListener("click", () => {
      focusMode = "sort";
      reorderPassageSelect({ activePh: focusActivePh, mode: focusMode });
      syncFocusModeUI();
    });
  }

  if (modeOnlyBtn) {
    modeOnlyBtn.addEventListener("click", () => {
      focusMode = "only";
      reorderPassageSelect({ activePh: focusActivePh, mode: focusMode });
      syncFocusModeUI();
    });
  }

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
  
  // GLOBAL POP HANDLER (For both modes)
  const summaryBtn = document.getElementById('showSummaryBtn');
  if (summaryBtn) {
      summaryBtn.addEventListener('click', () => {
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
