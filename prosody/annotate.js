// prosody/annotate.js
// Per-word tempo/gap classifiers + dev audit

import { ticksToSec, computeTimings, median } from "./core-calc.js";

export function classifyTempo(durationSec, medianDur) {
  if (!Number.isFinite(durationSec)) return "ok";
  if (Number.isFinite(medianDur) && medianDur > 0) {
    if (durationSec >= medianDur * 1.45) return "slow";
    if (durationSec <= medianDur * 0.6) return "fast";
    return "ok";
  }
  if (durationSec > 0.65) return "slow";
  if (durationSec < 0.3) return "fast";
  return "ok";
}

export function classifyGap(prevEnd, currStart) {
  var pe = ticksToSec(prevEnd) ?? (prevEnd == null ? null : Number(prevEnd));
  var cs = ticksToSec(currStart) ?? (currStart == null ? null : Number(currStart));
  
  if (!Number.isFinite(pe) || !Number.isFinite(cs)) return "ok";
  var gap = cs - pe;
  if (!Number.isFinite(gap) || gap < 0) return "ok";
  if (gap > 0.6) return "unexpected";
  if (gap >= 0.35) return "missing";
  return "ok";
}

export function devAuditProsody(data, limit) {
  limit = Number.isFinite(limit) ? limit : 10;
  var words = data?.NBest?.[0]?.Words || [];
  var timings = computeTimings(words);
  var med = median(
    timings
      .map(function (t) {
        return t.durationSec;
      })
      .filter(Number.isFinite)
  );
  var rows = [];
  var lastEnd = null;
  for (var i = 0; i < Math.min(words.length, limit); i++) {
    var w = words[i] || {};
    var t = timings[i] || {};
    var gap =
      Number.isFinite(lastEnd) && Number.isFinite(t.start)
        ? +(t.start - lastEnd).toFixed(3)
        : null;
    rows.push({
      i,
      word: w.Word,
      rawOffset: w.Offset,
      rawDuration: w.Duration,
      startSec: t.start,
      durSec: t.durationSec,
      endSec: t.end,
      gapSec: gap,
      tempo: classifyTempo(t.durationSec, med),
      gapClass:
        i > 0 && Number.isFinite(gap)
          ? gap > 0.6
            ? "unexpected"
            : gap >= 0.35
            ? "missing"
            : "ok"
          : "n/a",
    });
    lastEnd = t.end;
  }
  console.table(rows);
  var hugeGaps = rows.filter(function (r) {
    return r.gapSec != null && r.gapSec > 5;
  });
  if (hugeGaps.length) {
    console.warn(
      "⚠️ Suspiciously large gaps (>5s). This usually means a unit mismatch (ms vs ticks vs s) in Offset/Duration:",
      hugeGaps
    );
  }
  return rows;
}