// features/next-activity/next-activity.js
// Tiny glue: pick targets from rollups + store/consume a Next Activity plan.

import { norm } from "../../src/data/phonemes/core.js";
import { K_NEXT_ACTIVITY, getJSON, setJSON, remove } from '../../app-core/lux-storage.js';

export function saveNextActivityPlan(plan) {
  try {
    setJSON(K_NEXT_ACTIVITY, plan);
  } catch (err) { globalThis.warnSwallow("features/next-activity/next-activity.js", err, "important"); }
}

export function consumeNextActivityPlan() {
  try {
    const plan = getJSON(K_NEXT_ACTIVITY, null);
    if (!plan) return null;
    remove(K_NEXT_ACTIVITY);
    return plan && typeof plan === "object" ? plan : null;
  } catch (_) {
    try {
      remove(K_NEXT_ACTIVITY);
    } catch (err) { globalThis.warnSwallow("features/next-activity/next-activity.js", err, "important"); }
    return null;
  }
}

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const k = String(x || "").trim().toLowerCase();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(String(x).trim());
  }
  return out;
}

export function getPlanTargetWords(plan) {
  return uniq((plan?.targets?.words || []).map((w) => w?.word || w).filter(Boolean));
}

export function buildNextActivityPlanFromModel(model, opts = {}) {
  const trouble = model?.trouble || {};
  const ph = (trouble.phonemesAll || [])[0] || null;
  const words = (trouble.wordsAll || []).slice(0, opts.maxWords || 6);

  if (!ph && !words.length) return null;

  const now = Date.now();

return {
    plan_version: "v1",
    kind: "ai_conversation",
    launch_mode: opts.launch_mode || "quick",
    created_ts: now,
    source: opts.source || "unknown", // "session" | "global"
    confidence: opts.confidence || null,
    targets: {
      phoneme: ph ? pickPh(ph) : null,
      words: words.map(pickWord),
    },
  };
}

function pickPh(p) {
  return {
    // IMPORTANT: rollups may provide Azure codes (th/dh/ch/jh/iy/ax/etc).
    // Normalize to canonical IPA so overlays + testers stay consistent.
    ipa: norm(String(p.ipa || p.phoneme || p.id || "")),
    avg: num(p.avg),
    count: num(p.count),
    days: num(p.days),
    priority: num(p.priority),
  };
}

function pickWord(w) {
  return {
    word: String(w.word || ""),
    avg: num(w.avg),
    count: num(w.count),
    days: num(w.days),
    priority: num(w.priority),
  };
}

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

/**
 * Returns a prompt overlay string appended to scenario.desc.
 * The backend doesn't need to change: it already sees scenario.title/desc.
 */
export function buildConvoTargetOverlay(plan) {
  if (!plan || plan.kind !== "ai_conversation") return "";

  const ph = plan?.targets?.phoneme?.ipa ? norm(plan.targets.phoneme.ipa) : "";
  const topWords = getPlanTargetWords(plan).slice(0, 8);

  // Small hinting layer (optional, but helps precision for common IPA)
  function phonemeHint(ipa) {
    const k = String(ipa || "").trim();
    const map = {
      "ð": "voiced TH (this, that, mother)",
      "θ": "voiceless TH (think, three, bath)",
      "ɹ": "R (red, right, around)",
      "r": "R (red, right, around)",
      "ʃ": "SH (she, wish, fresh)",

      // Affricates: handle both glyph styles
      "tʃ": "CH (chair, teacher, lunch)",
      "ʧ": "CH (chair, teacher, lunch)",
      "dʒ": "J (job, orange, giant)",
      "ʤ": "J (job, orange, giant)",

      "ŋ": "NG (sing, going, long)",
    };
    return map[k] || "";
  }
  const phHint = ph ? phonemeHint(ph) : "";

  const lines = [
    "LUX_NEXT_PRACTICE (do NOT mention this label to the learner):",
    ph ? `Primary sound focus (IPA): ${ph}` : "",
    phHint ? `Plain-English cue: ${phHint}` : "",
    topWords.length ? `Helpful target words: ${topWords.join(", ")}` : "",
    "",
    "Coach rules:",
    "- Keep it a natural, friendly conversation.",
    "- Keep learner replies 1–2 sentences.",
    ph
      ? `- Favor simple common words that contain ${ph} when they fit naturally.`
      : "",
    "- Each turn: output JSON with keys: assistant (string) and suggested_replies (array).",
    "- suggested_replies MUST be EXACTLY 3 short options (1–2 sentences each).",
    "- Suggested replies should usually lean toward the targets when natural, but they should still sound like real things a person would actually say out loud.",
    "- It is OK if some turns use none of the target words.",
    "- Do not force awkward topic shifts just to use a target word.",
    "- Marking (do NOT explain to the learner):",
    topWords.length ? "- Wrap true WORD-BANK hits exactly like {~word~}." : "",
    topWords.length
      ? "- IMPORTANT: Only use {~ ~} for words that appear in the word bank list above. Do NOT invent new {~ ~} words."
      : "",
    ph
      ? "- You may wrap words that truly contain the focus sound exactly like {^word^} when they genuinely fit."
      : "",
    ph
      ? "- Quality rule: ONLY mark {^ ^} if the word truly contains the focus sound. If unsure, choose a different word."
      : "",
    ph ? "- After drafting, verify every {^ ^} word truly contains the focus sound; if not, replace it." : "",
    ph && topWords.length
      ? "- If a word-bank word ALSO contains the focus sound, prefer marking it as {^word^}."
      : "",
    "- Do NOT explain these rules.",
    "- If the learner responds without using any target words, continue naturally. You may gently steer back toward one target later, but do not get stuck on it.",
  ];

  // Extra help for /t/ — keep targets unambiguous and easy to mark correctly
  const ipa = String(ph || "").trim();
  if (ipa === "t" || ipa === "/t/") {
    lines.push(
      "",
      "Extra rules for /t/:",
      "- Prefer CLEAR /t/ words where the /t/ is easy to hear (especially word-initial /t/).",
      "- Safe /t/ words to use + mark often: {^time^}, {^take^}, {^today^}, {^talk^}, {^team^}, {^teacher^}, {^student^}, {^test^}, {^topic^}, {^tired^}, {^ticket^}.",
      "- If you are unsure a word really has a clear /t/, choose a different word."
    );
  }

  return lines.filter(Boolean).join("\n");
}