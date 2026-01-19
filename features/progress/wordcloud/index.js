// features/progress/wordcloud/index.js
import { ensureWordCloudLibs } from "./libs.js";

import {
  savedListForMode,
  addManySaved,
  FAV_KEY,
  PIN_KEY,
} from "./state-store.js";

import { mixLabel } from "./labels.js";

import { lower, idFromItem, smartTop3 } from "./compute.js";

import { wordcloudTemplateHtml } from "./template.js";

import { bindWordcloudEvents } from "./events.js";

import { saveNextActivityPlan } from "../../next-activity/next-activity.js";

// ✅ COMMIT 10: extract DOM querying into dom.js
import { getWordcloudDom } from "./dom.js";

// ✅ COMMIT 11: replay/timeline controller extracted
import { createTimelineController } from "./timeline.js";

// ✅ COMMIT 12A: real shared context object
import { createWordcloudContext } from "./context.js";

// ✅ COMMIT 12B: strips + coach lane extracted
import { createWordcloudStrips } from "./strips.js";

// ✅ COMMIT 12D: Next Activity Plan build extracted
import {
  buildCloudPlan,
  buildCloudTop3Plan,
  buildCloudCoachQuickPlan,
} from "./plan.js";

// ✅ COMMIT 14: UI sync layer extracted
import { createWordcloudUIManager } from "./ui-manager.js";

// ✅ COMMIT 15: data loader extracted
import { createWordcloudDataLoader } from "./data-loader.js";

// ✅ COMMIT 16: drawing orchestrator extracted
import {
  createWordcloudDrawer,
  fmtDaysAgo,
} from "./drawing-orchestrator.js";

const ROOT_ID = "wordcloud-root";
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

  // ✅ COMMIT 14 — UI sync layer owns all look/active-state updating
  const ui = createWordcloudUIManager({
    dom,
    getState: () => S,
    fmtDaysAgo,
  });

  // ✅ COMMIT 15 — data loader owns backend communication + refresh scheduling
  const data = createWordcloudDataLoader({ attemptsAll });

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

  // ✅ COMMIT 16 — draw orchestration moved out of index.js
  const drawer = createWordcloudDrawer({
    ctx,
    dom,
    ui,
    data,
    strips,

    attemptsAll,
    ensureWordCloudLibs,

    buildCloudPlan,
    saveNextActivityPlan,
    goToConvo: () => window.location.assign("./convo.html#chat"),

    getState: () => S,
    topN: TOP_N,
  });

  // ✅ COMMIT 11: timeline controller owns replay timer + button state
  // index.js only delegates and requests redraw
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
      drawer.draw(false);
    },

    getPos: () => S.timelinePos,
    setPos: (val) => {
      ctx.set({ timelinePos: val });
      ui.applyTimelineUI();
      drawer.draw(false);
    },

    // UI helpers
    fmtDaysAgo,
    applyTimelineUI: ui.applyTimelineUI,

    // redraw hook (controller calls when replay ticks)
    requestDraw: () => drawer.draw(false),
  });

  // ---------- bind events ----------
  bindWordcloudEvents(root, {
    goBack: () => window.location.assign("./progress.html"),

    toggleTheme: () => {
      ctx.toggleTheme(dom);
    },

    redraw: (forceFetch = false) => drawer.draw(!!forceFetch),

    setMode: (mode) => {
      ctx.set({ mode });
      ui.setModeStory();
      drawer.draw(false);
    },

    setSort: (sort) => {
      ctx.set({ sort });
      drawer.draw(false);
    },

    setRange: (range) => {
      const next = ["all", "30d", "7d", "today", "timeline"].includes(range)
        ? range
        : S.range;

      // ✅ COMMIT 11: stop replay when leaving timeline
      if (next !== "timeline") timeline.stop?.();

      ctx.set({ range: next });
      ui.setActiveButtons();
      drawer.draw(false);
    },

    setQuery: (q) => {
      ctx.set({ query: String(q || "") });
      drawer.draw(false);
    },

    clearQuery: () => {
      ctx.set({ query: "" });
      drawer.draw(false);
    },

    toggleCluster: () => {
      ctx.set({ clusterMode: !S.clusterMode });
      drawer.draw(false);
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
      drawer.draw(false);
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

    // timeline scrub inputs delegate to controller
    setTimelineWin: (val) => timeline.setWin?.(val),
    setTimelinePos: (val) => timeline.setPos?.(val),

    timeline,
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
      drawer.draw(false);
    },

    // ✅ COMMIT 12C — open-by-id flows into controller (via drawer/sheetCtrl internally)
    openSheetForId: (id) => {
      // optional: no-op if sheet controller isn't ready yet
      // sheet is owned by drawer; leaving this here for compatibility
      // (your sheet controller already supports open-by-hit in drawWordcloud)
    },
  });

  // initial
  ctx.applyTheme(dom);
  ui.setActiveButtons();
  ui.setModeStory();
  ui.applyTimelineUI();
  timeline.syncButton?.(); // optional (controller can update replay button text on load)

  await drawer.draw(false);

  // ✅ COMMIT 15 — auto refresh scheduling is owned by data loader
  data.startAutoRefresh({
    rootId: ROOT_ID,
    onRefresh: () => drawer.draw(false),
  });
}
