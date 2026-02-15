// features/interactions/metric-modal/render.js
// HTML builder for the metric explainer modal card.

import {
  getScorePackAny,
  hasRawWordDetail,
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

function noteBlock() {
  return `
    <div class="lux-metricNote">
      <div class="lux-metricNoteTitle">Note</div>
      <div class="lux-metricNoteBody">
        This attempt was saved without raw word/phoneme detail, so Lux can show the score + explanation,
        but not the deeper per-word/per-phoneme breakdown here.
      </div>
    </div>
  `;
}

export function buildModalHtml(metricKey, data) {
  const ctx =
    data && typeof data === "object" && ("azureResult" in data || "summary" in data)
      ? {
          azureResult: data.azureResult || null,
          summary: data?.summary || null,
          referenceText: data.referenceText || "",
        }
      : { azureResult: data || null, summary: null, referenceText: "" };

  const azure = ctx.azureResult;
  const referenceText = ctx.referenceText || "";

  const pack = getScorePackAny(azure, ctx.summary);
  const meta = buildMeta(metricKey, pack);

  const timing = azure ? deriveTimingStats(azure) : null;
  const errs = azure ? deriveErrorStats(azure) : null;
  const diff = referenceText ? deriveCompletenessDiff(referenceText, azure) : null;
  const classSplit = azure ? derivePhonemeClassSplit(azure) : null;

  const score = meta.value;
  const hasRaw = hasRawWordDetail(azure);
  const isSummaryOnly = !hasRaw;

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

  const note = hasRaw ? "" : noteBlock();

  const explainerBlock = section("How this score is measured", explainMetric(metricKey));

  const uniqueBlock = section(
    "What Lux found (unique)",
    uniqueMetricPanel(metricKey, { pack, timing, errs, diff, classSplit, isSummaryOnly })
  );

  const interpretBlock = sectionDetails("How to interpret it", interpretMetric(metricKey, pack), {
    open: false,
  });

  const helpBlock = section("Need help?", helpCta(metricKey));

  return `
    ${top}

    ${note}

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
