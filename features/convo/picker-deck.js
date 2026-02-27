// features/convo/picker-deck.js
// ONE-LINE: Wires the convo picker deck UI (active/preview cards + thumbnails strip), including thumb hydration and smooth arrow-scrolling wrapper.

import { ensureThumbScroller } from "./picker-deck/thumb-scroller.js";
import { makeThumbHydrator } from "./picker-deck/thumbs-hydrator.js";
import { makeFillDeckCard } from "./picker-deck/deck-card.js";
import { renderThumbs } from "./picker-deck/thumbs-render.js";

export function wirePickerDeck({
  scenarios,
  state,
  thumbs,
  deckActive,
  deckPreview,
  backBtn,
  nextBtn,

  // helpers / deps
  el,
  applyMediaSizingVars,
  applySceneVisuals,

  // callback
  onBeginScenario,
}) {
  const list = Array.isArray(scenarios) ? scenarios : [];

  function safeBeginScenario() {
    try {
      const p = onBeginScenario?.();
      if (p && typeof p.catch === "function") p.catch(console.error);
    } catch (e) {
      console.error(e);
    }
  }

  const { hydrateThumbButtons, scenarioThumbUrl } = makeThumbHydrator();

  const fillDeckCard = makeFillDeckCard({ el, applyMediaSizingVars, safeBeginScenario });

  let disposeThumbHydrator = null;

  function renderDeck() {
    applySceneVisuals?.();

    if (!list.length) {
      renderThumbs({ thumbs, list, state, el, scenarioThumbUrl, onPickIndex: () => {} });
      ensureThumbScroller(thumbs);
      return;
    }

    const idx = state.scenarioIdx;
    const next = (idx + 1) % list.length;

    fillDeckCard(deckActive, list[idx], true);
    fillDeckCard(deckPreview, list[next], false);

    renderThumbs({
      thumbs,
      list,
      state,
      el,
      scenarioThumbUrl,
      onPickIndex: (i) => {
        state.scenarioIdx = i;
        renderDeck();
      },
    });

    if (disposeThumbHydrator) disposeThumbHydrator();
    disposeThumbHydrator = hydrateThumbButtons(thumbs, { immediate: 8 });

    ensureThumbScroller(thumbs);
  }

  // --- wire controls (once) ---
  backBtn?.addEventListener("click", () => {
    if (!list.length) return;
    state.scenarioIdx = (state.scenarioIdx - 1 + list.length) % list.length;
    renderDeck();
  });

  nextBtn?.addEventListener("click", () => {
    if (!list.length) return;
    state.scenarioIdx = (state.scenarioIdx + 1) % list.length;
    renderDeck();
  });

  // Preview click behaves like Next (Edge feel)
  deckPreview?.addEventListener("click", () => {
    if (!list.length) return;
    state.scenarioIdx = (state.scenarioIdx + 1) % list.length;
    renderDeck();
  });

  return { renderDeck };
}