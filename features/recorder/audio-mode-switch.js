// features/recorder/audio-mode-switch.js

import { AUDIO_MODES, getAudioMode, setAudioMode, initAudioModeDataset } from "./audio-mode.js";

const TIP_NORMAL =
  "NORMAL: Browser-enhanced mic (Echo Cancellation + Noise Suppression + Auto Gain). Best for everyday rooms & clean scoring.";
const TIP_PRO =
  "PRO: Raw mic capture (No Echo Cancel / No Noise Suppression / No Auto Gain). Best for quiet rooms & deeper stress/prosody fidelity.";

function buildSwitch(scope) {
  const wrap = document.createElement("div");
  wrap.className = "lux-audioModeWrap";
  wrap.dataset.scope = scope;

  const label = document.createElement("div");
  label.className = "lux-audioModeLabel";
  label.textContent = "Audio";

  const toggle = document.createElement("div");
  toggle.className = "lux-audioToggle";
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Audio Recording Mode");

  const knob = document.createElement("span");
  knob.className = "lux-audioKnob";

  const btnNormal = document.createElement("button");
  btnNormal.type = "button";
  btnNormal.className = "lux-audioOpt";
  btnNormal.dataset.mode = AUDIO_MODES.NORMAL;
  btnNormal.dataset.tip = TIP_NORMAL;
  btnNormal.textContent = "Normal";

  const btnPro = document.createElement("button");
  btnPro.type = "button";
  btnPro.className = "lux-audioOpt";
  btnPro.dataset.mode = AUDIO_MODES.PRO;
  btnPro.dataset.tip = TIP_PRO;
  btnPro.textContent = "Pro";

  toggle.appendChild(knob);
  toggle.appendChild(btnNormal);
  toggle.appendChild(btnPro);

  wrap.appendChild(label);
  wrap.appendChild(toggle);

  function apply(mode) {
    const m = setAudioMode(mode);
    // (CSS is driven by html[data-lux-audio-mode], so nothing else is required)
    return m;
  }

  btnNormal.addEventListener("click", () => apply(AUDIO_MODES.NORMAL));
  btnPro.addEventListener("click", () => apply(AUDIO_MODES.PRO));

  // Sync if something else changes mode
  window.addEventListener("lux:audioModeChanged", (e) => {
    const m = e?.detail?.mode || getAudioMode();
    document.documentElement.setAttribute("data-lux-audio-mode", String(m).toLowerCase());
  });

  return wrap;
}

function findPracticeAnchor() {
  // Insert above Record/Stop row
  return document.querySelector(".btn-group")?.parentElement || null;
}

function findConvoAnchor() {
  // Insert in convo header actions if possible
  return document.querySelector(".lux-convo-actions") || null;
}

export function mountAudioModeSwitch({ scope = "practice", mount = null, compact = false } = {}) {
  initAudioModeDataset();

  const existing = document.querySelector(`.lux-audioModeWrap[data-scope="${scope}"]`);
  if (existing) return existing;

  const ui = buildSwitch(scope);

  if (compact) ui.classList.add("is-compact");

  const anchor =
    mount ||
    (scope === "convo" ? findConvoAnchor() : findPracticeAnchor()) ||
    document.body;

  // If it’s a header/actions row, we want it left-aligned compact
  if (anchor.classList?.contains("lux-convo-actions")) ui.classList.add("is-compact");

  anchor.prepend(ui);
  return ui;
}
