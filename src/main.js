// src/main.js
// The Main Entry Point: Boots the app, handles the Typewriter, and wires the Dropdown.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[LUX] Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  console.error('[LUX] Uncaught error:', event.message, event.filename, event.lineno);
});

import { wirePassageSelect, wireNextBtn } from "../features/passages/index.js";

import { wireHarvardPicker } from "../features/harvard/index.js";
import { maybeApplyStoredNextPracticePlan } from "../features/next-activity/next-practice.js";

import { initLuxRecorder, wireRecordingButtons } from "../features/recorder/index.js";

import { mountAudioModeSwitch } from "../features/recorder/audio-mode-switch.js";

import { showSummary } from "../features/results/index.js";

import { allPartsResults, currentParts } from "../app-core/state.js";

import { initAudioSink } from "../app-core/audio-sink.js";
import { bootTTS } from "../features/features/tts/boot-tts.js";

// NEW: Import the language change handler for auto-updates
import { onLanguageChanged } from "../ui/ui-ai-ai-logic.js";

// Lazy-load controller for the Self-Playback drawer
import "../features/features/08-selfpb-peekaboo.js";

// Onboarding
import { maybeShowOnboarding } from "../features/onboarding/lux-onboarding.js";

// Dashboard
import { initDashboard } from "../features/dashboard/index.js";

// Authentication (NEW)
import { initAuthUI } from "../ui/auth-dom.js";

// Arrow trail (NEW)
import { initArrowTrail } from "../ui/ui-arrow-trail.js";

// ✅ My Words Lazy-Load Launcher (NEW)
import { bootMyWordsLauncher } from "../features/my-words/launcher.js";

// ✅ My Words warp prefill (?mw=...) into Practice Skills textarea
function applyMyWordsWarpPrefill() {
  try {
    const url = new URL(window.location.href);
    const mw = url.searchParams.get("mw");
    if (!mw) return;

    const input = document.getElementById("referenceText");
    if (!input) return;

    // Fill + focus
    input.value = mw;
    input.focus();
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Optional: clear the param so refresh doesn't keep re-filling
    url.searchParams.delete("mw");
    if (url.hash === "#mw") url.hash = "";
    window.history.replaceState({}, "", url.toString());
  } catch (_) {}
}

// --- VISUALS: Typewriter Effect ---
let typewriterTimeout;

function startTypewriter() {
  const input = document.getElementById("referenceText");
  if (!input) return;

  const phrases = [
    "Paste or type everything you’ll read here...",
    "Try the Rainbow Passage to test all phonemes (sounds)...",
    "Focus on difficult words you struggle with...",
    "Select a passage from the menu above...",
    "Practice your elevator pitch...",
    "Rehearse your upcoming presentation script...",
    "Tricky phrase: “third thorough thought”",
    "Read an email draft out loud to check the tone...",
    "Prepare for a job interview answer...",
    "Practice your Zoom meeting introduction...",
    "Interview intro: “Thanks for having me...”",
    "Read your favorite poem aloud...",
    "Practice a movie monologue...",
    "Phone message: “Hi, this is Mark — please call me back”",
    "Try a difficult tongue twister...",
    "Read a recipe instruction clearly...",
    "Tell a short story...",
    "Practice ordering coffee clearly...",
    "Read a news headline...",
    "Audio note: “Schedule a sales demo for 10am”",
    "Practice explaining a complex idea simple...",
    "Work on your 'R' and 'L' sounds...",
    "Slow down and enunciate every syllable...",
    "Go over exactly what you'll say when you propose...",
    "Speech closer: “In short, here’s why...”",
  ];

  let i = 0;
  let charIndex = 0;
  let isDeleting = false;
  let currentPhrase = "";

  function type() {
    if (document.activeElement === input || input.value.length > 0) return;

    const fullPhrase = phrases[i];

    if (isDeleting) {
      currentPhrase = fullPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      currentPhrase = fullPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    input.setAttribute("placeholder", currentPhrase);

    let speed = 40;
    if (isDeleting) speed = 20;

    if (!isDeleting && charIndex === fullPhrase.length) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      i = (i + 1) % phrases.length;
      speed = 500;
    }

    typewriterTimeout = setTimeout(type, speed);
  }

  type();
}

