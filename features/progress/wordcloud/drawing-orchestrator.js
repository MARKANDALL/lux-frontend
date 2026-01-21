/**
 * features/progress/wordcloud/drawing-orchestrator.js
 *
 * Commit 16: "The Drawing Orchestrator"
 * Encapsulates the draw coordination logic and dev logging wrappers.
 *
 * Owns:
 * - _renderSeq reference object
 * - waitTwoFrames()
 * - fmtDaysAgo()
 * - draw(forceFetch) function
 *
 * Must preserve:
 * - LOG B: "[wc] attempts in range: ..."
 * - LOG C: "[wc] items: ..."
 *
 * Exports:
 * - fmtDaysAgo(pos)
 * - createWordcloudDrawer({ ... }) -> { draw, reflow }
 */

import { drawWordcloud, renderWordcloudView } from "./render.js";
import { filterAttemptsByRange, idFromItem, lower } from "./compute.js";
import { computeItemsForView } from "./view-logic.js";

import { rangeLabel, sortLabel, mixLabel } from "./labels.js";

import { createWordcloudSheetController } from "./sheet-controller.js";

import {
  attemptOverallScore,
  attemptWhen,
  findRecentAttemptsForWord,
  findRecentAttemptsForPhoneme,
} from "./attempt-utils.js";

import { openDetailsModal } from "../attempt-detail-modal.js";

/**
 * Ensures the overlay becomes visible BEFORE heavy work starts
 */
export function waitTwoFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/**
 * UI helper shared by multiple modules
 */
export function fmtDaysAgo(pos) {
  if (pos === 0) return "Now";
  return `${pos}d ago`;
}

/**
 * Factory that returns a draw() function.
 * It coordinates render.js with controllers (ui/data/strips) and preserves logs.
 */
