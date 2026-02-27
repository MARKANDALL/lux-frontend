// features/convo/picker-deck.js
// ONE-LINE: Wires the convo picker deck UI (active/preview cards + thumbnails strip), including thumb hydration and smooth arrow-scrolling wrapper.

import { ensureThumbScroller } from "./picker-deck/thumb-scroller.js";
import { makeThumbHydrator } from "./picker-deck/thumbs-hydrator.js";
import { makeFillDeckCard } from "./picker-deck/deck-card.js";

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

  function renderThumbs({ thumbs, list, selectedId, onPick }){
    if (!thumbs) return;

    thumbs.innerHTML = "";

    list.forEach((s, i) => {
      const isActive = i === state.scenarioIdx;
      const b = el("button", "lux-thumb" + (isActive ? " is-active" : ""));
      b.type = "button";
      b.title = s?.title || `Scenario ${i + 1}`;

      // accessibility + "active" marker
      b.setAttribute("aria-label", b.title);
      b.setAttribute("aria-current", isActive ? "true" : "false");

      const thumb = scenarioThumbUrl(s);
      if (thumb) {
        b.dataset.thumbSrc = thumb;     // store only
        b.classList.add("has-img");
        b.textContent = "";
        // DO NOT set backgroundImage here
      } else {
        // fallback (keeps your “color dots” behavior if a scenario has no image)
        const hue = (i * 37) % 360;
        b.style.backgroundImage = `linear-gradient(135deg, hsl(${hue} 55% 70%), hsl(${(hue+18)%360} 55% 62%))`;
        b.textContent = (s?.title || "?").trim().slice(0, 1).toUpperCase();
      }

      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.scenarioIdx = i;
        renderDeck();
      });

      thumbs.append(b);
    });
  }

  let disposeThumbHydrator = null;

  function renderDeck() {
    applySceneVisuals?.();

    if (!list.length) {
      renderThumbs({ thumbs, list, selectedId: null, onPick: () => {} });
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
      selectedId: list[idx]?.id,
      onPick: (id) => {
        const i = list.findIndex((s) => s?.id === id);
        if (i >= 0) {
          state.scenarioIdx = i;
          renderDeck();
        }
      }
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