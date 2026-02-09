// features/next-activity/next-practice.js
import { getCodesForIPA } from "../../src/data/phonemes/core.js";
import { PASSAGE_PHONEME_META } from "../../src/data/index.js";
import { setPassage, updatePartsInfoTip } from "../passages/index.js";
import { loadHarvardList } from "../harvard/index.js";

const STORAGE_KEY = "luxNextPracticePlan";

function pickFocusPhFromRollups(rollups) {
  const top = rollups?.trouble?.phonemesAll?.[0];
  const ipa = top?.ipa || "";
  if (!ipa) return { ipa: "", code: "" };

  const codes = getCodesForIPA(ipa) || [];
  const code = (codes[0] || "").toUpperCase();
  return { ipa, code };
}

function scoreKeyForPh(key, ph) {
  if (!key || !ph) return 0;
  const m = PASSAGE_PHONEME_META?.[String(key)] || null;
  const c = m?.counts?.[String(ph).toUpperCase()];
  return Number(c || 0);
}

function bestHarvardForPh(ph) {
  let bestN = 0;
  let bestScore = -1;

  for (let n = 1; n <= 72; n++) {
    const key = `harvard${String(n).padStart(2, "0")}`;
    const s = scoreKeyForPh(key, ph);
    if (s > bestScore) {
      bestScore = s;
      bestN = n;
    }
  }
  return { n: bestN, score: Math.max(0, bestScore) };
}

function bestNonHarvardForPh(ph) {
  const deny = new Set(["write-own", "clear", "custom", ""]);
  let bestKey = "";
  let bestScore = -1;

  const keys = Object.keys(PASSAGE_PHONEME_META || {});
  for (const k of keys) {
    const key = String(k);
    if (key.startsWith("harvard")) continue;
    if (deny.has(key)) continue;

    const s = scoreKeyForPh(key, ph);
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

export function buildNextPracticePlanFromModel(model) {
  const rollups = model || null;
  const { ipa, code } = pickFocusPhFromRollups(rollups);

  if (!code) return null;

  const harv = bestHarvardForPh(code);
  const pass = bestNonHarvardForPh(code);

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

export function wireViewRecommendationLink() {
  const btn =
    document.getElementById("luxViewRecommendationBtn") ||
    document.querySelector("[data-lux-view-reco]");

  if (!btn || btn.dataset.wired === "1") return;
  btn.dataset.wired = "1";

  btn.addEventListener("click", (e) => {
    e.preventDefault();

    // If the progress drawer exists on this page, open it.
    const drawer = document.querySelector(
      "#dashboard-root details.lux-progress-drawer"
    );

    if (drawer) {
      drawer.open = true;

      // Attempt to scroll to the Next Practice block (once it exists).
      setTimeout(() => {
        const anchor =
          document.getElementById("lux-next-practice") ||
          document.querySelector("[data-lux-next-practice]");
        if (anchor?.scrollIntoView) {
          anchor.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      }, 120);
      return;
    }

    // Fallback: go to All Data page and jump to section
    window.location.assign("./progress.html#lux-next-practice");
  });
}
