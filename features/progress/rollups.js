// features/progress/rollups.js
// Pure rollups: attempts -> totals + trouble sounds/words + trend + session summaries.

import { norm } from "../../src/data/phonemes/core.js";

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function pickAzure(attempt) {
  return (
    attempt?.azureResult ||
    attempt?.azure_result ||
    attempt?.azure ||
    attempt?.result ||
    null
  );
}

function pickSummary(attempt) {
  return attempt?.summary || attempt?.summary_json || attempt?.sum || null;
}

function pickPassageKey(attempt) {
  return attempt?.passage_key || attempt?.passageKey || attempt?.passage || "";
}

function pickSessionId(attempt) {
  return attempt?.session_id || attempt?.sessionId || "";
}

function pickTS(attempt) {
  return (
    attempt?.ts ||
    attempt?.created_at ||
    attempt?.createdAt ||
    attempt?.time ||
    Date.now()
  );
}

function localDayKey(ts) {
  const d = new Date(ts);
  // "en-CA" gives YYYY-MM-DD in most browsers
  try { return d.toLocaleDateString("en-CA"); } catch (_) {}
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function daysAgoFrom(tsNum) {
  if (!tsNum) return 999;
  const d = Math.floor((Date.now() - tsNum) / (24 * 60 * 60 * 1000));
  return Number.isFinite(d) ? Math.max(0, d) : 999;
}

// Constitutional priority: error_rate × exposure × persistence × recency
function priorityFromFull({ avg, count, daysSeen, lastTS }) {
  const a = Number.isFinite(avg) ? avg : 0;
  const c = Number.isFinite(count) ? count : 0;
  const ds = Number.isFinite(daysSeen) ? daysSeen : 0;

  const errorRate = Math.max(0, Math.min(1, (100 - a) / 100));     // 0..1
  const exposure = Math.log1p(Math.max(0, c));                     // grows slowly
  const persistence = Math.min(1, ds / 5);                         // 1.0 at 5 days
  const recency = 0.3 + 0.7 * Math.exp(-daysAgoFrom(lastTS) / 14); // never hits 0

  return errorRate * exposure * persistence * recency;
}

export function getAttemptScore(attempt) {
  const sum = pickSummary(attempt);
  if (sum && sum.pron != null) {
    const v = num(sum.pron);
    if (v != null) return v;
  }
  const az = pickAzure(attempt);
  const v = num(az?.NBest?.[0]?.PronScore);
  return v != null ? v : 0;
}

export function computeRollups(attempts = [], opts = {}) {
  const windowDays = Number(opts.windowDays || 30);

  // Optional thresholds (dashboard defaults stay strict; modal can loosen)
  const minWordCountRaw = Number(opts.minWordCount);
  const minPhonCountRaw = Number(opts.minPhonCount);

  const minWordCount = Number.isFinite(minWordCountRaw) ? Math.max(1, Math.floor(minWordCountRaw)) : 2;
  const minPhonCount = Number.isFinite(minPhonCountRaw) ? Math.max(1, Math.floor(minPhonCountRaw)) : 3;

  const phon = new Map(); // ipa -> {ipa,count,sum,examples:Set,days:Set,lastTS,lowCount}
  const words = new Map(); // word -> {word,count,sum,days:Set,lastTS}
  const byDay = new Map(); // day -> {count,sum}
  const sessions = new Map(); // sessionId -> {count,sumScore,tsMin,tsMax,passageKey,hasAI}
  const byPassage = new Map(); // passageKey -> {count,sumScore,lastTS}

  const phonDays = new Map(); // ipa -> Set(dayKey)
  const wordDays = new Map(); // word -> Set(dayKey)

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

    // Trend
    const day = localDayKey(ts);
    const dayAgg = byDay.get(day) || { count: 0, sum: 0 };
    dayAgg.count += 1;
    dayAgg.sum += score;
    byDay.set(day, dayAgg);

    // Sessions
    const sid = pickSessionId(a) || `nosess:${day}`;
    const pk = pickPassageKey(a);
    const sum = pickSummary(a);
    const hasAI = !!(sum && sum.ai_feedback && sum.ai_feedback.sections && sum.ai_feedback.sections.length);

    // Snapshot: most-practiced passage across these attempts
    const pAgg = byPassage.get(pk) || { passageKey: pk, count: 0, sumScore: 0, lastTS: 0 };
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
          const wAgg = words.get(word) || { word, count: 0, sum: 0, days: new Set(), lastTS: 0 };
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
            phon.get(ipa) ||
            { ipa, count: 0, sum: 0, examples: new Set(), days: new Set(), lastTS: 0, lowCount: 0 };

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

        const wAgg = words.get(word) || { word, count: 0, sum: 0, days: new Set(), lastTS: 0 };
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
          const ipa = norm(String(rawIpa || "").trim()) || String(rawIpa || "").trim();
          const occ = Number(v?.occ);
          const avg = num(v?.avg);
          if (!ipa || !Number.isFinite(occ) || occ <= 0 || avg == null) continue;

          const pAgg =
            phon.get(ipa) ||
            { ipa, count: 0, sum: 0, examples: new Set(), days: new Set(), lastTS: 0, lowCount: 0 };

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
            phon.get(ipa) ||
            { ipa, count: 0, sum: 0, examples: new Set(), days: new Set(), lastTS: 0, lowCount: 0 };

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
    const [yy, mm, dd] = String(bestDayKey).split("-").map((x) => Number(x));
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
        priority: priorityFromFull({ avg, count: x.count, daysSeen: days, lastTS: x.lastTS }),
        examples: Array.from(x.examples || []).slice(0, 3),
      };
    })
    .filter((x) => x.count >= minPhonCount)
    .sort((a, b) =>
      (b.priority - a.priority) ||
      (a.avg - b.avg) ||
      (b.count - a.count)
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
        priority: priorityFromFull({ avg, count: x.count, daysSeen: days, lastTS: x.lastTS }),
      };
    })
    .filter((x) => x.count >= minWordCount)
    .sort((a, b) =>
      (b.priority - a.priority) ||
      (a.avg - b.avg) ||
      (b.count - a.count)
    );

  // Trend points (last windowDays)
  const now = new Date();
  const days = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const k = localDayKey(d);
    const agg = byDay.get(k);
    days.push({
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
    trend: days,
    sessions: sessionArr,
  };
}
