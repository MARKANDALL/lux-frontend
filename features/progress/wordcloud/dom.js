// features/progress/wordcloud/dom.js
// Centralized DOM grabber for the Word Cloud page.
// This maps 1:1 to the IDs/classes used in:
//   features/progress/wordcloud/index.js

export function getWordcloudDom(root) {
  if (!root) throw new Error("[wordcloud/dom] root is required");

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => Array.from(root.querySelectorAll(sel));

  const dom = {
    // Root
    root,

    // Main shell + canvas area
    shell: $("#luxWcShell"),
    canvas: $("#luxWcCanvas") || $("canvas"),

    // Meta text blocks
    meta: $("#luxWcMeta"),
    sub: $("#luxWcSub"),

    // Loading overlay (center canvas)
    overlay: $("#luxWcOverlay"),
    overlayTitle: $("#luxWcOverlayTitle"),
    overlaySub: $("#luxWcOverlaySub"),

    // Top controls
    btnTheme: $("#luxWcThemeToggle"),

    // Mode pills + sort/range buttons (data attributes)
    pills: $$(".lux-wc-pill"),
    sortBtns: $$("[data-sort]"),
    rangeBtns: $$("[data-range]"),

    // Toggles / mix
    btnCluster: $("#luxWcCluster"),
    mixView: $("#luxWcMixView"),
    mixSmart: $("#luxWcMixSmart"),

    // Strips + helper hint
    targetsStrip: $("#luxWcTargets"),
    savedStrip: $("#luxWcSaved"),
    coachHint: $("#luxWcCoachHint"),

    // Timeline controls
    timelineRow: $("#luxWcTimelineRow"),
    winSlider: $("#luxWcWin"),
    posSlider: $("#luxWcPos"),
    winVal: $("#luxWcWinVal"),
    posVal: $("#luxWcPosVal"),
    btnReplay: $("#luxWcReplay"),

    // Convenience accessors (optional)
    $,
    $$,
  };

  // Optional: quick missing-element diagnostics (helps when template changes)
  dom.missing = () => {
    const required = [
      ["shell", dom.shell],
      ["canvas", dom.canvas],
      ["meta", dom.meta],
      ["sub", dom.sub],
      ["overlay", dom.overlay],
      ["btnTheme", dom.btnTheme],
      ["btnCluster", dom.btnCluster],
      ["mixView", dom.mixView],
      ["mixSmart", dom.mixSmart],
      ["targetsStrip", dom.targetsStrip],
      ["savedStrip", dom.savedStrip],
      ["coachHint", dom.coachHint],
      ["timelineRow", dom.timelineRow],
      ["winSlider", dom.winSlider],
      ["posSlider", dom.posSlider],
      ["winVal", dom.winVal],
      ["posVal", dom.posVal],
      ["btnReplay", dom.btnReplay],
    ];

    return required.filter(([, el]) => !el).map(([name]) => name);
  };

  return dom;
}
