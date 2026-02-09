// features/progress/rollups/rollupsPostProcess.js
// Post-processing extracted from rollups.js (trouble lists + overall trend + sessions)

export function buildPostProcess({
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
} = {}) {
  // Build trouble lists (worst avg first), with basic “seen enough” guard.
  const troublePhonemesAll = Array.from(phon.values())
    .map((x) => {
      const avg = x.count ? x.sum / x.count : 0;
      const days = phonDays.get(x.ipa)?.size || 1;
      return {
        ipa: x.ipa,
        count: x.count,
        avg,
        days,
        priority: priorityFromFull({
          avg,
          count: x.count,
          daysSeen: days,
          lastTS: x.lastTS,
        }),
        examples: Array.from(x.examples || []).slice(0, 3),
      };
    })
    .filter((x) => x.count >= minPhonCount)
    .sort(
      (a, b) => b.priority - a.priority || a.avg - b.avg || b.count - a.count
    );

  const troubleWordsAll = Array.from(words.values())
    .map((x) => {
      const avg = x.count ? x.sum / x.count : 0;
      const days = wordDays.get(x.word)?.size || 1;
      return {
        word: x.word,
        count: x.count,
        avg,
        days,
        priority: priorityFromFull({
          avg,
          count: x.count,
          daysSeen: days,
          lastTS: x.lastTS,
        }),
      };
    })
    .filter((x) => x.count >= minWordCount)
    .sort(
      (a, b) => b.priority - a.priority || a.avg - b.avg || b.count - a.count
    );

  // Trend points (last windowDays) — overall score
  const now = new Date();
  const trend = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const k = localDayKey(d);
    const agg = byDay.get(k);
    trend.push({
      day: k,
      avg: agg ? agg.sum / agg.count : null,
    });
  }

  const sessionArr = Array.from(sessions.values())
    .map((s) => ({
      ...s,
      avgScore: s.count ? s.sumScore / s.count : 0,
    }))
    .sort((a, b) => b.tsMax - a.tsMax);

  return {
    troublePhonemesAll,
    troubleWordsAll,
    trend,
    sessionArr,
  };
}
