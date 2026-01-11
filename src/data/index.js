// src/data/index.js
// index.js (barrel) — re-export data pieces for easy imports

import { passages as basePassages } from "./passages.js";
import { harvardPassages } from "./harvard.js";

export const passages = { ...basePassages, ...harvardPassages };

export { norm, normalizePhoneSequence } from "./phonemes/core.js";
export { getPhonemeAssetByIPA, phonemeAssets } from "./phonemes/assets.js";
export {
  articulatorPlacement,
  phonemeDetailsByIPA,
  ytLink,
} from "./phonemes/details.js";
