// features/interactions/metric-modal/render.js
// HTML builder for the metric explainer modal card.

import {
  getScorePack,
  deriveTimingStats,
  deriveErrorStats,
  deriveCompletenessDiff,
  derivePhonemeClassSplit,
} from "./derive.js";
import { fmtPct } from "../../../core/scoring/index.js";
import { METRIC_META, esc } from "./meta.js";
import {
  explainMetric,
  interpretMetric,
  uniqueMetricPanel,
  helpCta,
} from "./render-parts/panels.js";

function section(title, body) {
  return `
    <section class="lux-metricSection">
      <h3 class="lux-metricSectionTitle">${esc(title)}</h3>
      <div class="lux-metricSectionBody">${body}</div>
    </section>
  `;
}

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

  const interpretBlock = sectionDetails("How to interpret it", interpretMetric(metricKey, pack), {
    open: false,
  });

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

export { METRIC_META, esc };
