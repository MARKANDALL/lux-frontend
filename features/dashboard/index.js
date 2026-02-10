// features/dashboard/index.js
// Practice-page + Progress Hub dashboard bootstrap.
// - On /index.html: renders a collapsed "My Progress" drawer (loads on expand).
// - On /progress.html: renders the full dashboard immediately.

import * as UI from "./ui.js";
import { fetchHistory, ensureUID } from "/src/api/index.js";
import { computeRollups } from "../progress/rollups.js";
import { renderProgressDashboard } from "../progress/render.js";
import { mountAICoachAlwaysOn } from "../../ui/ui-ai-ai-logic.js";
import { bringBoxBottomToViewport } from "../../helpers/index.js";

const ROOT_ID = "dashboard-root";
const HUB_HREF = "./progress.html";

let _state = null;

function pickPassageKey(a) {
  return a?.passage_key || a?.passageKey || a?.passage || "";
}

function isConvoAttempt(a) {
  return String(pickPassageKey(a)).startsWith("convo:");
}

function fmtMini(totals = {}) {
  const avg = Math.round(Number(totals.avgScore || 0));
  const attempts = totals.attempts ?? 0;
  const last = totals.lastTS ? new Date(totals.lastTS) : null;
  const lastStr = last
    ? last.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "—";
  return `Avg ${avg}% · Attempts ${attempts} · Last ${lastStr}`;
}

/**
 * Public refresh hook (used by auth + recorder).
 * - If the drawer is open, re-renders the full dashboard.
 * - If closed, just refreshes the mini summary.
 */
export async function refreshHistory() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // Hub page: always re-render fully.
  const isHub =
    location.pathname.endsWith("/progress.html") ||
    location.pathname.endsWith("progress.html");
  if (isHub) {
    return await loadAndRenderHub(root);
  }

  // Practice page: drawer mode.
  if (!_state) return; // initDashboard not run yet

  try {
    const uid = ensureUID();
    const attempts = await fetchHistory(uid);
    const filtered = attempts.filter((a) => !isConvoAttempt(a));
    const model = computeRollups(filtered);

    if (_state.miniStatsEl) _state.miniStatsEl.textContent = fmtMini(model.totals);

    if (_state.detailsEl && _state.detailsEl.open && _state.mountEl) {
      renderProgressDashboard(_state.mountEl, filtered, model, {
        title: "My Progress",
        subtitle: "Practice Results (word + phoneme practice)",
        showActions: false,
        showNextPractice: true,
        nextPracticeBehavior: "apply",
        // IMPORTANT: drawer should NOT show category trend grid
        // showMetricTrends: false (default)
      });
    }
  } catch (err) {
    console.error("[Dashboard] refreshHistory failed:", err);
    if (_state.miniStatsEl) _state.miniStatsEl.textContent = "History unavailable";
  }
}

async function loadAndRenderHub(root) {
  UI.renderDashboard(ROOT_ID);

  try {
    const uid = ensureUID();
    const attempts = await fetchHistory(uid);
    const model = computeRollups(attempts);

    renderProgressDashboard(root, attempts, model, {
      title: "My Progress",
      subtitle: "All practice (Pronunciation + AI Conversations)",
      showActions: true,
      showCoach: true,
      showNextPractice: true,
      nextPracticeBehavior: "navigate",
      // ✅ ONLY the All Data page gets the new category trend block
      showMetricTrends: true,
    });

    // Always-on AI Coach shell (shows immediately, even before any clicks)
    mountAICoachAlwaysOn(() => {
      if (!Array.isArray(attempts) || !attempts.length) return null;

      // pick latest attempt robustly
      let latest = null;
      let bestTS = -1;
      for (const a of attempts) {
        const ts =
          Date.parse(
            a?.ts || a?.created_at || a?.createdAt || a?.time || a?.localTime || ""
          ) || 0;
        if (ts > bestTS) {
          bestTS = ts;
          latest = a;
        }
      }
      if (!latest) return null;

      const azureResult =
        latest?.azureResult || latest?.azure_result || latest?.azure || latest?.result || null;
      const referenceText = latest?.text || "";
      const firstLang = latest?.l1 || "universal";

      return { azureResult, referenceText, firstLang };
    });

    // Hub page: open AI Coach after first user interaction (click/tap/key)
    const coachDrawer = document.getElementById("aiCoachDrawer");
    if (coachDrawer) {
      coachDrawer.open = false;
      const openOnce = () => {
        if (!coachDrawer.open) coachDrawer.open = true;
      };
      document.addEventListener("pointerdown", openOnce, { once: true, capture: true });
      document.addEventListener("keydown", openOnce, { once: true, capture: true });
    }
  } catch (err) {
    console.error("[Dashboard] Hub load failed:", err);
    if (String(err).includes("404"))
      renderProgressDashboard(root, [], computeRollups([]), { showActions: true });
    else UI.renderError("History unavailable.");
  }
}

