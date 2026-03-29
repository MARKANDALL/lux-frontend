// features/convo/convo-report-ui.js
// End-session report overlay: user-facing session summary with scores, trouble areas, and coach turns.

import { computeRollups, getAttemptScore } from "../progress/rollups.js";
import { promptUserForAI } from "../../ui/ui-ai-ai-logic.js";
import { setLastAttemptId } from "../../app-core/runtime.js";
import {
  scoreClass as scoreClassCore,
  fmtPct,
  cefrBand,
} from "../../core/scoring/index.js";
import { escapeHtml as esc } from "../../helpers/escape-html.js";
import { pickSummary, pickAzure } from "../progress/attempt-pickers.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function mean(nums) {
  const v = (nums || []).filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function getColorConfig(s) {
  const n = Number(s) || 0;
  const cls = scoreClassCore(n);
  if (cls === "score-good") return { color: "#2563eb", bg: "#dbeafe" };
  if (cls === "score-warn") return { color: "#d97706", bg: "#fef3c7" };
  return { color: "#dc2626", bg: "#fee2e2" };
}

function attemptMetric(a, kind) {
  const sum = pickSummary(a) || {};
  const az = pickAzure(a);
  const nb = az?.NBest?.[0] || az?.nBest?.[0] || null;
  const pa =
    nb?.PronunciationAssessment ||
    nb?.pronunciationAssessment ||
    az?.PronunciationAssessment ||
    null;

  const map = {
    pron: () => (sum.pron != null ? Number(sum.pron) : Number(nb?.PronScore ?? pa?.PronScore)),
    acc: () => (sum.acc != null ? Number(sum.acc) : Number(pa?.AccuracyScore)),
    flu: () => (sum.flu != null ? Number(sum.flu) : Number(pa?.FluencyScore)),
    comp: () => (sum.comp != null ? Number(sum.comp) : Number(pa?.CompletenessScore)),
    pros: () =>
      sum.pros != null
        ? Number(sum.pros)
        : sum.pro != null
        ? Number(sum.pro)
        : Number(pa?.ProsodyScore),
  };

  const fn = map[kind];
  if (!fn) return null;
  const n = fn();
  return Number.isFinite(n) ? n : null;
}

function fmtRoundPct(v) {
  return v == null || !Number.isFinite(+v) ? "—" : `${Math.round(+v)}%`;
}

function scoreColorClass(avg) {
  const cls = scoreClassCore(avg);
  if (cls === "score-good") return "lux-pill--blue";
  if (cls === "score-warn") return "lux-pill--yellow";
  return "lux-pill--red";
}

// ── Score ring (matches header.js style) ─────────────────────────────────────

function renderOverallRing(v, ringColor) {
  const pct = v == null || !Number.isFinite(+v) ? "—" : fmtPct(Math.round(+v));
  const band =
    v == null || !Number.isFinite(+v) ? "" : cefrBand(Math.round(+v)) || "";

  return `
    <div
      class="lux-scoreRing lux-scoreRing--overall lux-scoreRing--coin"
      style="--lux-score-ring:${ringColor};"
      ${band ? `data-cefr="${band}"` : ""}
    >
      <span class="lux-scoreRingFlip">
        <span class="lux-scoreRingFace lux-scoreRingFace--front">${pct}</span>
        <span class="lux-scoreRingFace lux-scoreRingFace--back">${band || pct}</span>
      </span>
    </div>
  `;
}

function tileKV(label, val) {
  return `
    <div class="lux-scoreTile">
      <div class="lux-scoreTile-label">${esc(label)}</div>
      <div class="lux-scoreTile-value">${fmtRoundPct(val)}</div>
    </div>
  `;
}

// ── Trouble chips (lightweight inline version) ──────────────────────────────

