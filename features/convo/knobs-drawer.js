// features/convo/knobs-drawer.js

const KNOBS_KEY = "lux_knobs_v3";  // v3: mood→tone, expanded options

const DEFAULTS = {
  level: "B1",
  tone: "neutral",
  length: "medium",
};

function read() {
  try {
    const raw = localStorage.getItem(KNOBS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(next) {
  localStorage.setItem(KNOBS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lux:knobs", { detail: next }));
}

export function getKnobs() {
  return read();
}

export function setKnobs(patch) {
  const cur = read();
  const next = { ...cur, ...(patch || {}) };
  write(next);
  return next;
}

export function onKnobsChange(fn) {
  const handler = (e) => fn(e.detail || read());
  window.addEventListener("lux:knobs", handler);
  return () => window.removeEventListener("lux:knobs", handler);
}

export function formatKnobsSummary(k) {
  const level = (k.level || DEFAULTS.level);
  const tone = (k.tone || DEFAULTS.tone);
  const length = (k.length || DEFAULTS.length);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `Level: ${String(level).toUpperCase()} · Tone: ${cap(tone)} · Length: ${cap(length)}`;
}

/* ── Tone emoji map ───────────────────────────────────────── */
const TONE_EMOJI = {
  neutral:      "😐",
  formal:       "👔",
  friendly:     "😊",
  enthusiastic: "🤩",
  encouraging:  "💪",
  playful:      "😜",
  flirty:       "😏",
  sarcastic:    "🙄",
  tired:        "😴",
  distracted:   "📱",
  cold:         "🧊",
  blunt:        "🔨",
  impatient:    "⏱️",
  irritable:    "😤",
  angry:        "🔥",
  emotional:    "🥺",
};

/* ── Level color map (A=red, B=yellow, C=blue + light variants) */
/* Color logic:
   A2, B2, C2 = full standard color (matches phoneme/word chart scoring)
   A1, B1, C1 = lighter shade of the same hue
   Red = #dc2626  |  Amber = #d97706  |  Blue = #2563eb
*/
const LEVEL_COLORS = {
  A1: { bg: "#f87171", text: "#fff" },       // lighter red
  A2: { bg: "#dc2626", text: "#fff" },       // standard red
  B1: { bg: "#fbbf24", text: "#78350f" },    // lighter amber
  B2: { bg: "#d97706", text: "#fff" },       // standard amber
  C1: { bg: "#60a5fa", text: "#fff" },       // lighter blue
  C2: { bg: "#2563eb", text: "#fff" },       // standard blue
};

/* ── Length sizing (relative padding scale) ─────────────── */
const LENGTH_SIZES = {
  terse:    { px: "6px 10px",  fontSize: "0.78rem" },
  short:    { px: "7px 14px",  fontSize: "0.82rem" },
  medium:   { px: "8px 18px",  fontSize: "0.85rem" },
  long:     { px: "9px 24px",  fontSize: "0.88rem" },
  extended: { px: "10px 32px", fontSize: "0.90rem" },
};

const LENGTH_LABELS = {
  terse:    "Terse",
  short:    "Short",
  medium:   "Medium",
  long:     "Long",
  extended: "Extended",
};

function ensureDom() {
  let overlay = document.getElementById("luxKnobsOverlay");
  let drawer = document.getElementById("luxKnobsDrawer");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "luxKnobsOverlay";
    overlay.className = "lux-knobsOverlay";
    document.body.appendChild(overlay);
  }

  if (!drawer) {
    drawer = document.createElement("aside");
    drawer.id = "luxKnobsDrawer";
    drawer.className = "lux-knobsDrawer";
    drawer.setAttribute("aria-hidden", "true");

    /* ── Level chips (color-coded) ─────────────────────── */
    const levelChips = Object.keys(LEVEL_COLORS).map((lv) => {
      const c = LEVEL_COLORS[lv];
      return `<button type="button" data-value="${lv}" class="lux-levelChip" style="--lv-bg:${c.bg}; --lv-text:${c.text}">${lv}</button>`;
    }).join("\n            ");

    /* ── Tone chips (emoji + label) ───────────────────── */
    const toneChips = Object.entries(TONE_EMOJI).map(([val, emoji]) => {
      const label = val === "emotional" ? "Emotional / Upset" : val.charAt(0).toUpperCase() + val.slice(1);
      return `<button type="button" data-value="${val}" class="lux-toneChip">${emoji} ${label}</button>`;
    }).join("\n            ");

    /* ── Length chips (proportionally sized) ───────────── */
    const lengthChips = Object.entries(LENGTH_SIZES).map(([val, sz]) => {
      const label = LENGTH_LABELS[val];
      return `<button type="button" data-value="${val}" class="lux-lengthChip" style="padding:${sz.px}; font-size:${sz.fontSize}">${label}</button>`;
    }).join("\n            ");

    drawer.innerHTML = `
      <div class="lux-knobsHeader">
        <div class="lux-knobsTitle">Scene Settings</div>
        <button class="lux-knobsClose" type="button" aria-label="Close">✕</button>
      </div>

      <div class="lux-knobsBody">
        <div class="lux-knobsGroup" data-key="level">
          <div class="lux-knobsLabel">📊 Level</div>
          <div class="lux-knobsChips lux-levelChips">
            ${levelChips}
          </div>
        </div>

        <div class="lux-knobsGroup" data-key="tone">
          <div class="lux-knobsLabel">🎭 Tone</div>
          <div class="lux-knobsChips lux-toneChips">
            ${toneChips}
          </div>
        </div>

        <div class="lux-knobsGroup" data-key="length">
          <div class="lux-knobsLabel">⏱️ Length</div>
          <div class="lux-knobsChips lux-lengthChips">
            ${lengthChips}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  return { overlay, drawer };
}

function paintSelection(drawer, knobs) {
  drawer.querySelectorAll(".lux-knobsGroup").forEach((group) => {
    const key = group.getAttribute("data-key");
    const val = knobs[key];
    group.querySelectorAll("button[data-value]").forEach((b) => {
      const on = b.getAttribute("data-value") === val;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });
}

export function mountKnobsDrawer() {
  const { overlay, drawer } = ensureDom();

  // Track the element that opened the drawer so focus can return on close.
  let _opener = null;

  const open = () => {
    // Capture the currently focused element so we can restore focus on close.
    _opener = document.activeElement || null;

    const knobs = getKnobs();
    paintSelection(drawer, knobs);
    overlay.dataset.open = "1";
    drawer.dataset.open = "1";
    drawer.setAttribute("aria-hidden", "false");
  };

  const close = () => {
    // Move focus out of the drawer BEFORE hiding it (prevents aria-hidden focus warning).
    const safe = _opener || document.querySelector("#convoApp") || document.body;
    if (drawer.contains(document.activeElement)) {
      try { safe.focus({ preventScroll: true }); } catch (_) {}
    }

    overlay.dataset.open = "0";
    drawer.dataset.open = "0";
    drawer.setAttribute("aria-hidden", "true");
    _opener = null;
  };

  overlay.addEventListener("click", close);
  drawer.querySelector(".lux-knobsClose").addEventListener("click", close);

  drawer.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-value]");
    if (!btn) return;

    const group = btn.closest(".lux-knobsGroup");
    if (!group) return;

    const key = group.getAttribute("data-key");
    const value = btn.getAttribute("data-value");
    const next = setKnobs({ [key]: value });

    paintSelection(drawer, next);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.dataset.open === "1") close();
  });

  return { open, close };
}

// Singleton — safe to call from multiple modules
let _instance = null;
export function getKnobsDrawerInstance() {
  if (!_instance) _instance = mountKnobsDrawer();
  return _instance;
}