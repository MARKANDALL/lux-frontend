// features/convo/knobs-drawer.js

const KNOBS_KEY = "lux_knobs_v1";

const DEFAULTS = {
  tone: "friendly",   // friendly | neutral | playful | formal | flirty
  stress: "medium",   // low | medium | high
  pace: "normal",     // slow | normal | fast
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
  const tone = (k.tone || DEFAULTS.tone);
  const stress = (k.stress || DEFAULTS.stress);
  const pace = (k.pace || DEFAULTS.pace);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `Tone: ${cap(tone)} • Stress: ${cap(stress)} • Pace: ${cap(pace)}`;
}

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
    drawer.innerHTML = `
      <div class="lux-knobsHeader">
        <div class="lux-knobsTitle">Scene knobs</div>
        <button class="lux-knobsClose" type="button" aria-label="Close">✕</button>
      </div>

      <div class="lux-knobsBody">
        <div class="lux-knobsGroup" data-key="tone">
          <div class="lux-knobsLabel">Tone</div>
          <div class="lux-knobsChips">
            <button type="button" data-value="friendly">Friendly</button>
            <button type="button" data-value="neutral">Neutral</button>
            <button type="button" data-value="playful">Playful</button>
            <button type="button" data-value="formal">Formal</button>
            <button type="button" data-value="flirty">Flirty</button>
          </div>
        </div>

        <div class="lux-knobsGroup" data-key="stress">
          <div class="lux-knobsLabel">Stress level</div>
          <div class="lux-knobsChips">
            <button type="button" data-value="low">Low</button>
            <button type="button" data-value="medium">Medium</button>
            <button type="button" data-value="high">High</button>
          </div>
        </div>

        <div class="lux-knobsGroup" data-key="pace">
          <div class="lux-knobsLabel">Pace</div>
          <div class="lux-knobsChips">
            <button type="button" data-value="slow">Slow</button>
            <button type="button" data-value="normal">Normal</button>
            <button type="button" data-value="fast">Fast</button>
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

  const open = () => {
    const knobs = getKnobs();
    paintSelection(drawer, knobs);
    overlay.dataset.open = "1";
    drawer.dataset.open = "1";
    drawer.setAttribute("aria-hidden", "false");
  };

  const close = () => {
    overlay.dataset.open = "0";
    drawer.dataset.open = "0";
    drawer.setAttribute("aria-hidden", "true");
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
