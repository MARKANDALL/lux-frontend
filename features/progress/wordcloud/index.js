// features/progress/wordcloud/index.js
import { fetchHistory } from "/src/api/index.js";
import { ensureUID } from "/api/identity.js";
import { ensureWordCloudLibs } from "./libs.js";

import {
  savedListForMode,
  addManySaved,
  FAV_KEY,
  PIN_KEY,
} from "./state-store.js";

import { rangeLabel, sortLabel, mixLabel } from "./labels.js";

import {
  lower,
  idFromItem,
  filterAttemptsByRange,
  smartTop3,
} from "./compute.js";

import {
  attemptOverallScore,
  attemptWhen,
  findRecentAttemptsForWord,
  findRecentAttemptsForPhoneme,
} from "./attempt-utils.js";

import { wordcloudTemplateHtml } from "./template.js";

import { drawWordcloud } from "./render.js";
import { bindWordcloudEvents } from "./events.js";

import { saveNextActivityPlan } from "../../next-activity/next-activity.js";

import { openDetailsModal } from "../attempt-detail-modal.js";

// ✅ COMMIT 10: extract DOM querying into dom.js
import { getWordcloudDom } from "./dom.js";

// ✅ COMMIT 11: replay/timeline controller extracted
import { createTimelineController } from "./timeline.js";

// ✅ COMMIT 12A: real shared context object
import { createWordcloudContext } from "./context.js";

// ✅ COMMIT 12B: strips + coach lane extracted
import { createWordcloudStrips } from "./strips.js";

// ✅ COMMIT 12C: sheet feature extracted
import { createWordcloudSheetController } from "./sheet-controller.js";

// ✅ COMMIT 12D: Next Activity Plan build extracted
import {
  buildCloudPlan,
  buildCloudTop3Plan,
  buildCloudCoachQuickPlan,
} from "./plan.js";

// ✅ COMMIT 13: view data engine extracted
import { computeItemsForView } from "./view-logic.js";

// ✅ COMMIT 14: UI sync layer extracted
import { createWordcloudUIManager } from "./ui-manager.js";

const ROOT_ID = "wordcloud-root";
const AUTO_REFRESH_MS = 10 * 60 * 1000;
const TOP_N = 20;

