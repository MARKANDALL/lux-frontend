// features/convo/convo-picker-system.js

import { wirePickerDeck } from "./picker-deck.js";

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

  // boot
  applySceneVisuals();
  renderDeck();

  return { renderDeck };
}