function renderTroubleChips(items, kind) {
  if (!items || !items.length) {
    return `<div style="color:#94a3b8; font-size:0.88rem;">Not enough data yet.</div>`;
  }
  return `
    <div class="lux-chiprow lux-chiprow--center">
      ${items
        .slice(0, 10)
        .map((x) => {
          const label = kind === "sounds" ? (x.ipa || "") : (x.word || "");
          const avg = Math.round(Number(x.avg) || 0);
          return `
            <span class="lux-chip" title="Seen ${x.count || 0}× · Avg ${avg}%">
              <span>${esc(label)}</span>
              <span class="lux-pill ${scoreColorClass(avg)}">${avg}%</span>
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

// ── Coach turn list ──────────────────────────────────────────────────────────

function buildCoachTurnListHtml(turns) {
  const all = Array.isArray(turns) ? turns : [];
  const shown = all.slice(-10);

  if (!shown.length) {
    return `<div style="color:#64748b; font-size:0.88rem;">No scored turns in this session.</div>`;
  }

  return shown
    .map((t, idx) => {
      const has = !!t?.azureResult?.NBest?.[0];
      const text = String(t?.userText || "").trim();
      const label = text
        ? text.length > 90
          ? text.slice(0, 90) + "…"
          : text
        : "(no text)";
      const turnNum = Number.isFinite(t?.turn)
        ? t.turn + 1
        : all.length - shown.length + idx + 1;

      return `
        <button data-coach-i="${idx}" ${has ? "" : "disabled"}
          class="lux-coach-turn ${has ? "" : "lux-coach-turn--disabled"}">
          <div class="lux-coach-turn__num">Turn ${turnNum}</div>
          <div class="lux-coach-turn__text">${esc(label)}</div>
        </button>
      `;
    })
    .join("");
}

function wireCoachTurnList(host, turns) {
  const all = Array.isArray(turns) ? turns : [];
  const shown = all.slice(-10);

  host.querySelectorAll("button[data-coach-i]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-coach-i") || -1);
      const t = shown[idx];
      if (!t?.azureResult?.NBest?.[0]) return;

      // Close overlay first so coach panel is visible
      host.remove();

      setLastAttemptId(t.attemptId || null);
      promptUserForAI(t.azureResult, t.userText || "", "universal");

      document.getElementById("aiFeedbackSection")?.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
    });
  });
}

// ── Next actions (derived from trouble data) ─────────────────────────────────

function buildNextActions(trouble, scenarioTitle) {
  const actions = [];
  const topPh = (trouble?.phonemesAll || [])[0];
  const topWd = (trouble?.wordsAll || [])[0];

  if (topPh) {
    const avg = Math.round(Number(topPh.avg) || 0);
    actions.push(
      `Focus on the <b>${esc(topPh.ipa)}</b> sound (avg ${avg}%) — try it in a new conversation or passage.`
    );
  }

  if (topWd) {
    const avg = Math.round(Number(topWd.avg) || 0);
    actions.push(
      `Practice the word <b>"${esc(topWd.word)}"</b> (avg ${avg}%) — say it slowly, then at normal speed.`
    );
  }

  if (!actions.length) {
    actions.push("Great session! Keep practicing to build consistency.");
  }

  actions.push(
    `Try <b>"${esc(scenarioTitle || "another scenario")}"</b> again, or pick a new one to challenge yourself.`
  );

  return actions;
}

// ── Main overlay ─────────────────────────────────────────────────────────────

/**
 * @param {object}  report  - API response from /api/convo-report
 * @param {Array}   turns   - state.turns from the conversation
 * @param {object}  [ctx]   - extra context
 * @param {object}  [ctx.nextActivity]
 * @param {string}  [ctx.sessionId]
 * @param {string}  [ctx.passageKey]
 * @param {object}  [ctx.scenario] - { id, title }
 */
