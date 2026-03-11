// features/convo/characters-drawer.js
// Left-side drawer – character selection.

import { guardedListener, removeGuardedListener } from '../../app-core/lux-listeners.js';
import { SCENARIOS } from "./scenarios.js";
import { luxBus } from '../../app-core/lux-bus.js';
import { escapeHtml as escHtml } from "../../helpers/escape-html.js";

let _drawer = null;
let _body = null;
let _onRoleSelect = null;
let _openerEl = null;
let _currentAnim = null; // track running WAAPI animation
let _hoverRoleCard = null;
let _contentAnim = null; // track running content swap animation

/* ── Peekaboo (hover-preview teaser) ── */
export function peekCharsDrawer() {
  ensureDom();
  if (_drawer.dataset.state !== "closed") return;
  // Clear any stale inline transform left by close animation's onfinish,
  // so the CSS class rule can take effect.
  _drawer.style.transform = "";
  _drawer.classList.add("lux-charsPeek");
}

export function unpeekCharsDrawer() {
  if (!_drawer) return;
  _drawer.classList.remove("lux-charsPeek");
  // Restore closed position inline (close animation's onfinish sets this,
  // but if we peeked we cleared it, so put it back).
  _drawer.style.transform = "translateX(-100%)";
}

/* ── Empty-space nudge (wiggle close btn if user clicks dead space) ── */
function _onDocClick(e) {
  if (!_drawer || _drawer.dataset.state !== "open") return;
  if (_drawer.contains(e.target)) return;

  const knobsDrawer = document.getElementById("luxKnobsDrawer");
  if (knobsDrawer && knobsDrawer.contains(e.target)) return;

  // Broad interactive selector — anything clickable should NOT trigger nudge
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

  _nudgeCloseBtn();
}

function _nudgeCloseBtn() {
  const btn = _drawer?.querySelector(".lux-charsClose");
  if (!btn || btn.classList.contains("lux-closeNudge")) return;
  btn.classList.add("lux-closeNudge");
  btn.addEventListener(
    "animationend",
    () => btn.classList.remove("lux-closeNudge"),
    { once: true }
  );
}

