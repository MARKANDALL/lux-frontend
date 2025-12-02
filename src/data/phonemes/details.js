// details.js
// articulatorPlacement + per-phoneme coaching details and youtube link

import { norm } from "./core.js";

/* ---------- Articulator placement (tips/labels) ---------- */
export const articulatorPlacement = {
  /* CONSONANTS */
  p: {
    label: "Voiceless bilabial stop",
    example: "pie",
    tip: "Press both lips together to block airflow; build slight pressure, then release it cleanly without using your vocal cords.",
  },
  b: {
    label: "Voiced bilabial stop",
    example: "buy",
    tip: "Same lip closure and release as /p/, but keep your vocal folds vibrating the whole time.",
  },
  t: {
    label: "Voiceless alveolar stop",
    example: "tea",
    tip: "Touch the tongue tip to the alveolar ridge (just behind upper teeth); seal off airflow, build pressure, then release crisply without voice.",
  },
  d: {
    label: "Voiced alveolar stop",
    example: "do",
    tip: "Identical placement to /t/ but engage vocal-fold vibration through the closure and release.",
  },
  k: {
    label: "Voiceless velar stop",
    example: "cat",
    tip: "Raise back of tongue to soft palate, seal, build pressure, then release sharply with no voicing.",
  },
  g: {
    label: "Voiced velar stop",
    example: "go",
    tip: "Same placement as /k/ but activate voicing during closure and release.",
  },
  m: {
    label: "Bilabial nasal",
    example: "me",
    tip: "Close lips as for /b/ but lower the velum so air flows through the nose; vocal folds vibrate.",
  },
  n: {
    label: "Alveolar nasal",
    example: "no",
    tip: "Tongue tip on alveolar ridge; velum lowered for nasal airflow; keep voicing on.",
  },
  ŋ: {
    label: "Velar nasal",
    example: "sing",
    tip: "Back of tongue contacts soft palate; velum lowered; voiced airflow exits through nose.",
  },
  f: {
    label: "Voiceless labiodental fricative",
    example: "fine",
    tip: "Rest upper teeth lightly on inner lower lip; let narrow gap leak air, creating friction—no voicing.",
  },
  v: {
    label: "Voiced labiodental fricative",
    example: "vine",
    tip: "Same lip-to-teeth position as /f/, but vibrate the vocal folds so the friction is voiced.",
  },
  θ: {
    label: "Voiceless dental fricative",
    example: "think",
    tip: "Place tongue tip lightly against or just behind upper front teeth, creating a tiny slit; push air through without voice—keep contact light.",
  },
  ð: {
    label: "Voiced dental fricative",
    example: "this",
    tip: "Identical placement to /θ/ but add voicing throughout; keep contact light so friction remains.",
  },
  s: {
    label: "Voiceless alveolar fricative",
    example: "see",
    tip: "Groove the tongue tip/blade near the alveolar ridge, keep sides touching upper molars; push air through central groove—no voicing.",
  },
  z: {
    label: "Voiced alveolar fricative",
    example: "zoo",
    tip: "Same groove position as /s/ but engage vocal folds; maintain narrow air channel.",
  },
  ʃ: {
    label: "Voiceless postalveolar fricative",
    example: "shoe",
    tip: "Pull tongue blade slightly back from /s/ position, raise sides; lips round lightly; release unvoiced turbulent air.",
  },
  ʒ: {
    label: "Voiced postalveolar fricative",
    example: "measure",
    tip: "Same tongue and lip shape as /ʃ/ but vocalize the airflow.",
  },
  h: {
    label: "Voiceless glottal fricative",
    example: "he",
    tip: "Slightly narrow the vocal-fold opening and exhale; no tongue or lip constriction needed.",
  },
  t͡ʃ: {
    label: "Voiceless postalveolar affricate",
    example: "church",
    tip: "Begin with tongue position for /t/ slightly further back; release immediately into /ʃ/ in one smooth motion without voicing.",
  },
  d͡ʒ: {
    label: "Voiced postalveolar affricate",
    example: "judge",
    tip: "Same sequence as /t͡ʃ/ but maintain vocal-fold vibration throughout.",
  },
  ɹ: {
    label: "Voiced postalveolar approximant",
    example: "red",
    tip: "Curl or bunch tongue toward—but not touching—the postalveolar region; lips may round; sustain voicing without central friction.",
  },
  l: {
    label: "Voiced alveolar lateral approximant",
    example: "let",
    tip: "Tongue tip to alveolar ridge; sides of tongue lower so voiced air escapes laterally along molars.",
  },
  w: {
    label: "Voiced labial-velar approximant",
    example: "we",
    tip: "Round lips while back of tongue raises toward the soft palate; glide with continuous voicing.",
  },
  j: {
    label: "Voiced palatal approximant",
    example: "yes",
    tip: "Front of tongue comes close to hard palate (like the glide into /i/); voice flows smoothly with no friction.",
  },
  ɾ: {
    label: "Voiced alveolar tap",
    example: "butter (AmE)",
    tip: "Flick tongue tip quickly against alveolar ridge; contact lasts ~20 ms, voiced throughout.",
  },
  ʔ: {
    label: "Glottal stop",
    example: "uh-oh",
    tip: "Briefly close the vocal folds completely to stop airflow, then release; no tongue involvement.",
  },

  /* VOWELS (MONOPHTHONGS) */
  i: {
    label: "Close front unrounded",
    example: "fleece",
    tip: "Spread lips; raise tongue body high and forward near hard palate; jaw nearly closed.",
  },
  ɪ: {
    label: "Near-close front unrounded",
    example: "kit",
    tip: "Similar to /i/ but relax tongue slightly lower; lips lax; jaw a bit more open.",
  },
  e: {
    label: "Close-mid front unrounded",
    example: "chaotic",
    tip: "Tongue high front-mid; lips neutral; jaw medium height.",
  },
  ɛ: {
    label: "Open-mid front unrounded",
    example: "dress",
    tip: "Lower the tongue to mid-open front; lips neutral; jaw more open than /e/.",
  },
  æ: {
    label: "Near-open front unrounded",
    example: "trap",
    tip: "Tongue low-front; jaw dropped; lips neutral to slight spread.",
  },
  ɑ: {
    label: "Open back unrounded",
    example: "father",
    tip: "Lower jaw fully; tongue low and back; lips unrounded.",
  },
  ɔ: {
    label: "Open-mid back rounded",
    example: "thought",
    tip: "Tongue low-mid back; lips rounded; jaw moderately open.",
  },
  o: {
    label: "Close-mid back rounded",
    example: "go (steady portion)",
    tip: "Tongue mid-high back; lips rounded; jaw fairly closed.",
  },
  ʊ: {
    label: "Near-close back rounded",
    example: "foot",
    tip: "Tongue high-back but slightly lower than /u/; lips loosely rounded.",
  },
  u: {
    label: "Close back rounded",
    example: "goose",
    tip: "Raise tongue high-back near soft palate; lips tightly rounded; jaw nearly closed.",
  },
  ʌ: {
    label: "Open-mid back unrounded",
    example: "strut",
    tip: "Tongue mid-low central-back; jaw fairly open; lips relaxed.",
  },
  ə: {
    label: "Mid-central (schwa)",
    example: "sofa",
    tip: "Tongue relaxed in central position; jaw mid; lips neutral; occurs only in unstressed syllables.",
  },
  ɝ: {
    label: "Mid-central rhotic",
    example: "nurse",
    tip: "Center of tongue bunches slightly upward while tongue tip curls/bunches for /ɹ/ quality; voiced r-coloring throughout.",
  },
  ɚ: {
    label: "Mid-central rhotic (unstressed)",
    example: "butter (second syllable)",
    tip: "Same tongue shape as /ɝ/ but shorter and unstressed—keep the r-colouring.",
  },

  /* DIPHTHONGS */
  eɪ: {
    label: "Diphthong (face)",
    example: "day",
    tip: "Start at /e/; glide upward/forward toward /ɪ/ while lips spread.",
  },
  aɪ: {
    label: "Diphthong (price)",
    example: "my",
    tip: "Begin low-front /a/; glide to high-front /ɪ/ raising tongue and narrowing lips.",
  },
  ɔɪ: {
    label: "Diphthong (choice)",
    example: "boy",
    tip: "Start at /ɔ/ with lip rounding; glide to /ɪ/ with lips spreading.",
  },
  aʊ: {
    label: "Diphthong (mouth)",
    example: "now",
    tip: "Begin low-front /a/ unrounded; glide to high-back /ʊ/ with progressive lip rounding.",
  },
  oʊ: {
    label: "Diphthong (goat)",
    example: "go",
    tip: "Start mid-back rounded /o/; glide slightly upward/back toward /ʊ/ while maintaining rounding.",
  },
};

