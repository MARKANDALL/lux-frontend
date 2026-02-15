// features/progress/render/dashboard.js
// Main full-size Progress dashboard render functions live here.
// features/progress/render/dashboard.js

import { openDetailsModal } from "../attempt-detail-modal.js";
import { wireAttemptDetailChipExplainers } from "../attempt-detail/chip-explainers.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../../next-activity/next-activity.js";

import {
  buildNextPracticePlanFromModel,
  saveNextPracticePlan,
  applyNextPracticePlan,
} from "../../next-activity/next-practice.js";

import { scoreClass, fmtScore, fmtDate, titleFromPassageKey, esc } from "./format.js";
import { sparklineSvg } from "./sparkline.js";
import { downloadBlob } from "./export.js";

import {
  pickAzure,
  pickSummary,
  pickTS,
  buildAttemptsBySession,
} from "./dashboard/attempt-utils.js";

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

  host.innerHTML = `
    <a id="lux-my-progress"></a>
    <section class="lux-progress-shell">
      <div class="lux-progress-head">
        <div>
          <h2 class="lux-progress-title">${esc(title)}</h2>
          <div class="lux-progress-sub">${esc(subtitle)}</div>
        </div>
        ${
          showActions
            ? `
          <div class="lux-progress-actions">
<button class="lux-pbtn" id="luxGenerateNextPractice" data-lux-generate-next>
  ✨ Next conversation
</button>
<button class="lux-pbtn lux-pbtn--ghost" id="luxOpenWordCloud">
  ☁️ Cloud Visuals
