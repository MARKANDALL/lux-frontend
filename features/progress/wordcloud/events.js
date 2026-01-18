// features/progress/wordcloud/events.js
// ✅ All event listeners extracted from index.js

/**
 * Dumb wiring layer:
 * - queries DOM nodes inside root
 * - binds listeners
 * - calls api callbacks provided by index.js
 */
export function bindWordcloudEvents(root, api) {
  if (!root || !api) return;

  // Top actions
  const btnTheme = root.querySelector("#luxWcThemeToggle");
  const btnRefresh = root.querySelector("#luxWcRefresh");
  const btnBack = root.querySelector("#luxWcBack");

  // Mode toggles
  const pills = Array.from(root.querySelectorAll(".lux-wc-pill"));

  // Sort + range chips
  const sortBtns = Array.from(root.querySelectorAll("[data-sort]"));
  const rangeBtns = Array.from(root.querySelectorAll("[data-range]"));

  // Search
  const search = root.querySelector("#luxWcSearch");
  const clear = root.querySelector("#luxWcClear");

  // Power row
  const btnGenTop = root.querySelector("#luxWcGenTop");
  const btnCluster = root.querySelector("#luxWcCluster");
  const btnSnap = root.querySelector("#luxWcSnapshot");

  // Mix toggle
  const mixView = root.querySelector("#luxWcMixView");
  const mixSmart = root.querySelector("#luxWcMixSmart");

  // Timeline controls
  const winSlider = root.querySelector("#luxWcWin");
  const posSlider = root.querySelector("#luxWcPos");
  const btnReplay = root.querySelector("#luxWcReplay");

  // Coach lane
  const coachQuick = root.querySelector("#luxWcCoachQuick");
  const coachPinTop = root.querySelector("#luxWcCoachPinTop");

  // -----------------------------
  // Basic navigation / actions
  // -----------------------------
  btnBack?.addEventListener("click", () => api.goBack?.(), { passive: true });

  btnTheme?.addEventListener("click", () => api.toggleTheme?.(), {
    passive: true,
  });

  btnRefresh?.addEventListener("click", () => api.redraw?.(true), {
    passive: true,
  });

  // -----------------------------
  // Mode (words / phonemes)
  // -----------------------------
  pills.forEach((b) =>
    b.addEventListener(
      "click",
      () => {
        const mode = b?.dataset?.mode;
        if (!mode) return;
        api.setMode?.(mode);
      },
      { passive: true }
    )
  );

  // -----------------------------
  // Sort
  // -----------------------------
  sortBtns.forEach((b) =>
    b.addEventListener(
      "click",
      () => {
        const sort = b?.dataset?.sort;
        if (!sort) return;
        api.setSort?.(sort);
      },
      { passive: true }
    )
  );

  // -----------------------------
  // Range
  // -----------------------------
  rangeBtns.forEach((b) =>
    b.addEventListener(
      "click",
      () => {
        const range = b?.dataset?.range;
        if (!range) return;
        api.setRange?.(range);
      },
      { passive: true }
    )
  );

  // -----------------------------
  // Search
  // -----------------------------
  if (search) {
    search.addEventListener(
      "input",
      () => {
        api.setQuery?.(search.value || "");
      },
      { passive: true }
    );
  }

  clear?.addEventListener(
    "click",
    () => {
      if (search) search.value = "";
      api.clearQuery?.();
      try {
        search?.focus?.();
      } catch (_) {}
    },
    { passive: true }
  );

  // -----------------------------
  // Power row buttons
  // -----------------------------
  btnCluster?.addEventListener("click", () => api.toggleCluster?.(), {
    passive: true,
  });

  btnSnap?.addEventListener("click", () => api.snapshot?.(), { passive: true });

  btnGenTop?.addEventListener("click", () => api.generateTop3?.(), {
    passive: true,
  });

  // -----------------------------
  // Mix toggle
  // -----------------------------
  mixView?.addEventListener("click", () => api.setMix?.("view"), {
    passive: true,
  });

  mixSmart?.addEventListener("click", () => api.setMix?.("smart"), {
    passive: true,
  });

  // -----------------------------
  // Timeline sliders
  // -----------------------------
  winSlider?.addEventListener(
    "input",
    () => {
      api.setTimelineWin?.(Number(winSlider.value || 0));
    },
    { passive: true }
  );

  posSlider?.addEventListener(
    "input",
    () => {
      api.setTimelinePos?.(Number(posSlider.value || 0));
    },
    { passive: true }
  );

  // ✅ Replay toggle (UPDATED)
  // When someone clicks “Replay”: timeline.toggle();
  btnReplay?.addEventListener(
    "click",
    () => {
      // preferred new shape
      api.timeline?.toggle?.();

      // (optional compatibility fallback if index.js still provides toggleReplay)
      // safe to keep; remove later once timeline.toggle is everywhere
      if (!api.timeline?.toggle) api.toggleReplay?.();
    },
    { passive: true }
  );

  // -----------------------------
  // Coach lane
  // -----------------------------
  coachQuick?.addEventListener("click", () => api.coachQuick?.(), {
    passive: true,
  });

  coachPinTop?.addEventListener("click", () => api.coachPinTop?.(), {
    passive: true,
  });

  // -----------------------------
  // Delegated: open sheet from chips
  // (Top targets + pinned/favs use [data-open])
  // -----------------------------
  root.addEventListener(
    "click",
    (e) => {
      const btn = e.target?.closest?.("[data-open]");
      if (!btn) return;

      const id = String(btn.getAttribute("data-open") || "").trim();
      if (!id) return;

      api.openSheetForId?.(id);
    },
    { passive: true }
  );
}
