// features/progress/wordcloud/index.js
import { ensureWordCloudLibs } from "./libs.js";

import { savedListForMode, FAV_KEY, PIN_KEY } from "./state-store.js";
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
import { buildCloudPlan } from "./plan.js";

// ✅ COMMIT 14: UI sync layer extracted
import { createWordcloudUIManager } from "./ui-manager.js";

// ✅ COMMIT 15: data loader extracted
import { createWordcloudDataLoader } from "./data-loader.js";

// ✅ COMMIT 16: drawing orchestrator extracted
import { createWordcloudDrawer, fmtDaysAgo } from "./drawing-orchestrator.js";

// ✅ COMMIT 17: event handler factory extracted
import { createWordcloudEventHandlers } from "./event-handlers.js";


// ✅ FIX C: drawer arrows must work even if something else crashes later
import { wireWordcloudSideDrawers } from "./side-drawers.js";

const ROOT_ID = "wordcloud-root";
const TOP_N = 50; // ✅ was 40

export async function initWordCloudPage() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // ✅ shared context owns all state + persistence + URL + theme
  const ctx = createWordcloudContext();

  // Snapshot of state for easy reads (updated via onChange)
  let S = ctx.get();
  ctx.onChange((next) => {
    S = next;
  });

  // Stable refs are owned by ctx (NOT by index.js)
  const attemptsAll = ctx.refs.attemptsAll;

  // Mount template FIRST, then grab DOM once
  root.innerHTML = wordcloudTemplateHtml();
  const dom = getWordcloudDom(root);
  console.log("[wc] dom missing:", dom.missing());

  // ✅ FIX 1: drawer toggle should NOT reset the cloud (no redraw)
  // wire early so arrows never "die" even if later setup crashes
  wireWordcloudSideDrawers(root, {
    // ✅ resizing drawers should NOT recompute the cloud
    onLayoutChange: () => drawer.reflow?.() ?? drawer.draw(false),
  });

  // UI sync layer
  const ui = createWordcloudUIManager({
    dom,
    getState: () => S,
    fmtDaysAgo,
  });

  // data loader owns backend communication + refresh scheduling
  const data = createWordcloudDataLoader({ attemptsAll });

  // strips UI controller
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

  // draw orchestration
  // NOTE: drawer is declared with `const` BUT referenced by the earlier onLayoutChange callback via closure.
  // That callback won't execute until user clicks the arrows, by which time drawer will exist (unless init crashes).
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

  // timeline controller delegates + requests redraw
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

    fmtDaysAgo,
    applyTimelineUI: ui.applyTimelineUI,

    requestDraw: () => drawer.draw(false),
  });

  // bind events (now created by factory)
  bindWordcloudEvents(
    root,
    createWordcloudEventHandlers({
      dom,
      ctx,
      ui,
      drawer,
      timeline,
      strips,
      saveNextActivityPlan,
      getState: () => S,
    })
  );

  // initial UI state
  ctx.applyTheme(dom);
  ui.setActiveButtons();
  ui.setModeStory();
  ui.applyTimelineUI();
  timeline.syncButton?.();

  await drawer.draw(false);

  // auto refresh scheduling (owned by data loader)
  data.startAutoRefresh({
    rootId: ROOT_ID,
    onRefresh: () => drawer.draw(false),
  });
}
