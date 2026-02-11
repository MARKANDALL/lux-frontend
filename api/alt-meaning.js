// api/alt-meaning.js
// Fetch tiny AI meanings/examples for stress-shift / alt pronunciations.

import { API_BASE, jsonOrThrow, dbg } from "./util.js";
import { getUID } from "./identity.js";

const ALT_MEANING_URL = `${API_BASE}/api/alt-meaning`;

export async function fetchAltMeanings({ word, sentence, prons }) {
  const uid = typeof getUID === "function" ? getUID() : null;

  const payload = {
    word: String(word || "").slice(0, 80),
    sentence: String(sentence || "").slice(0, 280),
    prons: Array.isArray(prons) ? prons.slice(0, 6) : [],
    uid,
  };

  dbg("POST", ALT_MEANING_URL, { word: payload.word, n: payload.prons.length });

  const resp = await fetch(ALT_MEANING_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return jsonOrThrow(resp); // expects { alts: [{pos, def, example, note?}, ...] }
}
