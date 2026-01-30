// core.js
// Normalization helpers and sequence coalescing (from original data.js)
// Canonical IPA truth lives here.
//
// ALIGNMENT UPDATE (assets-compatible):
// - Adds aliases for any asset keys you use (e.g., schwa, u_short).
// - Keeps ALL existing mappings unchanged (safe).
// - Slightly hardens norm(): trim + lowercases underscore/hyphen codes too.
// - Keeps affricate/tie-bar handling as before.

const phonemeAlias = {
  // ---------------------------
  // VOWELS (Azure → canonical IPA)
  // ---------------------------
  iy: "i",
  ih: "ɪ",
  eh: "ɛ",
  ae: "æ",
  aa: "ɑ",
  ao: "ɔ",
  ah: "ʌ",
  ax: "ə",
  axr: "ɚ",
  er: "ɝ",
  uw: "u",
  uh: "ʊ",
  ey: "eɪ",
  ay: "aɪ",
  aw: "aʊ",
  ow: "oʊ",
  oy: "ɔɪ",

  // ---------------------------
  // VOWEL LABELS USED IN ASSETS / UI (project-friendly)
  // ---------------------------
  schwa: "ə",
  u_short: "ʊ",

  // ---------------------------
  // CONSONANTS (Azure/ASCII → canonical IPA)
  // ---------------------------
  p: "p",
  b: "b",
  t: "t",
  d: "d",
  k: "k",
  g: "g",
  f: "f",
  v: "v",
  th: "θ",
  dh: "ð",
  s: "s",
  z: "z",
  sh: "ʃ",
  zh: "ʒ",
  h: "h",
  hh: "h",
  m: "m",
  n: "n",
  ng: "ŋ",
  l: "l",
  r: "ɹ",
  w: "w",
  y: "j",
  ch: "tʃ",
  jh: "dʒ",
  dx: "ɾ",
  wh: "ʍ",
  q: "ʔ",

  // ---------------------------
  // Legacy / alternate symbols that show up in old data
  // ---------------------------
  "t͡ʃ": "tʃ",
  "d͡ʒ": "dʒ",
  "ʧ": "tʃ",
  "ʤ": "dʒ",

  // ---------------------------
  // Already-IPA passthrough (no change, but harmless if seen)
  // (Includes everything core already covered + the extra asset symbol ɳ.)
  // ---------------------------
  "ŋ": "ŋ",
  "ɹ": "ɹ",
  "ɾ": "ɾ",
  "ʔ": "ʔ",
  "ʍ": "ʍ",
  "θ": "θ",
  "ð": "ð",
  "ʃ": "ʃ",
  "ʒ": "ʒ",
  "tʃ": "tʃ",
  "dʒ": "dʒ",

  // Extras present in assets.js (safe to include; does not affect Azure outputs)
  "ɳ": "ɳ",
};

// Reverse index: canonical IPA -> list of project/Azure-friendly codes (ASCII-ish keys only)
const _codesByIPA = Object.create(null);
Object.entries(phonemeAlias).forEach(([code, ipa]) => {
  // Keep only readable ASCII-ish codes (iy, ey, th, u_short, schwa, etc.)
  if (!/^[a-z0-9_]+$/i.test(code)) return;
  (_codesByIPA[ipa] ||= []).push(code);
});
Object.values(_codesByIPA).forEach((arr) => {
  arr.sort((a, b) => a.length - b.length || a.localeCompare(b));
});

// combining tie-bars, ZWJ, etc.
const TIE = /[\u0361\u035C\u200D\u034F]/g;

// legacy single-codepoint affricates some fonts use
const LEGACY = { "ʧ": "tʃ", "ʤ": "dʒ" };

/** Normalize any phoneme symbol to the canonical form used everywhere. */
export function norm(sym) {
  if (!sym) return sym;

  let s = String(sym).normalize("NFC").trim();
  if (!s) return s;

  // Lowercase ASCII-ish codes (letters, digits, underscores, hyphens).
  // Keeps IPA intact because IPA symbols are non-ASCII.
  if (/^[A-Za-z0-9_-]+$/.test(s)) s = s.toLowerCase();

  // Legacy single-codepoint affricates first
  if (LEGACY[s]) s = LEGACY[s];

  // Replace explicit tie-bar affricates
  s = s
    .replace(/t[\u0361\u035C]?ʃ/g, "tʃ")
    .replace(/d[\u0361\u035C]?ʒ/g, "dʒ");

  // Strip any leftover tie bars / ZWJ
  s = s.replace(TIE, "");

  // Finally map Azure/legacy -> canonical IPA (and any remaining aliases)
  return phonemeAlias[s] || s;
}

/** Return Azure/project-friendly codes for a canonical IPA (e.g., eɪ -> ["ey"], ə -> ["ax","schwa"]). */
export function getCodesForIPA(symbol) {
  const ipa = norm(symbol);
  const arr = _codesByIPA[ipa] || [];
  // Unique + stable
  return Array.from(new Set(arr));
}

/* ---------- Sequence coalescing (fix for ɚ not surfacing) ---------- */
/**
 * Normalize and coalesce an Azure phoneme sequence into canonical IPA,
 * merging rhotic schwa combos (ax + r / ə + ɹ → ɚ).
 *
 * Call this on the array you get back from Azure before scoring/display.
 */
export function normalizePhoneSequence(seq) {
  if (!Array.isArray(seq)) return [];
  const out = [];

  for (let i = 0; i < seq.length; i++) {
    const cur = norm(seq[i]);
    const next = norm(seq[i + 1]);

    // Merge unstressed rhotic vowel: schwa + r  -> ɚ
    if (cur === "ə" && next === "ɹ") {
      out.push("ɚ");
      i++; // skip the following /ɹ/
      continue;
    }

    out.push(cur);
  }

  return out;
}
