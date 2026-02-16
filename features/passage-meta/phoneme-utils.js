// C:\dev\LUX_GEMINI\features\passage-meta\phoneme-utils.js
// Tiny helpers to read per-passage phoneme counts using lazy-loaded PASSAGE_PHONEME_META (keeps first paint lean).

import { ensurePassagePhonemeMeta } from "../../src/data/index.js";

// Lazy passage meta cache (keeps existing sync scoring helpers intact)
let _PASSAGE_META = null;
let _PASSAGE_META_PROMISE = null;

function _getPassageMetaSync() {
  return _PASSAGE_META;
}

// Optional: allow callers to “warm” the meta before using the sync helpers
export async function warmPassagePhonemeMeta() {
  if (_PASSAGE_META) return _PASSAGE_META;

  if (!_PASSAGE_META_PROMISE) {
    _PASSAGE_META_PROMISE = ensurePassagePhonemeMeta()
      .then((m) => {
        _PASSAGE_META = m || null;
        return _PASSAGE_META;
      })
      .catch((e) => {
        console.error("[PassageMeta] Failed to lazy-load PASSAGE_PHONEME_META", e);
        _PASSAGE_META_PROMISE = null; // allow retry
        _PASSAGE_META = _PASSAGE_META || null;
        return _PASSAGE_META;
      });
  }

  return _PASSAGE_META_PROMISE;
}

export function getPhCountForKey(passageKey, ph) {
  if (!passageKey || !ph) return 0;

  const PASSAGE_PHONEME_META = _getPassageMetaSync();
  if (!PASSAGE_PHONEME_META) return 0;

  const meta = PASSAGE_PHONEME_META?.[String(passageKey)] || null;
  const counts = meta?.counts;
  if (!counts || typeof counts !== "object") return 0;
  return Number(counts[String(ph).toUpperCase()] || 0);
}

export function getTotalPhonesForKey(passageKey) {
  const PASSAGE_PHONEME_META = _getPassageMetaSync();
  if (!PASSAGE_PHONEME_META) return 0;

  const meta = PASSAGE_PHONEME_META?.[String(passageKey)] || null;
  return Number(meta?.totalPhones || 0);
}
