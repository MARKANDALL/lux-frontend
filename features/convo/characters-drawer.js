// features/convo/characters-drawer.js
// Left-side drawer showing the two characters in the current scenario and lets the user pick which role they want to play.


// Left-side drawer showing the two characters in the current scenario.
// User picks which role they want to play.

import { SCENARIOS } from "./scenarios.js";

let _overlay = null;
let _drawer = null;
let _body = null;
let _onRoleSelect = null;

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
}

export function openCharsDrawer({ scenarioIdx, roleIdx, onRoleSelect }) {
  ensureDom();

  _onRoleSelect = onRoleSelect || null;

  const scenario = SCENARIOS[scenarioIdx];
  if (!scenario || !scenario.roles) {
    _body.innerHTML = `<div class="lux-charsEmpty">No characters for this scene.</div>`;
  } else {
    _body.innerHTML = scenario.roles.map((role, i) => {
      // Optional override supported (future-proof), otherwise fall back to convention:
      // assets/characters/<scenarioId>-<roleId>.webp
      const src = `assets/characters/${scenario.id}-${role.id}.jpg`;

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
               onerror="this.style.display='none'">
        </button>
      `;
    }).join("");
  }

  _overlay.dataset.open = "1";
  _drawer.dataset.open = "1";
  _drawer.setAttribute("aria-hidden", "false");
}

export function closeCharsDrawer() {
  if (!_drawer) return;
  _overlay.dataset.open = "0";
  _drawer.dataset.open = "0";
  _drawer.setAttribute("aria-hidden", "true");
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}