export function createWordcloudDrawer({
  ctx,
  dom,
  ui,
  data,
  strips,

  attemptsAll,
  ensureWordCloudLibs,

  buildCloudPlan,
  saveNextActivityPlan,
  goToConvo,

  getState,
  topN = 40,
}) {
  if (!ctx) throw new Error("[wc/draw] ctx is required");
  if (!dom) throw new Error("[wc/draw] dom is required");
  if (!ui) throw new Error("[wc/draw] ui is required");
  if (!data) throw new Error("[wc/draw] data is required");
  if (!strips) throw new Error("[wc/draw] strips is required");

  if (!attemptsAll) throw new Error("[wc/draw] attemptsAll is required");
  if (typeof ensureWordCloudLibs !== "function")
    throw new Error("[wc/draw] ensureWordCloudLibs is required");
  if (typeof getState !== "function")
    throw new Error("[wc/draw] getState() is required");
  if (typeof buildCloudPlan !== "function")
    throw new Error("[wc/draw] buildCloudPlan is required");

  // Render sequencing guard (prevents old async layouts hiding new overlay)
  const _renderSeq = { value: 0 };

  // ✅ COMMIT 12C — sheet feature wiring stays within the draw orchestrator
  let sheetCtrl = null;

  // ✅ FIX 3 — timeline auto-heal (never start empty)
  let _timelineHealedOnce = false;

  async function draw(forceFetch = false) {
    const S = getState();

    // Wrap the two choke points so logs occur here (even though work is in render.js)

    const filterAttemptsByRangeLogged = (allAttempts, range, win, pos) => {
      // Reset heal flag anytime we’re not in timeline
      if (range !== "timeline") _timelineHealedOnce = false;

      let usedPos = pos;
      let attemptsInRange = filterAttemptsByRange(allAttempts, range, win, usedPos);

      // ✅ AUTO-HEAL: timeline can’t boot into an empty slice
      if (
        range === "timeline" &&
        Array.isArray(allAttempts) &&
        allAttempts.length &&
        attemptsInRange.length === 0 &&
        !_timelineHealedOnce
      ) {
        _timelineHealedOnce = true;

        usedPos = 0;
        try {
          ctx.set({ timelinePos: 0 });
        } catch (_) {}

        attemptsInRange = filterAttemptsByRange(allAttempts, range, win, 0);

        console.warn(
          "[wc] auto-heal: timeline slice empty → timelinePos reset to 0"
        );
      }

      // ✅ LOG B — right after range filter
      console.log(
        "[wc] attempts in range:",
        attemptsInRange?.length,
        "range=",
        range,
        "win=",
        win,
        "pos=",
        usedPos
      );

      return attemptsInRange;
    };

    const computeItemsForViewLogged = (attemptsInRange) => {
      const items = computeItemsForView({
        attemptsInRange,
        state: S,
        ctx,
        topN,
      });

      // ✅ LOG C — right after items computed
      console.log("[wc] items:", items?.length, "mode=", S.mode, "sort=", S.sort);

      return items;
    };

    // Init sheet controller once we have draw() closure available
    if (!sheetCtrl) {
      sheetCtrl = createWordcloudSheetController({
        ctx,
        attemptsAll,
        getState: () => getState(),
        strips,
        requestDraw: () => draw(false),

        // ✅ COMMIT 12D — plan build extracted
        buildCloudPlan: (state) => buildCloudPlan(ctx.refs.lastModel, state),

        saveNextActivityPlan,
        goToConvo,

        openDetailsModal,
        attemptOverallScore,
        attemptWhen,

        findRecentAttemptsForWord,
        findRecentAttemptsForPhoneme,

        filterAttemptsByRange,
        idFromItem,
        lower,
      });
    }

    await drawWordcloud({
      forceFetch,

      renderSeqRef: _renderSeq,

      setBusy: ui.setBusy,
      waitTwoFrames,

      metaEl: dom.meta,
      canvas: dom.canvas,

      mode: S.mode,
      range: S.range,
      timelineWin: S.timelineWin,
      timelinePos: S.timelinePos,
      query: S.query,
      sort: S.sort,
      mix: S.mix,
      clusterMode: S.clusterMode,

      attemptsAll,
      ensureWordCloudLibs,

      // ✅ COMMIT 15 — data loader supplies ensureData
      ensureData: data.ensureData,

      // ✅ pass wrappers (preserves dev logs)
      filterAttemptsByRange: filterAttemptsByRangeLogged,
      computeItemsForView: computeItemsForViewLogged,

      renderSavedStrip: strips.renderSavedStrip,
      renderTargetsStrip: strips.renderTargetsStrip,
      pinnedSet: strips.pinnedSetNow(),

      lower,
      rangeLabel,
      sortLabel,
      mixLabel,
      fmtDaysAgo,

      // ✅ context owns persistence+url now (keep keys identical)
      persist: () => ctx.persist(),
      syncUrl: () => ctx.syncUrl(),

      setActiveButtons: ui.setActiveButtons,
      setModeStory: ui.setModeStory,

      setLastItems: (items) => {
        ctx.setLastItems(items || []);
      },

      // ✅ COMMIT 12C — sheet controller owns hit-open behavior
      onSelect: (hit) => sheetCtrl?.openFromHit?.(hit),
    });
  }

  // ✅ FIX 2: True "reflow only" method (no recompute / no reshuffle)
  function reflow() {
    const items = ctx?.refs?.lastItems || [];
    if (!dom?.canvas || !items.length) return;

    const S = getState();
    const q = (S.query || "").trim().toLowerCase();

    const focusTest = q
      ? (idLower) => String(idLower || "").toLowerCase().includes(q)
      : null;

    // ✅ Repaint using cached layout (no reshuffle)
    renderWordcloudView({
      canvas: dom.canvas,
      items,
      focusTest,
      clusterMode: !!S.clusterMode,
      pinnedSet: strips.pinnedSetNow?.() || new Set(),
      onSelect: (hit) => sheetCtrl?.openFromHit?.(hit),
      onRenderEnd: () => {},
      reuseLayoutOnly: true,
    });
  }

  return {
    draw,
    reflow,
    renderSeqRef: _renderSeq, // exposed for debugging if needed
  };
}
