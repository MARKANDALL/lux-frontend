// features/convo/knobs-drawer.js

const KNOBS_KEY = "lux_knobs_v3";
const DEFAULTS = { level: "B1", tone: "neutral", length: "medium" };

function read() {
  try {
    const raw = localStorage.getItem(KNOBS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) || {}) };
  } catch { return { ...DEFAULTS }; }
}

function write(next) {
  localStorage.setItem(KNOBS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lux:knobs", { detail: next }));
}

export function getKnobs() { return read(); }

export function setKnobs(patch) {
  const next = { ...read(), ...(patch || {}) };
  write(next);
  return next;
}

export function onKnobsChange(fn) {
  const handler = (e) => fn(e.detail || read());
  window.addEventListener("lux:knobs", handler);
  return () => window.removeEventListener("lux:knobs", handler);
}

export function formatKnobsSummary(k) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `Level: ${String(k.level || "B1").toUpperCase()} · Tone: ${cap(k.tone || "neutral")} · Length: ${cap(k.length || "medium")}`;
}

/* ── Tone emoji map ───────────────────────────────────────── */
const TONE_EMOJI = {
  neutral:"😐", formal:"👔", friendly:"😊", enthusiastic:"🤩", encouraging:"💪",
  playful:"😜", flirty:"😏", sarcastic:"🙄", tired:"😴", distracted:"📱",
  cold:"🧊", blunt:"🔨", impatient:"⏱️", irritable:"😤", angry:"🔥", emotional:"🥺",
};

const LEVEL_COLORS = {
  A1: { bg: "#f87171", text: "#fff" }, A2: { bg: "#dc2626", text: "#fff" },
  B1: { bg: "#fbbf24", text: "#78350f" }, B2: { bg: "#d97706", text: "#fff" },
  C1: { bg: "#60a5fa", text: "#fff" }, C2: { bg: "#2563eb", text: "#fff" },
};

const LENGTH_SIZES = {
  terse:  { px: "6px 10px", fontSize: "0.78rem" },
  short:  { px: "7px 14px", fontSize: "0.82rem" },
  medium: { px: "8px 18px", fontSize: "0.85rem" },
  long:   { px: "9px 24px", fontSize: "0.88rem" },
  extended:{ px: "10px 32px",fontSize: "0.90rem" },
};

const LENGTH_LABELS = { terse:"Terse", short:"Short", medium:"Medium", long:"Long", extended:"Extended" };

let _openerEl = null;
let _docClickBound = false;