</button>
            <button class="lux-pbtn" id="luxDownloadReport">Download report</button>
            <button class="lux-pbtn lux-pbtn--ghost" id="luxDownloadTrouble">Download troubleshooting report</button>
          </div>
        `
            : ``
        }
      </div>

      <div class="lux-progress-cards">
        <div class="lux-pcard">
          <div class="lux-pcard-label">Sessions</div>
          <div class="lux-pcard-value">${totals.sessions ?? 0}</div>
          <div class="lux-pcard-mini">Attempts: ${totals.attempts ?? 0}</div>
        </div>

        <div class="lux-pcard">
          <div class="lux-pcard-label">Average score</div>
          <div class="lux-pcard-value">${fmtScore(totals.avgScore ?? 0)}</div>
          <div class="lux-pcard-mini">Last activity: ${fmtDate(totals.lastTS)}</div>
        </div>

        <div class="lux-pcard">
          <div class="lux-pcard-label">Trend (last 30 days)</div>
          ${sparklineSvg(trend)}
          <div class="lux-pcard-mini">Tap sections below for details</div>
        </div>
      </div>

      ${
        showMetricTrends
          ? `
      <details class="lux-progress-sec" open>
        <summary>📈 Score trends (by category)</summary>
        <div class="lux-sec-body">
          <div class="lux-metricTrendsGrid">
            ${renderMetricTrendCard(model.metrics.acc)}
            ${renderMetricTrendCard(model.metrics.flu)}
            ${renderMetricTrendCard(model.metrics.comp)}
            ${renderMetricTrendCard(model.metrics.pron)}
          </div>
          <div class="lux-metricTrendsNote">
            Prosody trend will be added once we store/compute it.
          </div>
        </div>
      </details>
      `
          : ``
      }

      <details class="lux-progress-sec" open>
        <summary>🎯 Snapshot</summary>
        <div class="lux-sec-body">
          <div class="lux-grid2">
            <div class="lux-kv">
              <div class="lux-k">Best day</div>
              <div class="lux-v">${fmtDate(totals.bestDayTS)} · ${
                totals.bestDayScore == null ? "—" : fmtScore(totals.bestDayScore)
              }</div>
            </div>
            <div class="lux-kv">
              <div class="lux-k">Most practiced</div>
              <div class="lux-v">${
                totals.topPassageKey
                  ? `${esc(titleFromPassageKey(totals.topPassageKey))}${
                      totals.topPassageCount
                        ? ` · ${totals.topPassageCount} attempt${
                            totals.topPassageCount === 1 ? "" : "s"
                          }`
                        : ""
                    }`
                  : "—"
              }</div>
            </div>
          </div>
        </div>
      </details>

      ${
        showNextPractice
          ? `
      <details class="lux-progress-sec" open id="lux-next-practice" data-lux-next-practice>
        <summary>✨ Next practice</summary>
        <div class="lux-sec-body">
          ${
            nextPracticePlan
              ? `
          <div class="lux-kv" style="margin-bottom:10px;">
            <div class="lux-k">Focus phoneme</div>
            <div class="lux-v">
              <b>${esc(nextPracticePlan.focusPh)}</b>
              ${
                nextPracticePlan.focusIpa
                  ? `<span style="opacity:0.7;"> (from /${esc(nextPracticePlan.focusIpa)}/)</span>`
                  : ``
              }
            </div>
          </div>

          <div class="lux-grid2" style="margin-bottom:10px;">
            <div class="lux-kv">
              <div class="lux-k">Best Harvard</div>
              <div class="lux-v">
                <b>${
                  nextPracticePlan.harvardN
                    ? `List ${String(nextPracticePlan.harvardN).padStart(2, "0")}`
                    : "—"
                }</b>
                <span style="opacity:0.75;">(${nextPracticePlan.harvardScore || 0})</span>
              </div>
            </div>
            <div class="lux-kv">
              <div class="lux-k">Best Passage/Drill</div>
              <div class="lux-v">
                <b>${esc(nextPracticePlan.passageLabel || nextPracticePlan.passageKey || "—")}</b>
                <span style="opacity:0.75;">(${nextPracticePlan.passageScore || 0})</span>
              </div>
            </div>
          </div>

          <div class="lux-nextpractice-actions">
            <button class="lux-pbtn" type="button" id="luxNextPracticeStartHarvard" ${
              nextPracticePlan.harvardN ? "" : "disabled"
            }>Start Harvard</button>
            <button class="lux-pbtn lux-pbtn--ghost" type="button" id="luxNextPracticeStartPassage" ${
              nextPracticePlan.passageKey ? "" : "disabled"
            }>Start Passage/Drill</button>
          </div>
          `
              : `<div style="color:#64748b">Not enough progress yet — do one more practice run.</div>`
          }
        </div>
      </details>
      `
          : ``
      }

      <details class="lux-progress-sec">
        <summary>⚠️ Trouble Sounds <span style="color:#94a3b8; font-weight:800">${
          (trouble.phonemesAll || []).length
        }</span></summary>

        <div class="lux-sec-body">
          <div class="lux-chiprow">
            ${
              topPh.length
                ? topPh
                    .map(
                      (p, i) => `
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
            <span class="lux-pill ${scoreClass(p.avg)}">${fmtScore(p.avg)}</span>
          </span>
        `
                    )
                    .join("")
                : `<span style="color:#64748b">Not enough data yet — keep practicing.</span>`
            }
          </div>

          <!-- ✅ inline explainer slot (click chip -> details appear here) -->
          <div id="luxExplainSounds" style="margin-top:10px;" hidden></div>
        </div>
      </details>

      <details class="lux-progress-sec">
        <summary>⚠️ Trouble Words <span style="color:#94a3b8; font-weight:800">${
          (trouble.wordsAll || []).length
        }</span></summary>

        <div class="lux-sec-body">
          <div class="lux-chiprow">
            ${
              topWd.length
                ? topWd
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
            <span class="lux-pill ${scoreClass(w.avg)}">${fmtScore(w.avg)}</span>
          </span>
        `
                    )
                    .join("")
                : `<span style="color:#64748b">Not enough data yet — keep practicing.</span>`
            }
          </div>

          <!-- ✅ inline explainer slot (click chip -> details appear here) -->
          <div id="luxExplainWords" style="margin-top:10px;" hidden></div>
        </div>
      </details>

      <details class="lux-progress-sec">
        <summary>🕘 History</summary>
        <div class="lux-sec-body">
          <div class="lux-history">
            ${sessions
              .slice(0, 12)
              .map(
                (s) => `
              <div class="lux-hblock">
                <div class="lux-hrow" data-sid="${esc(s.sessionId)}" role="button" tabindex="0">
                  <div class="lux-hleft">
                    <div class="lux-htitle">${esc(titleFromPassageKey(s.passageKey))}</div>
                    <div class="lux-hmeta">${fmtDate(s.tsMax)} · ${s.count} attempt${
                  s.count === 1 ? "" : "s"
                }${s.hasAI ? " · 🤖 AI coaching" : ""}</div>
                  </div>
                  <div class="lux-hright">
                    <button class="lux-hbtn" type="button" data-sid="${esc(
                      s.sessionId
                    )}" aria-label="Show details">👉</button>
                    <div class="lux-pill ${scoreClass(s.avgScore)}">${fmtScore(s.avgScore)}</div>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <div style="margin-top:10px; color:#64748b; font-size:0.9rem;">
            Showing your most recent sessions. Tip: click 👉 to open a saved-detail card (including any saved AI feedback).
          </div>
        </div>
      </details>

      ${
        showCoach
          ? `
      <!-- AI Coach (collapsed on load; opens after interaction) -->
      <details id="aiCoachDrawer" class="lux-progress-drawer lux-ai-drawer">
        <summary class="lux-progress-drawer-summary">
          <div class="lux-progress-drawer-left">
            <div class="lux-progress-drawer-title">AI Coach</div>
   <div class="lux-progress-drawer-mini">
              <span class="lux-mini-open">Hide AI Coach</span>
              <span class="lux-mini-closed">Show AI Coach?</span>
            </div>
           </div>
          <div class="lux-progress-drawer-right">
            <span class="lux-progress-drawer-chev" aria-hidden="true">▾</span>
          </div>          </div>
        </summary>
        <div class="lux-progress-drawer-body">
          <div id="aiFeedbackSection">
            <div id="aiFeedback"></div>
          </div>
        </div>
      </details>
      `
          : ``
      }
    </section>
  `;

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

  function renderAiFeedback(sum) {
    const secs =
      sum?.ai_feedback?.sections ||
      sum?.ai_feedback?.Sections ||
      sum?.aiFeedback?.sections ||
      sum?.sections ||
      [];
    if (!Array.isArray(secs) || !secs.length) return "";
    return `
      <details class="lux-hdetail-ai">
        <summary>🤖 Saved AI feedback (${secs.length})</summary>
        <div class="lux-hdetail-ai-body">
          ${secs
            .map((sec) => {
              const title = sec?.title || sec?.heading || "";
              const bullets = sec?.bullets || sec?.items || sec?.points || [];
              return `
              <div class="lux-ai-sec">
                ${title ? `<div class="lux-ai-sec-title">${esc(title)}</div>` : ``}
                ${
                  Array.isArray(bullets) && bullets.length
                    ? `
                  <ul class="lux-ai-bullets">
                    ${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}
                  </ul>
                `
                    : ``
                }
              </div>
            `;
            })
            .join("")}
        </div>
      </details>
    `;
  }

  function attemptPills(a) {
    const sum = pickSummary(a) || {};
    const az = pickAzure(a);
    const nb = az?.NBest?.[0] || az?.nBest?.[0] || null;
    const pa =
      nb?.PronunciationAssessment ||
      nb?.pronunciationAssessment ||
      az?.PronunciationAssessment ||
      null;

    const pills = [];
    const pron = sum?.pron ?? nb?.PronScore ?? pa?.PronScore;
    const acc = sum?.acc ?? pa?.AccuracyScore;
    const flu = sum?.flu ?? pa?.FluencyScore;
    const pro = sum?.pros ?? sum?.pro ?? pa?.ProsodyScore;

    if (pron != null) pills.push(`Pron ${Math.round(Number(pron))}`);
    if (acc != null) pills.push(`Acc ${Math.round(Number(acc))}`);
    if (flu !=null) pills.push(`Flu ${Math.round(Number(flu))}`);
    if (pro != null) pills.push(`Pro ${Math.round(Number(pro))}`);

    return pills.map((t) => `<span class="lux-mini-pill">${esc(t)}</span>`).join("");
  }

  function attemptOverallScore(a) {
    const sum = pickSummary(a) || {};
    if (sum.pron != null) return Number(sum.pron) || 0;

    const az = pickAzure(a);
    const v = az?.NBest?.[0]?.PronScore;
    return Number(v) || 0;
  }

  function attemptDateStr(a) {
    const ts = pickTS(a);
    const d = new Date(ts || Date.now());
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  host.querySelectorAll(".lux-hbtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const sid = btn.getAttribute("data-sid") || "";
      if (!sid) return;

      const list = (bySession.get(sid) || [])
        .slice()
        .sort((a, b) => {
          const ta = new Date(pickTS(a) || 0).getTime();
          const tb = new Date(pickTS(b) || 0).getTime();
          return tb - ta;
        });

      const a = list[0];
      if (!a) {
        console.warn("[progress] No attempts found for sid:", sid);
        return;
      }

      const sess = (sessions || []).find((x) => String(x.sessionId) === String(sid)) || null;

      openDetailsModal(a, attemptOverallScore(a), attemptDateStr(a), {
        sid,
        list,
        session: sess,
      });
    });
  });

  // Downloads (optional)
  if (showActions) {
    const gen = document.getElementById("luxGenerateNextPractice");
    if (gen) {
      gen.addEventListener("click", () => {
        const plan = buildNextActivityPlanFromModel(model, { source: "global" });
        if (!plan) return;
        saveNextActivityPlan(plan);
        window.location.assign("./convo.html#chat");
      });
    }

    const wc = document.getElementById("luxOpenWordCloud");
    if (wc)
      wc.addEventListener("click", () => {
        window.location.assign("./wordcloud.html");
      });

    const dl = document.getElementById("luxDownloadReport");
    if (dl)
      dl.addEventListener("click", () => {
        const name = `lux-progress-${new Date().toISOString().slice(0, 10)}.json`;
        downloadBlob(name, JSON.stringify({ model }, null, 2), "application/json");
      });

    const dlT = document.getElementById("luxDownloadTrouble");
    if (dlT)
      dlT.addEventListener("click", () => {
        const name = `lux-troubleshooting-${new Date().toISOString().slice(0, 10)}.json`;
        downloadBlob(name, JSON.stringify({ attempts }, null, 2), "application/json");
      });
  }
}

function renderMetricTrendCard(m) {
  if (!m) return "";
  const fmtPct = (v) =>
    v == null || !Number.isFinite(+v) ? "—" : `${Math.round(+v)}%`;
  const best =
    m.bestDay?.avg != null ? `${m.bestDay.day} • ${fmtPct(m.bestDay.avg)}` : "—";

  return `
    <div class="lux-pcard lux-metricTrendCard">
      <div class="lux-metricTrendTop">
        <div class="lux-pcard-label">${esc(m.label)}</div>
        <div class="lux-metricTrendValue">${fmtPct(m.avg30)}</div>
      </div>
      <div class="lux-spark">${sparklineSvg(m.trend || [], { width: 240, height: 42 })}</div>
      <div class="lux-metricTrendMeta">
        <span>Last: <b>${fmtPct(m.last)}</b></span>
        <span>7d: <b>${fmtPct(m.avg7)}</b></span>
        <span>Best: <b>${best}</b></span>
      </div>
    </div>
  `;
}
