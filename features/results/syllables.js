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

import { fetchAltMeanings } from "../../api/alt-meaning.js";
import {
  ensureCmuDict,
  scheduleStressUpgrade,
  getCmuDictState,
  cleanWord,
  getObservedPhones,
  stressIndicesFromPron,
  getExpectedStressFromCmu,
  getExpectedStressIndexHeuristic,
  getSylText,
  applyStressClasses,
} from "./syllables/cmu-stress.js";

// Meanings are optional + lazy. Cache per (word + sentence + prons).
const _ALT_MEANING_CACHE = new Map(); // key -> result OR Promise
const _ALT_HOVER_TIMERS = new WeakMap(); // btn -> timeout id

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSaidSentence() {
  const s = globalThis?.LuxLastSaidText;
  return typeof s === "string" ? s.trim() : "";
}

function buildAltMeaningKey(wordText, sentence, prons) {
  const w = cleanWord(wordText).toLowerCase();
  const s = String(sentence || "").trim();
  const p = Array.isArray(prons) ? prons.join("|") : "";
  return `${w}||${s}||${p}`;
}

function formatAltTitle({ altCount, altIndex, pron, meaning, loading }) {
  const head = `Alternate pronunciations (${altCount}) — click to cycle`;
  const line1 = pron
    ? `Alt ${altIndex + 1}/${altCount}: ${pron}`
    : `Alt ${altIndex + 1}/${altCount}`;

  if (loading) return [head, line1, "Loading meaning…"].join("\n");

  if (!meaning || (!meaning.def && !meaning.example && !meaning.pos && !meaning.note)) {
    return [head, line1, "(Hover to load meaning + example)"].join("\n");
  }

  const lines = [head, line1];
  const pos = meaning.pos ? String(meaning.pos).trim() : "";
  const def = meaning.def ? String(meaning.def).trim() : "";
  const ex  = meaning.example ? String(meaning.example).trim() : "";
  const note = meaning.note ? String(meaning.note).trim() : "";

  if (def) lines.push(`Meaning: ${pos ? pos + " — " : ""}${def}`);
  if (ex)  lines.push(`Example: ${ex}`);
  if (note) lines.push(note);
  return lines.join("\n");
}

function cancelAltHover(btn) {
  const t = _ALT_HOVER_TIMERS.get(btn);
  if (t) clearTimeout(t);
  _ALT_HOVER_TIMERS.delete(btn);
}

function scheduleAltHover(btn, strip) {
  cancelAltHover(btn);
  const t = setTimeout(() => {
    try {
      loadAltMeaningFor(btn, strip);
    } catch {}
  }, 750);
  _ALT_HOVER_TIMERS.set(btn, t);
}

async function loadAltMeaningFor(btn, strip) {
  // If dict isn't ready, don't spam; next hover will try again.
  if (getCmuDictState() === null) return;

  const wordText = strip?.dataset?.word || "";
  const obs = String(strip?.dataset?.obs || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const spans = strip.querySelectorAll(".lux-syl");
  const sylCount = spans?.length || 0;
  if (!sylCount) return;

  const faux = { Word: wordText, Phonemes: obs.map((p) => ({ Phoneme: p })) };
  const payload = getExpectedStressFromCmu(faux, sylCount);
  if (!payload || !Array.isArray(payload.prons) || payload.prons.length < 2) return;

  const prons = payload.prons.slice(0, 6);
  const sentence = getSaidSentence().slice(0, 280);
  const key = buildAltMeaningKey(wordText, sentence, prons);

  const altCount = prons.length;
  const altIndex = Math.max(0, Math.min(altCount - 1, Number(strip.dataset.altIdx || 0) || 0));
  const pron = prons[altIndex] || "";

  // Cached?
  const cached = _ALT_MEANING_CACHE.get(key);
  if (cached && typeof cached.then !== "function") {
    const meaning = cached?.alts?.[altIndex] || null;
    btn.title = formatAltTitle({ altCount, altIndex, pron, meaning });
    return;
  }

  // In-flight?
  if (cached && typeof cached.then === "function") {
    btn.title = formatAltTitle({ altCount, altIndex, pron, loading: true });
    const res = await cached.catch(() => null);
    if (res && res.alts) _ALT_MEANING_CACHE.set(key, res);
    const meaning = res?.alts?.[altIndex] || null;
    btn.title = formatAltTitle({ altCount, altIndex, pron, meaning });
    return;
  }

  // Start request (lazy on hover)
  btn.title = formatAltTitle({ altCount, altIndex, pron, loading: true });
  const p = fetchAltMeanings({ word: wordText, sentence, prons }).catch(() => null);
  _ALT_MEANING_CACHE.set(key, p);
  const res = await p;
  if (res && res.alts) _ALT_MEANING_CACHE.set(key, res);

  const meaning = res?.alts?.[altIndex] || null;
  btn.title = formatAltTitle({ altCount, altIndex, pron, meaning });
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

      // Keep the button itself “self-explaining”
      btn.textContent = `alts ${next + 1}/${n}`;
      const sentence = getSaidSentence().slice(0, 280);
      const prons = payload.prons.slice(0, 6);
      const key = buildAltMeaningKey(wordText, sentence, prons);
      const cached = _ALT_MEANING_CACHE.get(key);
      const meaning =
        cached && typeof cached.then !== "function" ? cached?.alts?.[next] : null;
      const pron = prons[next] || "";
      btn.title = formatAltTitle({ altCount: prons.length, altIndex: next, pron, meaning });
    });
  }

  // Lazy meanings on hover/focus (keeps first paint fast)
  if (!table.dataset.sylAltHoverBound) {
    table.dataset.sylAltHoverBound = "yes";
    table.addEventListener("mouseover", (e) => {
      const btn = e.target.closest(".lux-sylAlt");
      if (!btn) return;
      const strip = btn.closest(".lux-sylStrip");
      if (!strip) return;
      scheduleAltHover(btn, strip);
    });
    table.addEventListener("mouseout", (e) => {
      const btn = e.target.closest(".lux-sylAlt");
      if (!btn) return;
      cancelAltHover(btn);
    });
    table.addEventListener("focusin", (e) => {
      const btn = e.target.closest(".lux-sylAlt");
      if (!btn) return;
      const strip = btn.closest(".lux-sylStrip");
      if (!strip) return;
      scheduleAltHover(btn, strip);
    });
    table.addEventListener("focusout", (e) => {
      const btn = e.target.closest(".lux-sylAlt");
      if (!btn) return;
      cancelAltHover(btn);
    });
  }
}
