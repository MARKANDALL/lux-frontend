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

import {
  ensureCmuDict,
  scheduleStressUpgrade,
  getCmuDictState,
  getObservedPhones,
  stressIndicesFromPron,
  getExpectedStressFromCmu,
  getExpectedStressIndexHeuristic,
  getSylText,
  applyStressClasses,
} from "./syllables/cmu-stress.js";
import { bindSyllableAltInteractions } from "./syllables/alt-meaning.js";

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
        getCmuDictState() === null
          ? "Expected stress highlighted (loading dictionary)"
          : "Expected stress highlighted (heuristic fallback)";
      stressState = getCmuDictState() === null ? "pending" : "heur";
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
      ? `<button type="button" class="lux-sylAlt" title="Alternate pronunciations (${altCount}) — click to cycle" aria-label="Alternate pronunciations (click to cycle)">alts 1/${altCount}</button>`
      : ``;

  return `<div class="lux-sylStrip" data-stress="${stressState}" data-alts="${altCount}" data-alt-idx="0" data-word="${escapeHtml(
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

  bindSyllableAltInteractions(table);
}
