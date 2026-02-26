// features/convo/convo-tts-context.js
// ONE-LINE: Installs a LuxTTSContext adapter for AI Conversations so the TTS drawer can speak AI/user/selected turns with character-matched voices.

function norm(s) {
  return String(s || "").trim();
}

function parseGender(text) {
  const s = norm(text).toLowerCase();
  const male = /\b(he|him|his|man|male|boy|father|sir|husband|gentleman)\b/.test(s);
  const female = /\b(she|her|hers|woman|female|girl|mother|ma'am|wife|lady)\b/.test(s);
  if (male && !female) return "male";
  if (female && !male) return "female";
  return "";
}

function parseAgeDecade(text) {
  const s = norm(text).toLowerCase();
  const m = s.match(/\b(\d{2})s\b/);
  if (m) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
  if (/\bteen(ager)?\b/.test(s)) return 10;
  if (/\b(child|kid)\b/.test(s)) return 10;
  if (/\b(retired|senior|elderly)\b/.test(s)) return 60;
  return null;
}

function ageGroupFromDecade(dec) {
  const n = Number(dec);
  if (!Number.isFinite(n)) return "";
  if (n >= 60) return "older";
  if (n >= 40) return "mature";
  if (n >= 30) return "adult";
  if (n >= 10) return "young";
  return "";
}

function voiceFromPersona({ gender, ageGroup } = {}) {
  const g = gender || "";
  const a = ageGroup || "";

  // Fast, stable US defaults (override per-role via role.ttsVoice / role.tts.voice later).
  if (g === "male") {
    if (a === "older" || a === "mature") return "en-US-DavisNeural";
    if (a === "adult") return "en-US-ChristopherNeural";
    return "en-US-GuyNeural"; // young/unknown
  }
  if (g === "female") {
    if (a === "older" || a === "mature") return "en-US-NancyNeural";
    if (a === "adult") return "en-US-JennyNeural";
    return "en-US-AriaNeural"; // young/unknown
  }
  return "en-US-AriaNeural";
}

function derivePersona(role) {
  const src = `${role?.npc || ""} ${role?.label || ""}`;
  const gender = parseGender(src);
  const decade = parseAgeDecade(src);
  const ageGroup = ageGroupFromDecade(decade);
  return { gender, decade, ageGroup };
}

function roleVoice(role) {
  const explicit = role?.ttsVoice || role?.tts?.voice || role?.tts?.voiceId || "";
  if (explicit) return explicit;
  return voiceFromPersona(derivePersona(role));
}

// ---- Tone → Azure TTS speaking style mapping ----
// Maps knobs "tone" values to Azure speaking style names.
// Only styles widely supported by Azure en-US voices are included.
// Returns "" (neutral) for tones without a clear match.
const TONE_TO_STYLE = {
  neutral:      "",
  formal:       "newscast-formal",
  friendly:     "friendly",
  enthusiastic: "cheerful",
  encouraging:  "empathetic",
  playful:      "cheerful",
  flirty:       "chat",
  sarcastic:    "chat",
  tired:        "",
  distracted:   "",
  cold:         "",
  blunt:        "",
  impatient:    "",
  irritable:    "angry",
  angry:        "angry",
  emotional:    "sad",
};

// Role-based style hints (from NPC description keywords).
function styleFromRole(role) {
  const npc = norm(role?.npc || role?.label || "").toLowerCase();
  if (/\b(doctor|physician|nurse|medical)\b/.test(npc)) return "empathetic";
  if (/\b(customer service|receptionist|representative|bank rep)\b/.test(npc)) return "customerservice";
  if (/\b(support agent|tech support)\b/.test(npc)) return "customerservice";
  if (/\b(interview|hiring|manager)\b/.test(npc)) return "newscast-formal";
  if (/\b(friend|buddy|pal)\b/.test(npc)) return "friendly";
  if (/\b(child|kid|teen)\b/.test(npc)) return "chat";
  return "";
}

function lastMessageText(messages, role) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (!m) continue;
    if (String(m.role) !== String(role)) continue;
    const t = norm(m.content);
    if (t) return t;
  }
  return "";
}

function safeDispatch(name) {
  try {
    window.dispatchEvent(new Event(name));
  } catch (_) {}
}