// --- MAIN BOOT SEQUENCE ---
async function bootApp() {
  console.log("[Lux] Booting features...");

  // 1. Initialize Audio Infrastructure
  initAudioSink();

  // ✅ Boot TTS panel (lazy player mount on open)
  bootTTS();

  // 2. Setup Passages
  wirePassageSelect();
  wireNextBtn();

  // ✅ If we arrived via My Words "Send" from another page, prefill the textarea now
  applyMyWordsWarpPrefill();

  wireHarvardPicker(); // ✅ new
  await maybeApplyStoredNextPracticePlan();

  // 3. Setup Dropdown Logic
  const passageSelect = document.getElementById("passageSelect");
  const textInput = document.getElementById("referenceText");

  // --- NEW: Wire up the Language Selector for Auto-Updates ---
  const langSelect = document.getElementById("l1Select");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      // Tell the AI logic that language changed immediately
      onLanguageChanged(e.target.value);
    });
  }
  // ----------------------------------------------------------

  if (passageSelect && textInput) {
passageSelect.addEventListener("change", (e) => {
      const val = e.target.value;

// Return the dropdown to the blank "Select Passage..." option (no twitch).
  passageSelect.value = "";
  // Let the passages controller react to the now-blank selection.
  passageSelect.dispatchEvent(new Event("change", { bubbles: true }));

        // Keep your existing UX: blur + typewriter hint.
        textInput.blur();
        startTypewriter();
      }
    });


    textInput.addEventListener("focus", () => {
      if (typewriterTimeout) clearTimeout(typewriterTimeout);
      textInput.setAttribute("placeholder", "Type whatever you like here...");
    });

    textInput.addEventListener("blur", () => {
      if (textInput.value.trim() === "") {
        startTypewriter();
      }
    });
  }

  // 4. Setup Recorder
  await initLuxRecorder();
  wireRecordingButtons();

  // ✅ Mount audio mode switch AFTER recorder DOM exists
  mountAudioModeSwitch("practice");

  // 5. Setup Summary Button
  const summaryBtn = document.getElementById("showSummaryBtn");
  if (summaryBtn) {
    summaryBtn.addEventListener("click", () => {
      showSummary({
        allPartsResults: allPartsResults,
        currentParts: currentParts,
      });
    });
  }

  // 6. Start Visuals
  startTypewriter();

  // 6.5 Arrow trail (NEW)
  initArrowTrail({
    targetSelector: "aside.lux-tts-panel > button.lux-tts-tab",
    autoRunMs: 7000,
    autoRunOnce: true,
    // debug: true, // optional for 30 seconds
  });

  setTimeout(() => {
    const banner = document.getElementById("lux-top-banner");
    const msg = document.getElementById("userMsg");

    if (banner) banner.classList.add("is-revealed");
    if (msg) msg.classList.add("show");

    requestAnimationFrame(() => {
      updateTopBannerLayout();
      setTimeout(updateTopBannerLayout, 460);
    });
  }, 2500);

  // 7. Boot Dashboard
  await initDashboard();

  // 8. Boot Authentication
  initAuthUI();

  // 9. Boot New Onboarding Deck (CSS is loaded via index.html <link>)
  maybeShowOnboarding();

  // ✅ 10. Boot My Words launcher (LAZY)
  bootMyWordsLauncher();

  console.log("[Lux] App fully initialized.");
}

// Add functionality to toggle the visibility of the banner using the collapse and tab buttons.
function updateTopBannerLayout() {
  const banner = document.getElementById("lux-top-banner");
  if (!banner) return;

  const panel = banner.querySelector(".lux-top-banner-panel");
  const handle = banner.querySelector(".lux-banner-handle");
  if (!panel || !handle) return;

  const collapsed = banner.classList.contains("is-collapsed");
  const revealed = banner.classList.contains("is-revealed");

  // Show the handle once the banner has revealed OR if user previously collapsed it
  const showHandle = revealed || collapsed;
  handle.style.opacity = showHandle ? "1" : "0";
  handle.style.pointerEvents = showHandle ? "auto" : "none";

  // Position handle: when open, hang off panel bottom; when collapsed, sit near top
  let handleTop = 16;
  if (!collapsed && revealed) {
    const panelRect = panel.getBoundingClientRect();
    handleTop = Math.max(16, Math.ceil(panelRect.bottom));
  }
  document.documentElement.style.setProperty(
    "--lux-banner-handle-top",
    handleTop + "px"
  );

  // Arrow + a11y
  handle.textContent = collapsed ? "Tips ▾" : "Tips ▴";
  handle.setAttribute("aria-label", collapsed ? "Show tips" : "Hide tips");
  handle.title = collapsed ? "Show tips" : "Hide tips";

  // Content offset: push past whichever is lowest (panel or handle)
  if (!revealed && !collapsed) {
    document.documentElement.style.setProperty("--lux-top-banner-offset", "0px");
    return;
  }

  const panelRect = panel.getBoundingClientRect();
  const handleRect = handle.getBoundingClientRect();
  const bottom = collapsed
    ? handleRect.bottom
    : Math.max(panelRect.bottom, handleRect.bottom);

  document.documentElement.style.setProperty(
    "--lux-top-banner-offset",
    Math.ceil(bottom) + "px"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("lux-top-banner");
  if (!banner) return;

  const panel = banner.querySelector(".lux-top-banner-panel");
  const handle = banner.querySelector(".lux-banner-handle");
  if (!panel || !handle) return;

  // Load state
  let collapsed = false;
  try {
    collapsed = localStorage.getItem("bannerCollapsed") === "true";
  } catch {}
  banner.classList.toggle("is-collapsed", collapsed);

  // If user previously collapsed it, we still want the handle visible immediately
  if (collapsed) banner.classList.add("is-revealed");

  const setCollapsed = (next) => {
    banner.classList.toggle("is-collapsed", !!next);
    try {
      localStorage.setItem("bannerCollapsed", next ? "true" : "false");
    } catch {}

    requestAnimationFrame(() => {
      updateTopBannerLayout();
      setTimeout(updateTopBannerLayout, 460);
    });
  };

  // Handle toggles both ways, always
  handle.addEventListener("click", (e) => {
    e.preventDefault();
    setCollapsed(!banner.classList.contains("is-collapsed"));
  });

  // Keep layout correct after animation and resizes
  panel.addEventListener("transitionend", () => updateTopBannerLayout());
  window.addEventListener("resize", () => updateTopBannerLayout(), {
    passive: true,
  });

  updateTopBannerLayout();
});

// Run Boot
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootApp);
} else {
  bootApp();
}
