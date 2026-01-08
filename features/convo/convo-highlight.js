// features/convo/convo-highlight.js
import { norm } from "../../src/data/phonemes/core.js";

function escHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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
  const k = norm(String(ipa || "").trim());

  // Return a function(word)->boolean, or null if we don't have safe spelling cues.
  if (!k) return null;

  const map = {
    f: /(?:f|ph|gh)/i, // far, flight, phone, laugh
    v: /v/i,
    θ: /th/i, // think
    ð: /th/i, // this
    ʃ: /sh/i, // she
    "tʃ": /(?:ch|tch)/i, // chair, match
    "dʒ": /(?:j|dge|dg)/i, // job, bridge
    ŋ: /ng/i, // sing
    ɹ: /(?:r|wr)/i,
    r: /(?:r|wr)/i,
    l: /l/i,

    // /t/ is tricky, but we need a practical rule so blue can exist.
    // Accept most “t” spellings; avoid very common t→sh/ch patterns + a tiny silent-t denylist.
    t: (word) => {
      const s = normToken(word);
      if (!s) return false;
      if (!s.includes("t")) return false;
      if (/(tion|tial|tious|ture)/i.test(s)) return false; // nation, special, future (often not /t/)
      if (/stle$/i.test(s)) return false; // castle, whistle (t often silent)
      if (/(listen|often)/i.test(s)) return false; // common silent-t words
      return true;
    },
  };

  const rule = map[k];
  if (!rule) return null;
  if (rule instanceof RegExp) return (word) => rule.test(String(word || ""));
  if (typeof rule === "function") return rule;
  return null;
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

  const dbgOn = localStorage.getItem("lux.debugMarks") === "1";
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
