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

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../../next-activity/next-activity.js";

import { buildProgressDashboardHtml, buildNextPracticeSectionBody } from "./dashboard/dashboard-template.js";

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

  // ✅ NEW (All Data-only): metric trends section (acc/flu/comp/pron)
  const showMetricTrends = !!opts.showMetricTrends && !!model?.metrics;

  const topPh = (trouble.phonemesAll || []).slice(0, 10);
  const topWd = (trouble.wordsAll || []).slice(0, 10);

  const bySession = buildAttemptsBySession(attempts);

  // ── Pass 1: render immediately with nextPracticePlan: null ──
  // (buildNextPracticePlanFromModel is async — awaits passage phoneme meta)
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
    nextPracticePlan: null,
  });

  // ✅ Enable "click trouble chip -> show details" on the main dashboard too
  wireAttemptDetailChipExplainers(host, { phItems: topPh, wdItems: topWd });

  wireHistoryButtons(host, bySession, sessions);

  // Downloads (optional)
  if (showActions) {
    wireDashboardActions(host, model, attempts);
  }

  // ── Pass 2: async — fill in Next Practice when data arrives ──
  if (showNextPractice) {
    buildNextPracticePlanFromModel(model).then((plan) => {
      if (!plan) return;

      // Hot-swap the Next Practice section body
      const sec = host.querySelector('[data-lux-next-practice] .lux-sec-body');
      if (sec) {
        sec.innerHTML = buildNextPracticeSectionBody(plan);
      }

      // Wire the action buttons now that the plan is resolved
      wireNextPracticeButtons(plan, nextPracticeBehavior, model);
    }).catch((err) => {
      globalThis.warnSwallow?.("features/progress/render/dashboard.js", err, "important");
    });
  }
}

// ── Next Practice button wiring (extracted for clarity) ──
function wireNextPracticeButtons(plan, behavior, model) {
  if (!plan) return;

  const bH = document.getElementById("luxNextPracticeStartHarvard");
  const bP = document.getElementById("luxNextPracticeStartPassage");

  if (bH) {
    bH.addEventListener("click", () => {
      if (!plan.harvardN) return;

      if (behavior === "navigate") {
        saveNextPracticePlan({ ...plan, start: "harvard" });
        window.location.assign("./index.html#next-practice");
        return;
      }

      applyNextPracticePlan({ ...plan, start: "harvard" });
    });
  }

  if (bP) {
    bP.addEventListener("click", () => {
      if (!plan.passageKey) return;

      if (behavior === "navigate") {
        saveNextPracticePlan({ ...plan, start: "passage" });
        window.location.assign("./index.html#next-practice");
        return;
      }

      applyNextPracticePlan({ ...plan, start: "passage" });
    });
  }

  // ✨ Targeted AI Conversation — builds an activity plan from the full
  // model's trouble data (phoneme focus + word bank) and navigates to convo.
  // ✨ Quick Practice — instant launch, pins to neutral quick-practice scenario
  const bQ = document.getElementById("luxNextPracticeQuickConvo");
  if (bQ) {
    bQ.addEventListener("click", () => {
      const plan = buildNextActivityPlanFromModel(model, { source: "next-practice", launch_mode: "quick" });
      if (!plan) return;
      saveNextActivityPlan(plan);
      window.location.assign("./convo.html#chat");
    });
  }

  // 🎭 Choose Scenario — user picks the scenario, targets preserved as overlay
  const bS = document.getElementById("luxNextPracticeChooseConvo");
  if (bS) {
    bS.addEventListener("click", () => {
      const plan = buildNextActivityPlanFromModel(model, { source: "next-practice", launch_mode: "choose" });
      if (!plan) return;
      saveNextActivityPlan(plan);
      window.location.assign("./convo.html#picker");
    });
  }
}