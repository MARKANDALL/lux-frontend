// features/progress/rollups.js
// Pure rollups: attempts -> totals + trouble sounds/words + trend + session summaries.

import { norm } from "../../src/data/phonemes/core.js";

import {
  num,
  pickAzure,
  pickSummary,
  pickPassageKey,
  pickSessionId,
  pickTS,
  localDayKey,
  daysAgoFrom,
  priorityFromFull,
  getAttemptScore,
} from "./rollups/rollupsUtils.js";

import { buildSnapshots } from "./rollups/rollupsSnapshots.js";
import { accumulateRollups } from "./rollups/rollupsAccumulate.js";
import { buildMetrics } from "./rollups/rollupsMetrics.js";
import { buildPostProcess } from "./rollups/rollupsPostProcess.js";

export { getAttemptScore };

export function computeRollups(attempts = [], opts = {}) {
  const windowDays = Number(opts.windowDays || 30);

  // Optional thresholds (dashboard defaults stay strict; modal can loosen)
  const minWordCountRaw = Number(opts.minWordCount);
  const minPhonCountRaw = Number(opts.minPhonCount);

  const minWordCount = Number.isFinite(minWordCountRaw)
    ? Math.max(1, Math.floor(minWordCountRaw))
    : 2;
  const minPhonCount = Number.isFinite(minPhonCountRaw)
    ? Math.max(1, Math.floor(minPhonCountRaw))
    : 3;

  // Plan A: metric-specific trend capture (Prosody later)
  const METRICS = [
    ["acc", "Accuracy"],
    ["flu", "Fluency"],
    ["comp", "Completeness"],
    ["pron", "Pronunciation"],
  ];

  const {
    phon,
    words,
    byDay,
    sessions,
    byPassage,
    phonDays,
    wordDays,
    byDayMetric,
    seriesMetric,
    lastTS,
    scoreSum,
    scoreCount,
  } = accumulateRollups(attempts, { METRICS });

  const { bestDayTS, bestDayScore, topPassageKey, topPassageCount } =
    buildSnapshots({ byDay, byPassage });

  const { troublePhonemesAll, troubleWordsAll, trend, sessionArr } =
    buildPostProcess({
      phon,
      words,
      byDay,
      sessions,
      phonDays,
      wordDays,
      windowDays,
      minPhonCount,
      minWordCount,
      localDayKey,
      priorityFromFull,
    });

  const metrics = buildMetrics({
    METRICS,
    byDayMetric,
    seriesMetric,
    windowDays,
    localDayKey,
    num,
  });

  return {
    totals: {
      attempts: attempts.length,
      sessions: sessions.size,
      lastTS: lastTS || null,
      avgScore: scoreCount ? scoreSum / scoreCount : 0,

      // Snapshot
      bestDayTS,
      bestDayScore,
      topPassageKey,
      topPassageCount,
    },
    trouble: {
      phonemesAll: troublePhonemesAll,
      wordsAll: troubleWordsAll,
    },
    trend,
    metrics, // ✅ NEW STRUCTURE
    sessions: sessionArr,
  };
}
