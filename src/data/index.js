// index.js (barrel) — re-export data pieces for easy imports

export { passages } from "./passages.js";
export { norm, normalizePhoneSequence } from "./phonemes/core.js";
export { getPhonemeAssetByIPA, phonemeAssets } from "./phonemes/assets.js";
export {
  articulatorPlacement,
  phonemeDetailsByIPA,
  ytLink,
} from "./phonemes/details.js";