function ensureDom() {
  if (_drawer) return;

  _drawer = document.createElement("aside");
  _drawer.id = "luxCharsDrawer";
  _drawer.className = "lux-charsDrawer";
  _drawer.setAttribute("aria-hidden", "true");
  _drawer.inert = true;
  _drawer.dataset.state = "closed";
  _drawer.style.willChange = "transform"; // GPU compositing hint

  _drawer.innerHTML = `
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

  _drawer
    .querySelector(".lux-charsClose")
    .addEventListener("click", closeCharsDrawer);

  _drawer.addEventListener("click", (e) => {
    const card = e.target.closest("[data-role-idx]");
    if (!card) return;
    const idx = Number(card.dataset.roleIdx);
    _drawer
      .querySelectorAll("[data-role-idx]")
      .forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");
    if (_onRoleSelect) _onRoleSelect(idx);
    luxBus.set('pickerSummaryPulse', true);
  });

  // Hover-preview: tiny, subtle "Role • X" tag + slight pill bulge
  _drawer.addEventListener("pointerover", (e) => {
    const card = e.target.closest("[data-role-idx]");
    if (!card) return;
    if (card === _hoverRoleCard) return;
    _hoverRoleCard = card;
    const label = card.querySelector(".lux-charCard-label")?.textContent?.trim();
    if (label) {
      luxBus.set('pickerSummaryHover', { label: `Role • ${label}` });
    }
  });

  _drawer.addEventListener("pointerout", (e) => {
    const fromCard = e.target.closest("[data-role-idx]");
    if (!fromCard) return;
    const toCard = e.relatedTarget?.closest?.("[data-role-idx]");
    if (toCard) return;
    _hoverRoleCard = null;
    luxBus.set('pickerSummaryHoverClear', true);
  });
}

export function isCharsDrawerOpen() {
  ensureDom();
  return _drawer.dataset.state === "open" || _drawer.dataset.state === "opening";
}

function _renderRolesHtml(scenarioIdx, roleIdx) {
  const scenario = SCENARIOS[scenarioIdx];
  if (!scenario || !scenario.roles) {
    return `<div class="lux-charsEmpty">No characters for this scene.</div>`;
  }

  return scenario.roles
    .map((role, i) => {
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
    })
    .join("");
}

export function swapCharsDrawerContent(scenarioIdx, roleIdx) {
  ensureDom();
  if (!isCharsDrawerOpen()) return;

  const nextHtml = _renderRolesHtml(scenarioIdx, roleIdx);

  // Cancel any in-flight content animation so fast flicking stays responsive.
  if (_contentAnim) {
    _contentAnim.cancel();
    _contentAnim = null;
  }

  // OUT: fade + tiny drift (very subtle)
  _contentAnim = _body.animate(
    [
      { opacity: 1, transform: "translate3d(0,0,0)" },
      { opacity: 0, transform: "translate3d(6px,-2px,0)" },
    ],
    { duration: 120, easing: "ease-out", fill: "forwards" }
  );

  _contentAnim.onfinish = () => {
    _body.innerHTML = nextHtml;

    // IN: fade in + micro drift from left/down (gentle)
    _contentAnim = _body.animate(
      [
        { opacity: 0, transform: "translate3d(-10px,6px,0)" },
        { opacity: 1, transform: "translate3d(0,0,0)" },
      ],
      { duration: 170, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );

    _contentAnim.onfinish = () => {
      _contentAnim = null;
    };
  };
}

/* ── WAAPI slide animations (true 60fps on compositor) ───── */

function _animateOpen() {
  if (_currentAnim) {
    _currentAnim.cancel();
    _currentAnim = null;
  }

  _currentAnim = _drawer.animate(
    [
      { transform: "translateX(-100%)", offset: 0 },
      { transform: "translateX(-12%)", offset: 0.35 }, // fast burst
      { transform: "translateX(0%)", offset: 0.7 }, // arrive at target
      { transform: "translateX(1.4%)", offset: 0.82 }, // overshoot past
      { transform: "translateX(-0.3%)", offset: 0.92 }, // tiny counter-bounce
      { transform: "translateX(0%)", offset: 1 }, // settle
    ],
    {
      duration: 520,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)", // emphasized decelerate
      fill: "forwards",
    }
  );

  _currentAnim.onfinish = () => {
    _drawer.dataset.state = "open";
    _drawer.style.transform = "translateX(0)";
    _currentAnim = null;
  };
}

function _animateClose() {
  if (_currentAnim) {
    _currentAnim.cancel();
    _currentAnim = null;
  }

  _currentAnim = _drawer.animate(
    [
      { transform: "translateX(0)", offset: 0 },
      { transform: "translateX(2%)", offset: 0.15 }, // tiny pull-back
      { transform: "translateX(-100%)", offset: 1 }, // accelerate out
    ],
    {
      duration: 300,
      easing: "cubic-bezier(0.4, 0, 0.85, 0.12)", // accelerate
      fill: "forwards",
    }
  );

  _currentAnim.onfinish = () => {
    _drawer.dataset.open = "0";
    _drawer.dataset.state = "closed";
    _drawer.setAttribute("aria-hidden", "true");
    _drawer.inert = true;
    _drawer.style.transform = "translateX(-100%)";
    // Kill the finished animation so its fill:forwards doesn't
    // permanently override CSS classes (e.g. peek on next hover).
    try { _currentAnim.cancel(); } catch (_) {}
    _currentAnim = null;
    if (_openerEl && typeof _openerEl.focus === "function") {
      _openerEl.focus();
      _openerEl = null;
    }
  };
}

/* ── PUBLIC API ───────────────────────────────────────────── */

export function openCharsDrawer({ scenarioIdx, roleIdx, onRoleSelect }) {
  ensureDom();
  _drawer.classList.remove("lux-charsPeek");
  _drawer.style.transform = "";           // clear any stale inline transform
  if (_currentAnim) { _currentAnim.cancel(); _currentAnim = null; }

  // TOGGLE: if already open/opening → close
  if (_drawer.dataset.state === "open" || _drawer.dataset.state === "opening") {
    closeCharsDrawer();
    return;
  }

  _openerEl = document.activeElement || null;
  _onRoleSelect = onRoleSelect || null;

  _body.innerHTML = _renderRolesHtml(scenarioIdx, roleIdx);

  _drawer.dataset.open = "1";
  _drawer.dataset.state = "opening";
  _drawer.setAttribute("aria-hidden", "false");
  _drawer.inert = false;

  // Fire WAAPI animation (or instant if reduced-motion)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    _drawer.style.transform = "translateX(0)";
    _drawer.dataset.state = "open";
  } else {
    _animateOpen();
  }

  guardedListener('charsDrawer:docClick', document, 'click', _onDocClick);
  guardedListener('charsDrawer:escKey', document, 'keydown', (e) => {
    if (e.key === "Escape" && _drawer.dataset.state === "open") {
      closeCharsDrawer();
    }
  });

  requestAnimationFrame(() => {
    const closeBtn = _drawer.querySelector(".lux-charsClose");
    if (closeBtn) closeBtn.focus();
  });
}

export function closeCharsDrawer() {
  if (!_drawer) return;
  const st = _drawer.dataset.state;
  if (st === "closing" || st === "closed") return;

  removeGuardedListener('charsDrawer:docClick');
  removeGuardedListener('charsDrawer:escKey');

  _drawer.dataset.state = "closing";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    _drawer.style.transform = "translateX(-100%)";
    _drawer.dataset.open = "0";
    _drawer.dataset.state = "closed";
    _drawer.setAttribute("aria-hidden", "true");
    _drawer.inert = true;
    if (_openerEl) {
      _openerEl.focus();
      _openerEl = null;
    }
  } else {
    _animateClose();
  }
}

/* ── Utility ── */
// escHtml imported from helpers/escape-html.js