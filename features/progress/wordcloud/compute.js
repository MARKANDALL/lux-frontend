// features/progress/wordcloud/compute.js
import { pickTS, pickAzure } from "../attempt-pickers.js";

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function lower(s) {
  return String(s || "").trim().toLowerCase();
}

export function log1p(n) {
  return Math.log(1 + Math.max(0, Number(n || 0)));
}

export function idFromItem(mode, x) {
  if (mode === "phonemes") return String(x?.ipa ?? x?.text ?? "").trim();
  return String(x?.word ?? x?.text ?? "").trim();
}

export function filterAttemptsByRange(attempts, rangeKey, winDays = 14, posDays = 0) {
  const list = Array.isArray(attempts) ? attempts : [];
  if (rangeKey === "all") return list;

  const now = Date.now();

  if (rangeKey === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const start = +d;
    return list.filter((a) => +new Date(pickTS(a) || 0) >= start);
  }

  if (rangeKey === "timeline") {
    const end = now - posDays * 24 * 60 * 60 * 1000;
    const start = end - winDays * 24 * 60 * 60 * 1000;

    return list.filter((a) => {
      const ts = +new Date(pickTS(a) || 0);
      return ts >= start && ts <= end;
    });
  }

  const days = rangeKey === "7d" ? 7 : 30;
  const start = now - days * 24 * 60 * 60 * 1000;

  return list.filter((a) => +new Date(pickTS(a) || 0) >= start);
}

export function computeLastSeenMap(mode, attempts, idsWanted) {
  const want = new Set((idsWanted || []).map((x) => lower(x)));
  const seen = new Map();
  if (!want.size) return seen;

  const list = Array.isArray(attempts) ? attempts.slice() : [];
  list.sort((a, b) => +new Date(pickTS(b) || 0) - +new Date(pickTS(a) || 0));

  for (const a of list) {
    if (seen.size >= want.size) break;

    const ts = +new Date(pickTS(a) || 0);
    if (!ts) continue;

    const az = pickAzure(a);
    const W = az?.NBest?.[0]?.Words || [];
    if (!Array.isArray(W) || !W.length) continue;

    if (mode === "words") {
      for (const w of W) {
        const word = lower(w?.Word);
        if (!word || !want.has(word)) continue;
        if (!seen.has(word)) seen.set(word, ts);
      }
    } else {
      for (const w of W) {
        const P = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
        if (!P.length) continue;

        for (const p of P) {
          const ipa = lower(p?.Phoneme);
          if (!ipa || !want.has(ipa)) continue;
          if (!seen.has(ipa)) seen.set(ipa, ts);
        }
      }
    }
  }

  return seen;
}

export function persistentScore(x) {
  const days = Number(x?.days || 0);
  const count = Number(x?.count || 0);
  const avg = Number(x?.avg || 0);
  const bad = clamp((100 - avg) / 100, 0, 1);
  return Math.pow(days + 1, 1.2) * Math.pow(count + 1, 0.65) * (0.35 + bad);
}

export function smartTop3(mode, pool) {
  const items = Array.isArray(pool) ? pool.slice() : [];
  if (!items.length) return [];

  const minCount = mode === "phonemes" ? 3 : 2;
  const candidates = items.filter((x) => Number(x.count || 0) >= minCount);
  if (!candidates.length) return items.slice(0, 3);

  const counts = candidates.map((x) => log1p(x.count || 0));
  const days = candidates.map((x) => log1p(x.days || 0));
  const recs = candidates.map((x) => Number(x.lastSeenTS || 0));

  const maxC = Math.max(1e-6, ...counts);
  const maxD = Math.max(1e-6, ...days);
  const maxR = Math.max(1, ...recs);

  const score = (x) => {
    const diff = clamp((100 - Number(x.avg || 0)) / 100, 0, 1);
    const freq = clamp(log1p(x.count || 0) / maxC, 0, 1);
    const pers = clamp(log1p(x.days || 0) / maxD, 0, 1);
    const rec  = clamp(Number(x.lastSeenTS || 0) / maxR, 0, 1);

    return 0.45 * diff + 0.25 * pers + 0.2 * freq + 0.1 * rec;
  };

  candidates.sort((a, b) => score(b) - score(a));

  const out = [];
  const seen = new Set();
  for (const x of candidates) {
    const id = lower(idFromItem(mode, x));
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(x);
    if (out.length >= 3) break;
  }

  return out;
}
