// features/next-activity/next-activity.js
// Tiny glue: pick targets from rollups + store/consume a Next Activity plan.

const KEY = "lux.nextActivity.v1";

export function saveNextActivityPlan(plan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch (_) {}
}

export function consumeNextActivityPlan() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const plan = JSON.parse(raw);
    return plan && typeof plan === "object" ? plan : null;
  } catch (_) {
    try { localStorage.removeItem(KEY); } catch (_) {}
    return null;
  }
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
    ipa: String(p.ipa || p.phoneme || p.id || ""),
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

  const ph = plan?.targets?.phoneme?.ipa;
  const words = (plan?.targets?.words || []).map((x) => x.word).filter(Boolean);
  const topWords = words.slice(0, 8);

  return [
    "LUX_NEXT_PRACTICE (do NOT mention this label to the learner):",
    ph ? `Primary sound focus (IPA): ${ph}` : "",
    topWords.length ? `Word bank (use naturally, repeat often): ${topWords.join(", ")}` : "",
    "",
    "Coach rules:",
    "- Keep it a natural, friendly conversation.",
    "- Keep learner replies 1–2 sentences.",
    ph ? `- Increase density of the primary sound by favoring simple common words that contain ${ph}.` : "",
    "- Each turn: return ONE assistant message and 3 suggested replies.",
    "- If the learner avoids a word-bank word, ask once for a repeat using that word, then move on.",
  ].filter(Boolean).join("\n");
}
