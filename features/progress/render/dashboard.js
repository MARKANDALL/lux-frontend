// features/progress/render/dashboard.js
// Main full-size Progress dashboard render + wiring.

import { openDetailsModal } from "../attempt-detail-modal.js";
import { wireTroubleChips } from "../../../ui/components/trouble-chips.js";

import { buildProgressDashboardHtml } from "./dashboard/dashboard-template.js";

import {
  pickTS,
  buildAttemptsBySession,
} from "./dashboard/attempt-utils.js";

import {
  attemptOverallScore,
  attemptDateStr,
} from "./dashboard/attempt-display.js";

import { wireDashboardActions } from "./dashboard/actions-and-trends.js";

export function renderProgressDashboard(host, attempts, model, opts = {}) {
  const totals = model?.totals || {};
  const trouble = model?.trouble || {};
  const trend = model?.trend || [];
  const sessions = model?.sessions || [];

  const title = opts.title || "My Progress";
  const subtitle = opts.subtitle || "All practice (Pronunciation + AI Conversations)";
  const showActions = opts.showActions !== false;
  const showCoach = !!opts.showCoach;
  const showNextPractice = false;
  const nextPracticePlan = null;
  const showMetricTrends = !!opts.showMetricTrends && !!model?.metrics;

  const topPh = (trouble.phonemesAll || []).slice(0, 12);
  const topWd = (trouble.wordsAll || []).slice(0, 12);

  const bySession = buildAttemptsBySession(attempts);

  host.innerHTML = buildProgressDashboardHtml({
    model,
    title,
    subtitle,
    showActions,
    showCoach,
    showNextPractice,
    showMetricTrends,
    totals,
    trouble,
    trend,
    sessions,
    topPh,
    topWd,
    nextPracticePlan,
  });

  // ── Deferred wiring: chips and history rows are inside <details> ──
  // Wire them when the section opens, not on initial mount.

  let chipsWired = false;
  let historyWired = false;

  function wireChipsIfNeeded() {
    if (chipsWired) return;
    chipsWired = true;
    wireTroubleChips(host, { phItems: topPh, wdItems: topWd });
  }

  function wireHistoryIfNeeded() {
    if (historyWired) return;
    historyWired = true;

    host.querySelectorAll('.lux-card--row[data-sid]').forEach((row) => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const sid = row.getAttribute('data-sid') || '';
        if (!sid) return;

        const list = (bySession.get(sid) || [])
          .slice()
          .sort((a, b) => {
            const ta = new Date(pickTS(a) || 0).getTime();
            const tb = new Date(pickTS(b) || 0).getTime();
            return tb - ta;
          });

        const a = list[0];
        if (!a) return;

        const sess = (sessions || []).find((x) => String(x.sessionId) === String(sid)) || null;

        openDetailsModal(a, attemptOverallScore(a), attemptDateStr(a), {
          sid,
          list,
          session: sess,
        });
      };

      row.addEventListener('click', handler);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handler(e);
      });
    });
  }

  // Listen for <details> toggle events to wire at the right time
  host.querySelectorAll('details.lux-progress-sec').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;

      const summary = details.querySelector('summary');
      const text = summary?.textContent || '';

      if (text.includes('Trouble Sounds') || text.includes('Trouble Words')) {
        wireChipsIfNeeded();
      }

      if (text.includes('History')) {
        wireHistoryIfNeeded();
      }
    });
  });

  // Action buttons (downloads, next conversation, cloud visuals)
  if (showActions) {
    wireDashboardActions(host, model, attempts);
  }
}