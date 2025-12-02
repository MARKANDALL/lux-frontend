// 02-data-bridge.js — bridge module: move data exports onto globalThis.*
import {
  passages,
  getPhonemeAssetByIPA,
  articulatorPlacement,
  phonemeDetailsByIPA,
  ytLink,
  normalizePhoneSequence,
} from "./src/data/index.js";

globalThis.passages = passages;
globalThis.getPhonemeAssetByIPA = getPhonemeAssetByIPA;
globalThis.articulatorPlacement = articulatorPlacement;
globalThis.phonemeDetailsByIPA = phonemeDetailsByIPA;
globalThis.normalizePhoneSequence = normalizePhoneSequence;
globalThis.ytLink = ytLink;

console.debug("[bridge] data → globals bridged");
