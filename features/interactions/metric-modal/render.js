// features/interactions/metric-modal/render.js
// HTML builder for the metric explainer modal card.

import { fmtPct } from "../../../core/scoring/index.js";
import {
  getScorePack,
  deriveTimingStats,
  deriveErrorStats,
  prettyErrCounts,
  deriveCompletenessDiff,
  derivePhonemeClassSplit,
} from "./derive.js";

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

/* ============================================================================
   Section helpers
============================================================================ */

/** Standard section block */
function section(title, body) {
  return `
    <section class="lux-metricSection">
      <h3 class="lux-metricSectionTitle">${esc(title)}</h3>
      <div class="lux-metricSectionBody">${body}</div>
    </section>
  `;
}

/** Collapsible (details/summary) section block */
function sectionDetails(title, body, { open = false } = {}) {
  return `
    <details class="lux-metricSection lux-metricSection--details" ${open ? "open" : ""}>
      <summary class="lux-metricSectionTitle">${esc(title)}</summary>
      <div class="lux-metricSectionBody">${body}</div>
    </details>
  `;
}

function buildMeta(metricKey, pack) {
  const base = METRIC_META[metricKey] || { title: metricKey, blurb: "" };

  const valMap = {
    Overall: pack.overallAgg,
    Pronunciation: pack.pronunciation,
    Accuracy: pack.accuracy,
    Fluency: pack.fluency,
    Completeness: pack.completeness,
    Prosody: pack.prosody,
  };

  return {
    title: base.title || metricKey,
    blurb: base.blurb || "",
    value: valMap[metricKey],
  };
}

export function buildModalHtml(metricKey, data) {
  const azure = data?.azureResult || data;
  const referenceText = data?.referenceText || "";

  const pack = getScorePack(azure);
  const meta = buildMeta(metricKey, pack);

  const timing = deriveTimingStats(azure);
  const errs = deriveErrorStats(azure);
  const diff = deriveCompletenessDiff(referenceText, azure);
  const classSplit = derivePhonemeClassSplit(azure);

  const score = meta.value;

  // ✅ TOP BLOCK (with subtle meter bar)
  const top = `
    <div class="lux-metricTop">
      <div class="lux-metricTitle">${esc(metricKey)}</div>
      <div class="lux-metricScore">${esc(fmtPct(score))}</div>
      <div class="lux-metricMeter" aria-hidden="true">
        <div class="lux-metricMeterFill" style="width:${Math.max(
          0,
          Math.min(100, Number(score) || 0)
        )}%"></div>
      </div>
      <div class="lux-metricBlurb">${esc(meta.blurb || "")}</div>
    </div>
  `;

  const explainerBlock = section("How this score is measured", explainMetric(metricKey));

  const uniqueBlock = section(
    "What Lux found (unique)",
    uniqueMetricPanel(metricKey, { pack, timing, errs, diff, classSplit })
  );

  // ✅ COLLAPSED BY DEFAULT (no “wall of text” on first glance)
  const interpretBlock = sectionDetails(
    "How to interpret it",
    interpretMetric(metricKey, pack),
    { open: false }
  );

  const helpBlock = section("Need help?", helpCta(metricKey));

  return `
    ${top}

    ${explainerBlock}
    ${uniqueBlock}
    ${interpretBlock}
    ${helpBlock}

    <div class="lux-metricFoot">
      <span style="color:#64748b;">Tip:</span>
      These cards are “data + explanations.” The AI Coach stays separate and focuses on personalized strategy.
    </div>
  `;
}

/* ============================================================================
   New helpers (metric-specific modal sections)
============================================================================ */

function bullets(items = []) {
  return `<ul class="lux-metricBullets">${(items || [])
    .map((x) => `<li>${esc(x)}</li>`)
    .join("")}</ul>`;
}

