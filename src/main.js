// src/main.js
// Canonical app boot (Vite).
// Single source of truth: wire every top-level feature exactly once from here.

import {
  ensureCustomOption,
  wirePassageSelect,
  wireNextBtn,
  showCurrentPart,
} from "../features/passages/index.js";

import { initLuxRecorder } from "../features/recorder/index.js";
import { bootInteractions } from "../features/interactions/boot.js";
import { bootTTS } from "../features/features/tts/boot-tts.js";

// Lazy drawers (self-playback)
import "../features/features/08-selfpb-peekaboo.js";

function boot() {
  // 1) Global interaction handlers
  bootInteractions();

  // 2) Passage wiring
  ensureCustomOption();
  wirePassageSelect();
  wireNextBtn();
  showCurrentPart({ preserveExistingInput: true });

  // 3) Recorder + results rendering
  initLuxRecorder();

  // 4) TTS drawer
  bootTTS();

  console.info("[LUX] boot complete");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
