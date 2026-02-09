// features/progress/rollups/rollupsAccumulate.js
// Main accumulation pass extracted from rollups.js (surgical copy/paste inside a wrapper)

import { norm } from "../../../src/data/phonemes/core.js";

import {
  num,
  pickAzure,
  pickSummary,
  pickPassageKey,
  pickSessionId,
  pickTS,
  localDayKey,
  getAttemptScore,
} from "./rollupsUtils.js";

export function accumulateRollups(attempts = [], { METRICS } = {}) {
  const phon = new Map(); // ipa -> {ipa,count,sum,examples:Set,days:Set,lastTS,lowCount}
  const words = new Map(); // word -> {word,count,sum,days:Set,lastTS}
  const byDay = new Map(); // day -> {count,sum}
  const sessions = new Map(); // sessionId -> {count,sumScore,tsMin,tsMax,passageKey,hasAI}
  const byPassage = new Map(); // passageKey -> {count,sumScore,lastTS}

  const phonDays = new Map(); // ipa -> Set(dayKey)
  const wordDays = new Map(); // word -> Set(dayKey)

  const byDayMetric = Object.fromEntries(METRICS.map(([k]) => [k, new Map()])); // k -> Map(dayKey -> {count,sum})
  const seriesMetric = Object.fromEntries(METRICS.map(([k]) => [k, []])); // k -> [{ts,v}]

  let lastTS = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  for (const a of attempts) {
    const ts = pickTS(a);
    const tsNum = +new Date(ts);
    lastTS = Math.max(lastTS, tsNum);
    const score = getAttemptScore(a);

    scoreSum += score;
    scoreCount += 1;

    // Trend (overall)
    const day = localDayKey(ts);
    const dayAgg = byDay.get(day) || { count: 0, sum: 0 };
    dayAgg.count += 1;
    dayAgg.sum += score;
    byDay.set(day, dayAgg);

    // Sessions
    const sid = pickSessionId(a) || `nosess:${day}`;
    const pk = pickPassageKey(a);
    const sum = pickSummary(a);
    const hasAI = !!(
      sum &&
      sum.ai_feedback &&
      sum.ai_feedback.sections &&
      sum.ai_feedback.sections.length
    );

    // metric trends: acc / flu / comp / pron
    for (const [k] of METRICS) {
      const v = num(sum?.[k]);
      if (v == null) continue;

      const aggM = byDayMetric[k].get(day) || { count: 0, sum: 0 };
      aggM.count += 1;
      aggM.sum += v;
      byDayMetric[k].set(day, aggM);

      seriesMetric[k].push({ ts: tsNum, v });
    }

    // Snapshot: most-practiced passage across these attempts
    const pAgg = byPassage.get(pk) || {
      passageKey: pk,
      count: 0,
      sumScore: 0,
      lastTS: 0,
    };
    pAgg.count += 1;
    pAgg.sumScore += score;
    pAgg.lastTS = Math.max(pAgg.lastTS, +new Date(ts));
    byPassage.set(pk, pAgg);

    const sAgg = sessions.get(sid) || {
      sessionId: sid,
      passageKey: pk,
      count: 0,
      sumScore: 0,
      tsMin: +new Date(ts),
      tsMax: +new Date(ts),
      hasAI: false,
    };
    sAgg.count += 1;
    sAgg.sumScore += score;
    sAgg.tsMin = Math.min(sAgg.tsMin, +new Date(ts));
    sAgg.tsMax = Math.max(sAgg.tsMax, +new Date(ts));
    sAgg.passageKey = sAgg.passageKey || pk;
    sAgg.hasAI = sAgg.hasAI || hasAI;
    sessions.set(sid, sAgg);

    // Word + phoneme details
    // Prefer Azure word/phoneme arrays if present; otherwise use compact backend summary (summary.words / summary.lows).
    const az = pickAzure(a);
    const nb = az?.NBest?.[0];
    const W = Array.isArray(nb?.Words) ? nb.Words : [];

    if (W.length) {
      // --- Original path: full Azure detail available ---
      for (const w of W) {
        const word = String(w?.Word || "").trim().toLowerCase();
        if (!word) continue;

        const wScore = num(w?.AccuracyScore);
        if (wScore != null) {
          const wAgg =
            words.get(word) || {
              word,
              count: 0,
              sum: 0,
              days: new Set(),
              lastTS: 0,
            };
          wAgg.count += 1;
          wAgg.sum += wScore;
          wAgg.days.add(day);
          wAgg.lastTS = Math.max(wAgg.lastTS, tsNum);
          words.set(word, wAgg);

          const wd = wordDays.get(word) || new Set();
          wd.add(day);
          wordDays.set(word, wd);
        }

        const P = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
        for (const p of P) {
          const raw = String(p?.Phoneme || p?.phoneme || "").trim();
          if (!raw) continue;

          const ipa = norm(raw);
          if (!ipa) continue;

          const pScore = num(p?.AccuracyScore);
          if (pScore == null) continue;

          const pAgg =
            phon.get(ipa) || {
              ipa,
              count: 0,
              sum: 0,
              examples: new Set(),
              days: new Set(),
              lastTS: 0,
              lowCount: 0,
            };

          pAgg.count += 1;
          pAgg.sum += pScore;

          if (pScore < 80) pAgg.lowCount += 1;
          pAgg.days.add(day);
          pAgg.lastTS = Math.max(pAgg.lastTS, tsNum);

          // keep a few example words
          if (word && pAgg.examples.size < 4) pAgg.examples.add(word);

          phon.set(ipa, pAgg);

          const pd = phonDays.get(ipa) || new Set();
          pd.add(day);
          phonDays.set(ipa, pd);
        }
      }
    } else {
      // --- Fallback path: compact summary-only attempts (normal for /api/user-recent) ---
      // Words: summary.words is [[word, avgScore, count], ...]
      const sumWords = Array.isArray(sum?.words) ? sum.words : [];
      for (const t of sumWords) {
        if (!Array.isArray(t)) continue;
        const word = String(t[0] || "").trim().toLowerCase();
        const avg = num(t[1]);
        const cntRaw = Number(t[2]);
        const cnt = Number.isFinite(cntRaw) && cntRaw > 0 ? cntRaw : 1;
        if (!word || avg == null) continue;

        const wAgg =
          words.get(word) || {
            word,
            count: 0,
            sum: 0,
            days: new Set(),
            lastTS: 0,
          };
        wAgg.count += cnt;
        wAgg.sum += avg * cnt;
        wAgg.days.add(day);
        wAgg.lastTS = Math.max(wAgg.lastTS, tsNum);
        words.set(word, wAgg);

        const wd = wordDays.get(word) || new Set();
        wd.add(day);
        wordDays.set(word, wd);
      }

      // Phonemes: prefer summary.stats.phonemes if it ever exists; otherwise use summary.lows [[phoneme, score], ...]
      const phStats = sum?.stats?.phonemes;
      if (phStats && typeof phStats === "object") {
        for (const [rawIpa, v] of Object.entries(phStats)) {
          const ipa =
            norm(String(rawIpa || "").trim()) || String(rawIpa || "").trim();
          const occ = Number(v?.occ);
          const avg = num(v?.avg);
          if (!ipa || !Number.isFinite(occ) || occ <= 0 || avg == null) continue;

          const pAgg =
            phon.get(ipa) || {
              ipa,
              count: 0,
              sum: 0,
              examples: new Set(),
              days: new Set(),
              lastTS: 0,
              lowCount: 0,
            };

          pAgg.count += occ;
          pAgg.sum += avg * occ;

          const low = Number(v?.low);
          if (Number.isFinite(low) && low > 0) pAgg.lowCount += low;

          pAgg.days.add(day);
          pAgg.lastTS = Math.max(pAgg.lastTS, tsNum);

          phon.set(ipa, pAgg);

          const pd = phonDays.get(ipa) || new Set();
          pd.add(day);
          phonDays.set(ipa, pd);
        }
      } else {
        const lows = Array.isArray(sum?.lows) ? sum.lows : [];
        for (const p of lows) {
          if (!Array.isArray(p)) continue;
          const raw = String(p[0] || "").trim();
          const pScore = num(p[1]);
          if (!raw || pScore == null) continue;

          const ipa = norm(raw) || raw;

          const pAgg =
            phon.get(ipa) || {
              ipa,
              count: 0,
              sum: 0,
              examples: new Set(),
              days: new Set(),
              lastTS: 0,
              lowCount: 0,
            };

          pAgg.count += 1;
          pAgg.sum += pScore;
          if (pScore < 80) pAgg.lowCount += 1;

          pAgg.days.add(day);
          pAgg.lastTS = Math.max(pAgg.lastTS, tsNum);

          phon.set(ipa, pAgg);

          const pd = phonDays.get(ipa) || new Set();
          pd.add(day);
          phonDays.set(ipa, pd);
        }
      }
    }
  }

  return {
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
  };
}
