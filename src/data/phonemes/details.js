// details.js
// articulatorPlacement + per-phoneme coaching details and youtube link
//
// This file is the “plain-English” side (friendly, independently clear).
// Technical/jargon-heavy copy can live in a future “tech side” map.

import { norm } from "./core.js";

/* =========================================================================
   Articulator placement (PLAIN ENGLISH)
   - Keyed by CANONICAL IPA (so it aligns with core.js + assets.js).
   - Each entry stands alone (no “same as X” dependencies).
   ========================================================================= */

export const articulatorPlacement = {
  /* -------------------- CONSONANTS -------------------- */

  p: {
    label: "P (no voice) — lips stop, then pop open",
    example: "pie",
    tip: "Close your lips tightly, build a small puff of air, then release. Keep your throat quiet (no buzzing).",
  },
  b: {
    label: "B (voice on) — lips stop, then pop open",
    example: "buy",
    tip: "Close your lips, turn your voice on (feel a gentle throat buzz), then release the lips.",
  },
  t: {
    label: "T (no voice) — tongue tap behind top teeth",
    example: "tea",
    tip: "Touch the tip of your tongue to the gum ridge just behind your upper front teeth. Hold air briefly, then release with no throat buzz.",
  },
  d: {
    label: "D (voice on) — tongue tap behind top teeth",
    example: "do",
    tip: "Touch the tongue tip to the gum ridge behind your upper front teeth, keep your voice on (throat buzz), then release.",
  },
  k: {
    label: "K (no voice) — back of tongue blocks, then releases",
    example: "cat",
    tip: "Lift the back of your tongue to touch the soft palate (back of the roof of your mouth). Release with a clean burst of air and no throat buzz.",
  },
  g: {
    label: "G (voice on) — back of tongue blocks, then releases",
    example: "go",
    tip: "Lift the back of your tongue to the soft palate, keep your voice on (throat buzz), then release.",
  },

  m: {
    label: "M (voice on) — lips closed, air through nose",
    example: "me",
    tip: "Close your lips and let the sound come out through your nose. Keep your voice on (gentle throat buzz).",
  },
  n: {
    label: "N (voice on) — tongue behind top teeth, air through nose",
    example: "no",
    tip: "Touch the tongue tip to the gum ridge behind your upper front teeth and let air flow through your nose while voicing.",
  },
  "ŋ": {
    label: "NG (voice on) — back of tongue, air through nose",
    example: "sing",
    tip: "Raise the back of your tongue (as for /k/ or /g/) and let the sound come out through your nose. Keep voicing on.",
  },

  f: {
    label: "F (no voice) — teeth on lip, steady air",
    example: "fine",
    tip: "Rest your top teeth gently on your bottom lip and blow air steadily. No throat buzz.",
  },
  v: {
    label: "V (voice on) — teeth on lip, steady air",
    example: "vine",
    tip: "Top teeth lightly on bottom lip, blow air steadily, and keep your voice on (throat buzz).",
  },

  "θ": {
    label: "TH (no voice) — tongue lightly at the teeth",
    example: "think",
    tip: "Place your tongue tip lightly between your teeth (or just behind the top teeth) and let air hiss through. No throat buzz.",
  },
  "ð": {
    label: "TH (voice on) — tongue lightly at the teeth",
    example: "this",
    tip: "Place your tongue tip lightly between your teeth (or just behind the top teeth), let air pass through, and keep your voice on (throat buzz).",
  },

  s: {
    label: "S (no voice) — narrow air stream at the front",
    example: "see",
    tip: "Keep your tongue close to the front roof of your mouth (behind upper teeth) and blow a thin stream of air through the middle. No throat buzz.",
  },
  z: {
    label: "Z (voice on) — narrow air stream at the front",
    example: "zoo",
    tip: "Make the same narrow air stream as /s/, but keep your voice on (throat buzz).",
  },

  "ʃ": {
    label: "SH (no voice) — rounded lips, air over a slightly back tongue",
    example: "shoe",
    tip: "Round your lips slightly and pull your tongue a little farther back than /s/. Let air flow steadily with no throat buzz.",
  },
  "ʒ": {
    label: "ZH (voice on) — like “measure” sound",
    example: "measure",
    tip: "Shape your mouth like /ʃ/ (slight lip rounding, tongue a bit back) but keep your voice on (throat buzz).",
  },

  h: {
    label: "H (no voice) — open mouth breath sound",
    example: "he",
    tip: "Open your mouth and breathe out smoothly, as if fogging a window—no tongue or lip contact needed.",
  },

  "tʃ": {
    label: "CH (no voice) — stop + quick “sh” release",
    example: "chair",
    tip: "Make a quick tongue stop behind the upper teeth, then immediately release into a “sh”-like airflow, all as one sound. No throat buzz.",
  },
  "dʒ": {
    label: "J (voice on) — stop + quick “zh” release",
    example: "judge",
    tip: "Make a quick tongue stop behind the upper teeth, then release into the “measure” (ʒ) type airflow while keeping your voice on.",
  },

  "ɹ": {
    label: "R (voice on) — tongue lifted but not touching",
    example: "red",
    tip: "Lift and bunch your tongue slightly back in the mouth without touching the roof. Keep your voice on and avoid friction.",
  },
  l: {
    label: "L (voice on) — tongue tip up, air flows around sides",
    example: "let",
    tip: "Touch your tongue tip to the gum ridge behind the upper teeth. Keep voicing on and let air escape around the sides of the tongue.",
  },

  w: {
    label: "W (voice on) — rounded lips, quick glide",
    example: "we",
    tip: "Round your lips and move quickly into the next vowel while keeping your voice on.",
  },
  j: {
    label: "Y (voice on) — quick “ee”-like glide",
    example: "yes",
    tip: "Lift the front of your tongue toward the hard palate (like the start of “ee”) and glide into the next vowel with voicing on.",
  },

  "ɾ": {
    label: "Fast T/D tap (voice on) — quick tongue flick",
    example: "water (American)",
    tip: "Keep voicing on and flick the tongue tip quickly against the gum ridge behind the upper teeth. It’s a very fast, light contact.",
  },

  "ʔ": {
    label: "Throat stop — tiny pause in airflow",
    example: "uh-oh",
    tip: "Briefly close your vocal folds to stop the air for a moment, then release. It feels like a tiny catch in your throat.",
  },

  "ʍ": {
    label: "Breathy W (no voice) — “which” (for some speakers)",
    example: "which",
    tip: "Round your lips like /w/, but keep your voice off and push air through. It’s a breathy, whispered W.",
  },

  "ɳ": {
    label: "N with tongue curled back (not common in English)",
    example: "—",
    tip: "Curl the tongue tip slightly back (a retroflex shape) and let the sound come out through the nose while voicing. This sound is mainly used in some languages other than English.",
  },

  /* -------------------- VOWELS (MONOPHTHONGS) -------------------- */

  i: {
    label: "EE vowel — steady, smile-like",
    example: "see",
    tip: "Spread your lips slightly (like a small smile) and raise the front of your tongue high. Hold the vowel steady.",
  },
  "ɪ": {
    label: "IH vowel — relaxed, shorter",
    example: "sit",
    tip: "Keep the tongue high-front but a little lower and more relaxed than /i/. Lips relaxed; vowel is usually shorter.",
  },
  e: {
    label: "AY start vowel — the start of “day”",
    example: "day (start)",
    tip: "Raise the front of your tongue to a mid-high position. Lips neutral. (In many accents, this vowel quickly glides into /ɪ/.)",
  },
  "ɛ": {
    label: "EH vowel — open-mid front",
    example: "bed",
    tip: "Open your mouth a bit more and keep the tongue mid-front. Lips neutral.",
  },
  "æ": {
    label: "A vowel — wide mouth, low-front",
    example: "cat",
    tip: "Drop your jaw and keep the tongue low and forward. Lips neutral to slightly spread.",
  },
  "ɑ": {
    label: "AH vowel — open, back",
    example: "father",
    tip: "Open the mouth wide. Keep the tongue low and back. Lips relaxed (not rounded).",
  },
  "ɔ": {
    label: "AW vowel — back + rounded lips",
    example: "thought",
    tip: "Round your lips and keep the tongue back with a medium-open jaw. (Some speakers merge this with /ɑ/.)",
  },
  o: {
    label: "OH start vowel — the start of “go”",
    example: "go (start)",
    tip: "Round your lips and keep the tongue mid-back. (In many accents, this vowel quickly glides toward /ʊ/.)",
  },
  "ʊ": {
    label: "Short OO vowel — like “book”",
    example: "book",
    tip: "Loosely round your lips and keep the tongue high-back but relaxed. Keep it short.",
  },
  u: {
    label: "OO vowel — like “food”",
    example: "food",
    tip: "Round your lips more firmly and raise the tongue high-back. Hold the vowel steady.",
  },
  "ʌ": {
    label: "UH vowel — like “cup”",
    example: "cup",
    tip: "Keep lips relaxed and the tongue in a central-to-back, mid position. Jaw moderately open.",
  },
  "ə": {
    label: "Schwa — quick, relaxed “uh” in unstressed syllables",
    example: "about (first “a”)",
    tip: "Relax your mouth and tongue. Make a very short, neutral “uh” sound—usually only in unstressed syllables.",
  },

  "ɝ": {
    label: "Stressed ER — like “bird”",
    example: "bird",
    tip: "Keep your tongue in an R-shaped position (bunched or slightly curled back) while voicing the vowel. Hold it steady.",
  },
  "ɚ": {
    label: "Unstressed ER — like the end of “teacher”",
    example: "teacher (end)",
    tip: "Use the same R-shaped tongue as /ɝ/, but make it shorter and unstressed.",
  },

  /* -------------------- DIPHTHONGS -------------------- */

  "eɪ": {
    label: "AY diphthong — “day”",
    example: "day",
    tip: "Start with the “day-start” vowel and glide upward toward a short /ɪ/. The movement is smooth and quick.",
  },
  "aɪ": {
    label: "I diphthong — “my”",
    example: "my",
    tip: "Start with an open mouth and then glide up toward /ɪ/ as the mouth narrows slightly.",
  },
  "ɔɪ": {
    label: "OY diphthong — “boy”",
    example: "boy",
    tip: "Start with rounded lips and a back vowel feeling, then glide to /ɪ/ as the lips spread a bit.",
  },
  "aʊ": {
    label: "OW diphthong — “now”",
    example: "now",
    tip: "Start open and unrounded, then glide toward /ʊ/ with more lip rounding near the end.",
  },
  "oʊ": {
    label: "OH diphthong — “go”",
    example: "go",
    tip: "Start with rounded “go-start” vowel and glide toward /ʊ/. Keep the motion smooth.",
  },
};

