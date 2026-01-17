// features/results/syllables.js
// Renders [syllables] with a glowing "expected stress" syllable.
//
// NOTE (Azure): The API provides syllable objects + accuracy,
// but does NOT directly label lexical stress.
// So this v1 highlights a best-guess “expected stress” based on a small override list,
// with a safe default (first syllable) when unknown.

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Small “starter lexicon” (easy to expand later)
const EXPECTED_STRESS_OVERRIDES = {
  // common multi-syllable words (index is 0-based)
  computer: 1,     // com-PU-ter
  about: 1,        // a-BOUT
  before: 1,       // be-FORE
  today: 1,        // to-DAY
  hotel: 1,        // ho-TEL (often)
  pocket: 0,       // POCK-et

  // classic stress-shift words (default = noun/adjective stress)
  record: 0,       // RE-cord (noun) vs re-CORD (verb)
  present: 0,      // PRE-sent vs pre-SENT
  contract: 0,     // CON-tract vs con-TRACT
  permit: 0,       // PER-mit vs per-MIT
  protest: 0,      // PRO-test vs pro-TEST
  conduct: 0,      // CON-duct vs con-DUCT
  import: 0,       // IM-port vs im-PORT
  export: 0,       // EX-port vs ex-PORT
  object: 0,       // OB-ject vs ob-JECT
  project: 0,      // PRO-ject vs pro-JECT
  increase: 0,     // IN-crease vs in-CREASE
};

function getExpectedStressIndex(wordText, syllableCount) {
  if (!syllableCount || syllableCount <= 1) return 0;

  const w = String(wordText || "").toLowerCase().replace(/[^a-z']/g, "");
  if (!w) return 0;

  if (w in EXPECTED_STRESS_OVERRIDES) {
    const idx = EXPECTED_STRESS_OVERRIDES[w];
    return Math.max(0, Math.min(syllableCount - 1, idx));
  }

  // Safe default until you add a real stress dictionary
  return 0;
}

function normalizeSyllables(wordObj) {
  // Azure typically returns word.Syllables = [{ Syllable, AccuracyScore, Offset, Duration }, ...]
  const syls = wordObj?.Syllables;
  if (Array.isArray(syls) && syls.length) return syls;

  // Fallback: treat whole word as 1 syllable
  return [{ Syllable: wordObj?.Word || "" }];
}

function getSylText(sylObj) {
  // be defensive about casing
  const raw =
    sylObj?.Syllable ??
    sylObj?.syllable ??
    sylObj?.Text ??
    sylObj?.text ??
    "";

  // If stress markers ever appear (ˈ ˌ), strip them for display
  return String(raw).replace(/[ˈˌ]/g, "");
}

export function renderSyllableStrip(wordObj) {
  const wordText = wordObj?.Word || "";
  const syls = normalizeSyllables(wordObj);

  const stressIdx = getExpectedStressIndex(wordText, syls.length);

  const pieces = syls
    .map((s, i) => {
      const t = getSylText(s);
      const cls = i === stressIdx ? "lux-syl is-stress" : "lux-syl";
      return `<span class="${cls}">${escapeHtml(t)}</span>`;
    })
    .join("");

  const title =
    syls.length > 1
      ? `Expected stress highlighted (v1 heuristic)`
      : `Single-syllable word`;

  return `<div class="lux-sylStrip" title="${escapeHtml(title)}">${pieces}</div>`;
}