export function showConvoReportOverlay(report, turns = [], ctx = {}) {
  // Remove any existing overlay
  const existing = document.getElementById("luxConvoReportOverlay");
  if (existing) existing.remove();

  const scenarioTitle = ctx?.scenario?.title || "";

  // Build attempt-like objects for session-local rollups
  const baseTS = Date.now();
  const attempts = (turns || []).map((t, i) => ({
    ts: new Date(baseTS - (turns.length - i) * 1000).toISOString(),
    passage_key: ctx?.passageKey || "",
    session_id: ctx?.sessionId || "",
    text: t?.userText || "",
    azureResult: t?.azureResult || null,
  }));

  let sessionModel = null;
  try {
    sessionModel = computeRollups(attempts, { minWordCount: 1, minPhonCount: 1 });
  } catch (e) {
    console.error("[ConvoReportOverlay] computeRollups failed", e);
  }

  const trouble = sessionModel?.trouble || {};
  const troubleWords = trouble.wordsAll || [];
  const troublePhonemes = trouble.phonemesAll || [];

  // Scores
  const accAvg = mean(attempts.map((a) => attemptMetric(a, "acc")));
  const fluAvg = mean(attempts.map((a) => attemptMetric(a, "flu")));
  const compAvg = mean(attempts.map((a) => attemptMetric(a, "comp")));
  const pronAvg = mean(attempts.map((a) => attemptMetric(a, "pron")));
  const prosAvg = mean(attempts.map((a) => attemptMetric(a, "pros")));
  const overallAvg = mean([accAvg, fluAvg, compAvg, pronAvg, prosAvg].filter(Number.isFinite));
  const overallColor = getColorConfig(overallAvg).color;

  const turnsWithScores = (turns || []).filter((t) => !!t?.azureResult?.NBest?.[0]);

  const nextActions = buildNextActions(trouble, scenarioTitle);

  // Debug JSON (only shown when LUX_DEBUG is on)
  const debugHtml = globalThis.LUX_DEBUG
    ? `
    <details style="margin-top: 16px;">
      <summary style="cursor:pointer; font-size:0.85rem; color:#94a3b8; font-weight:700;">Debug JSON</summary>
      <pre style="
        white-space: pre-wrap; word-break: break-word;
        font-size: 11px; line-height: 1.35; margin: 10px 0 0;
        background: #f1f5f9; border: 1px solid #e2e8f0;
        padding: 12px; border-radius: 10px; max-height: 300px; overflow: auto;
      ">${esc(JSON.stringify(report, null, 2))}</pre>
    </details>
    `
    : "";

  // ── Build overlay ──
  const host = document.createElement("div");
  host.id = "luxConvoReportOverlay";
  host.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0,0,0,0.35);
    display:flex; align-items:center; justify-content:center;
    padding: 18px;
  `;

  host.innerHTML = `
    <dialog open class="lux-end-report">
      <div class="lux-end-report__header">
        <div>
          <div class="lux-end-report__title">Session Complete</div>
          <div class="lux-end-report__subtitle">${esc(scenarioTitle || "AI Conversation")} · ${turnsWithScores.length} scored turn${turnsWithScores.length === 1 ? "" : "s"}</div>
        </div>
        <button id="luxConvoReportClose" class="lux-end-report__close">✕</button>
      </div>

      <div class="lux-end-report__body">
        <!-- Score ring + pyramid -->
        <div class="lux-scoreSummary lux-scoreSummary--pyramid" style="margin-bottom:16px;">
          <div class="lux-scoreMain">
            <div class="lux-scoreMainLabel">Overall</div>
            ${renderOverallRing(overallAvg, overallColor)}
          </div>
          <div class="lux-scorePyramid">
            <div class="lux-scoreRow lux-scoreRow-mid">
              ${tileKV("Prosody", prosAvg)}
              ${tileKV("Pronunciation", pronAvg)}
            </div>
            <div class="lux-scoreRow lux-scoreRow-bottom">
              ${tileKV("Accuracy", accAvg)}
              ${tileKV("Fluency", fluAvg)}
              ${tileKV("Completeness", compAvg)}
            </div>
          </div>
        </div>

        <!-- Trouble sounds -->
        <div class="lux-end-report__section">
          <div class="lux-end-report__section-title">⚠️ Trouble Sounds <span style="color:#94a3b8; font-weight:800;">${troublePhonemes.length}</span></div>
          ${renderTroubleChips(troublePhonemes, "sounds")}
        </div>

        <!-- Trouble words -->
        <div class="lux-end-report__section">
          <div class="lux-end-report__section-title">⚠️ Trouble Words <span style="color:#94a3b8; font-weight:800;">${troubleWords.length}</span></div>
          ${renderTroubleChips(troubleWords, "words")}
        </div>

        <!-- What to do next -->
        <div class="lux-end-report__section">
          <div class="lux-end-report__section-title">✅ What to do next</div>
          <ul style="margin:0; padding-left:18px; color:#475569; line-height:1.55;">
            ${nextActions.map((x) => `<li style="margin-bottom:6px;">${x}</li>`).join("")}
          </ul>
        </div>

        <!-- Coach: review your turns -->
        <details class="lux-end-report__section" ${turnsWithScores.length ? "open" : ""}>
          <summary class="lux-end-report__section-title" style="cursor:pointer;">🤖 Review your turns <span style="color:#94a3b8; font-weight:800;">${turnsWithScores.length}</span></summary>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
            ${buildCoachTurnListHtml(turns)}
          </div>
          <div style="font-size:0.82rem; color:#94a3b8; margin-top:8px;">
            Tap a turn to get AI Coach feedback on that recording.
          </div>
        </details>

        <!-- Actions -->
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:18px; padding-top:14px; border-top:1px solid #e2e8f0;">
          <button id="luxEndReportNextConvo" class="lux-pbtn">✨ Next conversation</button>
          <button id="luxEndReportChoose" class="lux-pbtn lux-pbtn--ghost">🗂️ Choose scenario</button>
        </div>

        ${debugHtml}
      </div>
    </dialog>
  `;

  // ── Wire interactions ──
  host.querySelector("#luxConvoReportClose")?.addEventListener("click", () => host.remove());

  // Click backdrop to close
  host.addEventListener("click", (e) => {
    if (e.target === host) host.remove();
  });

  // Escape to close
  const onKey = (e) => {
    if (e.key === "Escape") {
      host.remove();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);

  // Coach turn buttons
  wireCoachTurnList(host, turns);

  // Action buttons
  host.querySelector("#luxEndReportNextConvo")?.addEventListener("click", () => {
    host.remove();
    // Trigger the same "next conversation" flow as the drawer
    const genBtn = document.querySelector("[data-lux-generate-next]");
    if (genBtn) {
      genBtn.click();
      return;
    }
    // Fallback: reload convo page
    window.location.assign("./convo.html#chat");
  });

  host.querySelector("#luxEndReportChoose")?.addEventListener("click", () => {
    host.remove();
    window.location.assign("./convo.html#picker");
  });

  document.body.appendChild(host);
}