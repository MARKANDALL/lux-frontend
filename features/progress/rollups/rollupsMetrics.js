// features/progress/rollups/rollupsMetrics.js
// Metric rollups extracted from rollups.js (surgical copy/paste)

export function buildMetrics({ METRICS, byDayMetric, seriesMetric, windowDays, localDayKey, num }) {
  // Build metric rollups: { acc:{label,trend[],avg7,avg30,last,bestDay}, ... }
  const buildMetric = (k, label) => {
    const pts = [];
    const nowMs = Date.now();

    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(nowMs - i * 86400000);
      const key = localDayKey(d);
      const agg = byDayMetric[k].get(key);
      const avg = agg && agg.count ? agg.sum / agg.count : null;
      pts.push({ day: key, avg });
    }

    const vals30 = pts.map((p) => num(p.avg)).filter((v) => v != null);
    const avg30 = vals30.length
      ? vals30.reduce((a, b) => a + b, 0) / vals30.length
      : null;

    const vals7 = pts
      .slice(-7)
      .map((p) => num(p.avg))
      .filter((v) => v != null);
    const avg7 = vals7.length
      ? vals7.reduce((a, b) => a + b, 0) / vals7.length
      : null;

    let bestDay = null;
    for (const p of pts) {
      const v = num(p.avg);
      if (v == null) continue;
      if (!bestDay || v > bestDay.avg) bestDay = { day: p.day, avg: v };
    }

    const series = (seriesMetric[k] || [])
      .slice()
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const last = series.length ? num(series[0].v) : null;

    return {
      label,
      trend: pts.map((p) => ({ avg: p.avg ?? null })),
      avg7,
      avg30,
      last,
      bestDay,
    };
  };

  return Object.fromEntries(
    METRICS.map(([k, label]) => [k, buildMetric(k, label)])
  );
}