/* Canonicalise articulatorPlacement keys & mirror tie-bar forms */
(() => {
  const AP = articulatorPlacement;
  [
    ["t͡ʃ", "tʃ"],
    ["d͡ʒ", "dʒ"],
    ["ʧ", "tʃ"],
    ["ʤ", "dʒ"],
  ].forEach(([from, to]) => {
    if (AP[from] && !AP[to]) AP[to] = AP[from];
  });
})();

/* ---------- Per-phoneme coaching details ---------- */
const phonemeDetails = {
  th: {
    tip: "Try placing your tongue between your front teeth and blow air out gently.",
    mistake:
      "Many Spanish, French, and German speakers say 't' or 'd' instead of 'th'.",
    ipa: "/θ/ (as in 'think', 'bath', 'path')",
  },
  r: {
    tip: "Curl your tongue back, but don’t let it touch the roof of your mouth.",
    mistake:
      "Spanish, French, and Japanese speakers often use a tapped or rolled 'r'.",
    ipa: "/ɹ/ (as in 'red', 'car', 'run')",
  },
  n: {
    tip: "Touch the tip of your tongue to the ridge just behind your top front teeth.",
    mistake: "Final 'n' is sometimes replaced with 'ng' or dropped.",
    ipa: "/n/ (as in 'nine', 'run', 'pen')",
  },
  s: {
    tip: "Keep your tongue close to, but not touching, the roof of your mouth. Blow air steadily.",
    mistake: "Can be replaced with 'sh' or voiced as 'z' by some speakers.",
    ipa: "/s/ (as in 'see', 'bus', 'hiss')",
  },
  z: {
    tip: "Voice the 's' sound by vibrating your vocal cords.",
    mistake: "'z' is sometimes pronounced as 's'.",
    ipa: "/z/ (as in 'zoo', 'nose', 'rose')",
  },
  t: {
    tip: "Touch the tongue tip to the ridge just behind your upper front teeth, then release.",
    mistake: "Some speakers tap the 't' too quickly.",
    ipa: "/t/ (as in 'top', 'cat', 'bat')",
  },
  ax: {
    tip: "Relax your mouth and make a short, central vowel sound.",
    mistake: "This reduced vowel (schwa) doesn't exist in many languages.",
    ipa: "/ə/ (as in 'sofa', 'about')",
  },

  // Added
  tʃ: {
    tip: "Start with a quick /t/ closure and release directly into the /ʃ/ friction—no gap.",
    mistake:
      "Often realised as plain /ʃ/ (missing the stop) or split as /t/ + /ʃ/ with a pause.",
    ipa: "/tʃ/ (as in 'church')",
  },
  dʒ: {
    tip: "Same as /tʃ/ but keep voicing on through the whole sound.",
    mistake: "Produced as /ʒ/ (no stop) or as /d/ + /ʒ/ with an audible break.",
    ipa: "/dʒ/ (as in 'judge')",
  },
  ɚ: {
    tip: "Same tongue shape as /ɝ/ but shorter and unstressed—keep the r-colouring.",
    mistake: "Reduced to a plain schwa /ə/ with no r-colouring.",
    ipa: "/ɚ/ (second syllable of 'butter')",
  },
  ɝ: {
    tip: "Bunch or retroflex the tongue for /ɹ/ quality while keeping the vowel steady; sustain voicing.",
    mistake: "Produced as plain /ə/ or /ʌ/ without r-colouring.",
    ipa: "/ɝ/ (as in 'bird', 'nurse')",
  },
  ɾ: {
    tip: "A super quick tap of the tongue against the alveolar ridge (~20 ms).",
    mistake: "Held too long like /d/ or devoiced like /t'.",
    ipa: "/ɾ/ (AmE 'butter')",
  },
  ʔ: {
    tip: "Briefly close the vocal folds to stop airflow, then release.",
    mistake: "Replacing intended /t/ or /d/ where it shouldn’t be glottalised.",
    ipa: "/ʔ/ (as in 'uh-oh')",
  },
};

/* Map coaching details by canonical IPA */
export const phonemeDetailsByIPA = {};
Object.entries(phonemeDetails).forEach(([k, v]) => {
  phonemeDetailsByIPA[norm(k)] = v;
});

/* ---------- Misc ---------- */
export const ytLink = "https://youtu.be/y-k8sDRto9s";
