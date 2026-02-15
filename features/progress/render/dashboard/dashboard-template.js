// features/progress/render/dashboard/dashboard-template.js
// Builds the Progress dashboard HTML string (pure markup renderer).

import { scoreClass, fmtScore, fmtDate, titleFromPassageKey, esc } from "../format.js";
import { sparklineSvg } from "../sparkline.js";
import { renderMetricTrendCard } from "./actions-and-trends.js";

export function buildProgressDashboardHtml({
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
}) {
  return `
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
}
