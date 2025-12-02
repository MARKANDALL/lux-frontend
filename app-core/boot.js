// app-core/boot.js

import { nukeSWInDev, $ } from "./state.js";
import {
  ensureCustomOption,
  updatePartsInfoTip,
  wirePassageSelect,
  wireNextBtn,
  showCurrentPart,
} from "./passages.js";
import { initLuxRecorder } from "./recording.js";
import { initUI } from "../ui/ui-shell-typing.js";
import { initOnboarding } from "../ui/ui-shell-onboarding.js";
import { showSummary } from "../ui/views/index.js";
import { bootInteractions } from "../ui/interactions/boot.js"; // ✅ NEW

export function bootApp() {
  nukeSWInDev();

  const start = () => {
    // Initial UI cleanup / reset
    const passageLabel = $("#passageLabel");
    if (passageLabel) passageLabel.style.display = "none";

    const suggestedSentence = $("#suggestedSentence");
    if (suggestedSentence) suggestedSentence.textContent = "";

    const partProgress = $("#partProgress");
    if (partProgress) partProgress.textContent = "";

    const summaryBtn = $("#showSummaryBtn");
    if (summaryBtn) summaryBtn.style.display = "none";

    // Show helper message a bit after load
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

    // ✅ Boot interactions once (safe even before results exist;
    // ph-hover/ph-chips use MutationObserver to bind later)
    try {
      bootInteractions();
    } catch (e) {
      console.warn("[LUX] bootInteractions failed", e);
    }

    // Summary button behavior
    if (summaryBtn) {
      summaryBtn.onclick = () => {
        const results = window.__allPartsResults || [];
        showSummary({ allPartsResults: results, currentParts: [] });
      };
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

export const boot = bootApp;
