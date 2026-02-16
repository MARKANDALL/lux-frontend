// C:\dev\LUX_GEMINI\src\data\index.js
// Data barrel + lazy loaders for big static blobs (Harvard passages + passage phoneme meta) so first paint stays lean.

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

// ✅ Passage phoneme meta is lazy-loaded ONLY when needed
let _passageMeta = null;
let _passageMetaPromise = null;

export async function ensurePassagePhonemeMeta() {
  if (_passageMeta) return _passageMeta;

  if (!_passageMetaPromise) {
    _passageMetaPromise = import("./passage-phoneme-meta.js")
      .then((mod) => {
        _passageMeta = mod.PASSAGE_PHONEME_META || null;
        return _passageMeta;
      })
      .catch((err) => {
        _passageMetaPromise = null; // allow retry
        throw err;
      });
  }

  return _passageMetaPromise;
}

// everything else stays the same:
export { norm, normalizePhoneSequence } from "./phonemes/core.js";
export { getPhonemeAssetByIPA, phonemeAssets } from "./phonemes/assets.js";
export {
  articulatorPlacement,
  phonemeDetailsByIPA,
  ytLink,
} from "./phonemes/details.js";

// ⛔️ IMPORTANT: do NOT statically re-export PASSAGE_PHONEME_META here.
// It must remain behind ensurePassagePhonemeMeta() so it doesn't load on first paint.
