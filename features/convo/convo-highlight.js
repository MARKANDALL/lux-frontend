// features/convo/convo-highlight.js

import { norm } from "../../src/data/phonemes/core.js";
import { K_DEBUG_CONVO_MARKS, getBool } from "../../app-core/lux-storage.js";
import { escapeHtml as escHtml } from "../../helpers/escape-html.js";
import { getPhonemeSpellingRule } from "./phoneme-spelling-map.js";


function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Normalize a token for comparisons (word-bank matching, focus testing).
function normToken(tok) {
  let s = String(tok || "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""); // trim edge punctuation
  s = s.replace(/’/g, "'"); // curly apostrophe
  s = s.replace(/'s$/g, ""); // possessive
  return s;
}

function makeFocusTester(ipa) {
  const rule = getPhonemeSpellingRule(ipa);
  if (!rule) return null;
  return (word) => rule.test(String(word || ""));
}

export function stripMarks(s) {
  return String(s || "")
    .replace(/\{~([^}]+)~\}/g, "$1")
    .replace(/\{\^([^}]+)\^\}/g, "$1");
}

/**
 * Convert marked convo text to safe HTML.
 *
 * Inputs (passed in via opts; no state coupling):
 * - wordBank: array of strings (target words)
 * - focusIpa: string (e.g. "t", "θ", "tʃ")
 * - autoBlue: boolean (defaults true) — only inject blue when allowed + safe
 */
export function highlightHtml(text, opts = {}) {
  const raw = String(text || "");
  const autoBlue = opts.autoBlue !== false;

  const wb = (opts.wordBank || []).map((w) => String(w || "").trim()).filter(Boolean);
  const wbSet = new Set(wb.map(normToken).filter(Boolean));

  const focusIpa = norm(String(opts.focusIpa || ""));
  const focusTester = focusIpa ? makeFocusTester(focusIpa) : null;

  const dbgOn = getBool(K_DEBUG_CONVO_MARKS);
  const dbg =
    dbgOn && autoBlue
      ? { focusIpa, wbCount: wbSet.size, gotBlue: 0, okBlue: 0, badBlue: 0 }
      : null;

  // Protect explicit marks so fallback word-bank highlighting can’t wrap inside them.
  const stash = [];
  let marked = raw
    .replace(/\{~([^}]+)~\}/g, (_m, w) => {
      const i = stash.length;
      stash.push({ t: "wb", w: String(w) });
      return `\u0001${i}\u0002`;
    })
    .replace(/\{\^([^}]+)\^\}/g, (_m, w) => {
      const i = stash.length;
      stash.push({ t: "ph", w: String(w) });
      return `\u0003${i}\u0004`;
    });

  // Fallback: wrap unmarked word-bank words with {~ ~} (so yellow still appears if the model forgets).
  const tw = [...wb].sort((a, b) => b.length - a.length);
  for (const w of tw) {
    const re = new RegExp(`\\b(${escapeRegExp(w)})\\b`, "gi");
    marked = marked.replace(re, "{~$1~}");
  }

  // Restore protected explicit marks
  marked = marked
    .replace(/\u0001(\d+)\u0002/g, (_m, i) => `{~${stash[Number(i)]?.w ?? ""}~}`)
    .replace(/\u0003(\d+)\u0004/g, (_m, i) => `{^${stash[Number(i)]?.w ?? ""}^}`);

  // AUTO-BLUE FALLBACK:
  // If the model provided zero {^ ^}, inject up to 2 safe focus words.
  // We only do this when we have a conservative focusTester (trust boundary).
  if (autoBlue && focusTester && !/\{\^/.test(marked)) {
    const STOP = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "to",
      "of",
      "in",
      "on",
      "for",
      "at",
      "by",
      "with",
      "as",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "i",
      "you",
      "he",
      "she",
      "we",
      "they",
      "it",
      "this",
      "that",
      "these",
      "those",
      "my",
      "your",
      "his",
      "her",
      "our",
      "their",
    ]);

    // Protect existing {~ ~} blocks so we don’t nest marks inside them.
    const prot = [];
    let scan = marked.replace(/\{~([^}]+)~\}/g, (m) => {
      const i = prot.length;
      prot.push(m);
      return `\u0005${i}\u0006`;
    });

    let added = 0;
    scan = scan.replace(/\b[A-Za-z][A-Za-z']*\b/g, (tok) => {
      if (added >= 2) return tok;
      const key = normToken(tok);
      if (!key) return tok;
      if (STOP.has(key)) return tok;
      if (wbSet.has(key)) return tok; // word-bank handled separately (can become double-hit)
      if (!focusTester(key)) return tok;
      added++;
      return `{^${tok}^}`;
    });

    marked = scan.replace(/\u0005(\d+)\u0006/g, (_m, i) => prot[Number(i)] || "");
  }

  // Escape once, then convert marks to spans (no double-escaping).
  let html = escHtml(marked);

  // Only honor {~ ~} if it’s truly in the current word bank.
  html = html.replace(/\{~([^}]+)~\}/g, (_m, w) => {
    const key = normToken(w);
    if (!wbSet.has(key)) return w;

    // Double-hit without requiring the model to mark {^ ^}:
    if (focusTester && focusTester(key)) return `<span class="lux-hl lux-hl2">${w}</span>`;
    return `<span class="lux-hl">${w}</span>`;
  });

  // Blue: validate against focusTester when available. If invalid, strip highlight.
  html = html.replace(/\{\^([^}]+)\^\}/g, (_m, w) => {
    if (dbg) dbg.gotBlue++;
    const key = normToken(w);
    if (focusTester && !focusTester(key)) {
      if (dbg) dbg.badBlue++;
      return w;
    }
    if (dbg) dbg.okBlue++;
    const cls = wbSet.has(key) ? "lux-hl lux-hl2" : "lux-hl2";
    return `<span class="${cls}">${w}</span>`;
  });

  if (dbg) console.debug("[Lux blue marks]", dbg);

  return html;
}