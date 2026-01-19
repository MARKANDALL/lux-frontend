/**
 * features/progress/wordcloud/event-handlers.js
 *
 * Commit 17: "The Event Handler Factory"
 * Moves the massive bindWordcloudEvents() handler mapping out of index.js.
 *
 * This module is the "glue" between UI events and app logic.
 * Each handler should delegate to controllers (ctx/ui/drawer/timeline/strips).
 */

import { addManySaved, PIN_KEY } from "./state-store.js";
import { idFromItem } from "./compute.js";
import { buildCloudTop3Plan, buildCloudCoachQuickPlan } from "./plan.js";

export function createWordcloudEventHandlers({
  dom,
  ctx,
  ui,
  drawer,
  timeline,
  strips,
  saveNextActivityPlan,

  // optional config
  goBack = () => window.location.assign("./progress.html"),
  goToConvo = () => window.location.assign("./convo.html#chat"),

  // state getter for range validation + mode references
  getState,
}) {
  if (!dom) throw new Error("[wc/events] dom is required");
  if (!ctx) throw new Error("[wc/events] ctx is required");
  if (!ui) throw new Error("[wc/events] ui is required");
  if (!drawer) throw new Error("[wc/events] drawer is required");
  if (!timeline) throw new Error("[wc/events] timeline is required");
  if (!strips) throw new Error("[wc/events] strips is required");
  if (typeof saveNextActivityPlan !== "function")
    throw new Error("[wc/events] saveNextActivityPlan is required");
  if (typeof getState !== "function")
    throw new Error("[wc/events] getState() is required");

  return {
    goBack,

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
      const S = getState();

      const next = ["all", "30d", "7d", "today", "timeline"].includes(range)
        ? range
        : S.range;

      // ✅ stop replay when leaving timeline
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
      const S = getState();
      ctx.set({ clusterMode: !S.clusterMode });
      drawer.draw(false);
    },

    snapshot: () => {
      try {
        if (!dom.canvas) return;
        const S = getState();
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

      const S = getState();
      const top = strips.getTop3();
      if (!top.length) return;

      const plan = buildCloudTop3Plan(ctx.refs.lastModel, S.mode, top);
      if (!plan) return;

      saveNextActivityPlan(plan);
      goToConvo();
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
      goToConvo();
    },

    coachPinTop: () => {
      const S = getState();
      const top = strips.getTop3();
      const ids = top.map((x) => idFromItem(S.mode, x)).filter(Boolean);
      if (!ids.length) return;

      addManySaved(PIN_KEY, S.mode, ids);
      strips.renderSavedStrip();
      drawer.draw(false);
    },

    // compatibility hook (sheet is owned by drawer now)
    openSheetForId: (_id) => {
      // Intentionally no-op.
      // Sheet open is handled via onSelect in the drawing orchestrator.
    },
  };
}
