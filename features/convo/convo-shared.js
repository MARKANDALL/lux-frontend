// features/convo/convo-shared.js
// Slim orchestrator — re-exports from split modules + owns tiny shared helpers.
// Report overlay peeled to convo-report-ui.js (March 2026).

import { ensureUID } from "../../_api/index.js";

// --- Deck card sizing: make the CARD match the media's natural aspect ratio ---
const _luxMediaMeta = new Map();

export function applyMediaSizingVars(host, imgSrc) {
  if (!host || !imgSrc) return;

  const cached = _luxMediaMeta.get(imgSrc);
  if (cached) {
    host.style.setProperty("--lux-media-ar", cached.ar);
    host.style.setProperty("--lux-media-h", cached.h);
    return;
  }

  const im = new Image();
  im.onload = () => {
    const ar = `${im.naturalWidth} / ${im.naturalHeight}`;
    const h = `${im.naturalHeight}px`;
    _luxMediaMeta.set(imgSrc, { ar, h });

    host.style.setProperty("--lux-media-ar", ar);
    host.style.setProperty("--lux-media-h", h);
  };
  im.src = imgSrc;
}

export function uid() {
  return ensureUID();
}

export function newSessionId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

// Re-export from split module so existing importers don't break
export { showConvoReportOverlay } from "./convo-report-ui.js";