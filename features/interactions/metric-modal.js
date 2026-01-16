// features/interactions/metric-modal.js
// Click any score tile/ring to open a detailed, static metric explainer modal.
// IMPORTANT: This is NOT the AI Coach. This is computed/explanatory info only.

import { getAzureScores, deriveFallbackScores, fmtPct } from "../../core/scoring/index.js";
import { computeTimings, median, ticksToSec } from "../../prosody/core-calc.js";
import { classifyTempo } from "../../prosody/annotate.js";

let installed = false;
let currentData = null;

const PAUSE_MIN_SEC = 0.18; // "pause" threshold (tweak later if you want)

const METRIC_META = {
  Overall: {
    title: "Overall",
    blurb:
      "Your overall score is an aggregate of the five core categories below. It gives a quick summary of this attempt.",
  },
  Pronunciation: {
    title: "Pronunciation",
    blurb:
      "A high-level pronunciation score based on how accurately you produced the expected sounds overall.",
  },
  Accuracy: {
    title: "Accuracy",
    blurb:
      "How close your pronunciation was to the expected target sounds (segment-by-segment accuracy).",
  },
  Fluency: {
    title: "Fluency",
    blurb:
      "How smooth and natural your speech flow was—often affected by pausing, stopping, and restarts.",
  },
  Completeness: {
    title: "Completeness",
    blurb:
      "Whether you said all the words from the reference (and whether anything was skipped or extra).",
  },
  Prosody: {
    title: "Prosody",
    blurb:
      "Stress, rhythm, intonation, and pacing — how your speech “sounds as a whole,” not just individual sounds.",
  },
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mean(nums) {
  const v = (nums || []).map(toNum).filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function pickWords(data) {
  return (
    data?.NBest?.[0]?.Words ||
    data?.nBest?.[0]?.Words ||
    data?.PronunciationAssessment?.Words ||
    []
  );
}

function pickPa(data) {
  const nb = data?.NBest?.[0] || data?.nBest?.[0] || null;
  return (
    nb?.PronunciationAssessment ||
    nb?.pronunciationAssessment ||
    data?.PronunciationAssessment ||
    null
  );
}

function getScorePack(data) {
  let s = getAzureScores(data);
  if (s.accuracy == null) {
    const fb = deriveFallbackScores(data);
    s = { ...s, ...fb };
  }

  // getAzureScores().overall === "Pronunciation score" (Azure PronScore)
  const pron = toNum(s.overall);
  const agg = mean([s.accuracy, s.fluency, s.completeness, s.prosody, pron]);

  return {
    accuracy: toNum(s.accuracy),
    fluency: toNum(s.fluency),
    completeness: toNum(s.completeness),
    prosody: toNum(s.prosody),
    pronunciation: pron,
    overallAgg: agg,
  };
}

function deriveTimingStats(data) {
  const words = pickWords(data);
  if (!Array.isArray(words) || !words.length) return null;

  const timings = computeTimings(words);

  // Build start/end arrays (seconds). computeTimings tries hard to infer these.
  const starts = timings.map((t) => t?.start).filter(Number.isFinite);
  const ends = timings.map((t) => t?.end).filter(Number.isFinite);

  // If we can't get a full span, bail gracefully.
  const minStart = starts.length ? Math.min(...starts) : null;
  const maxEnd = ends.length ? Math.max(...ends) : null;

  let spanSec = null;
  if (Number.isFinite(minStart) && Number.isFinite(maxEnd) && maxEnd > minStart) {
    spanSec = maxEnd - minStart;
  }

  // Pause detection: gaps between word end and next word start
  let pauseCount = 0;
  let pauseTotal = 0;
  let pauseLongest = 0;

  for (let i = 1; i < timings.length; i++) {
    const prevEnd = timings[i - 1]?.end;
    const currStart = timings[i]?.start;
    if (!Number.isFinite(prevEnd) || !Number.isFinite(currStart)) continue;

    const gap = currStart - prevEnd;
    if (gap >= PAUSE_MIN_SEC) {
      pauseCount++;
      pauseTotal += gap;
      pauseLongest = Math.max(pauseLongest, gap);
    }
  }

  const wordCount = words.length;

  // Speech rates
  const wps = Number.isFinite(spanSec) && spanSec > 0 ? wordCount / spanSec : null;
  const wpm = Number.isFinite(wps) ? wps * 60 : null;

  const articulationSec =
    Number.isFinite(spanSec) && spanSec > 0 ? Math.max(0, spanSec - pauseTotal) : null;

  const arWps =
    Number.isFinite(articulationSec) && articulationSec > 0 ? wordCount / articulationSec : null;
  const arWpm = Number.isFinite(arWps) ? arWps * 60 : null;

  // Tempo buckets (fast/slow/ok) using word durations + median
  const durs = timings.map((t) => t?.durationSec).filter(Number.isFinite);
  const med = median(durs);
  const tempoCounts = { fast: 0, slow: 0, ok: 0 };

  for (const d of durs) {
    const label = classifyTempo(d, med);
    tempoCounts[label] = (tempoCounts[label] || 0) + 1;
  }

  return {
    wordCount,
    spanSec,
    pauseCount,
    pauseTotal,
    pauseLongest,
    wps,
    wpm,
    articulationSec,
    arWps,
    arWpm,
    tempoCounts,
  };
}

function deriveErrorStats(data) {
  const words = pickWords(data);
  if (!Array.isArray(words) || !words.length) return null;

  // Word-level accuracy + error type
  const worstWords = words
    .map((w) => {
      const pa = w?.PronunciationAssessment || w?.pronunciationAssessment || {};
      return {
        word: w?.Word || w?.word || "",
        acc: toNum(pa?.AccuracyScore),
        err: String(pa?.ErrorType || pa?.errorType || "").trim(),
      };
    })
    .filter((x) => x.word)
    .sort((a, b) => (a.acc ?? 999) - (b.acc ?? 999))
    .slice(0, 8);

  const errCounts = {};
  for (const w of words) {
    const pa = w?.PronunciationAssessment || w?.pronunciationAssessment || {};
    const t = String(pa?.ErrorType || pa?.errorType || "").trim();
    if (!t) continue;
    errCounts[t] = (errCounts[t] || 0) + 1;
  }

  // Phoneme-level accuracy: group by symbol (best-effort)
  const phMap = new Map();
  for (const w of words) {
    const phs = w?.Phonemes || w?.phonemes || [];
    for (const ph of phs) {
      const sym = String(ph?.Phoneme || ph?.phoneme || "").trim();
      const pa = ph?.PronunciationAssessment || ph?.pronunciationAssessment || {};
      const acc = toNum(pa?.AccuracyScore);
      if (!sym) continue;

      const prev = phMap.get(sym) || { sum: 0, n: 0 };
      if (Number.isFinite(acc)) {
        prev.sum += acc;
        prev.n += 1;
      }
      phMap.set(sym, prev);
    }
  }

  const worstPhonemes = [...phMap.entries()]
    .map(([sym, v]) => ({ phoneme: sym, avg: v.n ? v.sum / v.n : null, n: v.n }))
    .filter((x) => Number.isFinite(x.avg))
    .sort((a, b) => (a.avg ?? 999) - (b.avg ?? 999))
    .slice(0, 8);

  return { worstWords, worstPhonemes, errCounts };
}

function prettyErrCounts(errCounts) {
  const entries = Object.entries(errCounts || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "—";
  return entries.map(([k, v]) => `${k}: ${v}`).join(" • ");
}

function kv(label, val) {
  return `
    <div class="lux-metricKV">
      <div class="lux-metricKV-k">${esc(label)}</div>
      <div class="lux-metricKV-v">${esc(val)}</div>
    </div>
  `;
}

function section(title, bodyHtml) {
  return `
    <div class="lux-metricSection">
      <div class="lux-metricSection-h">${esc(title)}</div>
      <div class="lux-metricSection-b">${bodyHtml}</div>
    </div>
  `;
}

function resolveMetricKeyFromEl(el) {
  if (!el) return null;

  // Explicit data-score-key wins
  const k = el.dataset?.scoreKey;
  if (k) return String(k).trim();

  // Ring usually means Overall
  if (el.classList?.contains("lux-scoreRing")) return "Overall";

  // Try to infer from label text
  const lbl =
    el.querySelector?.(".lux-scoreTile-label")?.textContent ||
    el.querySelector?.(".lux-scoreLabel")?.textContent ||
    el.textContent ||
    "";

  const s = String(lbl).replace(/\(\?\)/g, "").trim().toLowerCase();
  if (!s) return null;

  if (s.includes("overall")) return "Overall";
  if (s.includes("pronunciation")) return "Pronunciation";
  if (s.includes("prosody")) return "Prosody";
  if (s.includes("accuracy")) return "Accuracy";
  if (s.includes("fluency")) return "Fluency";
  if (s.includes("completeness")) return "Completeness";

  return null;
}

function decorateTiles() {
  // Make tiles keyboard-focusable + obviously clickable (no markup changes required)
  const tiles = document.querySelectorAll(".lux-scoreTile, .lux-scoreRing");
  tiles.forEach((t) => {
    if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "0");
    if (!t.hasAttribute("role")) t.setAttribute("role", "button");
    t.setAttribute("aria-haspopup", "dialog");

    // If no dataset key, infer + add it (stable for click handling)
    if (!t.dataset.scoreKey) {
      const inferred = resolveMetricKeyFromEl(t);
      if (inferred) t.dataset.scoreKey = inferred;
    }
  });
}

function buildModalHtml(metricKey, data) {
  const meta = METRIC_META[metricKey] || { title: metricKey, blurb: "" };

  const scores = getScorePack(data);
  const timing = deriveTimingStats(data);
  const errors = deriveErrorStats(data);

  const valMap = {
    Overall: scores.overallAgg,
    Pronunciation: scores.pronunciation,
    Accuracy: scores.accuracy,
    Fluency: scores.fluency,
    Completeness: scores.completeness,
    Prosody: scores.prosody,
  };

  const primaryVal = valMap[metricKey];
  const bigPct = fmtPct(primaryVal);

  // Shared “attempt snapshot”
  const snapshot = `
    <div class="lux-metricGrid">
      ${kv("Overall (aggregate)", fmtPct(scores.overallAgg))}
      ${kv("Pronunciation", fmtPct(scores.pronunciation))}
      ${kv("Accuracy", fmtPct(scores.accuracy))}
      ${kv("Fluency", fmtPct(scores.fluency))}
      ${kv("Completeness", fmtPct(scores.completeness))}
      ${kv("Prosody", fmtPct(scores.prosody))}
    </div>
  `;

  // Timing block (only show if we have it)
  const timingBlock = timing
    ? `
      <div class="lux-metricGrid">
        ${kv("Words", String(timing.wordCount))}
        ${kv("Total time", timing.spanSec != null ? `${timing.spanSec.toFixed(2)}s` : "—")}
        ${kv("Words / minute", timing.wpm != null ? `${timing.wpm.toFixed(0)} wpm` : "—")}
        ${kv("Words / second", timing.wps != null ? `${timing.wps.toFixed(2)} w/s` : "—")}
        ${kv("Articulation rate", timing.arWpm != null ? `${timing.arWpm.toFixed(0)} wpm` : "—")}
        ${kv("Pause count", String(timing.pauseCount))}
        ${kv("Total pause time", `${timing.pauseTotal.toFixed(2)}s`)}
        ${kv("Longest pause", `${timing.pauseLongest.toFixed(2)}s`)}
        ${kv(
          "Tempo mix",
          `fast ${timing.tempoCounts.fast || 0} • ok ${timing.tempoCounts.ok || 0} • slow ${
            timing.tempoCounts.slow || 0
          }`
        )}
      </div>
    `
    : `<div style="color:#64748b;">Timing stats not available for this attempt.</div>`;

  // Error block (only show if we have it)
  const errorBlock = errors
    ? `
      <div class="lux-metricSubhead">Most difficult words (this attempt)</div>
      <div class="lux-metricChips">
        ${
          errors.worstWords.length
            ? errors.worstWords
                .map((w) => `<span class="lux-metricChip">${esc(w.word)} · ${fmtPct(w.acc)}</span>`)
                .join("")
            : `<span style="color:#64748b;">—</span>`
        }
      </div>

      <div class="lux-metricSubhead" style="margin-top:10px;">Most difficult phonemes (this attempt)</div>
      <div class="lux-metricChips">
        ${
          errors.worstPhonemes.length
            ? errors.worstPhonemes
                .map((p) => `<span class="lux-metricChip">${esc(p.phoneme)} · ${fmtPct(p.avg)}</span>`)
                .join("")
            : `<span style="color:#64748b;">—</span>`
        }
      </div>

      <div class="lux-metricSubhead" style="margin-top:10px;">Error types</div>
      <div style="color:#334155; font-weight:800;">${esc(prettyErrCounts(errors.errCounts))}</div>
    `
    : `<div style="color:#64748b;">Error detail not available for this attempt.</div>`;

  // Per-metric “what to look at” guidance (STATIC, not AI coach)
  const guidance = (() => {
    switch (metricKey) {
      case "Accuracy":
        return `
          <ul class="lux-metricList">
            <li><b>Watch:</b> low phoneme scores and repeated low-scoring words.</li>
            <li><b>Meaning:</b> your mouth shape or voicing differs from target sounds.</li>
            <li><b>Try:</b> slow down slightly and exaggerate the hardest consonants/vowels.</li>
          </ul>
        `;
      case "Fluency":
        return `
          <ul class="lux-metricList">
            <li><b>Watch:</b> many pauses or a very slow/very fast rate.</li>
            <li><b>Meaning:</b> you may be searching for words or restarting mid-phrase.</li>
            <li><b>Try:</b> practice “chunking” — speak in short natural groups.</li>
          </ul>
        `;
      case "Completeness":
        return `
          <ul class="lux-metricList">
            <li><b>Watch:</b> omissions or insertions.</li>
            <li><b>Meaning:</b> you skipped words or added extra ones.</li>
            <li><b>Try:</b> follow the reference text with your eyes, and keep a steady pace.</li>
          </ul>
        `;
      case "Prosody":
        return `
          <ul class="lux-metricList">
            <li><b>Watch:</b> tempo mix (fast/slow words) and long pauses.</li>
            <li><b>Meaning:</b> pacing/stress patterns may sound “non-native” even if sounds are correct.</li>
            <li><b>Try:</b> copy the rhythm first (even monotone), then add intonation.</li>
          </ul>
        `;
      case "Pronunciation":
        return `
          <ul class="lux-metricList">
            <li><b>Watch:</b> whether pronunciation stays high even when accuracy dips.</li>
            <li><b>Meaning:</b> it’s your overall sound quality combined, not one single error.</li>
            <li><b>Try:</b> aim for consistency across the whole sentence.</li>
          </ul>
        `;
      case "Overall":
      default:
        return `
          <ul class="lux-metricList">
            <li><b>Watch:</b> your lowest category — that’s usually your best “next focus.”</li>
            <li><b>Try:</b> repeat once with one clear goal (pace, hardest sound, or missing words).</li>
          </ul>
        `;
    }
  })();

  // Build final card HTML
  return `
    <div class="lux-metricTop">
      <div class="lux-metricTitle">${esc(meta.title)}</div>
      <div class="lux-metricBig">${esc(bigPct)}</div>
      <div class="lux-metricBlurb">${esc(meta.blurb || "")}</div>
    </div>

    ${section("This attempt (snapshot)", snapshot)}

    ${section("Timing & pacing (computed)", timingBlock)}

    ${section("Error patterns (computed)", errorBlock)}

    ${section("How to interpret this score", guidance)}

    <div class="lux-metricFoot">
      <span style="color:#64748b;">Tip:</span>
      These cards are “data + explanations.” The AI Coach stays separate and focuses on personalized strategy.
    </div>
  `;
}

function openMetricModal(metricKey, data) {
  // Kill any existing metric modal
  const existing = document.getElementById("lux-metric-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "lux-metric-modal";
  modal.className = "lux-metricModal";

  const card = document.createElement("div");
  card.className = "lux-metricCard";

  const closeBtn = document.createElement("button");
  closeBtn.className = "lux-metricClose";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = "&times;";

  function close() {
    try {
      document.body.style.overflow = "";
    } catch {}
    try {
      modal.remove();
    } catch {}
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener("keydown", onKey);

  card.appendChild(closeBtn);

  if (!data) {
    card.insertAdjacentHTML(
      "beforeend",
      `
      <div style="font-weight:900; font-size:1.05rem; color:#0f172a;">${esc(metricKey)}</div>
      <div style="margin-top:10px; color:#64748b; font-weight:800;">
        No attempt data yet. Record once to unlock details.
      </div>
    `
    );
  } else {
    card.insertAdjacentHTML("beforeend", buildModalHtml(metricKey, data));
  }

  modal.appendChild(card);
  document.body.appendChild(modal);

  try {
    document.body.style.overflow = "hidden";
  } catch {}
}

function shouldIgnoreClick(target) {
  // Prevent accidental opens when user clicks inside an already-open metric modal
  if (!target) return false;
  if (target.closest?.("#lux-metric-modal")) return true;
  return false;
}

function onDocClick(e) {
  const t = e.target;
  if (shouldIgnoreClick(t)) return;

  const hit = t?.closest?.("[data-score-key], .lux-scoreTile, .lux-scoreRing");
  if (!hit) return;

  const metricKey = resolveMetricKeyFromEl(hit);
  if (!metricKey) return;

  openMetricModal(metricKey, currentData);
}

function onDocKeyDown(e) {
  if (e.key !== "Enter" && e.key !== " ") return;

  const t = e.target;
  const hit = t?.closest?.("[data-score-key], .lux-scoreTile, .lux-scoreRing");
  if (!hit) return;

  const metricKey = resolveMetricKeyFromEl(hit);
  if (!metricKey) return;

  e.preventDefault();
  openMetricModal(metricKey, currentData);
}

export function setMetricModalData(data) {
  currentData = data || null;
  // every time fresh results render, refresh affordances
  decorateTiles();
}

export function initMetricScoreModals() {
  if (installed) return;
  installed = true;

  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onDocKeyDown, true);

  // first-time decoration for any already-present UI
  decorateTiles();
}
