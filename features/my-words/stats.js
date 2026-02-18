// features/my-words/stats.js

import { normalizeText } from "./normalize.js";
import { getColorConfig } from "../progress/progress-utils.js";
import { scoreClass as scoreClassCore } from "../../core/scoring/index.js";

function getAttemptText(a) {
  return (
    a?.reference_text ||
    a?.referenceText ||
    a?.reference ||
    a?.text ||
    a?.prompt ||
    a?.target_text ||
    a?.targetText ||
    ""
  );
}

function getAttemptTimeISO(a) {
  return (
    a?.ts ||
    a?.created_at ||
    a?.createdAt ||
    a?.timestamp ||
    a?.time ||
    a?.date ||
    null
  );
}

function toPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  // Handle both 0–1 and 0–100
  if (n >= 0 && n <= 1) return Math.round(n * 100);
  if (n >= 0 && n <= 100) return Math.round(n);
  return null;
}

function getOverallScore(a) {
  // ✅ Most likely in Lux attempt objects
  const v =
    a?.summary?.pron ??
    a?.summary?.pronunciation ??
    a?.summary?.pronScore ??
    a?.summary?.pron_score ??
    a?.scores?.overall ??
    a?.pronunciation_score ??
    a?.pronunciationScore ??
    a?.assessment?.pronunciationScore ??
    a?.result?.pronunciationScore ??
    a?.score ??
    null;

  return toPct(v);
}

function statusFromScore(lastScore, attemptCount) {
  if (!attemptCount) {
    return { label: "new", cls: "mw-new", color: "#94a3b8", bg: "#e2e8f0" };
  }
  if (lastScore == null) {
    return { label: "unknown", cls: "mw-unknown", color: "#94a3b8", bg: "#e2e8f0" };
  }

  const cfg = getColorConfig(lastScore);
  const tier = scoreClassCore(lastScore);
  const cls =
    tier === "score-good" ? "mw-good" : tier === "score-warn" ? "mw-warn" : "mw-bad";
  const label =
    tier === "score-good"
      ? "solid"
      : tier === "score-warn"
      ? "getting-there"
      : "needs-work";

  return { label, cls, color: cfg.color, bg: cfg.bg };
}

function computeTrend(lastScore, prevScores) {
  if (lastScore == null) return "—";
  const vals = (prevScores || []).filter((x) => Number.isFinite(x));
  if (!vals.length) return "—";

  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const d = lastScore - avg;

  if (d >= 5) return "↗";
  if (d <= -5) return "↘";
  return "→";
}

/**
 * Returns NEW entries array with computed fields:
 *  mw_attempts, mw_lastScore, mw_lastAt, mw_status, mw_color, mw_bg, mw_cls, mw_trend
 */
export function applyMyWordsStats(entries, attempts) {
  const list = Array.isArray(entries) ? entries : [];
  const hist = Array.isArray(attempts) ? attempts : [];

  const buckets = new Map();

  list.forEach((e) => {
    const norm = normalizeText(e?.normalized_text || e?.text || "");
    if (!norm) return;
    buckets.set(norm, []);
  });

  hist.forEach((a) => {
    const text = getAttemptText(a);
    if (!text) return;
    const norm = normalizeText(text);
    const b = buckets.get(norm);
    if (b) b.push(a);
  });

  const updated = list.map((e) => {
    const norm = normalizeText(e?.normalized_text || e?.text || "");
    const b = buckets.get(norm) || [];

    // Sort newest first
    b.sort((x, y) => {
      const tx = new Date(getAttemptTimeISO(x) || 0).getTime();
      const ty = new Date(getAttemptTimeISO(y) || 0).getTime();
      return ty - tx;
    });

    const attemptCount = b.length;
    const last = b[0] || null;

    const lastScore = last ? getOverallScore(last) : null;
    const lastAt = last ? getAttemptTimeISO(last) : null;

    const prevScores = b.slice(1, 4).map(getOverallScore).filter((n) => n != null);
    const trend = computeTrend(lastScore, prevScores);

    const status = statusFromScore(lastScore, attemptCount);

    return {
      ...e,
      mw_attempts: attemptCount,
      mw_lastScore: lastScore,
      mw_lastAt: lastAt,
      mw_status: status.label,
      mw_color: status.color,
      mw_bg: status.bg,
      mw_cls: status.cls,
      mw_trend: trend,
    };
  });

  return updated;
}
