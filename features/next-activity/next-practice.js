// C:\dev\LUX_GEMINI\features\next-activity\next-practice.js
// Builds and applies a “Next Practice Plan” by picking a focus phoneme from rollups and selecting the best matching Harvard list or non-Harvard passage (lazy-loads passage phoneme meta).

import { getCodesForIPA } from "../../src/data/phonemes/core.js";
import { ensurePassagePhonemeMeta } from "../../src/data/index.js";
import { setPassage, updatePartsInfoTip } from "../passages/index.js";
import { loadHarvardList } from "../harvard/index.js";

const STORAGE_KEY = "luxNextPracticePlan";

// Lazy passage meta cache (keeps existing sync scoring helpers intact)
let _PASSAGE_META = null;
let _PASSAGE_META_PROMISE = null;

async function _getPassageMeta() {
  if (_PASSAGE_META) return _PASSAGE_META;
  if (!_PASSAGE_META_PROMISE) {
    _PASSAGE_META_PROMISE = ensurePassagePhonemeMeta()
      .then((m) => {
        _PASSAGE_META = m || {};
        return _PASSAGE_META;
      })
      .catch((e) => {
        // allow retry later
        _PASSAGE_META_PROMISE = null;
        console.error("[NextPractice] Failed to lazy-load PASSAGE_PHONEME_META", e);
        _PASSAGE_META = _PASSAGE_META || {};
        return _PASSAGE_META;
      });
  }
  return _PASSAGE_META_PROMISE;
}

function pickFocusPhFromRollups(rollups) {
  const top = rollups?.trouble?.phonemesAll?.[0];
  const ipa = top?.ipa || "";
  if (!ipa) return { ipa: "", code: "" };

  const codes = getCodesForIPA(ipa) || [];
  const code = (codes[0] || "").toUpperCase();
  return { ipa, code };
}

function scoreKeyForPh(meta, key, ph) {
  if (!key || !ph) return 0;
  const m = meta?.[String(key)] || null;
  const c = m?.counts?.[String(ph).toUpperCase()];
  return Number(c || 0);
}

function bestHarvardForPh(meta, ph) {
  let bestN = 0;
  let bestScore = -1;

  for (let n = 1; n <= 72; n++) {
    const key = `harvard${String(n).padStart(2, "0")}`;
    const s = scoreKeyForPh(meta, key, ph);
    if (s > bestScore) {
      bestScore = s;
      bestN = n;
    }
  }
  return { n: bestN, score: Math.max(0, bestScore) };
}

function bestNonHarvardForPh(meta, ph) {
  const deny = new Set(["write-own", "clear", "custom", ""]);
  let bestKey = "";
  let bestScore = -1;

  const keys = Object.keys(meta || {});
  for (const k of keys) {
    const key = String(k);
    if (key.startsWith("harvard")) continue;
    if (deny.has(key)) continue;

    const s = scoreKeyForPh(meta, key, ph);
    if (s > bestScore) {
      bestScore = s;
      bestKey = key;
    }
  }
  return { key: bestKey, score: Math.max(0, bestScore) };
}

function labelForPassageKey(key) {
  try {
    const sel = document.getElementById("passageSelect");
    const opt = sel?.querySelector?.(`option[value="${CSS.escape(key)}"]`);
    const txt = opt?.textContent?.trim();
    return txt || key;
  } catch {
    return key;
  }
}

export async function buildNextPracticePlanFromModel(model) {
  const rollups = model || null;
  const { ipa, code } = pickFocusPhFromRollups(rollups);

  if (!code) return null;

  const meta = await _getPassageMeta();

  const harv = bestHarvardForPh(meta, code);
  const pass = bestNonHarvardForPh(meta, code);

  return {
    focusIpa: ipa,
    focusPh: code,
    harvardN: harv.n,
    harvardScore: harv.score,
    passageKey: pass.key,
    passageScore: pass.score,
    passageLabel: pass.key ? labelForPassageKey(pass.key) : pass.key,
  };
}

export function saveNextPracticePlan(plan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan || null));
  } catch (_) {}
}

export function consumeNextPracticePlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export async function applyNextPracticePlan(plan, opts = {}) {
  if (!plan) return;

  const mode = opts.mode || plan.start || "";

  if (mode === "harvard") {
    if (!plan.harvardN) return;
    await loadHarvardList(plan.harvardN);
    try {
      document.getElementById("referenceText")?.focus();
    } catch {}
    return;
  }

  if (mode === "passage") {
    if (!plan.passageKey) return;

    // Keep dropdown visually in sync
    const sel = document.getElementById("passageSelect");
    if (sel) sel.value = plan.passageKey;

    setPassage(plan.passageKey, { clearInputForCustom: false });
    updatePartsInfoTip();
    try {
      document.getElementById("referenceText")?.focus();
    } catch {}
  }
}

export async function maybeApplyStoredNextPracticePlan() {
  const plan = consumeNextPracticePlan();
  if (!plan) return;
  await applyNextPracticePlan(plan);
}