/* Mirror common alternate spellings/affricate tie-bars into canonical keys */
(() => {
  const AP = articulatorPlacement;

  [
    ["t͡ʃ", "tʃ"],
    ["d͡ʒ", "dʒ"],
    ["ʧ", "tʃ"],
    ["ʤ", "dʒ"],
  ].forEach(([from, to]) => {
    if (AP[from] && !AP[to]) AP[to] = AP[from];
    if (AP[to] && !AP[from]) AP[from] = AP[to];
  });
})();

/** Safe accessor (works with Azure codes, IPA, tie-bars, etc.). */
export function getArticulatorPlacement(symbol) {
  return articulatorPlacement[norm(symbol)] || null;
}

/* =========================================================================
   Per-phoneme coaching details (extra “coach notes”)
   - Still plain-ish, but can include “common mix-ups”.
   - Mapped by canonical IPA via norm().
   ========================================================================= */

const phonemeDetails = {
  // Consonants
  p: { tip: articulatorPlacement.p.tip, mistake: "Often loses the little puff and sounds too soft.", ipa: "/p/ (pie)" },
  b: { tip: articulatorPlacement.b.tip, mistake: "Often loses voicing and sounds like /p/.", ipa: "/b/ (buy)" },
  t: { tip: articulatorPlacement.t.tip, mistake: "May sound too weak or turn into a tap in casual speech.", ipa: "/t/ (tea)" },
  d: { tip: articulatorPlacement.d.tip, mistake: "May lose voicing and sound like /t/.", ipa: "/d/ (do)" },
  k: { tip: articulatorPlacement.k.tip, mistake: "May be too far forward and sound like /t/.", ipa: "/k/ (cat)" },
  g: { tip: articulatorPlacement.g.tip, mistake: "May lose voicing and sound like /k/.", ipa: "/g/ (go)" },

  m: { tip: articulatorPlacement.m.tip, mistake: "Nasal airflow gets blocked (turns into /b/).", ipa: "/m/ (me)" },
  n: { tip: articulatorPlacement.n.tip, mistake: "Tongue placement drifts and it becomes /ŋ/ in the wrong places.", ipa: "/n/ (no)" },
  "ŋ": { tip: articulatorPlacement["ŋ"].tip, mistake: "Added extra /g/ sound (“sing-guh”).", ipa: "/ŋ/ (sing)" },

  f: { tip: articulatorPlacement.f.tip, mistake: "Airflow too weak; turns into /p/ or /h/.", ipa: "/f/ (fine)" },
  v: { tip: articulatorPlacement.v.tip, mistake: "Loses voicing and becomes /f/.", ipa: "/v/ (vine)" },

  "θ": { tip: articulatorPlacement["θ"].tip, mistake: "Tongue stays inside; it becomes /t/ or /s/.", ipa: "/θ/ (think)" },
  "ð": { tip: articulatorPlacement["ð"].tip, mistake: "Tongue stays inside; it becomes /d/ or /z/.", ipa: "/ð/ (this)" },

  s: { tip: articulatorPlacement.s.tip, mistake: "Becomes voiced /z/ when it should be unvoiced.", ipa: "/s/ (see)" },
  z: { tip: articulatorPlacement.z.tip, mistake: "Loses voicing and becomes /s/.", ipa: "/z/ (zoo)" },

  "ʃ": { tip: articulatorPlacement["ʃ"].tip, mistake: "Tongue too far forward; sounds like /s/.", ipa: "/ʃ/ (shoe)" },
  "ʒ": { tip: articulatorPlacement["ʒ"].tip, mistake: "Loses voicing and becomes /ʃ/.", ipa: "/ʒ/ (measure)" },

  h: { tip: articulatorPlacement.h.tip, mistake: "Gets dropped entirely at the start of words.", ipa: "/h/ (he)" },

  "tʃ": { tip: articulatorPlacement["tʃ"].tip, mistake: "Missing the stop part; turns into /ʃ/.", ipa: "/tʃ/ (chair)" },
  "dʒ": { tip: articulatorPlacement["dʒ"].tip, mistake: "Missing the stop part; turns into /ʒ/.", ipa: "/dʒ/ (judge)" },

  "ɹ": { tip: articulatorPlacement["ɹ"].tip, mistake: "Tongue touches the roof (creates friction) or becomes a tap/trill.", ipa: "/ɹ/ (red)" },
  l: { tip: articulatorPlacement.l.tip, mistake: "Tongue tip doesn’t lift; vowel takes over and /l/ disappears.", ipa: "/l/ (let)" },

  w: { tip: articulatorPlacement.w.tip, mistake: "Lip rounding is missing; sounds like /v/ or a plain vowel.", ipa: "/w/ (we)" },
  j: { tip: articulatorPlacement.j.tip, mistake: "Glide is too weak and disappears.", ipa: "/j/ (yes)" },

  "ɾ": { tip: articulatorPlacement["ɾ"].tip, mistake: "Held too long and sounds like /d/.", ipa: "/ɾ/ (water, AmE)" },
  "ʔ": { tip: articulatorPlacement["ʔ"].tip, mistake: "Used too often where a clear /t/ is expected.", ipa: "/ʔ/ (uh-oh)" },

  "ʍ": { tip: articulatorPlacement["ʍ"].tip, mistake: "Becomes voiced /w/ (many accents do this; it’s not always wrong).", ipa: "/ʍ/ (which, some speakers)" },

  "ɳ": { tip: articulatorPlacement["ɳ"].tip, mistake: "Tongue is not curled back enough; it becomes /n/.", ipa: "/ɳ/ (non-English in many cases)" },

  // Vowels
  i: { tip: articulatorPlacement.i.tip, mistake: "Becomes too relaxed and shifts toward /ɪ/.", ipa: "/i/ (see)" },
  "ɪ": { tip: articulatorPlacement["ɪ"].tip, mistake: "Too tense and becomes /i/.", ipa: "/ɪ/ (sit)" },
  e: { tip: articulatorPlacement.e.tip, mistake: "Glide is missing; can sound flat or too open.", ipa: "/e/ (day-start)" },
  "ɛ": { tip: articulatorPlacement["ɛ"].tip, mistake: "Jaw too open and drifts toward /æ/.", ipa: "/ɛ/ (bed)" },
  "æ": { tip: articulatorPlacement["æ"].tip, mistake: "Too closed; drifts toward /ɛ/.", ipa: "/æ/ (cat)" },
  "ɑ": { tip: articulatorPlacement["ɑ"].tip, mistake: "Lips round too much; drifts toward /ɔ/.", ipa: "/ɑ/ (father)" },
  "ɔ": { tip: articulatorPlacement["ɔ"].tip, mistake: "Often merges with /ɑ/ depending on accent.", ipa: "/ɔ/ (thought)" },
  o: { tip: articulatorPlacement.o.tip, mistake: "Glide is missing; can sound flat.", ipa: "/o/ (go-start)" },
  "ʊ": { tip: articulatorPlacement["ʊ"].tip, mistake: "Becomes too tense and turns into /u/.", ipa: "/ʊ/ (book)" },
  u: { tip: articulatorPlacement.u.tip, mistake: "Tongue too low; sounds like /ʊ/.", ipa: "/u/ (food)" },
  "ʌ": { tip: articulatorPlacement["ʌ"].tip, mistake: "Turns into schwa /ə/ when stressed.", ipa: "/ʌ/ (cup)" },
  "ə": { tip: articulatorPlacement["ə"].tip, mistake: "Made too long or too strong (schwa should be quick).", ipa: "/ə/ (about)" },
  "ɝ": { tip: articulatorPlacement["ɝ"].tip, mistake: "R-color is missing; sounds like a plain vowel.", ipa: "/ɝ/ (bird)" },
  "ɚ": { tip: articulatorPlacement["ɚ"].tip, mistake: "R-color is missing; becomes plain schwa.", ipa: "/ɚ/ (teacher, end)" },

  // Diphthongs
  "eɪ": { tip: articulatorPlacement["eɪ"].tip, mistake: "Glide is missing; can sound too short.", ipa: "/eɪ/ (day)" },
  "aɪ": { tip: articulatorPlacement["aɪ"].tip, mistake: "Doesn’t rise enough; sounds too flat.", ipa: "/aɪ/ (my)" },
  "ɔɪ": { tip: articulatorPlacement["ɔɪ"].tip, mistake: "Glide is weak; sounds like a plain vowel.", ipa: "/ɔɪ/ (boy)" },
  "aʊ": { tip: articulatorPlacement["aʊ"].tip, mistake: "Second part is too tense and becomes /u/.", ipa: "/aʊ/ (now)" },
  "oʊ": { tip: articulatorPlacement["oʊ"].tip, mistake: "Glide is missing; sounds too flat.", ipa: "/oʊ/ (go)" },
};

/* Map coaching details by canonical IPA */
export const phonemeDetailsByIPA = Object.create(null);
Object.entries(phonemeDetails).forEach(([k, v]) => {
  phonemeDetailsByIPA[norm(k)] = v;
});

/** Safe accessor (works with Azure codes, IPA, tie-bars, etc.). */
export function getPhonemeDetails(symbol) {
  return phonemeDetailsByIPA[norm(symbol)] || null;
}

/* ---------- Misc ---------- */
export const ytLink = "https://youtu.be/y-k8sDRto9s";

/* =========================================================================
   Suggestions / future upgrades (non-breaking ideas)
   1) Add a “tech side” map:
      - export const articulatorPlacementTech = { ... };
      - same keys (canonical IPA), but with full place/manner jargon.
   2) Add a tiny runtime self-check (dev-only):
      - import { getPhonemeAssetByIPA } and log any IPA that has video but
        missing articulatorPlacement entry (or vice versa).
   3) UI: flip-card tooltip
      - Front: articulatorPlacement (plain)
      - Back: articulatorPlacementTech (technical) + “front-of-mouth” video
   ========================================================================= */
