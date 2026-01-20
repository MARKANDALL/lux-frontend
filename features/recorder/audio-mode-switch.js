// features/recorder/audio-mode-switch.js

import { AUDIO_MODES, getAudioMode, setAudioMode, initAudioModeDataset } from "./audio-mode-core.js";

const SELECTOR = {
  wrap: ".lux-audioModeWrap",
};

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
  btnNormal.setAttribute("data-tip", "Balanced quality + smaller size");

  const btnPro = document.createElement("button");
  btnPro.className = "lux-audioOpt";
  btnPro.type = "button";
  btnPro.dataset.mode = "PRO";
  btnPro.textContent = "Pro";
  btnPro.setAttribute("data-tip", "Higher quality + slightly larger size");

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

  // ✅ Practice: place to the right of Record/Stop
  if (scope === "practice" && anchor.classList?.contains("lux-rec-actions")) {
    anchor.appendChild(ui);
  } else {
    anchor.prepend(ui);
  }

  return ui;
}
