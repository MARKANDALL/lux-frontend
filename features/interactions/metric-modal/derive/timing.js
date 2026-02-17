// features/interactions/metric-modal/derive/timing.js

import { computeTimings, median } from "../../../../prosody/core-calc.js";
import { classifyTempo } from "../../../../prosody/annotate.js";
import { PAUSE_MIN_SEC, pickWords } from "./utils.js";

export function deriveTimingStats(data) {
  const words = pickWords(data);
  if (!Array.isArray(words) || !words.length) return null;

  const timings = computeTimings(words);

  const starts = timings.map((t) => t?.start).filter(Number.isFinite);
  const ends   = timings.map((t) => t?.end).filter(Number.isFinite);

  const minStart = starts.length ? Math.min(...starts) : null;
  const maxEnd   = ends.length   ? Math.max(...ends)   : null;

  let spanSec = null;
  if (Number.isFinite(minStart) && Number.isFinite(maxEnd) && maxEnd > minStart) {
    spanSec = maxEnd - minStart;
  }

  let pauseCount  = 0;
  let pauseTotal  = 0;
  let longestPause = 0;

  for (let i = 1; i < timings.length; i++) {
    const prevEnd   = timings[i - 1]?.end;
    const currStart = timings[i]?.start;
    if (!Number.isFinite(prevEnd) || !Number.isFinite(currStart)) continue;

    const gap = currStart - prevEnd;
    if (gap >= PAUSE_MIN_SEC) {
      pauseCount++;
      pauseTotal += gap;
      longestPause = Math.max(longestPause, gap);
    }
  }

  const wordsCount = words.length;

  const wps = Number.isFinite(spanSec) && spanSec > 0 ? wordsCount / spanSec : null;
  const wpm = Number.isFinite(wps) ? wps * 60 : null;

  const articulationSec =
    Number.isFinite(spanSec) && spanSec > 0 ? Math.max(0, spanSec - pauseTotal) : null;

  const arWps =
    Number.isFinite(articulationSec) && articulationSec > 0
      ? wordsCount / articulationSec
      : null;
  const arWpm = Number.isFinite(arWps) ? arWps * 60 : null;

  const durs = timings.map((t) => t?.durationSec).filter(Number.isFinite);
  const med  = median(durs);

  const tempoMix = { fast: 0, ok: 0, slow: 0 };
  for (const d of durs) {
    const label = classifyTempo(d, med);
    tempoMix[label] = (tempoMix[label] || 0) + 1;
  }

  // ✅ Sanity + pause ratios (catch garbage spans / WPM)
  const pauseRatio        = spanSec        ? pauseTotal / spanSec        : null;
  const pauseToSpeechRatio = articulationSec ? pauseTotal / articulationSec : null;

  const isSane =
    Number.isFinite(spanSec) &&
    spanSec > 0.25 &&
    spanSec < 60 &&
    (!wpm || (wpm > 20 && wpm < 400));

  return {
    wordsCount,
    spanSec,
    wpm,
    wps,
    articulationSec,
    arWpm,
    pauseCount,
    pauseTotal,
    longestPause,
    tempoMix,
    pauseRatio,
    pauseToSpeechRatio,
    isSane,
  };
}