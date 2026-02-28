// features/convo/characters-drawer.js
// Left-side drawer showing the two characters in the current scenario.
// User picks which role they want to play.

import { SCENARIOS } from "./scenarios.js";

let _drawer = null;
let _body = null;
let _onRoleSelect = null;
let _openerEl = null;
let _docClickBound = false;

function ensureDom() {
  if (_drawer) return;

  _drawer = document.createElement("aside");
  _drawer.id = "luxCharsDrawer";
  _drawer.className = "lux-charsDrawer";
  _drawer.setAttribute("aria-hidden", "true");
  _drawer.inert = true;
  _drawer.dataset.state = "closed";

  _drawer.innerHTML = `
    <div class="lux-charsEdge"></div>
    <div class="lux-charsInner">
      <div class="lux-charsHeader">
        <div class="lux-charsTitle">Characters</div>
        <button class="lux-charsClose" type="button" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
          </svg>
        </button>
      </div>
      <div class="lux-charsBody"></div>
    </div>
  `;
  document.body.appendChild(_drawer);

  _body = _drawer.querySelector(".lux-charsBody");

  // Close ONLY via the X button or Escape
  _drawer.querySelector(".lux-charsClose").addEventListener("click", closeCharsDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && _drawer.dataset.state === "open") closeCharsDrawer();
  });

  _drawer.addEventListener("click", (e) => {
    const card = e.target.closest("[data-role-idx]");
    if (!card) return;
    const idx = Number(card.dataset.roleIdx);
    _drawer.querySelectorAll("[data-role-idx]").forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");
    if (_onRoleSelect) _onRoleSelect(idx);
  });

  // Finalize lifecycle on animation end
  _drawer.addEventListener("animationend", _onAnimEnd);

  // Global empty-space click detection
  if (!_docClickBound) {
    _docClickBound = true;
    document.addEventListener("click", _onDocClick, true);
  }
}

/* ── Peekaboo: show drawer hint on button hover ──────────── */

let _peekTimeout = null;
export function peekCharsDrawer() {
  ensureDom();
  if (_drawer.dataset.state !== "closed") return;
  _drawer.classList.add("lux-charsPeek");
}
export function unpeekCharsDrawer() {
  if (!_drawer) return;
  _drawer.classList.remove("lux-charsPeek");
}

/* ── Empty-space click → X-button attention nudge ────────── */

function _onDocClick(e) {
  // Check BOTH drawers
  const charsOpen = _drawer && _drawer.dataset.state === "open";
  const knobsDrawer = document.getElementById("luxKnobsDrawer");
  const knobsOpen = knobsDrawer && knobsDrawer.dataset.state === "open";

  if (!charsOpen) return;

  // Inside either drawer? ignore
  if (_drawer.contains(e.target)) return;
  if (knobsDrawer && knobsDrawer.contains(e.target)) return;

  // If click hit ANY interactive element, let it through — no nudge
  const interactive = e.target.closest(
    "a, button, input, select, textarea, [role='button'], [tabindex]:not([tabindex='-1']), video, audio, details, summary, label, .btn, .lux-pickerKnobsRow, .lux-thumb, img[onclick], [data-scenario]"
  );
  if (interactive) return;

  _nudgeCloseBtn();
}

function _nudgeCloseBtn() {
  const btn = _drawer?.querySelector(".lux-charsClose");
  if (!btn || btn.classList.contains("lux-closeNudge")) return;
  btn.classList.add("lux-closeNudge");
  btn.addEventListener("animationend", () => btn.classList.remove("lux-closeNudge"), { once: true });
}

/* ── Lifecycle ───────────────────────────────────────────── */

function _onAnimEnd(e) {
  if (e.target !== _drawer) return;
  const nm = e.animationName;
  if (nm === "luxCharsSlideIn") {
    _drawer.dataset.state = "open";
  } else if (nm === "luxCharsSlideOut") {
    _drawer.dataset.open = "0";
    _drawer.dataset.state = "closed";
    _drawer.setAttribute("aria-hidden", "true");
    _drawer.inert = true;
    if (_openerEl && typeof _openerEl.focus === "function") {
      _openerEl.focus();
      _openerEl = null;
    }
  }
}

/* ── PUBLIC API ───────────────────────────────────────────── */

export function openCharsDrawer({ scenarioIdx, roleIdx, onRoleSelect }) {
  ensureDom();
  _drawer.classList.remove("lux-charsPeek"); // cancel any peek

  // TOGGLE: if already open/opening, close instead
  if (_drawer.dataset.state === "open" || _drawer.dataset.state === "opening") {
    closeCharsDrawer();
    return;
  }

  _openerEl = document.activeElement || null;
  _onRoleSelect = onRoleSelect || null;

  const scenario = SCENARIOS[scenarioIdx];
  if (!scenario || !scenario.roles) {
    _body.innerHTML = `<div class="lux-charsEmpty">No characters for this scene.</div>`;
  } else {
    _body.innerHTML = scenario.roles.map((role, i) => {
      const src = `/assets/characters/${scenario.id}-${role.id}.jpg`;
      return `
        <button class="lux-charCard ${i === roleIdx ? "is-selected" : ""}"
                data-role-idx="${i}" type="button">
          <div class="lux-charCard-header">
            <span class="lux-charCard-icon">${i === 0 ? "🗣️" : "👤"}</span>
            <span class="lux-charCard-label">${escHtml(role.label)}</span>
          </div>
          <div class="lux-charCard-npc">${escHtml(role.npc)}</div>
          <img src="${escHtml(src)}"
               alt="${escHtml(role.label)}"
               class="char-avatar"
               loading="lazy"
               decoding="async"
               onerror="console.warn('[Lux] Missing portrait JPG:', this.src); this.style.display='none'">
        </button>
      `;
    }).join("");
  }

  _drawer.dataset.open = "1";
  _drawer.dataset.state = "opening";
  _drawer.setAttribute("aria-hidden", "false");
  _drawer.inert = false;

  requestAnimationFrame(() => {
    const closeBtn = _drawer.querySelector(".lux-charsClose");
    if (closeBtn) closeBtn.focus();
  });
}

export function closeCharsDrawer() {
  if (!_drawer) return;
  const st = _drawer.dataset.state;
  if (st === "closing" || st === "closed") return;

  _drawer.dataset.state = "closing";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    _drawer.dataset.open = "0";
    _drawer.dataset.state = "closed";
    _drawer.setAttribute("aria-hidden", "true");
    _drawer.inert = true;
    if (_openerEl && typeof _openerEl.focus === "function") {
      _openerEl.focus();
      _openerEl = null;
    }
  }
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}