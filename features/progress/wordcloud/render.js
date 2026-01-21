// features/progress/wordcloud/render.js
import { renderWordCloudCanvas } from "./render-canvas.js";

/**
 * Renders the wordcloud canvas + updates related UI bits.
 * Keep this module "dumb": it takes args and does render work.
 */
export function renderWordcloudView({
  canvas,
  items,
  focusTest,
  clusterMode,
  pinnedSet,
  onSelect,
  onRenderEnd,
  reuseLayoutOnly = false,
}) {
  // IMPORTANT: preserve your onRenderEnd hook
  renderWordCloudCanvas(canvas, items, {
    focusTest,
    clusterMode,
    pinnedSet,
    onSelect,
    onRenderEnd,
    reuseLayoutOnly,
  });
}

// ✅ FIX #3 — Prevent redraw overlaps (timer collision)
let drawing = false;

/**
 * Draw orchestration extracted from index.js.
 * This function stays UI-agnostic by receiving all dependencies/callbacks as args.
 */
export async function drawWordcloud({
  forceFetch = false,

  // sequencing guard (object ref: { value: 0 })
  renderSeqRef,

  // UI hooks
  setBusy,
  waitTwoFrames,

  // DOM
  metaEl,
  canvas,

  // state
  mode,
  range,
  timelineWin,
  timelinePos,
  query,
  sort,
  mix,
  clusterMode,

  // data + helpers
  attemptsAll,
  ensureWordCloudLibs,
  ensureData,
  filterAttemptsByRange,
  computeItemsForView,
  renderSavedStrip,
  renderTargetsStrip,
  pinnedSet,

  // formatting helpers
  lower,
  rangeLabel,
  sortLabel,
  mixLabel,
  fmtDaysAgo,

  // persistence + UI state sync
  persist,
  syncUrl,
  setActiveButtons,
  setModeStory,

  // keeps index.js model state correct
  setLastItems,

  // selection handler (delegated to index.js so it can call the sheet)
  onSelect,
}) {
  if (!canvas || !metaEl) return;

  // ✅ Prevent re-entrancy stampedes
  if (drawing) return;
  drawing = true;

  try {
    const seq = ++renderSeqRef.value;

    // Show overlay immediately so click feedback is instant
    setBusy(true, "Loading cloud…", "Preparing layout");
    await waitTwoFrames();

    try {
      metaEl.textContent = "Loading…";

      setBusy(true, "Loading cloud engine…", "D3 layout + canvas renderer");

      console.time("[wc] ensure libs");
      const ok = await ensureWordCloudLibs();
      console.timeEnd("[wc] ensure libs");

      if (seq !== renderSeqRef.value) return;

      if (!ok) {
        setBusy(false);
        metaEl.textContent =
          "Word Cloud libraries not found. Add /public/vendor/d3.v7.min.js + /public/vendor/d3.layout.cloud.js";
        return;
      }

      setBusy(true, "Loading your practice history…", "Fetching attempt data");

      console.time("[wc] ensure data");
      await ensureData(forceFetch);
      console.timeEnd("[wc] ensure data");

      if (seq !== renderSeqRef.value) return;

      console.time("[wc] compute items");
      const attemptsInRange = filterAttemptsByRange(
        attemptsAll,
        range,
        timelineWin,
        timelinePos
      );
      const items = computeItemsForView(attemptsInRange);
      console.timeEnd("[wc] compute items");

      // IMPORTANT: keep index.js top3 logic correct
      if (typeof setLastItems === "function") setLastItems(items);

      renderSavedStrip();
      renderTargetsStrip(attemptsInRange);

      if (!items.length) {
        metaEl.textContent =
          mode === "phonemes"
            ? "Not enough phoneme data yet — do a little more practice first."
            : "Not enough word data yet — do a little more practice first.";

        // Empty canvas + stop overlay
        console.time("[wc] render layout");
        renderWordcloudView({
          canvas,
          items: [],
          focusTest: null,
          clusterMode,
          pinnedSet,
          onSelect,
          onRenderEnd: ({ reason } = {}) => {
            console.log("[wc] render end:", reason);
            console.timeEnd("[wc] render layout");
            if (seq === renderSeqRef.value) setBusy(false);
          },
        });

        return;
      }

      // Keep overlay ON until D3 layout finishes and paint happens
      setBusy(true, "Building cloud…", "Placing targets on canvas");

      // ✅ Reassurance message if layout takes a while
      let slowNote = setTimeout(() => {
        if (seq === renderSeqRef.value) {
          setBusy(true, "Building cloud…", "Still working… (large history)");
        }
      }, 1200);

      const q = lower(query);
      const focusTest = q ? (idLower) => String(idLower || "").includes(q) : null;

      console.time("[wc] render layout");
      renderWordcloudView({
        canvas,
        items,
        focusTest,
        clusterMode,
        pinnedSet,

        // ✅ keep overlay hide hook
        onRenderEnd: ({ reason } = {}) => {
          console.log("[wc] render end:", reason);
          console.timeEnd("[wc] render layout");
          clearTimeout(slowNote);
          if (seq === renderSeqRef.value) setBusy(false);
        },

        onSelect,
      });

      const label = mode === "phonemes" ? "Phonemes" : "Words";
      const tl =
        range === "timeline"
          ? ` · Window: ${timelineWin}d ending ${fmtDaysAgo(timelinePos)}`
          : "";

      metaEl.textContent =
        `Updated ${new Date().toLocaleString()} · ${label} · ${rangeLabel(
          range
        )}${tl} · Sort: ${sortLabel(sort)} · Mix: ${mixLabel(mix)}` +
        (q ? ` · Search: “${String(query || "").trim()}”` : "");

      persist();
      syncUrl();
      setActiveButtons();
      setModeStory();
    } catch (err) {
      console.error("[Cloud Visuals] draw failed:", err);
      if (seq === renderSeqRef.value) setBusy(false);
      metaEl.textContent = "Cloud load failed — check console for details.";
    }
  } finally {
    drawing = false;
  }
}
