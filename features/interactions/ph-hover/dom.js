// features/interactions/ph-hover/dom.js
// Global tooltip DOM + CSS injection + hide scheduling + outside-close.
// This module does NOT decide tooltip content — it only provides the container + rules.
//
// This file is now a small façade/shim:
// - Keeps the public exports stable for other modules
// - Delegates CSS + behavior utilities to split modules

import { injectTooltipCSS } from "./dom.styles.js";
export { injectTooltipCSS } from "./dom.styles.js";
export { scheduleHide, bindOutsideCloseOnce } from "./dom.behavior.js";

export function ensureGlobalTooltip(state, { scheduleHide } = {}) {
  if (state.globalTooltip) return state.globalTooltip;

  // Put the CSS in <head> ONCE (not inside tooltip),
  // because tooltipContent.innerHTML updates would wipe it.
  injectTooltipCSS();

  const globalTooltip = document.createElement("div");
  globalTooltip.id = "lux-global-ph-tooltip";

  globalTooltip.style.cssText = `
    position: fixed;
    z-index: var(--z-popover);
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
    background: #1e293b;
    color: #fff;
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    width: min(560px, calc(100vw - 20px));
    pointer-events: auto;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    overflow: hidden;
  `;

  const tooltipContent = document.createElement("div");
  tooltipContent.id = "lux-global-ph-tooltip-content";
  globalTooltip.appendChild(tooltipContent);

  // Hover bridge: keep tooltip open while mouse is over it
  globalTooltip.addEventListener("mouseenter", () => {
    if (state.hideTimeout) clearTimeout(state.hideTimeout);
  });

  globalTooltip.addEventListener("mouseleave", () => {
    if (typeof scheduleHide === "function") scheduleHide();
  });

  document.body.appendChild(globalTooltip);

  // Save into shared state
  state.globalTooltip = globalTooltip;
  state.tooltipContent = tooltipContent;

  return globalTooltip;
}
