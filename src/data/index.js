// src/data/index.js
// index.js (barrel) — re-export data pieces for easy imports

import { passages as basePassages } from "./passages.js";

// ✅ Base passages are always available
export const passages = { ...basePassages };

// ✅ Harvard is lazy-loaded ONLY when needed
let _harvardLoaded = false;
let _harvardLoadPromise = null;

export async function ensureHarvardPassages() {
  if (_harvardLoaded) return passages;

  if (!_harvardLoadPromise) {
    _harvardLoadPromise = import("./harvard.js")
      .then((mod) => {
        Object.assign(passages, mod.harvardPassages || {});
        _harvardLoaded = true;
        return passages;
      })
      .catch((err) => {
        _harvardLoadPromise = null; // allow retry
        throw err;
      });
  }

  return _harvardLoadPromise;
}

// everything else stays the same:
export { norm, normalizePhoneSequence } from "./phonemes/core.js";
export { getPhonemeAssetByIPA, phonemeAssets } from "./phonemes/assets.js";
export {
  articulatorPlacement,
  phonemeDetailsByIPA,
  ytLink,
} from "./phonemes/details.js";

export { PASSAGE_PHONEME_META } from "./passage-phoneme-meta.js";
