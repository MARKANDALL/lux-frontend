// features/my-words/stats.js

import { normalizeText } from "./normalize.js";

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
    a?.created_at ||
    a?.createdAt ||
    a?.timestamp ||
    a?.ts ||
    a?.time ||
    a?.date ||
    null
  );
}

function getOverallScore(a) {
  const v =
    a?.overall_score ??
    a?.overallScore ??
    a?.scores?.overall ??
    a?.scores?.pronunciation ??
    a?.pronunciation_score ??
    a?.pronunciationScore ??
    a?.assessment?.pronunciationScore ??
    a?.result?.pronunciationScore ??
    a?.score ??
    null;

  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function statusFromScore(lastScore, attemptCount) {
  if (!attemptCount) return { label: "new", color: "rgba(100,100,100,.35)" };
  if (lastScore == null) return { label: "unknown", color: "rgba(100,100,100,.35)" };
  if (lastScore < 60) return { label: "needs-work", color: "rgba(220, 60, 60, .70)" };
  if (lastScore < 80) return { label: "getting-there", color: "rgba(230, 160, 40, .75)" };
  return { label: "solid", color: "rgba(40, 170, 90, .75)" };
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
 *  mw_attempts, mw_lastScore, mw_lastAt, mw_status, mw_color, mw_trend
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
      mw_trend: trend,
    };
  });

  return updated;
}
