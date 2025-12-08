// app-core/boot.js

import { nukeSWInDev, $ } from "./state.js";
import {
  ensureCustomOption,
  updatePartsInfoTip,
  wirePassageSelect,
  wireNextBtn,
  showCurrentPart,  // <--- This was missing/hidden!
} from "./passages.js";
import { initLuxRecorder } from "./recording.js";
import { initUI } from "../ui/ui-shell-typing.js";
import { initOnboarding } from "../ui/ui-shell-onboarding.js";
import { showSummary } from "../ui/views/index.js";
import { bootInteractions } from "../ui/interactions/boot.js"; 
import { ensureUID } from "../api/identity.js";
import { initAudioSink } from "./audio-sink.js";
import { initProsodyTooltips } from "../prosody/prosody-help-bars.js";

export function bootApp() {
  nukeSWInDev();

  // 1. Ensure UID is generated/loaded immediately
  ensureUID();

  // 2. Initialize the audio sink (hidden player)
  initAudioSink();

  // 3. Initialize Prosody Tooltips (New ES Module)
  initProsodyTooltips();

  const start = () => {
    // Initial UI cleanup / reset
    const passageLabel = $("#passageLabel");
    if (passageLabel) passageLabel.style.display = "none";

    const suggestedSentence = $("#suggestedSentence");
    if (suggestedSentence) suggestedSentence.textContent = "";

    const partProgress = $("#partProgress");
    if (partProgress) partProgress.textContent = "";

    // RESTORED: 3-second delayed drop-down for the Blue Welcome Box (#userMsg)
    setTimeout(() => {
      const msg = $("#userMsg");
      if (msg) msg.classList.add("show");
    }, 2000);

    // Passages + navigation
    ensureCustomOption();
    showCurrentPart(); 
    updatePartsInfoTip();
    wirePassageSelect();
    wireNextBtn();

    // Recording
    initLuxRecorder();

    // Shell + onboarding
    initUI();
    initOnboarding();

    // Boot interactions once
    try {
      bootInteractions();
    } catch (e) {
      console.warn("[LUX] bootInteractions failed", e);
    }

    // Summary button behavior & FORCE VISIBLE
    const summaryBtn = $("#showSummaryBtn");
    if (summaryBtn) {
      summaryBtn.onclick = () => {
        const results = window.__allPartsResults || [];
        showSummary({ allPartsResults: results, currentParts: [] });
      };

      // ✅ TEMPORARY DEV OVERRIDE: ALWAYS SHOW
      summaryBtn.style.display = "inline-block";
      summaryBtn.disabled = false;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

export const boot = bootApp;