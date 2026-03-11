// features/convo/knobs-drawer.js
import { guardedListener, removeGuardedListener } from '../../app-core/lux-listeners.js';
import { luxBus } from '../../app-core/lux-bus.js';

import { K_CONVO_KNOBS as KNOBS_KEY } from '../../app-core/lux-storage.js';
const DEFAULTS = { level: "B1", tone: "neutral", length: "medium" };

function read() {
  try { const r = localStorage.getItem(KNOBS_KEY); return r ? { ...DEFAULTS, ...JSON.parse(r) } : { ...DEFAULTS }; }
  catch { return { ...DEFAULTS }; }
}
function write(n) { localStorage.setItem(KNOBS_KEY, JSON.stringify(n)); luxBus.set('knobs', n); }

export function getKnobs() { return read(); }
export function setKnobs(p) { const n = { ...read(), ...p }; write(n); return n; }
export function onKnobsChange(fn) { return luxBus.on('knobs', (val) => fn(val || read())); }
export function formatKnobsSummary(k) { const c = s => s.charAt(0).toUpperCase()+s.slice(1); return `Level: ${String(k.level||"B1").toUpperCase()} · Tone: ${c(k.tone||"neutral")} · Length: ${c(k.length||"medium")}`; }

const TONE_EMOJI = {neutral:"😐",formal:"👔",friendly:"😊",enthusiastic:"🤩",encouraging:"💪",playful:"😜",flirty:"😏",sarcastic:"🙄",tired:"😴",distracted:"📱",cold:"🧊",blunt:"🔨",impatient:"⏱️",irritable:"😤",angry:"🔥",emotional:"🥺"};
const LEVEL_COLORS = {A1:{bg:"#f87171",text:"#fff"},A2:{bg:"#dc2626",text:"#fff"},B1:{bg:"#fbbf24",text:"#78350f"},B2:{bg:"#d97706",text:"#fff"},C1:{bg:"#60a5fa",text:"#fff"},C2:{bg:"#2563eb",text:"#fff"}};
const LENGTH_SIZES = {terse:{px:"6px 10px",fs:"0.78rem"},short:{px:"7px 14px",fs:"0.82rem"},medium:{px:"8px 18px",fs:"0.85rem"},long:{px:"9px 24px",fs:"0.88rem"},extended:{px:"10px 32px",fs:"0.90rem"}};
const LENGTH_LABELS = {terse:"Terse",short:"Short",medium:"Medium",long:"Long",extended:"Extended"};

let _openerEl = null;
let _currentAnim = null;

