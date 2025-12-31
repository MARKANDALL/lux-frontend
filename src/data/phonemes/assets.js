// assets.js
// Phoneme asset map (ipa + video) and lookup. Uses norm from core.
//
// COMPATIBILITY EDITION (pull-up strategy):
// - Keeps ALL your original keys exactly as-is (zero break risk for any code
//   that references phonemeAssets["u_short"], phonemeAssets["schwa"], etc.).
// - Adds extra alias keys (Azure-friendly codes like iy/uw/ax/ey/...) that
//   point to the SAME assets, so more inputs resolve to the same videos.
// - Builds an O(1) canonical lookup by IPA (assetsByIPA) and always uses norm().

import { norm } from "./core.js";

/* ---------------------------------------------------------
           Original map (unchanged keys)
   --------------------------------------------------------- */
const phonemeAssets = {
  /* Original batch */
  r: {
    ipa: "ɹ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_7d727f4cc0d54acfb98e40c828905f0b/720p/mp4/file.mp4",
  },
  dh: {
    ipa: "ð",
    video:
      "https://video.wixstatic.com/video/0d5d6f_c0087bc4d2844ee78d209b004b9ac87d/720p/mp4/file.mp4",
  },
  th: {
    ipa: "θ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_a84f54cbcdc043dabb5677dd27293e0e/720p/mp4/file.mp4",
  },
  l: {
    ipa: "l",
    video:
      "https://video.wixstatic.com/video/0d5d6f_368f7009129f4458bb8093e43c710463/720p/mp4/file.mp4",
  },
  sh: {
    ipa: "ʃ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_4a4ea5cc1c7548739da1b6d8b0c11970/720p/mp4/file.mp4",
  },
  ae: {
    ipa: "æ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_86dfe7364dcf4c6aaea6418f245b203f/480p/mp4/file.mp4",
  },
  v: {
    ipa: "v",
    video:
      "https://video.wixstatic.com/video/0d5d6f_f2e53f03b6eb4f05b9c24aa3302b6a51/720p/mp4/file.mp4",
  },
  zh: {
    ipa: "ʒ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_b7941cad4a9f4ca985bb9e79cfa7c0ea/720p/mp4/file.mp4",
  },
  z: {
    ipa: "z",
    video:
      "https://video.wixstatic.com/video/0d5d6f_98738905164b417da9305818c866ccdf/720p/mp4/file.mp4",
  },

  ["ɳ"]: {
    ipa: "ɳ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_fd6d5d0b30a14f5b8156276908f071d6/720p/mp4/file.mp4",
  },
  u_short: {
    ipa: "ʊ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_d1f044e5eb254a858505df8cdc38cc6b/144p/mp4/file.mp4",
  },

  /* New Seeing-Speech clips — Stops / Plosives */
  p: {
    ipa: "p",
    video:
      "https://video.wixstatic.com/video/0d5d6f_cd77a253e2044a2f97ae82820c2e7db1/720p/mp4/file.mp4",
  },
  b: {
    ipa: "b",
    video:
      "https://video.wixstatic.com/video/0d5d6f_427b1facf4f94387b044e38e24573fbb/720p/mp4/file.mp4",
  },
  t: {
    ipa: "t",
    video:
      "https://video.wixstatic.com/video/0d5d6f_1c0eedc2840f46faba1a7c81cb6ec2b3/720p/mp4/file.mp4",
  },
  d: {
    ipa: "d",
    video:
      "https://video.wixstatic.com/video/0d5d6f_18f272949b024ed8bb09c9f82571ca4f/720p/mp4/file.mp4",
  },
  k: {
    ipa: "k",
    video:
      "https://video.wixstatic.com/video/0d5d6f_6e534b826f76438b8849303a93e058be/720p/mp4/file.mp4",
  },
  g: {
    ipa: "g",
    video:
      "https://video.wixstatic.com/video/0d5d6f_7ddce2d0d737482fa021d4a5e08e6c83/720p/mp4/file.mp4",
  },
  ["ʔ"]: {
    ipa: "ʔ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_0738fc5a714b44528439e1ab67887525/720p/mp4/file.mp4",
  },

  /* Vowels (monophthongs & useful contrasts) */
  i: {
    ipa: "i",
    video:
      "https://video.wixstatic.com/video/0d5d6f_7bfbbe6277e04dc9bf6b4c25b7085fc6/144p/mp4/file.mp4",
  },
  ih: {
    ipa: "ɪ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_bcfcacac0c8341caa2131bade4621ee5/144p/mp4/file.mp4",
  },
  e: {
    ipa: "e",
    video:
      "https://video.wixstatic.com/video/0d5d6f_6fe00ec89935410d8ce645528186046c/144p/mp4/file.mp4",
  },
  schwa: {
    ipa: "ə",
    video:
      "https://video.wixstatic.com/video/0d5d6f_b29663890f8e4d1aa96005c8e46bf497/144p/mp4/file.mp4",
  },
  eh: {
    ipa: "ɛ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_5753dd7d338b472a9c5e0b4009a90a44/144p/mp4/file.mp4",
  },
  uh: {
    ipa: "ʌ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_1602100a59d8495098039185c8fe09e6/144p/mp4/file.mp4",
  },
  u: {
    ipa: "u",
    video:
      "https://video.wixstatic.com/video/0d5d6f_a8aa8854bb3e4fccbc1e70a9e847d9b8/144p/mp4/file.mp4",
  },
  ah: {
    ipa: "ɑ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_16ba279a5bed4aa4a3ae915a0c708e98/144p/mp4/file.mp4",
  },
  aw: {
    ipa: "ɔ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_dca89bb4ab2b409fad8e4b9fc97edd27/144p/mp4/file.mp4",
  },
  o: {
    ipa: "o",
    video:
      "https://video.wixstatic.com/video/0d5d6f_70ffa1aa7b914a1484fc27ff65180012/144p/mp4/file.mp4",
  },

  /* === Rhotic vowels === */
  er: {
    ipa: "ɝ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_a4fd7aac7c27437fa0c9f70b243d0824/480p/mp4/file.mp4",
  },
  axr: {
    ipa: "ɚ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_4686a9b0407d4546b1c4fa746ade7392/480p/mp4/file.mp4",
  },

  /* Diphthongs */
  ["eɪ"]: {
    ipa: "eɪ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_c2d47dad0b3f470aa51768cd8f4dea74/480p/mp4/file.mp4",
  },
  ["aɪ"]: {
    ipa: "aɪ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_dedfc9cb295c4ebb972acb13cfebdd1d/480p/mp4/file.mp4",
  },
  ["ɔɪ"]: {
    ipa: "ɔɪ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_afc6389fce44476a921b4eee252726fa/480p/mp4/file.mp4",
  },
  ["aʊ"]: {
    ipa: "aʊ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_a4ed3fe3131e4d658be6bf6fad23ea4d/480p/mp4/file.mp4",
  },
  ["oʊ"]: {
    ipa: "oʊ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_7ccc4f3663c84a409f4b9ec41324e9ac/480p/mp4/file.mp4",
  },

  /* Nasals */
  m: {
    ipa: "m",
    video:
      "https://video.wixstatic.com/video/0d5d6f_7ee24079934f49c99418747c7fb9b291/720p/mp4/file.mp4",
  },
  n: {
    ipa: "n",
    video:
      "https://video.wixstatic.com/video/0d5d6f_cc606e7ffbd94b45b34f086802771210/720p/mp4/file.mp4",
  },
  ["ŋ"]: {
    ipa: "ŋ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_3a8df55492824f7abfaf245c40bf9982/720p/mp4/file.mp4",
  },

  /* Fricatives */
  f: {
    ipa: "f",
    video:
      "https://video.wixstatic.com/video/0d5d6f_c14cb7ce09204f4b9e3476e1bb39e0b6/720p/mp4/file.mp4",
  },
  s: {
    ipa: "s",
    video:
      "https://video.wixstatic.com/video/0d5d6f_1a60932597874db19eda4c5c69191826/720p/mp4/file.mp4",
  },
  h: {
    ipa: "h",
    video:
      "https://video.wixstatic.com/video/0d5d6f_eec4d7bd4500484a857a1ffeaeb2ab5b/720p/mp4/file.mp4",
  },

  /* Affricates */
  ["tʃ"]: {
    ipa: "tʃ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_ad3b6fb26e7d46fab857862c3de1d752/720p/mp4/file.mp4",
  },
  ["dʒ"]: {
    ipa: "dʒ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_805a57c5fdbc48eab56188314951b385/720p/mp4/file.mp4",
  },

  /* Approximants / Glides */
  w: {
    ipa: "w",
    video:
      "https://video.wixstatic.com/video/0d5d6f_9532587ba76245ae86301b2734b632dd/720p/mp4/file.mp4",
  },
  j: {
    ipa: "j",
    video:
      "https://video.wixstatic.com/video/0d5d6f_9e45cb00760e4d4d8b8236ea8b61b1c9/720p/mp4/file.mp4",
  },
  ["ʍ"]: {
    ipa: "ʍ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_5e09d71fb68e494480d5122d722a0e02/720p/mp4/file.mp4",
  },
  ["ɾ"]: {
    ipa: "ɾ",
    video:
      "https://video.wixstatic.com/video/0d5d6f_2e1b9a5fd9e14b40975a59ce641c6925/720p/mp4/file.mp4",
  },
};

