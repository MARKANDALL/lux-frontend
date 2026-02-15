// features/progress/render/dashboard.js
// Main full-size Progress dashboard render functions live here.
// features/progress/render/dashboard.js

import { openDetailsModal } from "../attempt-detail-modal.js";
import { wireAttemptDetailChipExplainers } from "../attempt-detail/chip-explainers.js";

import {
  buildNextPracticePlanFromModel,
  saveNextPracticePlan,
  applyNextPracticePlan,
} from "../../next-activity/next-practice.js";

import { buildProgressDashboardHtml } from "./dashboard/dashboard-template.js";

import {
  pickAzure,
  pickSummary,
  pickTS,
  buildAttemptsBySession,
} from "./dashboard/attempt-utils.js";

import {
  renderAiFeedback,
  attemptPills,
  attemptOverallScore,
  attemptDateStr,
} from "./dashboard/attempt-display.js";

import { wireHistoryButtons } from "./dashboard/wire-history.js";

import { wireDashboardActions } from "./dashboard/actions-and-trends.js";

export function renderProgressDashboard(host, attempts, model, opts = {}) {
  const totals = model?.totals || {};
  const trouble = model?.trouble || {};
  const trend = model?.trend || [];
  const sessions = model?.sessions || [];

  const title = opts.title || "My Progress";
  const subtitle = opts.subtitle || "All practice (Pronunciation + AI Conversations)";
  const showActions = opts.showActions !== false; // default true
  const showCoach = !!opts.showCoach;
  const showNextPractice = !!opts.showNextPractice;
  const nextPracticeBehavior = opts.nextPracticeBehavior || "apply";
  const nextPracticePlan = showNextPractice ? buildNextPracticePlanFromModel(model) : null;

  // ✅ NEW (All Data-only): metric trends section (acc/flu/comp/pron)
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

  // ✅ Enable “click trouble chip -> show details” on the main dashboard too
  wireAttemptDetailChipExplainers(host, { phItems: topPh, wdItems: topWd });

  // ✅ Next Practice actions (apply in-place or navigate to Practice page)
  if (showNextPractice && nextPracticePlan) {
    const bH = document.getElementById("luxNextPracticeStartHarvard");
    const bP = document.getElementById("luxNextPracticeStartPassage");

    if (bH) {
      bH.addEventListener("click", () => {
        if (!nextPracticePlan.harvardN) return;

        if (nextPracticeBehavior === "navigate") {
          saveNextPracticePlan({ ...nextPracticePlan, start: "harvard" });
          window.location.assign("./index.html#next-practice");
          return;
        }

        applyNextPracticePlan({ ...nextPracticePlan, start: "harvard" });
      });
    }

    if (bP) {
      bP.addEventListener("click", () => {
        if (!nextPracticePlan.passageKey) return;

        if (nextPracticeBehavior === "navigate") {
          saveNextPracticePlan({ ...nextPracticePlan, start: "passage" });
          window.location.assign("./index.html#next-practice");
          return;
        }

        applyNextPracticePlan({ ...nextPracticePlan, start: "passage" });
      });
    }
  }

  wireHistoryButtons(host, bySession, sessions);

  // Downloads (optional)
  if (showActions) {
    wireDashboardActions(host, model, attempts);
  }
}
