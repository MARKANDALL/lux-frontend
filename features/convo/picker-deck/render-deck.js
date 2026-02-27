// features/convo/picker-deck/render-deck.js
// ONE-LINE: Orchestrates deck rendering (active/preview cards + thumbs + hydration + scroller) and returns a renderDeck() function.

export function makeRenderDeck({
  list,
  state,
  thumbs,
  deckActive,
  deckPreview,
  el,
  applySceneVisuals,
  ensureThumbScroller,
  hydrateThumbButtons,
  scenarioThumbUrl,
  renderThumbs,
  fillDeckCard,
}) {
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

  return { renderDeck };
}