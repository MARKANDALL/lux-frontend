// features/interactions/ph-hover/dom.styles.js
// One-line: Injects phoneme tooltip + modal CSS into a single global <style> tag (id: lux-global-ph-tooltip-style).

import { TOOLTIP_BASE_CSS } from "./dom.styles/tooltip-base.cssText.js";
import { TOOLTIP_VIDEO_CSS } from "./dom.styles/tooltip-video.cssText.js";
import { TOOLTIP_MODAL_CSS } from "./dom.styles/tooltip-modal.cssText.js";

export function injectTooltipCSS() {
  if (document.getElementById("lux-global-ph-tooltip-style")) return;

  const style = document.createElement("style");
  style.id = "lux-global-ph-tooltip-style";

  style.textContent = TOOLTIP_BASE_CSS + TOOLTIP_VIDEO_CSS + TOOLTIP_MODAL_CSS;

  document.head.appendChild(style);
}
