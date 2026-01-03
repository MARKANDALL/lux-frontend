// features/convo/convo-shared.js
import { ensureUID } from "../../api/index.js";

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

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function showConvoReportOverlay(report) {
  let host = document.getElementById("luxConvoReportOverlay");
  const pretty = escapeHtml(JSON.stringify(report, null, 2));

  if (!host) {
    host = document.createElement("div");
    host.id = "luxConvoReportOverlay";
    host.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.45);
      display:flex; align-items:center; justify-content:center;
      padding: 18px;
    `;

    host.innerHTML = `
      <dialog open style="
        width: min(880px, 96vw);
        max-height: min(86vh, 920px);
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        background: rgba(12,12,14,0.96);
        color: #e5e7eb;
        box-shadow: 0 16px 64px rgba(0,0,0,0.45);
        padding: 0;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <div style="font-weight: 700;">Session Report</div>
          <button id="luxConvoReportClose" style="
            appearance:none; border: 0; background: rgba(255,255,255,0.08);
            color:#e5e7eb; border-radius: 10px; padding: 8px 10px; cursor:pointer;
          ">Close</button>
        </div>
        <div style="padding: 12px 14px;">
          <pre id="luxConvoReportPre" style="
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.35;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            background: rgba(0,0,0,0.22);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 12px;
          ">${pretty}</pre>
        </div>
      </dialog>
    `;

    host.querySelector("#luxConvoReportClose")?.addEventListener("click", () =>
      host.remove()
    );
  } else {
    host.querySelector("#luxConvoReportPre").textContent = JSON.stringify(report, null, 2);
  }

  document.body.appendChild(host);
}
