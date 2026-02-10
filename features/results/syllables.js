// features/results/syllables.js
// Renders [syllables] with a glowing "expected stress" syllable.
//
// Reality check:
// - Azure gives us syllable segmentation + accuracy
// - Azure does NOT tell us which syllable SHOULD carry lexical stress
//
// Fix:
// - Use CMU Pronouncing Dictionary stress digits (0/1/2 on vowel phones) to pick the
//   primary-stress syllable (fallback to secondary if needed).
// - If the CMU dictionary chunk hasn't loaded yet, we render a temporary heuristic,
//   then upgrade the DOM in-place once the dictionary arrives.

/* ------------------------------------------------------------
 * CMU dictionary (lazy-loaded)
 * ---------------------------------------------------------- */

let _CMU_DICT = null; // null = not loaded yet; {} = loaded but empty/failure; object = loaded dict
let _CMU_DICT_PROMISE = null;
let _upgradeScheduled = false;

function ensureCmuDict() {
  if (_CMU_DICT !== null) return _CMU_DICT_PROMISE || Promise.resolve(_CMU_DICT);
  if (_CMU_DICT_PROMISE) return _CMU_DICT_PROMISE;

  _CMU_DICT_PROMISE = import("cmu-pronouncing-dictionary")
    .then((mod) => {
      // Package exports { dictionary } (no default). We also tolerate default interop if a bundler adds it.
      _CMU_DICT = mod?.dictionary || mod?.default?.dictionary || {};
      return _CMU_DICT;
    })
    .catch((err) => {
      // If the dict chunk fails to load (offline, etc.), we keep the heuristic.
      _CMU_DICT = {};
      try {
        console.warn("[syllables] CMU dict failed to load; keeping heuristic.", err);
      } catch (_) {}
      return _CMU_DICT;
    })
    .finally(() => {
      scheduleStressUpgrade();
    });

  return _CMU_DICT_PROMISE;
}

function scheduleStressUpgrade() {
  if (_upgradeScheduled) return;
  _upgradeScheduled = true;

  if (typeof window === "undefined" || typeof document === "undefined") {
    _upgradeScheduled = false;
    return;
  }

  window.requestAnimationFrame(() => {
    _upgradeScheduled = false;
    try {
      upgradePendingStressStrips();
    } catch (_) {}
  });
}

/* ------------------------------------------------------------
 * Stress lookup (CMU) + fallback heuristic
 * ---------------------------------------------------------- */

// Keep your original tiny override list as a fallback when CMU lookup fails.
// (These are mostly to demonstrate that stress is NOT always on syllable #1.)
const secondSyllableWords = new Set([
  "police",
  "hotel",
  "guitar",
  "today",
  "tonight",
  "again",
  "hello",
  "about",
  "before",
  "because",
  "between",
]);

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanWord(raw) {
  // Keep apostrophes (DON'T), drop everything else.
  return String(raw || "")
    .trim()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^A-Za-z']/g, "")
    .replace(/^'+|'+$/g, "");
}