function ensureDom() {
  let drawer = document.getElementById("luxKnobsDrawer");
  if (drawer) return { drawer };

  drawer = document.createElement("aside");
  drawer.id = "luxKnobsDrawer";
  drawer.className = "lux-knobsDrawer";
  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;
  drawer.dataset.state = "closed";
  drawer.style.willChange = "transform";

  const levelChips = Object.keys(LEVEL_COLORS).map(lv => { const c=LEVEL_COLORS[lv]; return `<button type="button" data-value="${lv}" class="lux-levelChip" style="--lv-bg:${c.bg};--lv-text:${c.text}">${lv}</button>`; }).join("\n");
  const toneChips = Object.entries(TONE_EMOJI).map(([v,e]) => { const l=v==="emotional"?"Emotional / Upset":v.charAt(0).toUpperCase()+v.slice(1); return `<button type="button" data-value="${v}" class="lux-toneChip">${e} ${l}</button>`; }).join("\n");
  const lengthChips = Object.entries(LENGTH_SIZES).map(([v,s]) => `<button type="button" data-value="${v}" class="lux-lengthChip" style="padding:${s.px};font-size:${s.fs}">${LENGTH_LABELS[v]}</button>`).join("\n");

  drawer.innerHTML = `
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

  return { drawer };
}

/* ── WAAPI slide animations ── */

function _animateOpen(drawer) {
  if (_currentAnim) { _currentAnim.cancel(); _currentAnim = null; }

  _currentAnim = drawer.animate([
    { transform: "translateX(100%)",  offset: 0    },
    { transform: "translateX(12%)",   offset: 0.35 },
    { transform: "translateX(0%)",    offset: 0.7  },
    { transform: "translateX(-1.4%)", offset: 0.82 },
    { transform: "translateX(0.3%)",  offset: 0.92 },
    { transform: "translateX(0%)",    offset: 1    },
  ], {
    duration: 520,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
  });

  _currentAnim.onfinish = () => {
    drawer.dataset.state = "open";
    drawer.style.transform = "translateX(0)";
    _currentAnim = null;
  };
}

function _animateClose(drawer) {
  if (_currentAnim) { _currentAnim.cancel(); _currentAnim = null; }

  _currentAnim = drawer.animate([
    { transform: "translateX(0)",    offset: 0    },
    { transform: "translateX(-2%)",  offset: 0.15 },
    { transform: "translateX(100%)", offset: 1    },
  ], {
    duration: 300,
    easing: "cubic-bezier(0.4, 0, 0.85, 0.12)",
    fill: "forwards",
  });

  _currentAnim.onfinish = () => {
    drawer.dataset.open = "0";
    drawer.dataset.state = "closed";
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    drawer.style.transform = "translateX(100%)";
    // Kill the finished animation so its fill:forwards doesn't
    // permanently override CSS classes (e.g. peek on next hover).
    try { _currentAnim.cancel(); } catch (_) {}
    _currentAnim = null;
    if (_openerEl) { _openerEl.focus(); _openerEl = null; }
  };
}

/* ── Peekaboo ── */
export function peekKnobsDrawer() {
  const { drawer } = ensureDom();
  if (drawer.dataset.state !== "closed") return;
  // Clear stale inline transform left by close animation's onfinish,
  // so the .lux-knobsPeek CSS class rule can take effect.
  drawer.style.transform = "";
  drawer.classList.add("lux-knobsPeek");
}
export function unpeekKnobsDrawer() {
  const d = document.getElementById("luxKnobsDrawer");
  if (!d) return;
  d.classList.remove("lux-knobsPeek");
  // Restore closed position inline (close animation's onfinish sets this,
  // but peek cleared it, so put it back).
  d.style.transform = "translateX(100%)";
}

/* ── Empty-space nudge ── */
function _onDocClick(e) {
  const drawer = document.getElementById("luxKnobsDrawer");
  if (!drawer || drawer.dataset.state !== "open") return;
  if (drawer.contains(e.target)) return;
  const chars = document.getElementById("luxCharsDrawer");
  if (chars && chars.contains(e.target)) return;

  const interactive = e.target.closest(
    "a, button, input, select, textarea, [role='button'], [role='dialog'], " +
    "[tabindex]:not([tabindex='-1']), video, audio, details, summary, label, " +
    ".btn, .lux-pickerKnobsRow, .lux-pickerNavRow, .lux-thumb, img[onclick], [data-scenario], " +
    "[data-expandable], .scenario-desc, .practice-btn, .lux-scenarioDialog, " +
    ".lux-dialogBackdrop, dialog, [aria-expanded], nav, .lux-navItem, " +
    "[contenteditable], .lux-ttsBtn, .lux-micBtn, " +
    ".lux-deck-card, .lux-deckText, .lux-deckCta, .lux-deck"
  );
  if (interactive) return;

  const btn = drawer.querySelector(".lux-knobsClose");
  if (!btn || btn.classList.contains("lux-closeNudge")) return;
  btn.classList.add("lux-closeNudge");
  btn.addEventListener("animationend", () => btn.classList.remove("lux-closeNudge"), { once: true });
}

function paintSelection(drawer, knobs) {
  drawer.querySelectorAll(".lux-knobsGroup").forEach(g => {
    const k = g.getAttribute("data-key"), v = knobs[k];
    g.querySelectorAll("button[data-value]").forEach(b => {
      const on = b.getAttribute("data-value") === v;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });
}

export function mountKnobsDrawer() {
  const { drawer } = ensureDom();
  const _onEsc = (e) => { if (e.key === "Escape" && drawer.dataset.state === "open") close(); };

  const open = () => {
    drawer.classList.remove("lux-knobsPeek");
    drawer.style.transform = "";           // clear any stale inline transform
    if (_currentAnim) { _currentAnim.cancel(); _currentAnim = null; }

    if (drawer.dataset.state === "open" || drawer.dataset.state === "opening") { close(); return; }
    _openerEl = document.activeElement || null;
    paintSelection(drawer, getKnobs());
    drawer.dataset.open = "1";
    drawer.dataset.state = "opening";
    drawer.setAttribute("aria-hidden", "false");
    drawer.inert = false;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawer.style.transform = "translateX(0)";
      drawer.dataset.state = "open";
    } else {
      _animateOpen(drawer);
    }

    guardedListener('knobsDrawer:docClick', document, 'click', _onDocClick, { capture: true });
    guardedListener('knobsDrawer:escKey', document, 'keydown', _onEsc);
    requestAnimationFrame(() => { const c = drawer.querySelector(".lux-knobsClose"); if (c) c.focus(); });
  };

  const close = () => {
    removeGuardedListener('knobsDrawer:docClick');
    removeGuardedListener('knobsDrawer:escKey');

    const st = drawer.dataset.state;
    if (st === "closing" || st === "closed") return;
    drawer.dataset.state = "closing";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawer.style.transform = "translateX(100%)";
      drawer.dataset.open = "0"; drawer.dataset.state = "closed";
      drawer.setAttribute("aria-hidden", "true"); drawer.inert = true;
      if (_openerEl) { _openerEl.focus(); _openerEl = null; }
    } else { _animateClose(drawer); }
  };

  drawer.querySelector(".lux-knobsClose").addEventListener("click", close);
  drawer.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-value]"); if (!btn) return;
    const g = btn.closest(".lux-knobsGroup"); if (!g) return;
    paintSelection(drawer, setKnobs({ [g.getAttribute("data-key")]: btn.getAttribute("data-value") }));
  });

  return { open, close };
}

let _instance = null;
export function getKnobsDrawerInstance() { if (!_instance) _instance = mountKnobsDrawer(); return _instance; }