function explainMetric(metricKey) {
  const map = {
    Overall: {
      simple: [
        "A quick combined snapshot of all five categories.",
        "Not a separate measurement — it’s just a simple blend.",
        "Use it to track progress, then click a tile for specifics.",
      ],
      advanced:
        "Lux currently computes Overall as an equal-weight mean of Accuracy, Fluency, Completeness, Prosody, and Pronunciation.",
    },
    Pronunciation: {
      simple: [
        "A big-picture score of how close your sounds were overall.",
        "More global than Accuracy (which is phoneme-by-phoneme).",
        "Great for tracking improvement across attempts.",
      ],
      advanced:
        "Pronunciation summarizes overall sound quality and is often influenced by both segment accuracy and prosodic naturalness.",
    },
    Accuracy: {
      simple: [
        "How correct each sound (phoneme) was compared to the target.",
        "Sensitive to substitutions, deletions, and insertions.",
        "Best metric for pinpointing specific sound errors.",
      ],
      advanced:
        "Accuracy reflects closeness to expected target phonemes and is the most “microscopic” score of the five.",
    },
    Fluency: {
      simple: [
        "Smoothness: pauses, stops, and interruptions between words.",
        "Fluency is NOT about speaking fast — it’s about flow.",
        "A few long pauses can drop this score quickly.",
      ],
      advanced:
        "Fluency primarily reflects silent breaks and disfluency patterns across the utterance.",
    },
    Completeness: {
      simple: [
        "Did you say all expected words in the reference text?",
        "Skipping small words (the / a / to) can lower this a lot.",
        "Most improved by slowing down and reading fully.",
      ],
      advanced:
        "Completeness is essentially a reference-match ratio: spoken words vs expected words.",
    },
    Prosody: {
      simple: [
        "How natural your speech sounds as a whole.",
        "Includes stress, rhythm, intonation, and pacing.",
        "You can have great sounds but low prosody (robotic rhythm).",
      ],
      advanced:
        "Prosody relates to timing patterns, emphasis, and pitch movement — not just correctness of phonemes.",
    },
  };

  const info = map[metricKey] || map.Overall;
  return `
    ${bullets(info.simple)}
    <details class="lux-metricDetails">
      <summary>More technical</summary>
      <div class="lux-metricDetailsBody">${esc(info.advanced)}</div>
    </details>
  `;
}

function interpretMetric(metricKey, pack) {
  void pack; // pack may be used later for more personalized tips

  const tips = {
    Overall: [
      "Click the lowest tile — that’s what pulled the overall down most.",
      "Big gaps between tiles = uneven skill profile (totally normal).",
    ],
    Pronunciation: [
      "High Pronunciation + low Prosody usually means clear sounds but “flat” rhythm.",
      "High Prosody + low Accuracy usually means good flow but wrong consonants/vowels.",
    ],
    Accuracy: [
      "If Accuracy is low, focus on 1–2 sounds at a time (not everything).",
      "Look for patterns: vowels vs consonants vs voicing.",
    ],
    Fluency: [
      "A few long pauses hurt more than many tiny pauses.",
      "Try chunking phrases (meaning groups) instead of word-by-word starts.",
    ],
    Completeness: [
      "If Completeness is low, slow down and prioritize saying every word.",
      "Function words matter: the / a / to / of / in.",
    ],
    Prosody: [
      "Prosody improves fastest when you imitate short phrases with rhythm.",
      "Aim for natural emphasis, not perfect speed.",
    ],
  };

  return bullets(tips[metricKey] || tips.Overall);
}

