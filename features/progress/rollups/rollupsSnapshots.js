// features/progress/rollups/rollupsSnapshots.js
// Snapshot helpers extracted from rollups.js (surgical copy/paste)

export function buildSnapshots({ byDay, byPassage } = {}) {
  // Snapshot: best day (highest avg) + most-practiced passage
  let bestDayKey = null;
  let bestDayScore = null;

  for (const [day, agg] of byDay.entries()) {
    if (!agg || !agg.count) continue;
    const avg = agg.sum / agg.count;
    if (bestDayScore == null || avg > bestDayScore) {
      bestDayScore = avg;
      bestDayKey = day;
    }
  }

  let bestDayTS = null;
  if (bestDayKey) {
    const [yy, mm, dd] = String(bestDayKey)
      .split("-")
      .map((x) => Number(x));
    if (yy && mm && dd) bestDayTS = +new Date(yy, mm - 1, dd);
  }

  let topPassageKey = null;
  let topPassageCount = 0;

  for (const v of byPassage.values()) {
    if ((v.count || 0) > topPassageCount) {
      topPassageCount = v.count || 0;
      topPassageKey = v.passageKey || null;
    }
  }

  return { bestDayTS, bestDayScore, topPassageKey, topPassageCount };
}
