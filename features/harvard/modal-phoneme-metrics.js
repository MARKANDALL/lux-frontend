// features/harvard/modal-phoneme-metrics.js
import { HARVARD_PHONEME_META } from "../../src/data/harvard-phoneme-meta.js";
import { PASSAGE_PHONEME_META } from "../../src/data/passage-phoneme-meta.js";

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function harvardKey(n) {
  return `harvard${pad2(n)}`;
}

export function getHarvardMeta(n) {
  return (
    HARVARD_PHONEME_META?.[n] ??
    HARVARD_PHONEME_META?.[String(n)] ??
    HARVARD_PHONEME_META?.[String(n).padStart(2, "0")] ??
    null
  );
}

export function isHarvardKey(k) {
  return /^harvard\d{2}$/i.test(String(k || ""));
}

export function metaForHarvard(n) {
  return PASSAGE_PHONEME_META?.[harvardKey(n)] ?? null;
}

export function metaForKey(key) {
  return PASSAGE_PHONEME_META?.[String(key)] ?? null;
}

export function countForHarvard(n, ph) {
  if (!ph) return 0;
  const m = metaForHarvard(n);
  const c = m?.counts?.[String(ph || "").toUpperCase()];
  if (c) return Number(c || 0);

  // fallback if counts missing: Harvard distinctive meta (top3 only)
  const top3 = getHarvardMeta(n)?.top3 || [];
  const hit = top3.find(
    (p) =>
      String(p?.ph || "").toUpperCase() === String(ph || "").toUpperCase()
  );
  return hit ? Number(hit.count || 0) : 0;
}

export function totalForHarvard(n) {
  const m = metaForHarvard(n);
  return Number(m?.totalPhones || 0);
}

export function countForKey(key, ph) {
  if (!key || !ph) return 0;
  const m = metaForKey(key);
  const c = m?.counts?.[String(ph || "").toUpperCase()];
  return Number(c || 0);
}

export function totalForKey(key) {
  const m = metaForKey(key);
  return Number(m?.totalPhones || 0);
}

export function getAllTopPhonemes() {
  const set = new Set();
  const meta = HARVARD_PHONEME_META || {};
  for (const m of Object.values(meta)) {
    const top3 = m?.top3 || [];
    for (const p of top3) {
      if (p?.ph) set.add(String(p.ph).toUpperCase());
    }
  }
  return Array.from(set).sort();
}

export function getAllPhonemesFromPassageMeta() {
  const set = new Set();
  const meta = PASSAGE_PHONEME_META || {};
  for (const m of Object.values(meta)) {
    const counts = m?.counts;
    if (!counts || typeof counts !== "object") continue;
    for (const ph of Object.keys(counts)) set.add(String(ph).toUpperCase());
  }
  return Array.from(set).sort();
}
