// features/convo/convo-picker-system.js
// ONE-LINE: Initializes the convo scenario picker deck and randomizes the default scenario selection when entering picker mode.

import { wirePickerDeck } from "./picker-deck.js";
import { openCharsDrawer, closeCharsDrawer, peekCharsDrawer, unpeekCharsDrawer } from "./characters-drawer.js";
import { getKnobsDrawerInstance, onKnobsChange, peekKnobsDrawer, unpeekKnobsDrawer } from "./knobs-drawer.js";
import { luxBus } from '../../app-core/lux-bus.js';

const PICKER_BAG_KEY = "lux_convo_picker_bag_v1";
const PICKER_LAST_KEY = "lux_convo_picker_last_idx_v1";

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function safeParseJson(raw, fallback) {
  try { return JSON.parse(raw); } catch (_) { return fallback; }
}

function pickNextRandomScenarioIdx(n) {
  if (!Number.isFinite(n) || n <= 1) return 0;

  let bag = [];
  try {
    bag = safeParseJson(localStorage.getItem(PICKER_BAG_KEY) || "[]", []);
    if (!Array.isArray(bag)) bag = [];
  } catch (_) {
    bag = [];
  }

  // sanitize bag -> keep only valid, unique ints in-range
  const seen = new Set();
  bag = bag.filter((x) => Number.isInteger(x) && x >= 0 && x < n && !seen.has(x) && seen.add(x));

  if (!bag.length) {
    bag = Array.from({ length: n }, (_, i) => i);
    shuffleInPlace(bag);
  }

  let last = -1;
  try {
    const rawLast = localStorage.getItem(PICKER_LAST_KEY);
    const parsed = rawLast == null ? NaN : Number(rawLast);
    last = Number.isInteger(parsed) ? parsed : -1;
  } catch (_) {
    last = -1;
  }

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

  try {
    localStorage.setItem(PICKER_BAG_KEY, JSON.stringify(bag));
    localStorage.setItem(PICKER_LAST_KEY, String(idx));
  } catch (err) { globalThis.warnSwallow("features/convo/convo-picker-system.js", err, "important"); }

  return idx;
}

export function createBeginScenario({ warpSwap, setMode, startScenario }) {
  return async function beginScenario() {
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
    pickerKnobsBtn.addEventListener("mouseenter", () => peekKnobsDrawer());
    pickerKnobsBtn.addEventListener("mouseleave", () => unpeekKnobsDrawer());
  }

  const listLen = Array.isArray(scenarios) ? scenarios.length : 0;

  function randomizeDefaultSelectionAndRender() {
    if (!listLen) return;
    state.scenarioIdx = pickNextRandomScenarioIdx(listLen);
    renderDeck();
    luxBus.set('scenario', { idx: state.scenarioIdx });
  }

  // boot (randomize once so the deck doesn't always start on Coffee)
  randomizeDefaultSelectionAndRender();

  // Every time we ENTER the picker section, randomize again.
  // (Changed-only prevents re-randomizing if setMode("picker") is called redundantly.)
  luxBus.on('convoMode', (val) => {
    const mode = val?.mode;
    const changed = val?.changed;
    if (mode !== "picker" || !changed) return;
    randomizeDefaultSelectionAndRender();
  });

  return { renderDeck };
}