export function installConvoTtsContext({ state, input, msgs, SCENARIOS }) {
  if (!state) return;

  // Default behavior in convo: speaking "AI" is the most common first action.
  window.luxTTS = Object.assign(window.luxTTS || {}, {
    sourceMode: window.luxTTS?.sourceMode || "ai",
    autoVoice: window.luxTTS?.autoVoice !== false,
  });

  const ctx = {
    kind: "convo",
    defaultSourceMode: "ai",
    _selected: null,

    setSelected(sel) {
      const t = norm(sel?.text);
      if (!t) return;
      this._selected = { role: sel?.role || "", text: t };
      safeDispatch("lux:ttsContextChanged");
    },

    getScenario() {
      const i = Number(state.scenarioIdx || 0);
      const arr = Array.isArray(SCENARIOS) ? SCENARIOS : [];
      return arr[i] || null;
    },

    getRolePair() {
      const scenario = this.getScenario();
      const roles = Array.isArray(scenario?.roles) ? scenario.roles : [];
      const userIdx = Math.max(0, Number(state.roleIdx || 0));
      const aiIdx =
        roles.length > 1
          ? roles.findIndex((_, i) => i !== userIdx)
          : userIdx;
      return { roles, userIdx, aiIdx: aiIdx >= 0 ? aiIdx : userIdx };
    },

    getText({ mode } = {}) {
      const m = String(mode || window.luxTTS?.sourceMode || "auto");

      if (m === "selection") return norm(this._selected?.text);

      if (m === "me") {
        const typed = norm(input?.value);
        if (typed) return typed;
        return lastMessageText(state.messages, "user");
      }

      if (m === "ai") return lastMessageText(state.messages, "assistant");

      // auto: prefer clicked bubble; else typed; else last assistant; else last user
      const sel = norm(this._selected?.text);
      if (sel) return sel;

      const typed = norm(input?.value);
      if (typed) return typed;

      const a = lastMessageText(state.messages, "assistant");
      if (a) return a;

      return lastMessageText(state.messages, "user");
    },

    getVoiceId({ mode } = {}) {
      const m = String(mode || window.luxTTS?.sourceMode || "auto");
      const { roles, userIdx, aiIdx } = this.getRolePair();

      const userRole = roles[userIdx] || null;
      const aiRole = roles[aiIdx] || null;

      if (m === "me") return roleVoice(userRole);
      if (m === "ai") return roleVoice(aiRole);

      if (m === "selection") {
        const selRole = String(this._selected?.role || "");
        if (selRole === "assistant") return roleVoice(aiRole);
        if (selRole === "user") return roleVoice(userRole);
        return roleVoice(aiRole);
      }

      // auto: if we have a selected role, follow it; else typed => me; else ai
      const selRole = String(this._selected?.role || "");
      if (selRole === "assistant") return roleVoice(aiRole);
      if (selRole === "user") return roleVoice(userRole);

      const typed = norm(input?.value);
      if (typed) return roleVoice(userRole);

      return roleVoice(aiRole);
    },

    // Auto speaking style: tone knobs → Azure style, with role-based fallback.
    getStyle({ mode } = {}) {
      // 1. Tone from knobs (highest priority)
      let tone = "";
      try {
        const raw = localStorage.getItem("lux_knobs_v3");
        if (raw) tone = (JSON.parse(raw)?.tone || "").toLowerCase();
      } catch (_) {}

      const fromTone = TONE_TO_STYLE[tone] || "";
      if (fromTone) return fromTone;

      // 2. Role-based hint (from NPC description)
      const m = String(mode || window.luxTTS?.sourceMode || "auto");
      const { roles, userIdx, aiIdx } = this.getRolePair();
      const activeRole =
        m === "me" ? (roles[userIdx] || null)
        : m === "ai" ? (roles[aiIdx] || null)
        : m === "selection"
          ? (String(this._selected?.role || "") === "user" ? roles[userIdx] : roles[aiIdx])
          : (roles[aiIdx] || null);

      return styleFromRole(activeRole);
    },
  };

  // Bubble-click selection capture (delegated; safe across re-renders)
  if (msgs && msgs.dataset.luxTtsBound !== "1") {
    msgs.dataset.luxTtsBound = "1";
    msgs.addEventListener("click", (e) => {
      const bubble = e.target?.closest?.(".msg");
      if (!bubble) return;

      const role = bubble.classList.contains("assistant") ? "assistant" : "user";
      const text = norm(bubble.innerText || bubble.textContent || "");
      if (!text) return;

      ctx.setSelected({ role, text });
    });
  }

  window.LuxTTSContext = ctx;
  safeDispatch("lux:ttsContextChanged");
  return ctx;
}