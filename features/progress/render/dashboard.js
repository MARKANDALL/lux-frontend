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
  const fallbackBehavior = opts.nextPracticeBehavior || "apply";

  const nextPracticeBlocks =
    Array.isArray(opts.nextPracticeBlocks) && opts.nextPracticeBlocks.length
      ? opts.nextPracticeBlocks
      : opts.showNextPractice
      ? [
          {
            key: "default",
            title: "✨ Next practice",
            description: "Based on your current trouble sounds.",
            model,
            behavior: fallbackBehavior,
            source: "next-practice",
          },
        ]
      : [];

  const showNextPractice = nextPracticeBlocks.length > 0;

  // ✅ NEW (All Data-only): metric trends section (acc/flu/comp/pron)
  const showMetricTrends = !!opts.showMetricTrends && !!model?.metrics;

  const topPh = (trouble.phonemesAll || []).slice(0, 10);
  const topWd = (trouble.wordsAll || []).slice(0, 10);

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
    nextPracticeBlocks: nextPracticeBlocks.map((block) => ({
      ...block,
      nextPracticePlan: null,
    })),
  });

  wireAttemptDetailChipExplainers(host, { phItems: topPh, wdItems: topWd });
  wireHistoryButtons(host, bySession, sessions);

  if (showActions) {
    wireDashboardActions(host, model, attempts);
  }

  for (const block of nextPracticeBlocks) {
    buildNextPracticePlanFromModel(block.model)
      .then((plan) => {
        const sec = host.querySelector(
          `[data-lux-next-practice="${block.key}"] .lux-sec-body`
        );
        if (sec) {
          sec.innerHTML = buildNextPracticeSectionBody(plan, block);
        }

        wireNextPracticeButtons({
          plan,
          behavior: block.behavior || fallbackBehavior,
          model: block.model,
          scopeKey: block.key,
          source: block.source || "next-practice",
        });
      })
      .catch((err) => {
        globalThis.warnSwallow?.(
          "features/progress/render/dashboard.js",
          err,
          "important"
        );
      });
  }
}

function wireNextPracticeButtons({ plan, behavior, model, scopeKey, source }) {
  if (!plan) return;

  const bH = document.getElementById(`luxNextPracticeStartHarvard-${scopeKey}`);
  const bP = document.getElementById(`luxNextPracticeStartPassage-${scopeKey}`);

  // Extract trouble words from the model for highlighting
  const troubleWords = (model?.trouble?.wordsAll || [])
    .map((w) => w?.word || "")
    .filter(Boolean)
    .slice(0, 8);

  if (bH) {
    bH.addEventListener("click", () => {
      if (!plan.harvardN) return;

      if (behavior === "navigate") {
        saveNextPracticePlan({ ...plan, start: "harvard" });
        window.location.assign("./index.html#next-practice");
        return;
      }

      applyNextPracticePlan({ ...plan, start: "harvard" }, { wordBank: troubleWords });
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

      applyNextPracticePlan({ ...plan, start: "passage" }, { wordBank: troubleWords });
    });
  }

  const bQ = document.getElementById(`luxNextPracticeQuickConvo-${scopeKey}`);
  if (bQ) {
    bQ.addEventListener("click", () => {
      const nextPlan = buildNextActivityPlanFromModel(model, {
        source,
        launch_mode: "quick",
      });
      if (!nextPlan) return;
      saveNextActivityPlan(nextPlan);
      window.location.assign("./convo.html#chat");
    });
  }

  const bS = document.getElementById(`luxNextPracticeChooseConvo-${scopeKey}`);
  if (bS) {
    bS.addEventListener("click", () => {
      const nextPlan = buildNextActivityPlanFromModel(model, {
        source,
        launch_mode: "choose",
      });
      if (!nextPlan) return;
      saveNextActivityPlan(nextPlan);
      window.location.assign("./convo.html#picker");
    });
  }
}