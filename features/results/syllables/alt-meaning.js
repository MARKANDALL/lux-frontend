// features/results/syllables/alt-meaning.js
// One-line: Alt pronunciation cycling + lazy meaning hover loader for syllable strips.

import { fetchAltMeanings } from "../../../api/alt-meaning.js";
import {
  getCmuDictState,
  cleanWord,
  getExpectedStressFromCmu,
  stressIndicesFromPron,
  applyStressClasses,
} from "./cmu-stress.js";

// Meanings are optional + lazy. Cache per (word + sentence + prons).
const _ALT_MEANING_CACHE = new Map(); // key -> result OR Promise
const _ALT_HOVER_TIMERS = new WeakMap(); // btn -> timeout id

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

export function bindSyllableAltInteractions(table) {
  if (!table) return;

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
