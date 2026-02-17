// features/convo/progress.js
// Conversation Skills progress panel (same look as Practice Results, but filtered to convo:* attempts).
// Renders as a collapsed drawer; loads on expand.

import { fetchHistory, ensureUID } from "../../src/api/index.js";
import { computeRollups } from "../progress/rollups.js";
import { renderProgressDashboard } from "../progress/render.js";

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
  const lastStr = last ? last.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
  return `Avg ${avg}% · Attempts ${attempts} · Last ${lastStr}`;
}

export async function refreshConvoProgress() {
  if (!_state?.host) return;

  try {
    const uid = ensureUID();
    const attempts = await fetchHistory(uid);
    const filtered = (attempts || []).filter(isConvoAttempt);
    const model = computeRollups(filtered, { windowDays: 30 });

    if (_state.miniStatsEl) _state.miniStatsEl.textContent = fmtMini(model.totals);

    if (_state.detailsEl?.open && _state.mountEl) {
      renderProgressDashboard(_state.mountEl, filtered, model, {
        title: "My Progress",
        subtitle: "Conversation Skills (AI Conversations)",
        showActions: false,
      });
    }
  } catch (err) {
    console.error("[ConvoProgress] refresh failed:", err);
    if (_state.miniStatsEl) _state.miniStatsEl.textContent = "History unavailable";
  }
}

export async function initConvoProgress() {
  const host = document.getElementById("convoProgress");
  if (!host) return;

  // expose refresh hook so convo/index.js can call it after saveAttempt
  window.refreshConvoProgress = refreshConvoProgress;

  host.innerHTML = `
    <details class="lux-progress-drawer" id="luxConvoProgressDrawer">
      <summary class="lux-progress-drawer-summary">
        <div class="lux-progress-drawer-left">
          <div class="lux-progress-drawer-title">My Progress · Conversation Skills</div>
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

  const detailsEl = host.querySelector("details.lux-progress-drawer");
  const miniStatsEl = host.querySelector('[data-role="miniStats"]');
  const mountEl = host.querySelector('[data-role="mount"]');

  _state = { host, detailsEl, miniStatsEl, mountEl };

  let loadedOnce = false;

  async function loadIfNeeded() {
    if (loadedOnce) return;
    loadedOnce = true;

    if (mountEl) mountEl.innerHTML = `<div style="color:#64748b; padding: 14px 16px;">Loading…</div>`;

    try {
      const uid = ensureUID();
      const attempts = await fetchHistory(uid);
      const filtered = (attempts || []).filter(isConvoAttempt);
      const model = computeRollups(filtered, { windowDays: 30 });

      if (miniStatsEl) miniStatsEl.textContent = fmtMini(model.totals);

      if (mountEl) {
        renderProgressDashboard(mountEl, filtered, model, {
          title: "My Progress",
          subtitle: "Conversation Skills (AI Conversations)",
          showActions: false,
        });
      }
    } catch (err) {
      console.error("[ConvoProgress] Drawer load failed:", err);
      loadedOnce = false; // allow retry
      if (miniStatsEl) miniStatsEl.textContent = "History unavailable";
      if (mountEl) mountEl.innerHTML = `<div style="color:#ef4444; padding: 14px 16px;">History unavailable.</div>`;
    }
  }

  if (detailsEl) {
    detailsEl.addEventListener("toggle", () => {
      if (detailsEl.open) loadIfNeeded();
    });
  }
}