function uniqueMetricPanel(metricKey, ctx) {
  const { pack, timing, errs, diff, classSplit } = ctx;

  // Common “quick insight” for all: what’s lowest?
  const five = [
    ["Accuracy", pack.accuracy],
    ["Fluency", pack.fluency],
    ["Completeness", pack.completeness],
    ["Prosody", pack.prosody],
    ["Pronunciation", pack.pronunciation],
  ].filter(([, v]) => v != null);

  const lowest = five.slice().sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0))[0];

  const base = `
    <div class="lux-metricKVGrid">
      <div class="lux-kv">
        <div class="lux-kv-label">Lowest driver</div>
        <div class="lux-kv-value">${esc(lowest?.[0] || "—")}</div>
      </div>
      <div class="lux-kv">
        <div class="lux-kv-label">Lowest score</div>
        <div class="lux-kv-value">${esc(fmtPct(lowest?.[1]))}</div>
      </div>
    </div>
  `;

  // Completeness: show missing/extra vs reference
  if (metricKey === "Completeness") {
    if (!diff) {
      return base + `<div class="lux-muted">Reference text not available for this attempt.</div>`;
    }

    return (
      base +
      `
      <div class="lux-metricKVGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Expected words</div>
          <div class="lux-kv-value">${esc(String(diff.refCount))}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">You said</div>
          <div class="lux-kv-value">${esc(String(diff.saidCount))}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Missing</div>
          <div class="lux-kv-value">${
            diff.missing.length ? esc(diff.missing.join(", ")) : "None ✅"
          }</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Extra</div>
          <div class="lux-kv-value">${
            diff.extra.length ? esc(diff.extra.join(", ")) : "None ✅"
          }</div>
        </div>
      </div>
    `
    );
  }

  // Accuracy/Pronunciation: vowel vs consonant weakness split
  if (metricKey === "Accuracy" || metricKey === "Pronunciation") {
    if (!classSplit) return base;

    return (
      base +
      `
      <div class="lux-metricKVGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Weak vowels</div>
          <div class="lux-kv-value">${esc(
            `${Math.round(classSplit.weakShareVowels * 100)}%`
          )}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Weak consonants</div>
          <div class="lux-kv-value">${esc(
            `${Math.round(classSplit.weakShareConsonants * 100)}%`
          )}</div>
        </div>
      </div>
    `
    );
  }

  // Fluency/Prosody/Overall: timing & pacing sanity + pause ratios
  if (metricKey === "Fluency" || metricKey === "Prosody" || metricKey === "Overall") {
    if (!timing?.isSane) {
      return base + `<div class="lux-muted">Timing stats not available for this attempt.</div>`;
    }

    return (
      base +
      `
      <div class="lux-metricKVGrid">
        <div class="lux-kv"><div class="lux-kv-label">Words</div><div class="lux-kv-value">${esc(
          String(timing.wordsCount)
        )}</div></div>
        <div class="lux-kv"><div class="lux-kv-label">Span</div><div class="lux-kv-value">${esc(
          timing.spanSec != null ? `${timing.spanSec.toFixed(2)}s` : "—"
        )}</div></div>
        <div class="lux-kv"><div class="lux-kv-label">WPM</div><div class="lux-kv-value">${esc(
          timing.wpm != null ? `${timing.wpm.toFixed(0)}` : "—"
        )}</div></div>
        <div class="lux-kv"><div class="lux-kv-label">Pause count</div><div class="lux-kv-value">${esc(
          String(timing.pauseCount)
        )}</div></div>
        <div class="lux-kv"><div class="lux-kv-label">Pause share</div><div class="lux-kv-value">${esc(
          timing.pauseRatio != null ? `${Math.round(timing.pauseRatio * 100)}%` : "—"
        )}</div></div>
        <div class="lux-kv"><div class="lux-kv-label">Longest pause</div><div class="lux-kv-value">${esc(
          timing.longestPause != null ? `${timing.longestPause.toFixed(2)}s` : "—"
        )}</div></div>
      </div>
    `
    );
  }

  // Default: concise error fingerprint (if present)
  if (errs) {
    const topPh = (errs.worstPhonemes || [])
      .slice(0, 3)
      .map((x) => x.phoneme)
      .filter(Boolean)
      .join(", ");

    const topW = (errs.worstWords || [])
      .slice(0, 3)
      .map((x) => x.word)
      .filter(Boolean)
      .join(", ");

    const errTypes = prettyErrCounts(errs.errCounts);

    return (
      base +
      `
      <div class="lux-metricKVGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Top weak sounds</div>
          <div class="lux-kv-value">${esc(topPh || "—")}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Top weak words</div>
          <div class="lux-kv-value">${esc(topW || "—")}</div>
        </div>
        <div class="lux-kv" style="grid-column:1 / -1;">
          <div class="lux-kv-label">Error types</div>
          <div class="lux-kv-value">${esc(errTypes || "—")}</div>
        </div>
      </div>
    `
    );
  }

  return base;
}

function helpCta(metricKey) {
  const topic = String(metricKey || "").toLowerCase();
  return `
    <button class="lux-helpBtn" type="button"
      onclick="window.openLuxHelp ? window.openLuxHelp('${esc(topic)}') : alert('Lux Help is coming soon.')">
      Ask Lux Help about ${esc(metricKey)} →
    </button>
  `;
}
  