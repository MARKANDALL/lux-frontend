// attempt-log.js
// Client/Server attempt logger + tiny local history cache.
// Works from any origin (CodeSandbox, localhost, prod) by posting to Vercel.

const API_BASE = "https://luxury-language-api.vercel.app";
const LOCAL_KEY = "lux_attempts_v1";
const LOCAL_MAX = 100;

// --- UID helper (prefer localStorage; mirror to window) ---
function getUID() {
  try {
    const uid =
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("LUX_USER_ID")) ||
      null;
    if (uid && typeof window !== "undefined") window.LUX_USER_ID = uid;
    return uid || (typeof window !== "undefined" ? window.LUX_USER_ID : null);
  } catch {
    return (typeof window !== "undefined" ? window.LUX_USER_ID : null) || null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

// ---------- Summary extraction from Azure JSON ----------
// Produces:
// { pron, acc, flu, comp, lows:[{phoneme,score,word,err}], words:[{word,score}]) }
export function extractSummary(azure) {
  const nb = azure?.NBest?.[0] || {};
  const words = Array.isArray(nb.Words) ? nb.Words : [];

  // main scores (accept either legacy or nested forms)
  const pa =
    nb?.PronunciationAssessment || azure?.PronunciationAssessment || {};
  const summary = {
    pron: nb?.PronScore ?? pa?.PronScore ?? pa?.PronunciationScore ?? null,
    acc: nb?.AccuracyScore ?? pa?.AccuracyScore ?? null,
    flu: nb?.FluencyScore ?? pa?.FluencyScore ?? null,
    comp: nb?.CompletenessScore ?? pa?.CompletenessScore ?? null,
    lows: [],
    words: [],
  };

  // collect up to 20 lowest-accuracy phoneme hits (<85)
  for (const w of words) {
    const ps = Array.isArray(w.Phonemes) ? w.Phonemes : [];
    for (const p of ps) {
      const score = Number(p?.AccuracyScore ?? 0);
      if (Number.isFinite(score) && score < 85) {
        summary.lows.push({
          phoneme: p.Phoneme,
          score,
          word: w.Word,
          err: p.ErrorType || "None",
        });
        if (summary.lows.length >= 20) break;
      }
    }
    if (summary.lows.length >= 20) break;
  }

  // collect up to 20 “trouble words” from Azure word-level scores (<90)
  // Azure Word objects typically have Word + AccuracyScore
  const wordHits = [];
  for (const w of words) {
    const wScore = Number(w?.AccuracyScore ?? NaN);
    if (Number.isFinite(wScore) && wScore < 90 && w?.Word) {
      wordHits.push({ word: w.Word, score: wScore });
    }
  }
  // keep the 20 lowest scores
  wordHits.sort((a, b) => a.score - b.score);
  summary.words = wordHits.slice(0, 20);

  return summary;
}

// ---------- Local rolling cache (for a client “Recent attempts” pane) ----------
function pushLocal(row) {
  try {
    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    arr.push(row);
    while (arr.length > LOCAL_MAX) arr.shift();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Local attempt cache failed:", e);
  }
}

export function getAttempts() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

// ---------- Remote POST to Vercel (non-blocking; ignore failures) ----------
async function postRemoteAttempt(payload) {
  try {
    await fetch(`${API_BASE}/api/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Attempt log failed (remote)", err);
  }
}

/**
 * Main entry: log an attempt locally + remotely.
 * Call with whatever you have; we’ll compute extra fields if azureResult is present.
 *
 * @param {Object} opts
 *  - passageKey: string    (e.g., "rainbow" | "grandfather" | "custom")
 *  - partIndex:  number    (0-based)
 *  - text:       string    (what the user read)
 *  - azureResult?: object  (full Azure JSON; optional on failures)
 *  - success?:   boolean   (default true)
 *  - error?:     string    (optional error code/message)
 *  - pronScore?: number    (optional, used if azureResult is absent)
 */
export function logAttempt(opts = {}) {
  const {
    passageKey = "unknown",
    partIndex = 0,
    text = "",
    azureResult = null,
    success = true,
    error = null,
    pronScore = null,
  } = opts;

  const uid = getUID(); // <- fixed to respect hardened bootstrap
  // derive a compact summary if we have Azure; else keep minimal data
  const summary = azureResult ? extractSummary(azureResult) : {};

  // Final row we keep locally (quick client view)
  const row = {
    uid,
    ts: nowIso(),
    passageKey,
    partIndex,
    text,
    success,
    error,
    pron: summary.pron ?? pronScore ?? null,
    acc: summary.acc ?? null,
    flu: summary.flu ?? null,
    comp: summary.comp ?? null,
    lows: summary.lows || [],
    words: summary.words || [],
  };

  pushLocal(row);

  // Remote payload (server stores a JSON "summary" column and also the headline scores)
  postRemoteAttempt({
    uid,
    ts: row.ts,
    passage: passageKey,
    part: partIndex,
    text,
    success,
    error,
    acc: row.acc,
    flu: row.flu,
    comp: row.comp,
    pron: row.pron,
    summary: {
      // <- ensures admin “Trouble words/sounds” can populate
      acc: row.acc,
      flu: row.flu,
      comp: row.comp,
      pron: row.pron,
      lows: row.lows,
      words: row.words,
    },
    // If you also want to keep raw Azure for deep dives, include it:
    // azure: azureResult || undefined,
  });

  return row;
}
