// features/progress/attempt-detail-modal.js
// Orchestrator: builds session model + composes modal sections.
// Session "Attempt Details" modal (micro-report) used by Progress History drill-in.

import { computeRollups } from "./rollups.js";
import { fmtDateTime, titleFromPassageKey } from "./attempt-detail/format.js";
import { attemptMetric } from "./attempt-detail/metrics.js";
import { pillKV, chipRowWords, chipRowPhonemes } from "./attempt-detail/chips.js";
import { computeConfidence, buildNextActions, buildFocusWordsFallbackHtml } from "./attempt-detail/derive.js";
import { buildAttemptsListSection } from "./attempt-detail/attempts-section.js";
import { buildAiCoachMemorySection } from "./attempt-detail/ai-coach-section.js";
import { createAttemptDetailModalShell } from "./attempt-detail/modal-shell.js";
import { wireAttemptDetailChipExplainers } from "./attempt-detail/chip-explainers.js";
import { buildAttemptDetailHeader } from "./attempt-detail/header.js";
import { buildTroubleSoundsSection, buildTroubleWordsSection } from "./attempt-detail/trouble-sections.js";
import { esc, getColorConfig, mdToHtml, mean } from "./progress-utils.js";
import { pickTS, pickPassageKey, pickSessionId, pickSummary } from "./attempt-pickers.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../next-activity/next-activity.js";

/**
 * openDetailsModal(attempt, overallScore, dateStr, ctx?)
 * ctx can include:
 *   { sid, list: Attempt[], session: {sessionId, passageKey, count, tsMin, tsMax, avgScore, hasAI} }
 */
export function openDetailsModal(attempt, overallScore, dateStr, ctx = {}) {
  const existing = document.getElementById("lux-detail-modal");
  if (existing) existing.remove();

  const list = Array.isArray(ctx?.list) && ctx.list.length ? ctx.list.slice() : [attempt].filter(Boolean);

  // Sort desc by time (latest first)
  list.sort((a, b) => +new Date(pickTS(b) || 0) - +new Date(pickTS(a) || 0));

  const sid =
    ctx?.sid ||
    ctx?.session?.sessionId ||
    pickSessionId(list[0]) ||
    "";

  const pk =
    ctx?.session?.passageKey ||
    pickPassageKey(list[0]) ||
    "";

  const tsMax =
    ctx?.session?.tsMax ??
    Math.max(...list.map((a) => +new Date(pickTS(a) || 0)));

  const tsMin =
    ctx?.session?.tsMin ??
    Math.min(...list.map((a) => +new Date(pickTS(a) || 0)));

  // Session rollups (consistent trouble logic + summary-only support)
  const sessionModel = computeRollups(list, {
    windowDays: 30,
    minWordCount: 1,
    minPhonCount: 1,
  });
  const trouble = sessionModel?.trouble || {};
  const totals = sessionModel?.totals || {};

  // Keep the exact arrays used to render chips (so data-idx lines up)
  const phItems = (trouble.phonemesAll || []).slice(0, 12);
  const wdItems = (trouble.wordsAll || []).slice(0, 12);

  // Scores (session average)
  const pronAvg =
    Number.isFinite(totals.avgScore) ? totals.avgScore : Number(overallScore) || 0;

  const accAvg = mean(list.map((a) => attemptMetric(a, "acc")));
  const fluAvg = mean(list.map((a) => attemptMetric(a, "flu")));
  const compAvg = mean(list.map((a) => attemptMetric(a, "comp")));
  const prosAvg = mean(list.map((a) => attemptMetric(a, "pros")));

  const isNoSess = String(sid).startsWith("nosess:");
  const dayGroup = isNoSess ? String(sid).slice("nosess:".length) : "";

  const title = titleFromPassageKey(pk);
  const mode = String(pk).startsWith("convo:") ? "AI Conversations" : "Pronunciation Practice";

  const isConvo = String(pk).startsWith("convo:");
  const practiceHref = isConvo ? "./convo.html#chat" : "./index.html";
  const chooseHref = isConvo ? "./convo.html#picker" : "./index.html";

  const attemptsCount = list.length;

  // Confidence badge (tiny clarity layer)
  const confidence = computeConfidence(list, sid);
  const confidenceLabel = confidence.label;
  const confidenceHint = confidence.hint;

  // Derive next-action bullets from top priorities
  const nextActions = buildNextActions(trouble, title);

  // Latest attempt quick fallback (for small sessions with no trouble lists yet)
  const latest = list[0];
  const latestSum = pickSummary(latest) || {};

  // Fallback focus words list (latest attempt summary.words)
  const focusWordsFallbackHtml = buildFocusWordsFallbackHtml(latestSum);

  // Modal shell
  const { modal, card, close, mount } = createAttemptDetailModalShell();

  const { header, againBtn, chooseBtn } = buildAttemptDetailHeader({
    title,
    mode,
    attemptsCount,
    tsMin,
    tsMax,
    fmtDateTime,
    sid,
    isNoSess,
    dayGroup,
    pronAvg,
    list,
    attemptMetric,
    confidenceLabel,
    confidenceHint,
    nextActions,
    isConvo,
  });

  card.appendChild(header);

  // Trouble Sounds
  card.appendChild(buildTroubleSoundsSection(phItems));

  // Trouble Words
  card.appendChild(buildTroubleWordsSection(wdItems, focusWordsFallbackHtml));

  // Attempts list (collapsed)
  card.appendChild(buildAttemptsListSection(list));

  // AI Coach Memory (across session)
  const aiCoachEl = buildAiCoachMemorySection(list);
  if (aiCoachEl) card.appendChild(aiCoachEl);

  mount();

  if (againBtn) {
    againBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const plan = buildNextActivityPlanFromModel(sessionModel, {
        source: "session",
        confidence: { level: confidenceLabel, hint: confidenceHint },
      });

      if (plan) {
        saveNextActivityPlan(plan);
        close();
        window.location.assign("./convo.html#chat");
        return;
      }

      close();
      window.location.assign(practiceHref);
    });
  }

  if (chooseBtn) {
    chooseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      close();
      window.location.assign(chooseHref);
    });
  }

  // --- Inline micro-explainer wiring (click chip => explain below section) ---
  wireAttemptDetailChipExplainers(card, { phItems, wdItems });
}
