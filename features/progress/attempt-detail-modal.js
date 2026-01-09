// features/progress/attempt-detail-modal.js
// Session "Attempt Details" modal (micro-report) used by Progress History drill-in.

import { computeRollups } from "./rollups.js";
import { fmtDateTime, titleFromPassageKey } from "./attempt-detail/format.js";
import { attemptMetric } from "./attempt-detail/metrics.js";
import { pillKV, chipRowWords, chipRowPhonemes } from "./attempt-detail/chips.js";
import { computeConfidence, buildNextActions, buildFocusWordsFallbackHtml } from "./attempt-detail/derive.js";
import { buildAttemptsListSection } from "./attempt-detail/attempts-section.js";
import { buildAiCoachMemorySection } from "./attempt-detail/ai-coach-section.js";
import { createAttemptDetailModalShell } from "./attempt-detail/modal-shell.js";
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

  const bigScoreColor = getColorConfig(pronAvg).color;

  // Derive next-action bullets from top priorities
  const nextActions = buildNextActions(trouble, title);

  // Latest attempt quick fallback (for small sessions with no trouble lists yet)
  const latest = list[0];
  const latestSum = pickSummary(latest) || {};

  // Fallback focus words list (latest attempt summary.words)
  const focusWordsFallbackHtml = buildFocusWordsFallbackHtml(latestSum);

  // Modal shell
  const { modal, card, close, mount } = createAttemptDetailModalShell();

  // Header block
  const header = document.createElement("div");
  header.innerHTML = `
    <div style="text-align:center; margin-bottom: 14px;">
      <h3 style="margin:0; color:#1e293b; font-size:1.25rem;">Session Report</h3>
      <div style="margin-top:6px; font-weight:900; color:#334155;">${esc(title)}</div>
      <p style="margin:6px 0 0; color:#64748b; font-size:0.92rem;">
        ${esc(mode)} · ${attemptsCount} attempt${attemptsCount === 1 ? "" : "s"}
      </p>

      <div style="margin-top:10px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        <button id="luxPracticeAgainBtn"
          style="border:1px solid #cbd5e1; background:#fff; padding:8px 12px; border-radius:10px; font-weight:900; cursor:pointer; color:#0f172a;">
          ✨ Generate my next practice
        </button>
        ${
          isConvo
            ? `<button id="luxChooseScenarioBtn"
                style="border:1px solid #e2e8f0; background:#f8fafc; padding:8px 12px; border-radius:10px; font-weight:900; cursor:pointer; color:#334155;">
                🗂️ Choose scenario
              </button>`
            : ``
        }
      </div>

      <p style="margin:6px 0 0; color:#64748b; font-size:0.9rem;">
        ${esc(fmtDateTime(tsMin))} → ${esc(fmtDateTime(tsMax))}
      </p>

      <p style="margin:6px 0 0; color:#64748b; font-size:0.9rem; font-weight:900;">
        Confidence: ${esc(confidenceLabel)}
        <span style="color:#94a3b8; font-weight:800;">· ${esc(confidenceHint)}</span>
      </p>

      <p style="margin:6px 0 0; color:#94a3b8; font-size:0.85rem; font-weight:800;">
        ${
          sid
            ? isNoSess
              ? `Grouped by day (no session id): ${esc(dayGroup)}`
              : `Session: ${esc(sid)}`
            : ""
        }
      </p>
    </div>

    <div style="display:flex; justify-content:center; margin-bottom: 14px;">
      <div style="
        width: 80px; height: 80px; border-radius: 50%;
        border: 4px solid ${bigScoreColor};
        display:flex; align-items:center; justify-content:center;
        font-size: 1.5rem; font-weight: 900; color:#334155;
      ">${Math.round(Number(pronAvg) || 0)}%</div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px;">
      ${pillKV("Acc", accAvg == null ? "—" : `${Math.round(accAvg)}%`)}
      ${pillKV("Flu", fluAvg == null ? "—" : `${Math.round(fluAvg)}%`)}
      ${pillKV("Comp", compAvg == null ? "—" : `${Math.round(compAvg)}%`)}
      ${pillKV("Pro", prosAvg == null ? "—" : `${Math.round(prosAvg)}%`)}
    </div>

    <div style="border-top:1px solid #e2e8f0; padding-top: 12px;">
      <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">✅ What to do next</h4>
      <ul style="margin:0; padding-left:18px; color:#475569; line-height:1.55;">
        ${nextActions.map((x) => `<li style="margin-bottom:6px;">${x}</li>`).join("")}
      </ul>
    </div>
  `;
  card.appendChild(header);

  // Trouble Sounds
  const sounds = document.createElement("div");
  sounds.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";
  sounds.innerHTML = `
    <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">⚠️ Trouble Sounds</h4>
    ${chipRowPhonemes(phItems)}
    <div id="luxExplainSounds" style="margin-top:10px;" hidden></div>
  `;
  card.appendChild(sounds);

  // Trouble Words
  const words = document.createElement("div");
  words.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";
  words.innerHTML = `
    <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">⚠️ Trouble Words</h4>
    ${chipRowWords(wdItems)}
    <div id="luxExplainWords" style="margin-top:10px;" hidden></div>
    ${
      (wdItems || []).length
        ? ""
        : `<details style="margin-top:10px;">
            <summary style="cursor:pointer; font-weight:900; color:#334155;">(Fallback) Focus words from latest attempt</summary>
            <div style="margin-top:10px;">${focusWordsFallbackHtml}</div>
          </details>`
    }
  `;
  card.appendChild(words);

  // Attempts list (collapsed)
  card.appendChild(buildAttemptsListSection(list));

  // AI Coach Memory (across session)
  const aiCoachEl = buildAiCoachMemorySection(list);
  if (aiCoachEl) card.appendChild(aiCoachEl);

  mount();

  const againBtn = document.getElementById("luxPracticeAgainBtn");
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

      // Fallback: old behavior if we don't have enough data
      close();
      window.location.assign(practiceHref);
    });
  }

  const chooseBtn = document.getElementById("luxChooseScenarioBtn");
  if (chooseBtn) {
    chooseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      close();
      window.location.assign(chooseHref);
    });
  }

  // --- Inline micro-explainer wiring (click chip => explain below section) ---
  const explainSounds = card.querySelector("#luxExplainSounds");
  const explainWords = card.querySelector("#luxExplainWords");

  let lastPick = ""; // `${kind}:${idx}`

  function showExplain(kind, idx) {
    const key = `${kind}:${idx}`;
    const same = key === lastPick;
    lastPick = same ? "" : key;

    const panel = kind === "phoneme" ? explainSounds : explainWords;
    const items = kind === "phoneme" ? phItems : wdItems;

    if (!panel) return;

    if (same) {
      panel.innerHTML = "";
      panel.setAttribute("hidden", "");
      return;
    }

    const item = items[idx];
    if (!item) return;

    const avg = Math.round(Number(item.avg) || 0);
    const count = Number(item.count) || 0;
    const days = Number(item.days) || 1;
    const pr = Number.isFinite(item.priority) ? item.priority.toFixed(2) : "—";

    const label =
      kind === "phoneme"
        ? `Sound ${esc(item.ipa)}`
        : `Word ${esc(item.word)}`;

    const examples =
      kind === "phoneme" && Array.isArray(item.examples) && item.examples.length
        ? `<div style="margin-top:8px; color:#475569;"><span style="font-weight:900;">Examples:</span> ${esc(
            item.examples.join(", ")
          )}</div>`
        : "";

    panel.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-weight:900; color:#334155;">${label}</div>
            <div style="margin-top:4px; color:#64748b; font-weight:800; font-size:0.92rem;">
              Seen ${count}× · ${days} day(s) · Priority ${esc(pr)}
            </div>
          </div>
          <div style="font-weight:900; color:#334155; border:1px solid #e2e8f0; background:#fff; border-radius:999px; padding:6px 10px;">
            Avg ${avg}%
          </div>
        </div>
        ${examples}
        <div style="margin-top:10px; color:#64748b; font-size:0.92rem;">
          <span style="font-weight:900;">Why it’s here:</span> low accuracy + repeated exposure (count/days) increases priority.
        </div>
      </div>
    `;

    panel.removeAttribute("hidden");
    // keep it visible even if the user clicked near the bottom
    try { panel.scrollIntoView({ block: "nearest" }); } catch (_) {}
  }

  function bindChip(chip) {
    const kind = chip.getAttribute("data-kind");
    const idx = Number(chip.getAttribute("data-idx"));
    if (!kind || !Number.isFinite(idx)) return;

    chip.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showExplain(kind, idx);
    });

    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showExplain(kind, idx);
      }
    });
  }

  card.querySelectorAll(".lux-chip[data-kind][data-idx]").forEach(bindChip);
}