function ensureDom() {
  let drawer = document.getElementById("luxKnobsDrawer");
  if (drawer) return { drawer };

  drawer = document.createElement("aside");
  drawer.id = "luxKnobsDrawer";
  drawer.className = "lux-knobsDrawer";
  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;
  drawer.dataset.state = "closed";

  const levelChips = Object.keys(LEVEL_COLORS).map((lv) => {
    const c = LEVEL_COLORS[lv];
    return `<button type="button" data-value="${lv}" class="lux-levelChip" style="--lv-bg:${c.bg}; --lv-text:${c.text}">${lv}</button>`;
  }).join("\n");

  const toneChips = Object.entries(TONE_EMOJI).map(([val, emoji]) => {
    const label = val === "emotional" ? "Emotional / Upset" : val.charAt(0).toUpperCase() + val.slice(1);
    return `<button type="button" data-value="${val}" class="lux-toneChip">${emoji} ${label}</button>`;
  }).join("\n");

  const lengthChips = Object.entries(LENGTH_SIZES).map(([val, sz]) => {
    return `<button type="button" data-value="${val}" class="lux-lengthChip" style="padding:${sz.px}; font-size:${sz.fontSize}">${LENGTH_LABELS[val]}</button>`;
  }).join("\n");

  drawer.innerHTML = `
    <div class="lux-knobsEdge"></div>
    <div class="lux-knobsInner">
      <div class="lux-knobsHeader">
        <div class="lux-knobsTitle">Scene Settings</div>
        <button class="lux-knobsClose" type="button" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
          </svg>
        </button>
      </div>
      <div class="lux-knobsBody">
        <div class="lux-knobsGroup" data-key="level">
          <div class="lux-knobsLabel">📊 Level</div>
          <div class="lux-knobsChips lux-levelChips">${levelChips}</div>
        </div>
        <div class="lux-knobsGroup" data-key="tone">
          <div class="lux-knobsLabel">🎭 Tone</div>
          <div class="lux-knobsChips lux-toneChips">${toneChips}</div>
        </div>
        <div class="lux-knobsGroup" data-key="length">
          <div class="lux-knobsLabel">⏱️ Length</div>
          <div class="lux-knobsChips lux-lengthChips">${lengthChips}</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  drawer.addEventListener("animationend", _onAnimEnd);

  if (!_docClickBound) {
    _docClickBound = true;
    document.addEventListener("click", _onDocClick, true);
  }

  return { drawer };
}

/* ── Peekaboo ── */
export function peekKnobsDrawer() {
  const { drawer } = ensureDom();
  if (drawer.dataset.state !== "closed") return;
  drawer.classList.add("lux-knobsPeek");
}
export function unpeekKnobsDrawer() {
  const drawer = document.getElementById("luxKnobsDrawer");
  if (drawer) drawer.classList.remove("lux-knobsPeek");
}

/* ── Empty-space nudge ── */
function _onDocClick(e) {
  const drawer = document.getElementById("luxKnobsDrawer");
  if (!drawer || drawer.dataset.state !== "open") return;
  if (drawer.contains(e.target)) return;
  const charsDrawer = document.getElementById("luxCharsDrawer");
  if (charsDrawer && charsDrawer.contains(e.target)) return;
  const interactive = e.target.closest(
    "a, button, input, select, textarea, [role='button'], [tabindex]:not([tabindex='-1']), video, audio, details, summary, label, .btn, .lux-pickerKnobsRow, .lux-thumb, img[onclick], [data-scenario]"
  );
  if (interactive) return;
  _nudgeCloseBtn(drawer);
}

function _nudgeCloseBtn(drawer) {
  const btn = drawer?.querySelector(".lux-knobsClose");
  if (!btn || btn.classList.contains("lux-closeNudge")) return;
  btn.classList.add("lux-closeNudge");
  btn.addEventListener("animationend", () => btn.classList.remove("lux-closeNudge"), { once: true });
}

/* ── Lifecycle ── */
function _onAnimEnd(e) {
  const drawer = document.getElementById("luxKnobsDrawer");
  if (e.target !== drawer) return;
  const nm = e.animationName;
  if (nm === "luxKnobsSlideIn") {
    drawer.dataset.state = "open";
  } else if (nm === "luxKnobsSlideOut") {
    drawer.dataset.open = "0";
    drawer.dataset.state = "closed";
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    if (_openerEl && typeof _openerEl.focus === "function") {
      _openerEl.focus();
      _openerEl = null;
    }
  }
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
  const { drawer } = ensureDom();

  const open = () => {
    drawer.classList.remove("lux-knobsPeek");

    // TOGGLE: if already open/opening, close
    if (drawer.dataset.state === "open" || drawer.dataset.state === "opening") {
      close();
      return;
    }

    _openerEl = document.activeElement || null;
    paintSelection(drawer, getKnobs());

    drawer.dataset.open = "1";
    drawer.dataset.state = "opening";
    drawer.setAttribute("aria-hidden", "false");
    drawer.inert = false;

    requestAnimationFrame(() => {
      const closeBtn = drawer.querySelector(".lux-knobsClose");
      if (closeBtn) closeBtn.focus();
    });
  };

  const close = () => {
    const st = drawer.dataset.state;
    if (st === "closing" || st === "closed") return;
    drawer.dataset.state = "closing";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawer.dataset.open = "0";
      drawer.dataset.state = "closed";
      drawer.setAttribute("aria-hidden", "true");
      drawer.inert = true;
      if (_openerEl && typeof _openerEl.focus === "function") {
        _openerEl.focus();
        _openerEl = null;
      }
    }
  };

  drawer.querySelector(".lux-knobsClose").addEventListener("click", close);

  drawer.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-value]");
    if (!btn) return;
    const group = btn.closest(".lux-knobsGroup");
    if (!group) return;
    const key = group.getAttribute("data-key");
    const value = btn.getAttribute("data-value");
    paintSelection(drawer, setKnobs({ [key]: value }));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.dataset.state === "open") close();
  });

  return { open, close };
}

let _instance = null;
export function getKnobsDrawerInstance() {
  if (!_instance) _instance = mountKnobsDrawer();
  return _instance;
}