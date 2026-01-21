// features/recorder/audio-mode-switch.js

import {
  AUDIO_MODES,
  getAudioMode,
  setAudioMode,
  initAudioModeDataset,
} from "./audio-mode-core.js";

const SELECTOR = {
  wrap: ".lux-audioModeWrap",
};

function kickBump(toggleEl) {
  // restart the CSS animation cleanly
  toggleEl.classList.remove("is-bump");
  void toggleEl.offsetWidth; // reflow
  toggleEl.classList.add("is-bump");
  window.setTimeout(() => toggleEl.classList.remove("is-bump"), 320);
}

/* ✅ Tooltip helper */
function attachAudioTooltip(btn, title, rows, envLine) {
  const tip = document.createElement("div");
  tip.className = "lux-audioTip";

  const t = document.createElement("div");
  t.className = "lux-audioTipTitle";
  t.textContent = title;

  const list = document.createElement("ul");
  list.className = "lux-audioTipList";

  rows.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r;
    list.appendChild(li);
  });

  const env = document.createElement("div");
  env.className = "lux-audioTipEnv";
  env.textContent = envLine;

  tip.appendChild(t);
  tip.appendChild(list);
  tip.appendChild(env);

  btn.appendChild(tip);
}

/* ✅ Fix #3 helper: float dock so Record/Stop stay centered */
let _dockResizeHandler = null;

function dockRightOfStop(ui, stopBtn) {
  const group = stopBtn.closest(".btn-group");
  if (!group) return;

  // Keep tooltips + knob overflow safe
  group.style.position = group.style.position || "relative";
  group.style.overflow = "visible";

  ui.classList.add("is-floatDock");
  ui.style.position = "absolute";

  const place = () => {
    const left = stopBtn.offsetLeft + stopBtn.offsetWidth + 14;
    const top =
      stopBtn.offsetTop +
      Math.round((stopBtn.offsetHeight - ui.offsetHeight) / 2);

    ui.style.left = `${left}px`;
    ui.style.top = `${top}px`;
  };

  requestAnimationFrame(place);

  // Avoid stacking resize listeners on remount
  if (_dockResizeHandler) window.removeEventListener("resize", _dockResizeHandler);
  _dockResizeHandler = () => requestAnimationFrame(place);
  window.addEventListener("resize", _dockResizeHandler);
}

function ensurePracticeActionsRow() {
  const btnGroup = document.querySelector(".btn-group");
  if (!btnGroup) return null;

  // Already wrapped?
  const existing = btnGroup.closest(".lux-rec-actions");
  if (existing) return existing;

  // Wrap btn-group in a row container so we can place the toggle to the right
  const row = document.createElement("div");
  row.className = "lux-rec-actions";

  const parent = btnGroup.parentElement;
  if (!parent) return null;

  parent.insertBefore(row, btnGroup);
  row.appendChild(btnGroup);

  return row;
}

function findPracticeAnchor() {
  // ✅ Dock to the right of Record/Stop (same row)
  return ensurePracticeActionsRow();
}

function findConvoAnchor() {
  // If you mount it in AI Convo header actions, keep existing behavior
  return document.querySelector(".lux-convo-actions") || null;
}

function buildUI(scope = "practice") {
  const wrap = document.createElement("div");
  wrap.className = "lux-audioModeWrap";

  const label = document.createElement("div");
  label.className = "lux-audioModeLabel";
  label.textContent = "Audio";

  const toggle = document.createElement("div");
  toggle.className = "lux-audioToggle";

  const btnNormal = document.createElement("button");
  btnNormal.className = "lux-audioOpt";
  btnNormal.type = "button";
  btnNormal.dataset.mode = "NORMAL";
  btnNormal.textContent = "Normal";

  const btnPro = document.createElement("button");
  btnPro.className = "lux-audioOpt";
  btnPro.type = "button";
  btnPro.dataset.mode = "PRO";
  btnPro.textContent = "Pro";

  // ✅ Replace data-tip tooltips with richer tooltip DOM
  attachAudioTooltip(
    btnNormal,
    "Balanced quality + smaller size",
    ["Echo cancellation: ON", "Noise suppression: ON", "Auto gain control: ON"],
    "Best in: everyday rooms (handles light background noise)."
  );

  attachAudioTooltip(
    btnPro,
    "Higher quality + slightly larger size",
    ["Echo cancellation: OFF", "Noise suppression: OFF", "Auto gain control: OFF"],
    "Best in: quiet rooms (cleanest, most natural audio)."
  );

  const knob = document.createElement("span");
  knob.className = "lux-audioKnob";

  toggle.appendChild(btnNormal);
  toggle.appendChild(btnPro);
  toggle.appendChild(knob);

  wrap.appendChild(label);
  wrap.appendChild(toggle);

  // scope styling hooks
  if (scope === "practice") wrap.classList.add("is-docked");
  if (scope === "convo") wrap.classList.add("is-compact");

  // initial dataset mode sync
  const mode = getAudioMode?.() || AUDIO_MODES?.NORMAL || "NORMAL";
  initAudioModeDataset?.(mode);

  toggle.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (!b) return;

    const next = b.dataset.mode;
    setAudioMode?.(next);
    initAudioModeDataset?.(next);
    kickBump(toggle); // ✅ subtle “switch happened” feedback
  });

  return wrap;
}

export function mountAudioModeSwitch(scope = "practice") {
  // Kill duplicate mounts
  document.querySelectorAll(SELECTOR.wrap).forEach((n) => n.remove());

  const ui = buildUI(scope);

  let anchor = null;
  if (scope === "convo") anchor = findConvoAnchor();
  else anchor = findPracticeAnchor();

  if (!anchor) return null;

  // ✅ Practice: force the switch to live AFTER the Stop button
  if (scope === "practice") {
    const stopBtn = document.querySelector("#stop");
    if (stopBtn && stopBtn.parentElement) {
      // Insert immediately after Stop inside the same flex row
      stopBtn.insertAdjacentElement("afterend", ui);
      ui.classList.add("is-rightOfStop");

      // ✅ Float it so Record/Stop stay centered
      dockRightOfStop(ui, stopBtn);

      return ui;
    }
  }

  // fallback behavior (convo/header/etc.)
  anchor.prepend(ui);
  return ui;
}