/* ---------------------------------------------------------
   Compatibility aliases (additive; points to existing entries)
   - Adds Azure-friendly codes that your core.js already knows about
     without changing any of your original keys.
   - If a key already exists, we DO NOT overwrite it.
   --------------------------------------------------------- */
function addAliasKey(newKey, existingKey) {
  if (!phonemeAssets[newKey] && phonemeAssets[existingKey]) {
    phonemeAssets[newKey] = phonemeAssets[existingKey];
  }
}

// Vowels (Azure -> existing keys you already use)
addAliasKey("iy", "i");
addAliasKey("ax", "schwa");
addAliasKey("uw", "u");
addAliasKey("aa", "ah"); // /ɑ/
addAliasKey("ao", "aw"); // /ɔ/
addAliasKey("ey", "eɪ");
addAliasKey("ay", "aɪ");
addAliasKey("oy", "ɔɪ");
addAliasKey("ow", "oʊ");

// Consonants (Azure -> existing)
addAliasKey("ng", "ŋ");
addAliasKey("ch", "tʃ");
addAliasKey("jh", "dʒ");
addAliasKey("dx", "ɾ");
addAliasKey("wh", "ʍ");
addAliasKey("q", "ʔ");
addAliasKey("y", "j");

// Also accept direct IPA keys for convenience (without changing anything)
addAliasKey("ɹ", "r");
addAliasKey("θ", "th");
addAliasKey("ð", "dh");

/* ---------------------------------------------------------
   Build O(1) lookup by canonical IPA
   - We normalize before indexing to prevent drift.
   --------------------------------------------------------- */
const assetsByIPA = Object.create(null);

Object.values(phonemeAssets).forEach((a) => {
  if (!a?.ipa || !a?.video) return;
  const ipa = norm(a.ipa);
  if (!assetsByIPA[ipa]) assetsByIPA[ipa] = { ipa, video: a.video };
});

/* Defensive fallback: if ɚ ever goes missing, reuse the ɹ clip (better than null). */
if (!assetsByIPA["ɚ"] && assetsByIPA["ɹ"]?.video) {
  assetsByIPA["ɚ"] = { ipa: "ɚ", video: assetsByIPA["ɹ"].video };
}

/** Fast lookup by IPA (or Azure code—both normalized). */
export function getPhonemeAssetByIPA(symbol) {
  return assetsByIPA[norm(symbol)] || null;
}

export { phonemeAssets };
