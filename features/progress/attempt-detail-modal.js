// features/progress/attempt-detail-modal.js
// Session "Attempt Details" modal (micro-report) used by Progress History drill-in.

import { computeRollups } from "./rollups.js";
import { fmtDateTime, titleFromPassageKey } from "./attempt-detail/format.js";
import { esc, getColorConfig, mdToHtml, mean } from "./progress-utils.js";
import { pickTS, pickPassageKey, pickSessionId, pickSummary, pickAzure } from "./attempt-pickers.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../next-activity/next-activity.js";

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

function pillKV(label, val) {
  return `
    <div style="background:#f8fafc; padding:8px; border-radius:8px; text-align:center;">
      <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">${esc(
        label
      )}</div>
      <div style="font-weight:800; color:#334155;">${val}</div>
    </div>
  `;
}

function chipRowWords(items = []) {
  if (!items.length) {
    return `<p style="color:#94a3b8; font-style:italic;">Not enough word data in this session yet.</p>`;
  }
  return `
    <div class="lux-chiprow">
      ${items
        .slice(0, 12)
        .map(
          (w, i) => `
        <span
          class="lux-chip"
          data-kind="word"
          data-idx="${i}"
          role="button"
          tabindex="0"
          title="${esc(
            `Seen ${w.count}× · ${w.days || 1} day(s) · priority ${
              Number.isFinite(w.priority) ? w.priority.toFixed(2) : "—"
            }`
          )}"
        >
          <span>${esc(w.word)}</span>
          <span class="lux-pill ${
            w.avg >= 80 ? "lux-pill--blue" : w.avg >= 60 ? "lux-pill--yellow" : "lux-pill--red"
          }">${Math.round(Number(w.avg) || 0)}%</span>
        </span>
      `
        )
        .join("")}
    </div>
  `;
}

