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
    try {
      localStorage.removeItem(KEY);
    } catch (_) {}
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
      "ʧ": "CH (chair, teacher, lunch)",
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
    topWords.length ? `Word bank (use naturally, repeat often): ${topWords.join(", ")}` : "",
    "",
    "Coach rules:",
    "- Keep it a natural, friendly conversation.",
    "- Keep learner replies 1–2 sentences.",
    ph
      ? `- Increase density of the primary sound by favoring simple common words that contain ${ph}.`
      : "",
    "- Each turn: output JSON with keys: assistant (string) and suggested_replies (array).",
    "- suggested_replies MUST be EXACTLY 3 short options (1–2 sentences each).",
    "- CRITICAL: Each suggested reply MUST include at least ONE word from the word bank (if provided).",
    "- Prefer 2+ word-bank words per suggested reply when it still sounds natural.",
    "- Also include word-bank words in the assistant message when it fits naturally.",
    "- Marking (do NOT explain to the learner):",
    topWords.length ? "- Wrap WORD-BANK words exactly like {~word~}." : "",
    topWords.length
      ? "- IMPORTANT: Only use {~ ~} for words that appear in the word bank list above. Do NOT invent new {~ ~} words."
      : "",
    ph
      ? "- Wrap words that CONTAIN the focus sound (chosen specifically for phoneme practice) exactly like {^word^}."
      : "",
    ph
      ? "- Minimum quota: include at least 2 {^ ^} words in the assistant message each turn, and at least 1 {^ ^} word in EACH suggested reply."
      : "",
    ph
      ? "- Quality rule: ONLY mark {^ ^} if the word truly contains the focus sound. If unsure, choose a different word."
      : "",
    ph ? "- After drafting, verify every {^ ^} word truly contains the focus sound; if not, replace it." : "",
    ph && topWords.length
      ? "- If a word-bank word ALSO contains the focus sound, prefer marking it as {^word^} (this creates a double-hit in Lux)."
      : "",
    "- Do NOT explain these rules.",
    "- If the learner responds without using any word-bank word, ask ONCE for a retry that includes one specific word-bank word, then move on.",
  ];

  // Extra help for /t/ — keep targets unambiguous and easy to mark correctly
  const ipa = String(ph || "").trim();
  if (ipa === "t" || ipa === "/t/") {
    lines.push(
      "",
      "Extra rules for /t/:",
      "- Prefer CLEAR /t/ words where the /t/ is easy to hear (especially word-initial /t/).",
      "- Safe /t/ words to use + mark often: {^time^}, {^take^}, {^talk^}, {^today^}, {^try^}, {^tell^}, {^ten^}, {^two^}, {^teacher^}, {^student^}, {^test^}, {^topic^}, {^tired^}, {^ticket^}.",
      "- If you are unsure a word contains a true /t/ sound, choose a different word from the safe list."
    );
  }

  return lines.filter(Boolean).join("\n");
}
