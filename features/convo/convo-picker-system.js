// features/convo/convo-picker-system.js
// ONE-LINE: Initializes the convo scenario picker deck and randomizes the default scenario selection when entering picker mode.

import { wirePickerDeck } from "./picker-deck.js";
import { openCharsDrawer, closeCharsDrawer, peekCharsDrawer, unpeekCharsDrawer } from "./characters-drawer.js";
import { shuffleInPlace } from '../../helpers/core.js';
import { getKnobsDrawerInstance, onKnobsChange, peekKnobsDrawer, unpeekKnobsDrawer } from "./knobs-drawer.js";
import { luxBus } from '../../app-core/lux-bus.js';
import {
  K_CONVO_PICKER_BAG,
  K_CONVO_PICKER_LAST,
  getJSON,
  getString,
  setJSON,
  setString,
} from "../../app-core/lux-storage.js";

function pickNextRandomScenarioIdx(n) {
  if (!Number.isFinite(n) || n <= 1) return 0;

  let bag = getJSON(K_CONVO_PICKER_BAG, []);
  if (!Array.isArray(bag)) bag = [];

  // sanitize bag -> keep only valid, unique ints in-range
  const seen = new Set();
  bag = bag.filter((x) => Number.isInteger(x) && x >= 0 && x < n && !seen.has(x) && seen.add(x));

  if (!bag.length) {
    bag = Array.from({ length: n }, (_, i) => i);
    shuffleInPlace(bag);
  }

  let last = -1;
  const rawLast = getString(K_CONVO_PICKER_LAST);
  const parsed = rawLast == null ? NaN : Number(rawLast);
  last = Number.isInteger(parsed) ? parsed : -1;

  let idx = bag.pop();
  if (idx === last && n > 1) {
    // avoid immediate repeats (grab another if possible)
    if (bag.length) {
      const alt = bag.pop();
      bag.unshift(idx); // put repeat back into the remaining bag
      idx = alt;
    } else {
      idx = (idx + 1) % n;
    }
  }

  setJSON(K_CONVO_PICKER_BAG, bag);
  setString(K_CONVO_PICKER_LAST, idx);

  return idx;
}

export function createBeginScenario({ warpSwap, setMode, startScenario }) {
  return async function beginScenario() {
    // Hard-close picker drawers before we leave the picker view.
    // This prevents blank drawer shells from bleeding into chat if
    // a transition/render timing race leaves them visually mounted.
    try { closeCharsDrawer(); } catch (err) {
      globalThis.warnSwallow("features/convo/convo-picker-system.js", err, "important");
    }

    try {
      const knobs = getKnobsDrawerInstance();
      knobs?.close?.();
    } catch (err) {
      globalThis.warnSwallow("features/convo/convo-picker-system.js", err, "important");
    }

    await warpSwap(() => setMode("chat"), { outMs: 200, inMs: 240 });
    await startScenario(); // fetch opening line + suggested replies
  };
}

export function initConvoPickerSystem({
  scenarios,
  state,
  thumbs,
  deckActive,
  deckPreview,
  backBtn,
  nextBtn,
  el,
  applyMediaSizingVars,
  applySceneVisuals,
  onBeginScenario,
  pickerCharsBtn,
  pickerKnobsBtn,
}) {
  // --- Picker deck (extracted) ---
  const { renderDeck } = wirePickerDeck({
    scenarios: scenarios,
    state,
    thumbs,
    deckActive,
    deckPreview,
    backBtn,
    nextBtn,
    el,
    applyMediaSizingVars,
    applySceneVisuals,
    onBeginScenario,
  });

  // ─── Characters button peekaboo ───
  if (pickerCharsBtn) {
    pickerCharsBtn.addEventListener("mouseenter", () => peekCharsDrawer());
    pickerCharsBtn.addEventListener("mouseleave", () => unpeekCharsDrawer());
  }

  // ─── Scene Settings button peekaboo ───
  if (pickerKnobsBtn) {
    pickerKnobsBtn.addEventListener("mouseenter", () => {
      if (pickerKnobsBtn.dataset.luxSuppressPeek === "1") return;
      peekKnobsDrawer();
    });
    pickerKnobsBtn.addEventListener("mouseleave", () => {
      delete pickerKnobsBtn.dataset.luxSuppressPeek;
      unpeekKnobsDrawer();
    });
  }

  const listLen = Array.isArray(scenarios) ? scenarios.length : 0;

  function renderCurrentSelectionAndBroadcast() {
    renderDeck();
    luxBus.set("scenario", { idx: state.scenarioIdx });
  }

  function shouldPreservePinnedScenario() {
    return !!state.nextActivity;
  }

  function randomizeDefaultSelectionAndRender() {
    if (!listLen) return;

    if (shouldPreservePinnedScenario()) {
      renderCurrentSelectionAndBroadcast();
      return;
    }

    state.scenarioIdx = pickNextRandomScenarioIdx(listLen);
    renderCurrentSelectionAndBroadcast();
  }

  // boot (randomize once so the deck doesn't always start on Coffee)
  randomizeDefaultSelectionAndRender();

  // Every time we ENTER the picker section, randomize again.
  // (Changed-only prevents re-randomizing if setMode("picker") is called redundantly.)
  luxBus.on("convoMode", (val) => {
    const mode = val?.mode;
    const changed = val?.changed;
    if (mode !== "picker" || !changed) return;

    if (shouldPreservePinnedScenario()) {
      renderCurrentSelectionAndBroadcast();
      return;
    }

    randomizeDefaultSelectionAndRender();
  });

  return { renderDeck };
}