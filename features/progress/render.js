// features/progress/render.js
// Rendering helpers for progress UI (full dashboard + mini widget)

import { passages } from "../../src/data/passages.js";
import { SCENARIOS } from "../convo/scenarios.js";

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
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
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
  const vals = points.map((p) => (p && p.avg != null ? p.avg : null)).filter((v) => v != null);
  if (!vals.length) return `<svg class="lux-spark" viewBox="0 0 120 34" preserveAspectRatio="none"></svg>`;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(1, max - min);

  const W = 120, H = 34;
  const step = W / Math.max(1, points.length - 1);

  const pts = points.map((p, i) => {
    const v = p.avg == null ? null : p.avg;
    const x = i * step;
    const y = v == null ? null : (H - 4) - ((v - min) / span) * (H - 8);
    return { x, y };
  });

  // compress gaps by carrying last known y (keeps it readable)
  let lastY = H / 2;
  const path = pts.map((p) => {
    const y = p.y == null ? lastY : p.y;
    lastY = y;
    return `${p.x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

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
  const header = ["date","source","activity","score","text","sessionId","id"];
  const rows = attempts.map((a) => {
    const ts = a.ts || a.created_at || a.createdAt || "";
    const pk = a.passage_key || a.passageKey || "";
    const src = String(pk).startsWith("convo:") ? "AI Conversations" : "Pronunciation";
    const activity = titleFromPassageKey(pk);
    const score = Math.round(
      (a.summary?.pron != null ? a.summary.pron : (a.azureResult?.NBest?.[0]?.PronScore || 0))
    );
    const text = String(a.text || "").replace(/\s+/g, " ").trim();
    const sid = a.session_id || a.sessionId || "";
    const id = a.id || "";
    const safe = (x) => `"${String(x ?? "").replaceAll('"','""')}"`;
    return [safe(ts), safe(src), safe(activity), safe(score), safe(text), safe(sid), safe(id)].join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function renderProgressDashboard(host, attempts, model) {
  const totals = model?.totals || {};
  const trouble = model?.trouble || {};
  const trend = model?.trend || [];
  const sessions = model?.sessions || [];

  const topPh = (trouble.phonemesAll || []).slice(0, 12);
  const topWd = (trouble.wordsAll || []).slice(0, 12);

  host.innerHTML = `
    <a id="lux-my-progress"></a>
    <section class="lux-progress-shell">
      <div class="lux-progress-head">
        <div>
          <h2 class="lux-progress-title">My Progress</h2>
          <div class="lux-progress-sub">All practice (Pronunciation + AI Conversations)</div>
        </div>
        <div class="lux-progress-actions">
          <button class="lux-pbtn" id="luxDownloadReport">Download report</button>
          <button class="lux-pbtn lux-pbtn--ghost" id="luxDownloadTrouble">Download troubleshooting report</button>
        </div>
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
        <summary>🎧 Trouble Sounds <span style="color:#94a3b8; font-weight:800">${(trouble.phonemesAll||[]).length}</span></summary>
        <div class="lux-sec-body">
          <div class="lux-chiprow">
            ${topPh.length ? topPh.map((p) => `
              <span class="lux-chip">
                <span>/${p.ipa}/</span>
                <span class="lux-pill ${scoreClass(p.avg)}">${fmtScore(p.avg)}</span>
              </span>
            `).join("") : `<span style="color:#64748b">Not enough data yet — keep practicing.</span>`}
          </div>
          ${topPh.length ? `
            <div style="margin-top:10px; color:#64748b; font-size:0.92rem;">
              Tip: sounds only appear after repeated occurrences (so results are stable).
            </div>` : ``}
        </div>
      </details>

      <details class="lux-progress-sec">
        <summary>⚠️ Trouble Words <span style="color:#94a3b8; font-weight:800">${(trouble.wordsAll||[]).length}</span></summary>
        <div class="lux-sec-body">
          <div class="lux-chiprow">
            ${topWd.length ? topWd.map((w) => `
              <span class="lux-chip">
                <span>${w.word}</span>
                <span class="lux-pill ${scoreClass(w.avg)}">${fmtScore(w.avg)}</span>
              </span>
            `).join("") : `<span style="color:#64748b">Not enough data yet — keep practicing.</span>`}
          </div>
        </div>
      </details>

      <details class="lux-progress-sec">
        <summary>🕘 History</summary>
        <div class="lux-sec-body">
          <div class="lux-history">
            ${sessions.slice(0, 12).map((s) => `
              <div class="lux-hrow">
                <div class="lux-hleft">
                  <div class="lux-htitle">${titleFromPassageKey(s.passageKey)}</div>
                  <div class="lux-hmeta">${fmtDate(s.tsMax)} · ${s.count} attempt${s.count===1?"":"s"}${s.hasAI ? " · 🤖 AI coaching" : ""}</div>
                </div>
                <div class="lux-pill ${scoreClass(s.avgScore)}">${fmtScore(s.avgScore)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </details>
    </section>
  `;

  // Downloads (label doesn’t say CSV)
  const btn1 = host.querySelector("#luxDownloadReport");
  const btn2 = host.querySelector("#luxDownloadTrouble");

  if (btn1) {
    btn1.addEventListener("click", () => {
      const csv = attemptsToCSV(attempts);
      const name = `lux-report-${new Date().toISOString().slice(0,10)}.csv`;
      downloadBlob(name, csv, "text/csv;charset=utf-8");
    });
  }

  if (btn2) {
    btn2.addEventListener("click", () => {
      const name = `lux-troubleshooting-${new Date().toISOString().slice(0,10)}.json`;
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
        Sessions: ${totals.sessions ?? 0} · Attempts: ${totals.attempts ?? 0} · Last: ${fmtDate(totals.lastTS)}
        · <a href="./progress.html" style="font-weight:800; color:#2563eb; text-decoration:none;">View full</a>
      </div>
    </section>
  `;
}