function getDictKeyTries(wordText) {
  const w0 = cleanWord(wordText);
  if (!w0) return [];

  const up = w0.toUpperCase();
  const lo = w0.toLowerCase();

  const tries = [up, lo];

  // Possessives / contractions: try removing trailing 'S, and also removing apostrophes.
  if (up.endsWith("'S")) tries.push(up.slice(0, -2), lo.slice(0, -2));
  if (w0.includes("'")) tries.push(up.replaceAll("'", ""), lo.replaceAll("'", ""));

  // De-dup while preserving order
  const seen = new Set();
  const out = [];
  for (const t of tries) {
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function collectPronunciations(dict, baseKey) {
  if (!dict || !baseKey) return [];

  const out = [];
  const pushIf = (v) => {
    const s = String(v || "").trim();
    if (s) out.push(s);
  };

  // Primary entry
  if (dict[baseKey]) pushIf(dict[baseKey]);

  // Alternative pronunciations use numbered keys like WORD(1), WORD(2), ...
  // We scan a small range but stop after a few misses to avoid unnecessary work.
  let misses = 0;
  for (let i = 1; i <= 12; i++) {
    const k = `${baseKey}(${i})`;
    const v = dict[k];
    if (v) {
      pushIf(v);
      misses = 0;
    } else {
      misses++;
      if (misses >= 3) break;
    }
  }

  return out;
}

function getObservedPhones(wordObj) {
  const phs = wordObj?.Phonemes;
  if (!Array.isArray(phs) || !phs.length) return [];

  return phs
    .map((p) => String(p?.Phoneme || p?.phoneme || "").trim().toLowerCase())
    .map((p) => p.replace(/[0-2]$/, "")) // just in case a digit sneaks in
    .filter(Boolean);
}

function basePhonesFromPron(pron) {
  return String(pron || "")
    .trim()
    .split(/\s+/)
    .map((p) => p.toLowerCase().replace(/[0-2]$/, ""))
    .filter(Boolean);
}

function editDistance(a = [], b = []) {
  const n = a.length;
  const m = b.length;
  const dp = new Array(m + 1);
  for (let j = 0; j <= m; j++) dp[j] = j;

  for (let i = 1; i <= n; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[m];
}

function pickBestPronunciation(prons, observedPhones) {
  if (!Array.isArray(prons) || !prons.length) return null;
  if (!observedPhones || !observedPhones.length) return prons[0];

  let best = prons[0];
  let bestDist = Infinity;

  for (const p of prons) {
    const base = basePhonesFromPron(p);
    const d = editDistance(observedPhones, base);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }

  return best;
}

function stressInfoFromPron(pron) {
  const toks = String(pron || "").trim().split(/\s+/).filter(Boolean);

  // In CMU dict, stress is encoded as a digit suffix on vowel phones (0/1/2).
  const vowels = toks.filter((t) => /[0-2]$/.test(t));
  if (!vowels.length) return null;

  const digits = vowels.map((v) => Number(v.slice(-1)));

  let primaryVowelIdx = digits.findIndex((d) => d === 1);
  let secondaryVowelIdxs = digits
    .map((d, i) => (d === 2 ? i : -1))
    .filter((i) => i >= 0);

  // If no primary stress is marked, treat first secondary as primary, else first vowel.
  if (primaryVowelIdx < 0) {
    if (secondaryVowelIdxs.length) {
      primaryVowelIdx = secondaryVowelIdxs[0];
      secondaryVowelIdxs = secondaryVowelIdxs.slice(1);
    } else {
      primaryVowelIdx = 0;
    }
  }

  return { vowelCount: vowels.length, primaryVowelIdx, secondaryVowelIdxs };
}

function mapVowelStressToSyllableIdx(stressVowelIdx, vowelCount, syllableCount) {
  if (!Number.isFinite(stressVowelIdx)) return null;
  if (!syllableCount || syllableCount <= 0) return null;

  let idx = stressVowelIdx;

  // Usually vowelCount == syllableCount; when it isn't, scale to fit.
  if (syllableCount > 1 && vowelCount > 1 && vowelCount !== syllableCount) {
    idx = Math.round((stressVowelIdx * (syllableCount - 1)) / (vowelCount - 1));
  }

  idx = Math.max(0, Math.min(syllableCount - 1, idx));
  return idx;
}

function getExpectedStressIndexHeuristic(wordText, sylCount) {
  if (!wordText || sylCount <= 1) return 0;

  const w = String(wordText || "").toLowerCase();
  if (secondSyllableWords.has(w)) return 1;

  // Default heuristic: first syllable.
  return 0;
}

function stressIndicesFromPron(pron, syllableCount) {
  const info = stressInfoFromPron(pron);
  if (!info) return null;
  const primarySylIdx = mapVowelStressToSyllableIdx(
    info.primaryVowelIdx,
    info.vowelCount,
    syllableCount
  );
  if (!Number.isInteger(primarySylIdx)) return null;

  const secondarySylIdxs = Array.from(
    new Set(
      (info.secondaryVowelIdxs || [])
        .map((vIdx) =>
          mapVowelStressToSyllableIdx(vIdx, info.vowelCount, syllableCount)
        )
        .filter((n) => Number.isInteger(n) && n !== primarySylIdx)
    )
  );

  return { primarySylIdx, secondarySylIdxs };
}

function getExpectedStressFromCmu(wordObj, sylCount) {
  if (!_CMU_DICT || !wordObj || sylCount <= 1) return null;

  const tries = getDictKeyTries(wordObj?.Word || "");
  if (!tries.length) return null;

  let prons = [];
  for (const k of tries) {
    prons = collectPronunciations(_CMU_DICT, k);
    if (prons.length) break;
  }
  if (!prons.length) return null;

  const observed = getObservedPhones(wordObj);
  const bestPron = pickBestPronunciation(prons, observed) || prons[0];
  const idxs = stressIndicesFromPron(bestPron, sylCount);
  if (!idxs) return null;

  return { prons, bestPron, ...idxs };
}

function getExpectedStressIndexFromCmu(wordObj, sylCount) {
  const payload = getExpectedStressFromCmu(wordObj, sylCount);
  return payload ? payload.primarySylIdx : null;
}

function getSylText(sylObj) {
  // If Azure provides phonetic text like ˈhɛˌloʊ, strip stress marks and keep IPA-ish tokens.
  const raw = sylObj?.Syllable || sylObj?.Text || "";
  let s = String(raw || "").replace(/[ˈˌ]/g, "").trim();
  // Azure often already wraps syllables in brackets; strip them to avoid visual noise.
  s = s.replace(/^\[+/, "").replace(/\]+$/, "");
  return s;
}

function applyStressClasses(strip, primaryIdx, secondaryIdxs = []) {
  const spans = strip?.querySelectorAll?.(".lux-syl");
  if (!spans || !spans.length) return;

  const sec = new Set((secondaryIdxs || []).filter((n) => Number.isInteger(n)));
  spans.forEach((sp, i) => {
    const isPrimary = i === primaryIdx;
    sp.classList.toggle("is-stress", isPrimary);
    sp.classList.toggle("is-secondary", !isPrimary && sec.has(i));
  });
}

/* ------------------------------------------------------------
 * DOM upgrade pass (after CMU dict loads)
 * ---------------------------------------------------------- */

function upgradePendingStressStrips() {
  if (!_CMU_DICT || typeof document === "undefined") return;

  const pending = document.querySelectorAll('.lux-sylStrip[data-stress="pending"]');
  if (!pending.length) return;

  pending.forEach((strip) => {
    const wordText = strip?.dataset?.word || "";
    const obs = String(strip?.dataset?.obs || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const spans = strip.querySelectorAll(".lux-syl");
    const sylCount = spans?.length || 0;
    if (!sylCount) return;

    // Build a minimal wordObj-like shape for lookup (so we can reuse the same picker).
    const faux = {
      Word: wordText,
      Phonemes: obs.map((p) => ({ Phoneme: p })),
    };

    const payload = getExpectedStressFromCmu(faux, sylCount);
    if (!payload || !Number.isInteger(payload.primarySylIdx)) {
      // Safety net: ALWAYS highlight something
      applyStressClasses(strip, 0, []);
      strip.dataset.stress = "heur";
      strip.title = "Expected stress highlighted (heuristic fallback)";
      strip.dataset.alts = "0";
      return;
    }

    applyStressClasses(strip, payload.primarySylIdx, payload.secondarySylIdxs);
    strip.dataset.stress = "dict";
    strip.title = "Primary stress highlighted (CMU dictionary)";
    strip.dataset.alts = String((payload.prons || []).length || 0);

    // Add a tiny alt button if multiple pronunciations exist
    if ((payload.prons || []).length > 1 && !strip.querySelector(".lux-sylAlt")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lux-sylAlt";
      btn.textContent = "alts";
      btn.title = `Alternate pronunciations (${payload.prons.length}) — click to cycle`;
      btn.setAttribute("aria-label", "Alternate pronunciations (click to cycle)");
      strip.appendChild(btn);
    }
  });
}

/* ------------------------------------------------------------
 * Public renderer
 * ---------------------------------------------------------- */

export function renderSyllableStrip(wordObj) {
  let syls = Array.isArray(wordObj?.Syllables) ? wordObj.Syllables : [];

  // IMPORTANT: Avoid "open but empty" column.
  // If syllables aren't present yet, render a safe 1-chip fallback from observed phonemes.
  if (!syls.length) {
    const phs = Array.isArray(wordObj?.Phonemes) ? wordObj.Phonemes : [];
    const compact = phs.length
      ? phs
          .map((p) => String(p?.Phoneme || "").trim())
          .filter(Boolean)
          .map((x) => x.replace(/[ˈˌ]/g, "").replace(/[0-2]$/g, ""))
          .join("")
      : "";

    const fallbackText = compact || String(wordObj?.Word || "").trim();
    if (fallbackText) {
      syls = [{ Text: fallbackText }];
    }
  }

  const sylCount = syls.length;

  // Start loading the dict as soon as we ever render a strip.
  // (When it arrives, we upgrade any pending strips in-place.)
  ensureCmuDict();
  scheduleStressUpgrade();

  const wordText = String(wordObj?.Word || "");
  const obsPhones = getObservedPhones(wordObj);
  const obsAttr = escapeHtml(obsPhones.join(" "));

  let stressIdx = null;
  let secondaryIdxs = [];
  let altCount = 0;
  let stressLabel = "";
  let stressState = "single";

  if (sylCount <= 1) {
    // Single syllable: highlight the only syllable (harmless + consistent).
    stressIdx = 0;
    stressLabel = "Single-syllable word";
    stressState = "single";
  } else {
    const payload = getExpectedStressFromCmu(wordObj, sylCount);
    if (payload && Number.isInteger(payload.primarySylIdx)) {
      stressIdx = payload.primarySylIdx;
      secondaryIdxs = payload.secondarySylIdxs || [];
      altCount = (payload.prons || []).length || 0;
      stressLabel = "Primary stress highlighted (CMU dictionary)";
      stressState = "dict";
    } else {
      // Until CMU loads / or if no match, show the heuristic.
      stressIdx = getExpectedStressIndexHeuristic(wordText, sylCount);
      stressLabel =
        _CMU_DICT === null
          ? "Expected stress highlighted (loading dictionary)"
          : "Expected stress highlighted (heuristic fallback)";
      stressState = _CMU_DICT === null ? "pending" : "heur";
    }
  }

  // Safety net: never allow “no highlighted syllable”
  if (!Number.isInteger(stressIdx)) stressIdx = 0;

  const pieces = syls
    .map((syl, i) => {
      const t = escapeHtml(getSylText(syl));
      const isPrimary = i === stressIdx;
      const isSecondary = !isPrimary && secondaryIdxs.includes(i);
      const cls =
        "lux-syl" +
        (isPrimary ? " is-stress" : "") +
        (isSecondary ? " is-secondary" : "");
      return `<span class="${cls}">${t}</span>`;
    })
    .join(" ");

  const altBtn =
    altCount > 1
      ? `<button type="button" class="lux-sylAlt" title="Alternate pronunciations (${altCount}) — click to cycle" aria-label="Alternate pronunciations (click to cycle)">alts</button>`
      : ``;

  return `<div class="lux-sylStrip" data-stress="${stressState}" data-alts="${altCount}" data-word="${escapeHtml(
    wordText
  )}" data-obs="${obsAttr}" title="${escapeHtml(stressLabel)}">${pieces}${altBtn}</div>`;
}

export function mountSyllablesForTable(table, words) {
  if (!table || !Array.isArray(words)) return;

  const mounts = table.querySelectorAll(".lux-sylMount[data-word-idx]");
  if (!mounts.length) return;

  mounts.forEach((m) => {
    const idx = Number(m.dataset.wordIdx);
    const w = Number.isInteger(idx) ? words[idx] : null;
    if (!w) return;
    m.innerHTML = renderSyllableStrip(w);
  });

  // Light “alts” cycling (only when syllables are expanded / mounted)
  if (!table.dataset.sylAltBound) {
    table.dataset.sylAltBound = "yes";
    table.addEventListener("click", (e) => {
      const btn = e.target.closest(".lux-sylAlt");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const strip = btn.closest(".lux-sylStrip");
      if (!strip) return;

      // Build faux wordObj from dataset so we can compute all prons again
      const wordText = strip.dataset.word || "";
      const obs = String(strip.dataset.obs || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const spans = strip.querySelectorAll(".lux-syl");
      const sylCount = spans?.length || 0;
      if (!sylCount) return;

      const faux = { Word: wordText, Phonemes: obs.map((p) => ({ Phoneme: p })) };
      const payload = getExpectedStressFromCmu(faux, sylCount);
      if (!payload || !Array.isArray(payload.prons) || payload.prons.length < 2) return;

      // Cycle alt index
      const n = payload.prons.length;
      const cur = Number(strip.dataset.altIdx || 0);
      const next = (Number.isFinite(cur) ? cur + 1 : 1) % n;
      strip.dataset.altIdx = String(next);

      const idxs = stressIndicesFromPron(payload.prons[next], sylCount);
      if (!idxs) return;
      applyStressClasses(strip, idxs.primarySylIdx, idxs.secondarySylIdxs);
      strip.dataset.stress = "dict";
      strip.title = `Primary stress highlighted (CMU dictionary) — Alt ${next + 1}/${n}`;
    });
  }
}
