// features/convo/characters-drawer.js
// Left-side drawer showing the two characters in the current scenario and lets the user pick which role they want to play.


// Left-side drawer showing the two characters in the current scenario.
// User picks which role they want to play.

import { SCENARIOS } from "./scenarios.js";

let _overlay = null;
let _drawer = null;
let _body = null;
let _onRoleSelect = null;
let _openerEl = null;          // focus-return target

function ensureDom() {
  if (_overlay) return;

  _overlay = document.createElement("div");
  _overlay.id = "luxCharsOverlay";
  _overlay.className = "lux-charsOverlay";
  document.body.appendChild(_overlay);

  _drawer = document.createElement("aside");
  _drawer.id = "luxCharsDrawer";
  _drawer.className = "lux-charsDrawer";
  _drawer.setAttribute("aria-hidden", "true");
  _drawer.inert = true;                       // ← inert when closed
  _drawer.dataset.state = "closed";           // ← lifecycle state

  _drawer.innerHTML = `
    <div class="lux-charsHeader">
      <div class="lux-charsTitle">Characters</div>
      <button class="lux-charsClose" type="button" aria-label="Close">✕</button>
    </div>
    <div class="lux-charsBody"></div>
  `;
  document.body.appendChild(_drawer);

  _body = _drawer.querySelector(".lux-charsBody");

  _overlay.addEventListener("click", closeCharsDrawer);
  _drawer.querySelector(".lux-charsClose").addEventListener("click", closeCharsDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && _drawer.dataset.open === "1") closeCharsDrawer();
  });

  _drawer.addEventListener("click", (e) => {
    const card = e.target.closest("[data-role-idx]");
    if (!card) return;
    const idx = Number(card.dataset.roleIdx);

    // Visual selection
    _drawer.querySelectorAll("[data-role-idx]").forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");

    if (_onRoleSelect) _onRoleSelect(idx);
  });

  // Listen for close animation end to finalize "closed" state
  _drawer.addEventListener("animationend", _onAnimEnd);
  _drawer.addEventListener("transitionend", _onTransEnd);
}

/* ── Lifecycle helpers ───────────────────────────────────── */

function _onAnimEnd(e) {
  // Only respond to the drawer's own slide animation
  if (e.target !== _drawer) return;
  _finalize();
}

function _onTransEnd(e) {
  // Fallback: catch reduced-motion transitions (transform)
  if (e.target !== _drawer || e.propertyName !== "transform") return;
  _finalize();
}

function _finalize() {
  const st = _drawer.dataset.state;
  if (st === "opening") {
    _drawer.dataset.state = "open";
  } else if (st === "closing") {
    // NOW we can remove data-open (overlay fades out in CSS via data-state)
    _overlay.dataset.open = "0";
    _drawer.dataset.open = "0";
    _drawer.dataset.state = "closed";
    _drawer.setAttribute("aria-hidden", "true");
    _drawer.inert = true;

    // Restore focus to opener
    if (_openerEl && typeof _openerEl.focus === "function") {
      _openerEl.focus();
      _openerEl = null;
    }
  }
}

export function openCharsDrawer({ scenarioIdx, roleIdx, onRoleSelect }) {
  ensureDom();

  // Capture the element that triggered the open for focus restoration
  _openerEl = document.activeElement || null;
  _onRoleSelect = onRoleSelect || null;

  const scenario = SCENARIOS[scenarioIdx];
  if (!scenario || !scenario.roles) {
    _body.innerHTML = `<div class="lux-charsEmpty">No characters for this scene.</div>`;
  } else {
    _body.innerHTML = scenario.roles.map((role, i) => {
   // Portrait convention (JPG-only):
// /assets/characters/<scenarioId>-<roleId>.jpg
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
onerror="console.warn('[Lux] Missing portrait JPG:', this.src); this.style.display='none'"
        </button>
      `;
    }).join("");
  }

  // Lifecycle: opening → (animationend) → open
  _overlay.dataset.open = "1";
  _drawer.dataset.open = "1";
  _drawer.dataset.state = "opening";
  _drawer.setAttribute("aria-hidden", "false");
  _drawer.inert = false;

  // Move focus into the drawer (close button) after a tick
  requestAnimationFrame(() => {
    const closeBtn = _drawer.querySelector(".lux-charsClose");
    if (closeBtn) closeBtn.focus();
  });
}

export function closeCharsDrawer() {
  if (!_drawer) return;
  // Guard: don't re-close if already closing or closed
  const st = _drawer.dataset.state;
  if (st === "closing" || st === "closed") return;

  // Keep data-open="1" during closing so overlay stays visible
  _drawer.dataset.state = "closing";
  // data-open="0" and aria-hidden happen in _finalize() after animation ends

  // Reduced-motion fallback: if animations are off, finalize immediately
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    _overlay.dataset.open = "0";
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