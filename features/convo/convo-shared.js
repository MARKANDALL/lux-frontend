// features/convo/convo-shared.js
import { ensureUID } from "../../api/index.js";
import { computeRollups } from "../progress/rollups.js";
import { promptUserForAI } from "../../ui/ui-ai-ai-logic.js";
import { setLastAttemptId } from "../../app-core/runtime.js";

// --- Deck card sizing: make the CARD match the media's natural aspect ratio ---
const _luxMediaMeta = new Map();

export function applyMediaSizingVars(host, imgSrc) {
  if (!host || !imgSrc) return;

  const cached = _luxMediaMeta.get(imgSrc);
  if (cached) {
    host.style.setProperty("--lux-media-ar", cached.ar);
    host.style.setProperty("--lux-media-h", cached.h);
    return;
  }

  const im = new Image();
  im.onload = () => {
    const ar = `${im.naturalWidth} / ${im.naturalHeight}`;
    const h = `${im.naturalHeight}px`;
    _luxMediaMeta.set(imgSrc, { ar, h });

    host.style.setProperty("--lux-media-ar", ar);
    host.style.setProperty("--lux-media-h", h);
  };
  im.src = imgSrc;
}

export function uid() {
  return ensureUID();
}

export function newSessionId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wordSetFromText(text) {
  const s = String(text || "").toLowerCase();
  const out = new Set();
  const m = s.match(/[a-z']+/g) || [];
  for (const w of m) out.add(w);
  return out;
}

function uniqLower(list) {
  const out = [];
  const seen = new Set();
  for (const x of list || []) {
    const k = String(x || "").trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(String(x).trim());
  }
  return out;
}

function chipRow(items) {
  if (!items || !items.length) return `<div style="opacity:.7">—</div>`;
  return `
    <div style="display:flex; flex-wrap:wrap; gap:8px;">
      ${items
        .map(
          (x) =>
            `<span style="border:1px solid rgba(255,255,255,0.14); border-radius:999px; padding:6px 10px; font-size:12px;">${escapeHtml(
              x
            )}</span>`
        )
        .join("")}
    </div>
  `;
}

function wireCoachTurnList(host, turns) {
  const list = host?.querySelector("#luxConvoCoachTurnList");
  if (!list) return;

  const all = Array.isArray(turns) ? turns : [];
  const shown = all.slice(-10); // keep it compact

  if (!shown.length) {
    list.innerHTML = `<div style="font-size:12px; opacity:0.85;">No turns saved for this session yet.</div>`;
    return;
  }

  list.innerHTML = shown
    .map((t, idx) => {
      const has = !!t?.azureResult?.NBest?.[0];
      const text = String(t?.userText || "").trim();
      const label = text ? (text.length > 90 ? text.slice(0, 90) + "…" : text) : "(no text)";
      const turnNum = Number.isFinite(t?.turn) ? (t.turn + 1) : (all.length - shown.length + idx + 1);

      return `
        <button data-i="${idx}" ${has ? "" : "disabled"} style="
          text-align:left;
          width: 100%;
          appearance:none;
          border: 1px solid rgba(255,255,255,0.10);
          background: ${has ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"};
          color: ${has ? "#e5e7eb" : "rgba(229,231,235,0.55)"};
          border-radius: 10px;
          padding: 10px 12px;
          cursor: ${has ? "pointer" : "not-allowed"};
        ">
          <div style="font-weight:800; margin-bottom:4px;">Coach Turn ${turnNum}</div>
          <div style="font-size:12px; opacity:0.9;">${escapeHtml(label)}</div>
        </button>
      `;
    })
    .join("");

  list.querySelectorAll("button[data-i]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-i") || -1);
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

export function showConvoReportOverlay(report, turns = []) {
  let host = document.getElementById("luxConvoReportOverlay");
  const pretty = escapeHtml(JSON.stringify(report, null, 2));

  const plan = null;
  const targetPh = "";
  const targetWords = [];

  const said = new Set();
  for (const t of turns) {
    const ws = wordSetFromText(t?.userText || "");
    for (const w of ws) said.add(w);
  }
  const saidTargets = targetWords.filter((w) => said.has(w.toLowerCase()));

  // Build attempt-like objects for session-local rollups
  const baseTS = Date.now();
  const attempts = turns.map((t, i) => ({
    ts: baseTS - (turns.length - i) * 1000,
    passage_key: "",
    session_id: "",
    text: t?.userText || "",
    azureResult: t?.azureResult || null,
  }));

  let sessionModel = null;
  try {
    sessionModel = computeRollups(attempts);
  } catch (e) {
    console.error("[ConvoReportOverlay] computeRollups failed", e);
  }

  const troubleWords = sessionModel?.trouble?.wordsAll || [];
  const troublePhonemes = sessionModel?.trouble?.phonemesAll || [];

  // "Targets you said that still need work today"
  const saidTargetsNeedingWork = troubleWords
    .filter((x) => {
      const w = String(x?.word || "").toLowerCase();
      if (!w) return false;
      if (!saidTargets.map((s) => s.toLowerCase()).includes(w)) return false;
      const avg = Number(x?.avg);
      return Number.isFinite(avg) ? avg < 85 : true;
    })
    .slice(0, 10)
    .map((x) => {
      const avg = Number.isFinite(Number(x?.avg)) ? Number(x.avg).toFixed(0) : "—";
      const c = Number.isFinite(Number(x?.count)) ? `×${x.count}` : "";
      return `${x.word} (${avg}${c ? `, ${c}` : ""})`;
    });

  const topTroubleWords = troubleWords
    .slice(0, 12)
    .map((x) => {
      const avg = Number.isFinite(Number(x?.avg)) ? Number(x.avg).toFixed(0) : "—";
      const c = Number.isFinite(Number(x?.count)) ? `×${x.count}` : "";
      return `${x.word} (${avg}${c ? `, ${c}` : ""})`;
    });

  const topTroublePh = troublePhonemes
    .slice(0, 10)
    .map((x) => {
      const avg = Number.isFinite(Number(x?.avg)) ? Number(x.avg).toFixed(0) : "—";
      const c = Number.isFinite(Number(x?.count)) ? `×${x.count}` : "";
      return `${x.ipa} (${avg}${c ? `, ${c}` : ""})`;
    });

  let focusPhLine = "—";
  if (targetPh) {
    const hit = troublePhonemes.find((x) => String(x?.ipa || "") === targetPh);
    if (hit) {
      const avg = Number.isFinite(Number(hit?.avg)) ? Number(hit.avg).toFixed(0) : "—";
      const c = Number.isFinite(Number(hit?.count)) ? `×${hit.count}` : "";
      focusPhLine = `${targetPh} (today: ${avg}${c ? `, ${c}` : ""})`;
    } else {
      focusPhLine = `${targetPh} (today: not enough data)`;
    }
  }

  const headerSub = "";

  if (!host) {
    host = document.createElement("div");
    host.id = "luxConvoReportOverlay";
    host.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.45);
      display:flex; align-items:center; justify-content:center;
      padding: 18px;
    `;

    host.innerHTML = `
      <dialog open style="
        width: min(880px, 96vw);
        max-height: min(86vh, 920px);
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        background: rgba(12,12,14,0.96);
        color: #e5e7eb;
        box-shadow: 0 16px 64px rgba(0,0,0,0.45);
        padding: 0;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <div>
            <div style="font-weight: 800;">End Session Report</div>
            <div style="opacity:.75; font-size:12px; margin-top:2px;">${escapeHtml(headerSub || "")}</div>
          </div>
          <button id="luxConvoReportClose" style="background: transparent; border: 1px solid rgba(255,255,255,0.18); color:#e5e7eb; padding: 8px 12px; border-radius: 10px; cursor:pointer;">Close</button>
        </div>
        <div style="padding: 12px 14px; overflow:auto;">
          <div style="display:grid; grid-template-columns: 1fr; gap: 14px;">

            <div style="border:1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.04); border-radius: 14px; padding: 12px;">
              <div style="font-weight: 800; margin-bottom: 8px;">Targets loaded</div>
              <div style="font-size: 12px; opacity:.9;">Focus sound</div>
              <div style="margin: 6px 0 10px;">${escapeHtml(focusPhLine)}</div>
              <div style="font-size: 12px; opacity:.9; margin-top: 6px;">Word bank</div>
              ${chipRow(targetWords)}
            </div>

            <div style="border:1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.04); border-radius: 14px; padding: 12px;">
              <div style="font-weight: 800; margin-bottom: 8px;">What you actually practiced</div>
              <div style="font-size: 12px; opacity:.9;">Target words you said</div>
              ${chipRow(saidTargets)}
              <div style="font-size: 12px; opacity:.9; margin-top: 10px;">Target words you said that still need work today</div>
              ${chipRow(saidTargetsNeedingWork)}
            </div>

            <div style="border:1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.04); border-radius: 14px; padding: 12px;">
              <div style="font-weight: 800; margin-bottom: 8px;">Needs work today (this session)</div>
              <div style="font-size: 12px; opacity:.9;">Top trouble words</div>
              ${chipRow(topTroubleWords)}
              <div style="font-size: 12px; opacity:.9; margin-top: 10px;">Top trouble sounds (phonemes)</div>
              ${chipRow(topTroublePh)}
            </div>

            <details style="border:1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); border-radius: 14px; padding: 10px 12px;">
              <summary style="cursor:pointer; font-weight: 800;">Debug JSON</summary>
              <div style="padding: 12px 14px;">

                <div style="
                  margin: 0 0 12px 0;
                  padding: 12px;
                  border: 1px solid rgba(255,255,255,0.08);
                  border-radius: 12px;
                  background: rgba(255,255,255,0.04);
                ">
                  <div style="font-weight:800; margin-bottom:8px;">AI Coach</div>
                  <div id="luxConvoCoachTurnList" style="display:flex; flex-direction:column; gap:8px;"></div>
                  <div style="font-size:12px; opacity:0.85; margin-top:8px;">
                    Choose a turn to coach (turns without analysis are disabled).
                  </div>
                </div>

                <pre id="luxConvoReportPre" style="
                  white-space: pre-wrap;
                  word-break: break-word;
                  font-size: 12px;
                  line-height: 1.35;
                  margin: 10px 0 0;
                  background: rgba(255,255,255,0.06);
                  border: 1px solid rgba(255,255,255,0.10);
                  padding: 12px;
                  border-radius: 12px;
                ">${pretty}</pre>
              </div>
            </details>

          </div>
        </div>
      </dialog>
    `;

    host.querySelector("#luxConvoReportClose")?.addEventListener("click", () =>
      host.remove()
    );

    wireCoachTurnList(host, turns);
  } else {
    // If reusing existing overlay, just update Debug JSON block
    const pre = host.querySelector("#luxConvoReportPre");
    if (pre) pre.textContent = JSON.stringify(report, null, 2);

    wireCoachTurnList(host, turns);
  }

  document.body.appendChild(host);
}
