// features/interactions/metric-modal/render-parts/panels/unique.js
// Renders the “What Lux found (unique)” panel for each metric, plus its helper utilities.

import { esc } from "../meta.js";
import { prettyErrCounts } from "../../derive.js";

function scoreLabel(score) {
  if (!Number.isFinite(score)) return "";
  return `${Math.round(score)}%`;
}

function lowestDriverKey(pack) {
  const p = pack || {};
  const five = [
    ["Accuracy", p.accuracy],
    ["Fluency", p.fluency],
    ["Completeness", p.completeness],
    ["Prosody", p.prosody],
    ["Pronunciation", p.pronunciation],
  ].filter(([, v]) => Number.isFinite(v));
  const lowest = five.slice().sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0))[0];
  return lowest?.[0] ?? null;
}

function lowestDriverScore(pack, key) {
  const p = pack || {};
  if (!key) return null;
  const map = {
    Accuracy: p.accuracy,
    Fluency: p.fluency,
    Completeness: p.completeness,
    Prosody: p.prosody,
    Pronunciation: p.pronunciation,
  };
  const v = map[key];
  return Number.isFinite(v) ? v : null;
}

function prettyWeakShare(x) {
  if (x == null) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

function normalizeErrs(errs) {
  if (!errs) return null;

  // If deriveErrorStats already returns the "new" shape, use it.
  if (Array.isArray(errs.topPh) || Array.isArray(errs.topW) || errs.typeCounts) {
    return {
      topPh: Array.isArray(errs.topPh) ? errs.topPh : [],
      topW: Array.isArray(errs.topW) ? errs.topW : [],
      typeCounts: errs.typeCounts || null,
    };
  }

  // Otherwise, adapt the existing deriveErrorStats() output.
  const topPh = (errs.worstPhonemes || [])
    .slice(0, 6)
    .map((x) => ({
      p: x?.phoneme || x?.p || "",
      s: Number.isFinite(x?.score) ? x.score : Number.isFinite(x?.s) ? x.s : NaN,
    }))
    .filter((x) => x.p);

  const topW = (errs.worstWords || [])
    .slice(0, 8)
    .map((x) => ({
      w: x?.word || x?.w || "",
      s: Number.isFinite(x?.score) ? x.score : Number.isFinite(x?.s) ? x.s : NaN,
    }))
    .filter((x) => x.w);

  // We don't know exact keys, but keep counts if present.
  const typeCounts = errs.errCounts || errs.typeCounts || null;

  return { topPh, topW, typeCounts };
}

export function uniqueMetricPanel(metricKey, ctx = {}) {
  const pack = ctx.pack || {};
  const timing = ctx.timing || null;
  const errs = normalizeErrs(ctx.errs || null);
  const diff = ctx.diff || null;
  const classSplit = ctx.classSplit || null;
  const isSummaryOnly = !!ctx.isSummaryOnly;

  const rawDetailMissing = isSummaryOnly
    ? `<div class="lux-muted">Raw word/phoneme detail isn’t available for this saved attempt.</div>`
    : "";

  // Overall-only: compute what pulled the aggregate down.
  const lowestKey = lowestDriverKey(pack);
  const lowestScore = lowestDriverScore(pack, lowestKey);
  const lowestScoreLabel = scoreLabel(lowestScore);

  const overallDriver =
    metricKey === "Overall"
      ? `
      <div class="lux-metricWhatFoundGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Lowest driver</div>
          <div class="lux-kv-value">${esc(String(lowestKey || "—"))}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Lowest score</div>
          <div class="lux-kv-value">${esc(lowestScoreLabel || "—")}</div>
        </div>
      </div>
    `
      : "";

  // Mini reveal: error fingerprint (weak sounds/words + error types).
  const hasErrs =
    !!errs &&
    ((errs.topPh && errs.topPh.length) ||
      (errs.topW && errs.topW.length) ||
      (errs.typeCounts && Object.keys(errs.typeCounts).length));

  const topPhList = (errs?.topPh || [])
    .slice(0, 5)
    .map((x) => x?.p || x?.phoneme || "")
    .filter(Boolean)
    .join(", ");

  const topWList = (errs?.topW || [])
    .slice(0, 6)
    .map((x) => x?.w || x?.word || "")
    .filter(Boolean)
    .join(", ");

  const errTypes = hasErrs ? prettyErrCounts(errs?.typeCounts || null) : "";

  const errsReveal = (() => {
    if (!hasErrs) return "";
    return `
      <details class="lux-miniReveal">
        <summary class="lux-miniRevealTitle">
          <span class="lux-metricSummaryTitle">Show weak sounds / words</span>
          <span class="lux-metricSummaryHint" aria-hidden="true">Click to expand</span>
          <span class="lux-metricSummaryCaret" aria-hidden="true">▸</span>
        </summary>
        <div class="lux-miniRevealBody">
          <div class="lux-metricWhatFoundGrid">
            <div class="lux-kv">
              <div class="lux-kv-label">Top weak sounds</div>
              <div class="lux-kv-value">${esc(topPhList || "—")}</div>
            </div>
            <div class="lux-kv">
              <div class="lux-kv-label">Top weak words</div>
              <div class="lux-kv-value">${esc(topWList || "—")}</div>
            </div>
            <div class="lux-kv" style="grid-column:1 / -1;">
              <div class="lux-kv-label">Error types</div>
              <div class="lux-kv-value">${esc(errTypes || "—")}</div>
            </div>
          </div>
        </div>
      </details>
    `;
  })();

  // Completeness: show missing/extra vs reference (no “lowest driver” preface)
  if (metricKey === "Completeness") {
    if (!diff) {
      return `<div class="lux-muted">Reference text not available for this attempt.</div>`;
    }

    const refCount = Number.isFinite(diff?.refCount) ? diff.refCount : null;
    const hypCount = Number.isFinite(diff?.hypCount) ? diff.hypCount : null;
    const missingCount = Number.isFinite(diff?.missingCount) ? diff.missingCount : null;
    const extraCount = Number.isFinite(diff?.extraCount) ? diff.extraCount : null;

    const missingPreview = Array.isArray(diff?.missingWords)
      ? diff.missingWords.slice(0, 10).join(", ")
      : Array.isArray(diff?.missing)
      ? diff.missing.slice(0, 10).join(", ")
      : "";

    const extraPreview = Array.isArray(diff?.extraWords)
      ? diff.extraWords.slice(0, 10).join(", ")
      : Array.isArray(diff?.extra)
      ? diff.extra.slice(0, 10).join(", ")
      : "";

    return `
      <div class="lux-metricWhatFoundGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Expected words</div>
          <div class="lux-kv-value">${esc(refCount != null ? String(refCount) : "—")}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Spoken words</div>
          <div class="lux-kv-value">${esc(hypCount != null ? String(hypCount) : "—")}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Missing</div>
          <div class="lux-kv-value">${esc(missingCount != null ? String(missingCount) : "—")}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Extra</div>
          <div class="lux-kv-value">${esc(extraCount != null ? String(extraCount) : "—")}</div>
        </div>
        ${
          missingPreview
            ? `
          <div class="lux-kv" style="grid-column:1 / -1;">
            <div class="lux-kv-label">Missing words (sample)</div>
            <div class="lux-kv-value">${esc(missingPreview)}</div>
          </div>
        `
            : ""
        }
        ${
          extraPreview
            ? `
          <div class="lux-kv" style="grid-column:1 / -1;">
            <div class="lux-kv-label">Extra words (sample)</div>
            <div class="lux-kv-value">${esc(extraPreview)}</div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  // Accuracy: vowel vs consonant weakness split (+ mini reveal)
  if (metricKey === "Accuracy") {
    const vShare01 = Number(classSplit?.weakShareVowels);
    const cShare01 = Number(classSplit?.weakShareConsonants);

    const vPct = Number.isFinite(vShare01)
      ? vShare01 * 100
      : Number.isFinite(classSplit?.vowelsWeakSharePct)
      ? classSplit.vowelsWeakSharePct
      : NaN;
    const cPct = Number.isFinite(cShare01)
      ? cShare01 * 100
      : Number.isFinite(classSplit?.consWeakSharePct)
      ? classSplit.consWeakSharePct
      : NaN;

    const splitBlock = classSplit
      ? `
      <div class="lux-metricWhatFoundGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Weak vowels</div>
          <div class="lux-kv-value">${esc(prettyWeakShare(vPct))}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Weak consonants</div>
          <div class="lux-kv-value">${esc(prettyWeakShare(cPct))}</div>
        </div>
      </div>
    `
      : "";

    if (splitBlock || errsReveal) return `${splitBlock}${errsReveal}`;
    return rawDetailMissing || `<div class="lux-muted">Detail not available for this attempt.</div>`;
  }

  // Pronunciation: keep focused — show weak sounds/words behind reveal
  if (metricKey === "Pronunciation") {
    return errsReveal || rawDetailMissing || `<div class="lux-muted">Detail not available for this attempt.</div>`;
  }

  // Fluency/Prosody/Overall: timing & pacing sanity + pause ratios (no lowest-driver box except Overall)
  if (metricKey === "Fluency" || metricKey === "Prosody" || metricKey === "Overall") {
    if (!timing?.isSane) {
      return metricKey === "Overall"
        ? `${overallDriver}<div class="lux-muted">Timing stats not available for this attempt.</div>`
        : `<div class="lux-muted">Timing stats not available for this attempt.</div>`;
    }

    return `
      ${metricKey === "Overall" ? overallDriver : ""}
      <div class="lux-metricWhatFoundGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Words</div>
          <div class="lux-kv-value">${esc(String(timing.wordsCount ?? "—"))}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Duration</div>
          <div class="lux-kv-value">${esc(
            timing.durationSec != null ? `${Number(timing.durationSec).toFixed(2)}s` : "—"
          )}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Rate</div>
          <div class="lux-kv-value">${esc(
            timing.wpm != null
              ? `${Math.round(Number(timing.wpm))} wpm`
              : timing.wordsPerMinute != null
              ? `${Math.round(Number(timing.wordsPerMinute))} wpm`
              : "—"
          )}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Pauses</div>
          <div class="lux-kv-value">${esc(String(timing.pauseCount ?? "—"))}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Pause ratio</div>
          <div class="lux-kv-value">${esc(
            timing.pauseRatio != null ? `${Math.round(Number(timing.pauseRatio) * 100)}%` : "—"
          )}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Longest pause</div>
          <div class="lux-kv-value">${esc(
            timing.longestPause != null ? `${Number(timing.longestPause).toFixed(2)}s` : "—"
          )}</div>
        </div>
      </div>
    `;
  }

  // Default: concise error fingerprint (if present)
  if (hasErrs) {
    return `
      <div class="lux-metricWhatFoundGrid">
        <div class="lux-kv">
          <div class="lux-kv-label">Top weak sounds</div>
          <div class="lux-kv-value">${esc(topPhList || "—")}</div>
        </div>
        <div class="lux-kv">
          <div class="lux-kv-label">Top weak words</div>
          <div class="lux-kv-value">${esc(topWList || "—")}</div>
        </div>
        <div class="lux-kv" style="grid-column:1 / -1;">
          <div class="lux-kv-label">Error types</div>
          <div class="lux-kv-value">${esc(errTypes || "—")}</div>
        </div>
      </div>
    `;
  }

  return metricKey === "Overall" ? overallDriver : rawDetailMissing;
}