export async function initDashboard() {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  // expose refresh for auth + other flows
  window.refreshDashboard = refreshHistory;

  const isHub =
    location.pathname.endsWith("/progress.html") ||
    location.pathname.endsWith("progress.html");
  if (isHub) {
    // Full page: render immediately
    await loadAndRenderHub(root);
    return;
  }

  // Main Practice page: collapsed drawer, lazy-load on open
  root.innerHTML = `
    <details class="lux-progress-drawer">
      <summary class="lux-progress-drawer-summary">
        <div class="lux-progress-drawer-left">
          <div class="lux-progress-drawer-title">My Progress · Practice Results</div>
       <div class="lux-progress-drawer-mini">
            <span class="lux-mini-open">Hide My Progress</span>
            <span class="lux-mini-closed">Show My Progress</span>
            <span class="lux-mini-stats" data-role="miniStats"></span>
          </div>
        </div>
        <div class="lux-progress-drawer-right">
        <a class="lux-progress-drawer-link" href="${HUB_HREF}">All Data</a>
        <span class="lux-progress-drawer-chev" aria-hidden="true">▾</span>
      </div>
      </summary>
      <div class="lux-progress-drawer-body">
        <div class="lux-progress-drawer-mount" data-role="mount">
          <div style="color:#64748b; padding: 14px 16px;">Open to load your history.</div>
        </div>
      </div>
    </details>
  `;

  const detailsEl = root.querySelector("details.lux-progress-drawer");
  const miniStatsEl = root.querySelector('[data-role="miniStats"]');
  const mountEl = root.querySelector('[data-role="mount"]');

  _state = { detailsEl, miniStatsEl, mountEl };

  let loadedOnce = false;
  let wantScroll = false;
  let scrollAfterLoad = false;

  const summaryEl = detailsEl?.querySelector("summary");
  summaryEl?.addEventListener(
    "pointerdown",
    () => {
      wantScroll = true;
    },
    { passive: true }
  );
  summaryEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") wantScroll = true;
  });

  async function loadIfNeeded() {
    if (loadedOnce) return;
    loadedOnce = true;

    if (mountEl)
      mountEl.innerHTML = `<div style="color:#64748b; padding: 14px 16px;">Loading…</div>`;

    try {
      const uid = ensureUID();
      const attempts = await fetchHistory(uid);
      const filtered = attempts.filter((a) => !isConvoAttempt(a));
      const model = computeRollups(filtered);

      if (miniStatsEl) miniStatsEl.textContent = fmtMini(model.totals);

      if (mountEl) {
        renderProgressDashboard(mountEl, filtered, model, {
          title: "My Progress",
          subtitle: "Practice Results (word + phoneme practice)",
          showActions: false,
          showNextPractice: true,
          nextPracticeBehavior: "apply",
          // IMPORTANT: drawer should NOT show category trend grid
          // showMetricTrends: false (default)
        });
      }

      // After the first lazy-load expands content, re-align the bottom once.
      if (scrollAfterLoad && detailsEl?.open) {
        scrollAfterLoad = false;
        requestAnimationFrame(() => bringBoxBottomToViewport(detailsEl, 14));
      }
    } catch (err) {
      console.error("[Dashboard] Drawer load failed:", err);
      loadedOnce = false; // allow retry on next open
      scrollAfterLoad = false;
      if (miniStatsEl) miniStatsEl.textContent = "History unavailable";
      if (mountEl)
        mountEl.innerHTML = `<div style="color:#ef4444; padding: 14px 16px;">History unavailable.</div>`;
    }
  }

  if (detailsEl) {
    detailsEl.addEventListener("toggle", () => {
      if (!detailsEl.open) return;

      // Scroll only if the user opened it (not programmatic).
      if (wantScroll) {
        wantScroll = false;
        scrollAfterLoad = !loadedOnce; // only needed on first lazy-load open
        requestAnimationFrame(() => bringBoxBottomToViewport(detailsEl, 14));
      }

      loadIfNeeded();
    });
  }
}
