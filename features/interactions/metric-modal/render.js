// features/interactions/metric-modal/render.js
// HTML builder for the metric explainer modal card.

import { fmtPct } from "../../../core/scoring/index.js";
import {
  getScorePackAny,
  hasRawWordDetail,
  deriveTimingStats,
  deriveErrorStats,
  prettyErrCounts,
  deriveCompletenessDiff,
  derivePhonemeClassSplit,
} from "./derive.js";
import { METRIC_META, esc, kv, section, sectionDetails, buildMeta } from "./render-parts/meta.js";
import { noteBlock, explainMetric, interpretMetric, helpCta } from "./render-parts/content.js";
import { uniqueMetricPanel } from "./render-parts/panels.js";
// Keep render.js as the stable shim: other modules import esc from here.
export { esc } from "./render-parts/meta.js";

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

  const note = hasRaw ? "" : noteBlock();

  const explainerBlock = section("How this score is measured", explainMetric(metricKey));

  const uniqueBlock = section(
    "What Lux found (unique)",
    uniqueMetricPanel(metricKey, { pack, timing, errs, diff, classSplit, isSummaryOnly })
  );

  // ✅ COLLAPSED BY DEFAULT (no “wall of text” on first glance)
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