function chipRowPhonemes(items = []) {
  if (!items.length) {
    return `<p style="color:#94a3b8; font-style:italic;">Not enough sound data in this session yet.</p>`;
  }
  return `
    <div class="lux-chiprow">
      ${items
        .slice(0, 12)
        .map((p, i) => {
          const ex =
            Array.isArray(p.examples) && p.examples.length
              ? `<div style="margin-top:4px; color:#94a3b8; font-size:0.82rem; font-weight:800;">e.g., ${esc(
                  p.examples.join(", ")
                )}</div>`
              : ``;

          return `
          <div style="display:inline-block;">
            <span
              class="lux-chip"
              data-kind="phoneme"
              data-idx="${i}"
              role="button"
              tabindex="0"
              title="${esc(
                `Seen ${p.count}× · ${p.days || 1} day(s) · priority ${
                  Number.isFinite(p.priority) ? p.priority.toFixed(2) : "—"
                }`
              )}"
            >
              <span>${esc(p.ipa)}</span>
              <span class="lux-pill ${
                p.avg >= 80 ? "lux-pill--blue" : p.avg >= 60 ? "lux-pill--yellow" : "lux-pill--red"
              }">${Math.round(Number(p.avg) || 0)}%</span>
            </span>
            ${ex}
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

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
  const uniqueDays = new Set(
    list
      .map((a) => {
        const ts = +new Date(pickTS(a) || 0);
        if (!ts) return "";
        const d = new Date(ts);
        try { return d.toLocaleDateString("en-CA"); } catch (_) {}
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      })
      .filter(Boolean)
  ).size;

  let confidenceLabel = "Early signal";
  let confidenceHint = "Based on a small sample — keep practicing for stronger patterns.";
  if (attemptsCount >= 3 || uniqueDays >= 2) {
    confidenceLabel = "High confidence";
    confidenceHint = "Patterns are consistent across attempts/days.";
  } else if (attemptsCount === 2) {
    confidenceLabel = "Medium confidence";
    confidenceHint = "Good start — one more attempt will sharpen priorities.";
  }

  const bigScoreColor = getColorConfig(pronAvg).color;

  // Derive next-action bullets from top priorities
  const topPh = (trouble.phonemesAll || [])[0] || null;
  const topWd = (trouble.wordsAll || [])[0] || null;

  const nextActions = [];
  if (topPh) {
    const ex = Array.isArray(topPh.examples) && topPh.examples.length ? ` (e.g., ${topPh.examples.join(", ")})` : "";
    nextActions.push(
      `Top priority sound: <strong>${esc(topPh.ipa)}</strong> — seen ${topPh.count}× across ${
        topPh.days || 1
      } day(s).${ex}`
    );
  }
  if (topWd) {
    nextActions.push(
      `Top priority word: <strong>${esc(topWd.word)}</strong> — avg ${Math.round(topWd.avg)}% over ${topWd.count}×.`
    );
  }
  if (nextActions.length) {
    nextActions.push(`Repeat <strong>${esc(title)}</strong> once more focusing on the top items above.`);
  } else {
    nextActions.push(`Keep practicing — priorities become more reliable after a few repeats.`);
  }

  // Latest attempt quick fallback (for small sessions with no trouble lists yet)
  const latest = list[0];
  const latestSum = pickSummary(latest) || {};

  // Fallback focus words list (latest attempt summary.words)
  let focusWordsFallbackHtml = `<p style="color:#94a3b8; font-style:italic;">No word details available.</p>`;
  if (Array.isArray(latestSum.words) && latestSum.words.length > 0) {
    const items = latestSum.words
      .slice(0, 6)
      .map((w) => {
        const text = Array.isArray(w) ? w[0] : w?.w;
        const s = Array.isArray(w) ? w[1] : w?.s;
        const wordColor = getColorConfig(s).color;
        return `<li style="margin-bottom:4px;"><strong style="color:${wordColor};">${esc(
          text
        )}</strong> (${Math.round(Number(s) || 0)}%)</li>`;
      })
      .join("");
    focusWordsFallbackHtml = `<ul style="padding-left:20px; color:#475569;">${items}</ul>`;
  }

  // Modal shell
  const modal = document.createElement("div");
  modal.id = "lux-detail-modal";
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px);
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    background: white; width: 94%; max-width: 640px;
    border-radius: 16px; padding: 22px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.18);
    position: relative; max-height: 90vh; overflow-y: auto;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    position: absolute; top: 14px; right: 14px;
    background: none; border: none; font-size: 1.6rem;
    cursor: pointer; color: #94a3b8;
  `;

  function close() {
    modal.remove();
    document.removeEventListener("keydown", onKey);
    try {
      document.body.style.overflow = "";
    } catch (_) {}
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  closeBtn.onclick = close;
  card.appendChild(closeBtn);

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
  const attemptsWrap = document.createElement("div");
  attemptsWrap.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";
  attemptsWrap.innerHTML = `
    <details>
      <summary style="cursor:pointer; font-weight:900; color:#334155;">🕘 Attempts in this session (${attemptsCount})</summary>
      <div style="margin-top:10px;"></div>
    </details>
  `;
  const attemptsBody = attemptsWrap.querySelector("details > div");
  list.slice(0, 20).forEach((a) => {
    const ts = pickTS(a);
    const sum = pickSummary(a) || {};
    const pron = attemptMetric(a, "pron");
    const acc = attemptMetric(a, "acc");
    const flu = attemptMetric(a, "flu");
    const pros = attemptMetric(a, "pros");
    const text = String(a?.text || "").trim();

    const pills = [];
    if (pron != null) pills.push(`Pron ${Math.round(pron)}`);
    if (acc != null) pills.push(`Acc ${Math.round(acc)}`);
    if (flu != null) pills.push(`Flu ${Math.round(flu)}`);
    if (pros != null) pills.push(`Pro ${Math.round(pros)}`);

    const item = document.createElement("div");
    item.style.cssText = "background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px; margin-bottom:10px;";
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
        <div style="font-weight:900; color:#334155;">${esc(fmtDateTime(ts))}</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${pills
            .map(
              (t) =>
                `<span style="background:#fff; border:1px solid #e2e8f0; border-radius:999px; padding:3px 8px; font-weight:900; color:#475569; font-size:0.82rem;">${esc(
                  t
                )}</span>`
            )
            .join("")}
        </div>
      </div>
      ${
        text
          ? `<details style="margin-top:8px;">
              <summary style="cursor:pointer; font-weight:900; color:#334155;">📝 Text</summary>
              <div style="margin-top:8px; color:#475569; line-height:1.45;">${esc(text)}</div>
            </details>`
          : ""
      }
    `;
    attemptsBody.appendChild(item);
  });
  card.appendChild(attemptsWrap);

  // AI Coach Memory (across session)
  const aiAttemptGroups = list
    .map((a) => {
      const sum = pickSummary(a) || {};
      const secs = sum?.ai_feedback?.sections;
      if (!Array.isArray(secs) || !secs.length) return null;
      return { ts: pickTS(a), sections: secs };
    })
    .filter(Boolean);

  if (aiAttemptGroups.length) {
    const totalSecs = aiAttemptGroups.reduce((n, g) => n + (g.sections?.length || 0), 0);

    const aiContainer = document.createElement("div");
    aiContainer.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";

    aiContainer.innerHTML = `
      <details>
        <summary style="cursor:pointer; font-weight:900; color:#334155;">🧠 AI Coach Memory (${totalSecs})</summary>
        <div style="margin-top:10px; max-height: 320px; overflow-y:auto;"></div>
      </details>
    `;

    const listDiv = aiContainer.querySelector("details > div");

    aiAttemptGroups.forEach((g) => {
      const groupHead = document.createElement("div");
      groupHead.style.cssText = "margin:12px 0 8px; font-weight:900; color:#64748b;";
      groupHead.textContent = fmtDateTime(g.ts);
      listDiv.appendChild(groupHead);

      g.sections.forEach((sec) => {
        const item = document.createElement("div");
        item.style.cssText =
          "background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:12px; margin-bottom:10px;";

        const titleEn = sec?.title || "Coach Tip";
        const contentL1 = sec?.l1;
        const contentEn = sec?.en || sec?.content || "";
        const hasL1 = !!contentL1;
        let isShowingL1 = hasL1;

        const h = document.createElement("div");
        h.style.cssText = "font-weight:900; color:#0369a1; font-size:0.9em; margin-bottom:6px;";
        h.textContent = `${sec?.emoji || "🤖"} ${titleEn}`;
        item.appendChild(h);

        const contentDiv = document.createElement("div");
        contentDiv.style.cssText = "color:#334155; font-size:0.9em; line-height:1.5;";
        contentDiv.innerHTML = mdToHtml(hasL1 ? contentL1 : contentEn);
        item.appendChild(contentDiv);

        if (hasL1) {
          const btn = document.createElement("button");
          btn.textContent = "Show English 🇺🇸";
          btn.style.cssText =
            "margin-top:8px; font-size:0.8em; padding:4px 8px; cursor:pointer; background:#fff; border:1px solid #bae6fd; border-radius:6px; color:#0284c7; font-weight:900;";
          btn.onclick = () => {
            if (isShowingL1) {
              contentDiv.innerHTML = mdToHtml(contentEn);
              btn.textContent = "Show Original ↩️";
              isShowingL1 = false;
            } else {
              contentDiv.innerHTML = mdToHtml(contentL1);
              btn.textContent = "Show English 🇺🇸";
              isShowingL1 = true;
            }
          };
          item.appendChild(btn);
        }

        listDiv.appendChild(item);
      });
    });

    card.appendChild(aiContainer);
  }

  modal.appendChild(card);
  document.body.appendChild(modal);

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

  try {
    document.body.style.overflow = "hidden";
  } catch (_) {}

  document.addEventListener("keydown", onKey);

  modal.onclick = (e) => {
    if (e.target === modal) close();
  };
}
