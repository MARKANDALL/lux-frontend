// features/progress/wordcloud/state-store.js
// LocalStorage state + saved lists for Wordcloud

import { K_WC_STATE, getJSON, setJSON } from '../../../app-core/lux-storage.js';

export const THEME_KEY = "lux.cloud.theme.v1";
export const FAV_KEY   = "lux.cloud.favs.v1";
export const PIN_KEY   = "lux.cloud.pins.v1";

function lower(s) {
  return String(s || "").trim().toLowerCase();
}

export function readState() {
  const parsed = getJSON(K_WC_STATE, null);
  return parsed || {};
}

export function writeState(next) {
  setJSON(K_WC_STATE, next || {});
}

function readSaved(key) {
  const obj = getJSON(key, {}) || {};
  return {
    words: Array.isArray(obj.words) ? obj.words : [],
    phonemes: Array.isArray(obj.phonemes) ? obj.phonemes : [],
  };
}

function writeSaved(key, next) {
  setJSON(key, next);
}

export function savedListForMode(key, mode) {
  const s = readSaved(key);
  return mode === "phonemes" ? s.phonemes : s.words;
}

export function addManySaved(key, mode, ids) {
  const s = readSaved(key);
  const list = mode === "phonemes" ? s.phonemes : s.words;

  const add = [];
  const seen = new Set(list.map(lower));

  for (const id of ids) {
    const v = String(id || "").trim();
    if (!v) continue;

    const k = lower(v);
    if (seen.has(k)) continue;

    seen.add(k);
    add.push(v);
  }

  const merged = [...add, ...list].slice(0, 30);
  if (mode === "phonemes") s.phonemes = merged;
  else s.words = merged;

  writeSaved(key, s);
}