export async function initWordCloudPage() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // ✅ COMMIT 12A — shared context owns all state + persistence + URL + theme
  const ctx = createWordcloudContext();

  // Snapshot of state for easy reads (updated via onChange)
  let S = ctx.get();
  ctx.onChange((next) => {
    S = next;
  });

  // Stable refs are owned by ctx (NOT by index.js)
  const attemptsAll = ctx.refs.attemptsAll;

  // ✅ mount template, then grab all DOM in one call
  root.innerHTML = wordcloudTemplateHtml();
  const dom = getWordcloudDom(root);

  // Render sequencing guard (prevents old async layouts hiding new overlay)
  const _renderSeq = { value: 0 };

  // Ensures the overlay becomes visible BEFORE heavy work starts
  function waitTwoFrames() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  function fmtDaysAgo(pos) {
    if (pos === 0) return "Now";
    return `${pos}d ago`;
  }

  // ✅ COMMIT 14 — UI sync layer owns all look/active-state updating
  const ui = createWordcloudUIManager({
    dom,
    getState: () => S,
    fmtDaysAgo,
  });

  // ✅ COMMIT 12B — strips UI controller
  const strips = createWordcloudStrips({
    ctx,
    dom,
    getState: () => S,
    mixLabel,
    smartTop3,
    idFromItem,
    lower,
    savedListForMode,
    PIN_KEY,
    FAV_KEY,
  });

  // ✅ MINIMAL FIX (ONLY HERE)
  // Mutate the existing attemptsAll array so render.js always sees the same reference.
  async function ensureData(force = false) {
    if (attemptsAll.length && !force) return;

    const uid = ensureUID();
    const next = await fetchHistory(uid);

    attemptsAll.length = 0;
    attemptsAll.push(...(next || []));

    console.log(
      "[wc] history attempts:",
      attemptsAll?.length,
      attemptsAll?.[0]
    );
  }

  // ✅ COMMIT 12C — action sheet controller owns sheet logic
  let sheetCtrl = null;

  // ---------- draw ----------
  async function draw(forceFetch = false) {
    // Wrap the two choke points so logs occur in index.js (even though work is in render.js)

    const filterAttemptsByRangeLogged = (allAttempts, range, win, pos) => {
      const attemptsInRange = filterAttemptsByRange(allAttempts, range, win, pos);

      // ✅ LOG B — right after range filter
      console.log(
        "[wc] attempts in range:",
        attemptsInRange?.length,
        "range=",
        S.range,
        "win=",
        S.timelineWin,
        "pos=",
        S.timelinePos
      );

      return attemptsInRange;
    };

    const computeItemsForViewLogged = (attemptsInRange) => {
      const items = computeItemsForView({
        attemptsInRange,
        state: S,
        ctx,
        topN: TOP_N,
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
        getState: () => S,
        strips,
        requestDraw: () => draw(false),

        // ✅ COMMIT 12D — plan build extracted
        buildCloudPlan: (state) => buildCloudPlan(ctx.refs.lastModel, state),

        saveNextActivityPlan,
        goToConvo: () => window.location.assign("./convo.html#chat"),

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
      ensureData,

      // ✅ pass wrappers (this is how we guarantee logs happen in index.js)
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

  // ✅ COMMIT 11: timeline controller owns replay timer + button state
  // (index.js only holds win/pos + range, and delegates replay concerns)
  const timeline = createTimelineController({
    dom,

    getRange: () => S.range,
    setRange: (nextRange) => {
      ctx.set({ range: nextRange });
      ui.setActiveButtons();
      ui.applyTimelineUI();
    },

    getWin: () => S.timelineWin,
    setWin: (val) => {
      ctx.set({ timelineWin: val });
      ui.applyTimelineUI();
      draw(false);
    },

    getPos: () => S.timelinePos,
    setPos: (val) => {
      ctx.set({ timelinePos: val });
      ui.applyTimelineUI();
      draw(false);
    },

    // UI helpers
    fmtDaysAgo,
    applyTimelineUI: ui.applyTimelineUI,

    // redraw hook (controller calls when replay ticks)
    requestDraw: () => draw(false),
  });

  // ---------- bind events ----------
  bindWordcloudEvents(root, {
    goBack: () => window.location.assign("./progress.html"),

    toggleTheme: () => {
      ctx.toggleTheme(dom);
    },

    redraw: (forceFetch = false) => draw(!!forceFetch),

    setMode: (mode) => {
      ctx.set({ mode });
      ui.setModeStory();
      draw(false);
    },

    setSort: (sort) => {
      ctx.set({ sort });
      draw(false);
    },

    setRange: (range) => {
      const next = ["all", "30d", "7d", "today", "timeline"].includes(range)
        ? range
        : S.range;

      // ✅ COMMIT 11: stop replay when leaving timeline
      if (next !== "timeline") timeline.stop?.();

      ctx.set({ range: next });
      ui.setActiveButtons();
      draw(false);
    },

    setQuery: (q) => {
      ctx.set({ query: String(q || "") });
      draw(false);
    },

    clearQuery: () => {
      ctx.set({ query: "" });
      draw(false);
    },

    toggleCluster: () => {
      ctx.set({ clusterMode: !S.clusterMode });
      draw(false);
    },

    snapshot: () => {
      try {
        if (!dom.canvas) return;
        const a = document.createElement("a");
        a.download = `lux-cloud-${S.mode}-${Date.now()}.png`;
        a.href = dom.canvas.toDataURL("image/png");
        a.click();
      } catch (_) {}
    },

    setMix: (mix) => {
      ctx.set({ mix });
      draw(false);
    },

    generateTop3: () => {
      if (!ctx.refs.lastModel) return;

      const top = strips.getTop3();
      if (!top.length) return;

      const plan = buildCloudTop3Plan(ctx.refs.lastModel, S.mode, top);
      if (!plan) return;

      saveNextActivityPlan(plan);
      window.location.assign("./convo.html#chat");
    },

    // ✅ timeline scrub inputs still flow through index.js,
    // but we delegate to controller so it can keep replay consistent
    setTimelineWin: (val) => timeline.setWin?.(val),
    setTimelinePos: (val) => timeline.setPos?.(val),

    // ✅ Replay button path (events.js can call api.timeline.toggle())
    timeline,

    // ✅ Backward compatibility if anything still calls api.toggleReplay()
    toggleReplay: () => timeline.toggle?.(),

    coachQuick: () => {
      if (!ctx.refs.lastModel) return;

      const top = strips.getTop3();
      if (!top.length) return;

      const plan = buildCloudCoachQuickPlan(ctx.refs.lastModel);
      if (!plan) return;

      saveNextActivityPlan(plan);
      window.location.assign("./convo.html#chat");
    },

    coachPinTop: () => {
      const top = strips.getTop3();
      const ids = top.map((x) => idFromItem(S.mode, x)).filter(Boolean);
      if (!ids.length) return;

      addManySaved(PIN_KEY, S.mode, ids);
      strips.renderSavedStrip();
      draw(false);
    },

    // ✅ COMMIT 12C — open-by-id flows into controller
    openSheetForId: (id) => sheetCtrl?.openSheetForId?.(id),
  });

  // initial
  ctx.applyTheme(dom);
  ui.setActiveButtons();
  ui.setModeStory();
  ui.applyTimelineUI();
  timeline.syncButton?.(); // optional (controller can update replay button text on load)
  await draw(false);

  setInterval(() => {
    if (document.getElementById(ROOT_ID)) draw(false);
  }, AUTO_REFRESH_MS);
}
