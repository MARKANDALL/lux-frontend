// features/convo/progress.js
// Conversation Skills progress panel (same look as Practice Results, but filtered to convo:* attempts).
// Renders as a collapsed drawer; loads on expand.

import { fetchHistory, ensureUID } from "../../api/index.js";
import { computeRollups } from "../progress/rollups.js";
import { pickPassageKey } from "../progress/attempt-pickers.js";
import { renderProgressDashboard } from "../progress/render.js";
import {
  pickLatestAttempt,
  pickAttemptsForLatestSession,
  computeImmediateScopeRollups,
} from "../progress/next-practice-scopes.js";
import { luxBus } from "../../app-core/lux-bus.js";

const HUB_HREF = "./progress.html";

let _state = null;

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

function buildConvoNextPracticeBlocks(attempts, aggregateModel) {
  const latest = pickLatestAttempt(attempts);
  const latestOnly = latest ? [latest] : [];
  const sessionAttempts = pickAttemptsForLatestSession(attempts);

  // Use session if multiple turns exist, otherwise just the latest exchange
  const recentAttempts = sessionAttempts.length > 1 ? sessionAttempts : latestOnly;
  const recentLabel = sessionAttempts.length > 1
    ? "Based on your current conversation session."
    : "Based on your latest conversation turn.";
  const recentSource = sessionAttempts.length > 1
    ? "convo_current_session"
    : "convo_latest_attempt";

  return [
    {
      key: "convo-recent",
      title: "✨ Next practice • What you just did",
      description: recentLabel,
      model: computeImmediateScopeRollups(recentAttempts),
      behavior: "navigate",
      source: recentSource,
    },
    {
      key: "convo-total",
      title: "✨ Next practice • Your combined total",
      description: "Based on your AI Conversations history.",
      model: aggregateModel,
      behavior: "navigate",
      source: "convo_aggregate",
    },
  ];
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
        nextPracticeBlocks: buildConvoNextPracticeBlocks(filtered, model),
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

  // Canonical in-memory API via bus
  luxBus.set("convoProgressApi", { refresh: refreshConvoProgress });

  // Window compat shim (keep for now)

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
          nextPracticeBlocks: buildConvoNextPracticeBlocks(filtered, model),
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