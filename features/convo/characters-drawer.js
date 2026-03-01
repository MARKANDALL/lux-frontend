// features/convo/characters-drawer.js
// Left-side drawer – character selection.

import { SCENARIOS } from "./scenarios.js";

let _drawer = null;
let _body = null;
let _onRoleSelect = null;
let _openerEl = null;
let _docClickBound = false;
let _currentAnim = null;  // track running WAAPI animation

function ensureDom() {
  if (_drawer) return;

  _drawer = document.createElement("aside");
  _drawer.id = "luxCharsDrawer";
  _drawer.className = "lux-charsDrawer";
  _drawer.setAttribute("aria-hidden", "true");
  _drawer.inert = true;
  _drawer.dataset.state = "closed";
  _drawer.style.willChange = "transform";          // GPU compositing hint

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

  if (!_docClickBound) {
    _docClickBound = true;
    document.addEventListener("click", _onDocClick, true);
  }
}

/* ── WAAPI slide animations (true 60fps on compositor) ───── */

function _animateOpen() {
  if (_currentAnim) { _currentAnim.cancel(); _currentAnim = null; }

  _currentAnim = _drawer.animate([
    { transform: "translateX(-100%)",  offset: 0    },
    { transform: "translateX(-12%)",   offset: 0.35 },  // fast burst
    { transform: "translateX(0%)",     offset: 0.7  },  // arrive at target
    { transform: "translateX(1.4%)",   offset: 0.82 },  // overshoot past
    { transform: "translateX(-0.3%)",  offset: 0.92 },  // tiny counter-bounce
    { transform: "translateX(0%)",     offset: 1    },  // settle
  ], {
    duration: 520,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",  // emphasized decelerate
    fill: "forwards",
  });

  _currentAnim.onfinish = () => {
    _drawer.dataset.state = "open";
    _drawer.style.transform = "translateX(0)";
    _currentAnim = null;
  };
}

function _animateClose() {
  if (_currentAnim) { _currentAnim.cancel(); _currentAnim = null; }

  _currentAnim = _drawer.animate([
    { transform: "translateX(0)",     offset: 0   },
    { transform: "translateX(2%)",    offset: 0.15 },  // tiny pull-back
    { transform: "translateX(-100%)", offset: 1    },   // accelerate out
  ], {
    duration: 300,
    easing: "cubic-bezier(0.4, 0, 0.85, 0.12)",  // accelerate
    fill: "forwards",
  });

  _currentAnim.onfinish = () => {
    _drawer.dataset.open = "0";
    _drawer.dataset.state = "closed";
    _drawer.setAttribute("aria-hidden", "true");
    _drawer.inert = true;
    _drawer.style.transform = "translateX(-100%)";
    _currentAnim = null;
    if (_openerEl && typeof _openerEl.focus === "function") {
      _openerEl.focus();
      _openerEl = null;
    }
  };
}

/* ── Peekaboo ───────────────────────────────────────────── */

export function peekCharsDrawer() {
  ensureDom();
  if (_drawer.dataset.state !== "closed") return;
  _drawer.classList.add("lux-charsPeek");
  // IMPORTANT: drawer open/close uses inline transform; CSS peek transform can't win.
  // So set the peek transform inline too.
  _drawer.style.transform = "translateX(calc(-100% + 16px))";
}
export function unpeekCharsDrawer() {
  if (!_drawer) return;
  _drawer.classList.remove("lux-charsPeek");
  // Restore the closed position inline (matches base closed state)
  _drawer.style.transform = "translateX(-100%)";
}

/* ── Empty-space click → X nudge ─────────────────────────── */

function _onDocClick(e) {
  if (!_drawer || _drawer.dataset.state !== "open") return;
  if (_drawer.contains(e.target)) return;

  const knobsDrawer = document.getElementById("luxKnobsDrawer");
  if (knobsDrawer && knobsDrawer.contains(e.target)) return;

  // Broad interactive selector — anything clickable should NOT trigger nudge
  const interactive = e.target.closest(
    "a, button, input, select, textarea, [role='button'], [role='dialog'], " +
    "[tabindex]:not([tabindex='-1']), video, audio, details, summary, label, " +
    ".btn, .lux-pickerKnobsRow, .lux-thumb, img[onclick], [data-scenario], " +
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
  btn.addEventListener("animationend", () => btn.classList.remove("lux-closeNudge"), { once: true });
}

/* ── PUBLIC API ───────────────────────────────────────────── */

export function openCharsDrawer({ scenarioIdx, roleIdx, onRoleSelect }) {
  ensureDom();
  _drawer.classList.remove("lux-charsPeek");

  // TOGGLE: if already open/opening → close
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

  // Fire WAAPI animation (or instant if reduced-motion)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    _drawer.style.transform = "translateX(0)";
    _drawer.dataset.state = "open";
  } else {
    _animateOpen();
  }

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
    _drawer.style.transform = "translateX(-100%)";
    _drawer.dataset.open = "0";
    _drawer.dataset.state = "closed";
    _drawer.setAttribute("aria-hidden", "true");
    _drawer.inert = true;
    if (_openerEl) { _openerEl.focus(); _openerEl = null; }
  } else {
    _animateClose();
  }
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}