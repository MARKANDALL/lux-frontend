// features/progress/render.js
// Rendering helpers for progress UI (full dashboard + mini widget)

import { passages } from "../../src/data/passages.js";
import { SCENARIOS } from "../convo/scenarios.js";
import { openDetailsModal } from "./attempt-detail-modal.js";

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../next-activity/next-activity.js";

function scoreClass(score) {
  if (score >= 80) return "lux-pill--blue";
  if (score >= 60) return "lux-pill--yellow";
  return "lux-pill--red";
}

function fmtScore(score) {
  return `${Math.round(score)}%`;
}

function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleFromPassageKey(pk = "") {
  const s = String(pk);
  if (s.startsWith("convo:")) {
    const id = s.slice("convo:".length);
    const hit = SCENARIOS.find((x) => x.id === id);
    return hit ? `AI Conversation · ${hit.title}` : `AI Conversation · ${id}`;
  }
  const hit = passages?.[s];
  return hit?.name || s || "Practice";
}

function sparklineSvg(points = []) {
  const vals = points
    .map((p) => (p && p.avg != null ? p.avg : null))
    .filter((v) => v != null);
  if (!vals.length)
    return `<svg class="lux-spark" viewBox="0 0 120 34" preserveAspectRatio="none"></svg>`;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(1, max - min);

  const W = 120,
    H = 34;
  const step = W / Math.max(1, points.length - 1);

  const pts = points.map((p, i) => {
    const v = p.avg == null ? null : p.avg;
    const x = i * step;
    const y = v == null ? null : H - 4 - ((v - min) / span) * (H - 8);
    return { x, y };
  });

  // compress gaps by carrying last known y (keeps it readable)
  let lastY = H / 2;
  const path = pts
    .map((p) => {
      const y = p.y == null ? lastY : p.y;
      lastY = y;
      return `${p.x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return `
    <svg class="lux-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <polyline points="${path}" fill="none" stroke="rgba(15,23,42,0.55)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}

function downloadBlob(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function attemptsToCSV(attempts = []) {
  const header = ["date", "source", "activity", "score", "text", "sessionId", "id"];
  const rows = attempts.map((a) => {
    const ts = a.ts || a.created_at || a.createdAt || "";
    const pk = a.passage_key || a.passageKey || "";
    const src = String(pk).startsWith("convo:") ? "AI Conversations" : "Pronunciation";
    const activity = titleFromPassageKey(pk);
    const score = Math.round(
      a.summary?.pron != null ? a.summary.pron : a.azureResult?.NBest?.[0]?.PronScore || 0
    );
    const text = String(a.text || "").replace(/\s+/g, " ").trim();
    const sid = a.session_id || a.sessionId || "";
    const id = a.id || "";
    const safe = (x) => `"${String(x ?? "").replaceAll('"', '""')}"`;
    return [safe(ts), safe(src), safe(activity), safe(score), safe(text), safe(sid), safe(id)].join(
      ","
    );
  });
  return [header.join(","), ...rows].join("\n");
}

export function renderProgressDashboard(host, attempts, model, opts = {}) {
  const totals = model?.totals || {};
  const trouble = model?.trouble || {};
  const trend = model?.trend || [];
  const sessions = model?.sessions || [];

  const title = opts.title || "My Progress";
  const subtitle = opts.subtitle || "All practice (Pronunciation + AI Conversations)";
  const showActions = opts.showActions !== false; // default true
  const showCoach = !!opts.showCoach;

  const topPh = (trouble.phonemesAll || []).slice(0, 12);
  const topWd = (trouble.wordsAll || []).slice(0, 12);

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pickAzure(a) {
    return a?.azureResult || a?.azure_result || a?.azure || a?.result || null;
  }

  function pickSummary(a) {
    return a?.summary || a?.summary_json || a?.sum || null;
  }

  function pickSessionId(a) {
    return a?.session_id || a?.sessionId || "";
  }

  function pickTS(a) {
    return a?.ts || a?.created_at || a?.createdAt || a?.time || a?.localTime || null;
  }

  // Pre-group attempts by session for the History drill-in.
  function localDayKey(ts) {
    const d = new Date(ts);
    try {
      return d.toLocaleDateString("en-CA");
    } catch (_) {}
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }

  function sessionKeyForAttempt(a) {
    const sid = pickSessionId(a);
    if (sid) return sid;

    const ts = pickTS(a);
    if (!ts) return "";
    return `nosess:${localDayKey(ts)}`;
  }

  const bySession = new Map();
  for (const a of attempts || []) {
    const sid = sessionKeyForAttempt(a);
    if (!sid) continue;
    const arr = bySession.get(sid) || [];
    arr.push(a);
    bySession.set(sid, arr);
  }

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
  ✨ Generate my next practice
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
                      (p) => `
              <span class="lux-chip" title="${esc(
                `Seen ${p.count}× · ${p.days || 1} day(s) · priority ${
                  Number.isFinite(p.priority) ? p.priority.toFixed(2) : "—"
                }`
              )}">
                <span>${esc(p.ipa)}</span>
                <span class="lux-pill ${scoreClass(p.avg)}">${fmtScore(p.avg)}</span>
              </span>
            `
                    )
                    .join("")
                : `<span style="color:#64748b">Not enough data yet — keep practicing.</span>`
            }
          </div>
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
                      (w) => `
              <span class="lux-chip" title="${esc(
                `Seen ${w.count}× · ${w.days || 1} day(s) · priority ${
                  Number.isFinite(w.priority) ? w.priority.toFixed(2) : "—"
                }`
              )}">
                <span>${esc(w.word)}</span>
                <span class="lux-pill ${scoreClass(w.avg)}">${fmtScore(w.avg)}</span>
              </span>
            `
                    )
                    .join("")
                : `<span style="color:#64748b">Not enough data yet — keep practicing.</span>`
            }
          </div>
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
      <!-- AI Coach (always-on) — placed at bottom of All Data page -->
      <div id="aiFeedbackSection">
        <div id="aiFeedback"></div>
      </div>
      `
          : ``
      }
    </section>
  `;

  // --- History drill-in (👉) ---

  // Fast lookup (avoid CSS.escape dependency)
  const detailBySid = new Map();
  host.querySelectorAll(".lux-hdetail").forEach((el) => {
    if (el?.dataset?.sid) detailBySid.set(el.dataset.sid, el);
  });

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
    if (flu != null) pills.push(`Flu ${Math.round(Number(flu))}`);
    if (pro != null) pills.push(`Pro ${Math.round(Number(pro))}`);

    return pills.map((t) => `<span class="lux-mini-pill">${esc(t)}</span>`).join("");
  }

  function toggleSession(sid) {
    const detail = detailBySid.get(sid);
    if (!detail) return;

    const isHidden = detail.hasAttribute("hidden");
    if (!isHidden) {
      detail.setAttribute("hidden", "");
      detail.innerHTML = "";
      return;
    }

    const list = (bySession.get(sid) || [])
      .slice()
      .sort((a, b) => {
        const ta = new Date(pickTS(a) || 0).getTime();
        const tb = new Date(pickTS(b) || 0).getTime();
        return tb - ta;
      });

    detail.innerHTML = list
      .map((a) => {
        const ts = pickTS(a);
        const pk = a?.passage_key || a?.passageKey || a?.passage || "";
        const isConvo = String(pk).startsWith("convo:");
        const sum = pickSummary(a);
        const ref = a?.text || "";

        const label = isConvo ? "Conversation sample" : "Practice attempt";

        return `
        <div class="lux-hdetail-card">
          <div class="lux-hdetail-head">
            <div>
              <div class="lux-hdetail-title">${esc(label)} · ${fmtDate(ts)}</div>
              <div class="lux-hdetail-sub" style="color:#64748b; font-weight:800; font-size:0.9rem;">
                ${esc(titleFromPassageKey(pk))}
              </div>
            </div>
            <div class="lux-hdetail-pills">
              ${attemptPills(a)}
            </div>
          </div>

          ${
            ref
              ? `
            <details class="lux-hdetail-textwrap">
              <summary style="cursor:pointer; font-weight:900; color:#334155;">📝 Text</summary>
              <div class="lux-hdetail-text">${esc(ref)}</div>
            </details>
          `
              : ``
          }

          ${renderAiFeedback(sum)}
        </div>
      `;
      })
      .join("");

    detail.removeAttribute("hidden");
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

export function renderMiniProgress(host, model, opts = {}) {
  const title = opts.title || "Progress";
  const totals = model?.totals || {};
  host.innerHTML = `
    <section class="lux-pcard" style="margin-bottom:12px;">
      <div class="lux-pcard-label">${title}</div>
      <div class="lux-pcard-value">${fmtScore(totals.avgScore ?? 0)}</div>
      <div class="lux-pcard-mini">
        Sessions: ${totals.sessions ?? 0} · Attempts: ${totals.attempts ?? 0} · Last: ${fmtDate(
    totals.lastTS
  )}
        · <a href="./progress.html" style="font-weight:800; color:#2563eb; text-decoration:none;">View full</a>
      </div>
    </section>
  `;
}
