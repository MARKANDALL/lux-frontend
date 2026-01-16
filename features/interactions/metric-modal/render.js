// features/interactions/metric-modal/render.js
// HTML builder for the metric explainer modal card.

import { fmtPct } from "../../../core/scoring/index.js";
import { getScorePack, deriveTimingStats, deriveErrorStats, prettyErrCounts } from "./derive.js";

export const METRIC_META = {
  Overall: {
    title: "Overall",
    blurb:
      "Your overall score is an aggregate of the five core categories below. It gives a quick summary of this attempt.",
  },
  Pronunciation: {
    title: "Pronunciation",
    blurb: "A high-level pronunciation score based on how accurately you produced the expected sounds overall.",
  },
  Accuracy: {
    title: "Accuracy",
    blurb: "How close your pronunciation was to the expected target sounds (segment-by-segment accuracy).",
  },
  Fluency: {
    title: "Fluency",
    blurb: "How smooth and natural your speech flow was—often affected by pausing, stopping, and restarts.",
  },
  Completeness: {
    title: "Completeness",
    blurb: "Whether you said all the words from the reference (and whether anything was skipped or extra).",
  },
  Prosody: {
    title: "Prosody",
    blurb: "Stress, rhythm, intonation, and pacing — how your speech “sounds as a whole,” not just individual sounds.",
  },
};

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

export function buildModalHtml(metricKey, data) {
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
