// features/interactions/metric-modal/events.js
// DOM wiring + open/close + click/keyboard handlers.

import { buildModalHtml, esc } from "./render.js";

let installed = false;
let currentCtx = { azureResult: null, referenceText: "" };

function resolveMetricKeyFromEl(el) {
  if (!el) return null;

  const k = el.dataset?.scoreKey;
  if (k) return String(k).trim();

  if (el.classList?.contains("lux-scoreRing")) return "Overall";

  const lbl =
    el.querySelector?.(".lux-scoreTile-label")?.textContent ||
    el.querySelector?.(".lux-scoreLabel")?.textContent ||
    el.textContent ||
    "";

  const s = String(lbl).replace(/\(\?\)/g, "").trim().toLowerCase();
  if (!s) return null;

  if (s.includes("overall")) return "Overall";
  if (s.includes("pronunciation")) return "Pronunciation";
  if (s.includes("prosody")) return "Prosody";
  if (s.includes("accuracy")) return "Accuracy";
  if (s.includes("fluency")) return "Fluency";
  if (s.includes("completeness")) return "Completeness";

  return null;
}

function decorateTiles() {
  const tiles = document.querySelectorAll(".lux-scoreTile, .lux-scoreRing");
  tiles.forEach((t) => {
    if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "0");
    if (!t.hasAttribute("role")) t.setAttribute("role", "button");
    t.setAttribute("aria-haspopup", "dialog");

    if (!t.dataset.scoreKey) {
      const inferred = resolveMetricKeyFromEl(t);
      if (inferred) t.dataset.scoreKey = inferred;
    }
  });
}

function openMetricModal(metricKey, ctx) {
  const existing = document.getElementById("lux-metric-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "lux-metric-modal";
  modal.className = "lux-metricModal";

  const card = document.createElement("div");
  card.className = "lux-metricCard";

  const closeBtn = document.createElement("button");
  closeBtn.className = "lux-metricClose";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = "&times;";

  function close() {
    try {
      document.body.style.overflow = "";
    } catch {}
    try {
      modal.remove();
    } catch {}
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener("keydown", onKey);

  card.appendChild(closeBtn);

  const azureResult = ctx?.azureResult || null;

  if (!azureResult) {
    card.insertAdjacentHTML(
      "beforeend",
      `
      <div style="font-weight:900; font-size:1.05rem; color:#0f172a;">${esc(
        metricKey
      )}</div>
      <div style="margin-top:10px; color:#64748b; font-weight:800;">
        No attempt data yet. Record once to unlock details.
      </div>
    `
    );
  } else {
    card.insertAdjacentHTML("beforeend", buildModalHtml(metricKey, ctx));
  }

  modal.appendChild(card);
  document.body.appendChild(modal);

  try {
    document.body.style.overflow = "hidden";
  } catch {}
}

function shouldIgnoreClick(target) {
  if (!target) return false;
  if (target.closest?.("#lux-metric-modal")) return true;
  return false;
}

function onDocClick(e) {
  const t = e.target;
  if (shouldIgnoreClick(t)) return;

  const hit = t?.closest?.("[data-score-key], .lux-scoreTile, .lux-scoreRing");
  if (!hit) return;

  const metricKey = resolveMetricKeyFromEl(hit);
  if (!metricKey) return;

  openMetricModal(metricKey, currentCtx);
}

function onDocKeyDown(e) {
  if (e.key !== "Enter" && e.key !== " ") return;

  const t = e.target;
  const hit = t?.closest?.("[data-score-key], .lux-scoreTile, .lux-scoreRing");
  if (!hit) return;

  const metricKey = resolveMetricKeyFromEl(hit);
  if (!metricKey) return;

  e.preventDefault();
  openMetricModal(metricKey, currentCtx);
}

export function setMetricModalData(data) {
  // Accept either raw Azure payload or the richer ctx object
  if (data && typeof data === "object" && "azureResult" in data) {
    currentCtx = {
      azureResult: data.azureResult || null,
      referenceText: data.referenceText || "",
    };
  } else {
    currentCtx = { azureResult: data || null, referenceText: "" };
  }

  decorateTiles();
}

export function getMetricModalData() {
  return currentCtx;
}

export function initMetricScoreModals() {
  if (installed) return;
  installed = true;

  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onDocKeyDown, true);

  decorateTiles();
}
