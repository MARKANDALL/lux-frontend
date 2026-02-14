// features/interactions/metric-modal/render-parts/meta.js
// One-line: Metric modal shared constants + HTML/section helper builders.

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

export function kv(label, val) {
  return `
    <div class="lux-metricKV">
      <div class="lux-metricKV-k">${esc(label)}</div>
      <div class="lux-metricKV-v">${esc(val)}</div>
    </div>
  `;
}

/** Standard section block */
export function section(title, body) {
  return `
    <section class="lux-metricSection">
      <h3 class="lux-metricSectionTitle">${esc(title)}</h3>
      <div class="lux-metricSectionBody">${body}</div>
    </section>
  `;
}

/** Collapsible (details/summary) section block */
export function sectionDetails(title, body, { open = false } = {}) {
  return `
    <details class="lux-metricSection lux-metricSection--details" ${open ? "open" : ""}>
      <summary class="lux-metricSectionTitle">
        <span class="lux-metricSummaryTitle">${esc(title)}</span>
        <span class="lux-metricSummaryHint" aria-hidden="true">Click to expand</span>
        <span class="lux-metricSummaryCaret" aria-hidden="true">▸</span>
      </summary>
      <div class="lux-metricSectionBody">${body}</div>
    </details>
  `;
}

export function buildMeta(metricKey, pack) {
  const p = pack || {};
  const base = METRIC_META[metricKey] || { title: metricKey, blurb: "" };

  const valMap = {
    Overall: p.overallAgg,
    Pronunciation: p.pronunciation,
    Accuracy: p.accuracy,
    Fluency: p.fluency,
    Completeness: p.completeness,
    Prosody: p.prosody,
  };

  return {
    title: base.title || metricKey,
    blurb: base.blurb || "",
    value: valMap[metricKey],
  };
}
