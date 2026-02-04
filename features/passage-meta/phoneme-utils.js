import { PASSAGE_PHONEME_META } from "../../src/data/index.js";

export function getPhCountForKey(passageKey, ph) {
  if (!passageKey || !ph) return 0;
  const meta = PASSAGE_PHONEME_META?.[String(passageKey)] || null;
  const counts = meta?.counts;
  if (!counts || typeof counts !== "object") return 0;
  return Number(counts[String(ph).toUpperCase()] || 0);
}

export function getTotalPhonesForKey(passageKey) {
  const meta = PASSAGE_PHONEME_META?.[String(passageKey)] || null;
  return Number(meta?.totalPhones || 0);
}
