// src/main.js
// The Main Entry Point: Boots the app, handles the Typewriter, and wires the Dropdown.

import { 
  wirePassageSelect, 
  wireNextBtn
} from '../features/passages/index.js';

import { 
  initLuxRecorder, 
  wireRecordingButtons 
} from '../features/recorder/index.js';

import { 
  showSummary 
} from '../features/results/index.js';

import {
  allPartsResults,
  currentParts
} from '../app-core/state.js';

import { initAudioSink } from '../app-core/audio-sink.js';

// NEW: Import the language change handler for auto-updates
import { onLanguageChanged } from '../ui/ui-ai-ai-logic.js';

// Lazy-load controller for the Self-Playback drawer
import "../features/features/08-selfpb-peekaboo.js";

// Onboarding
import '/ui/ui-shell-onboarding.js';

// Dashboard
import { initDashboard } from '../features/dashboard/index.js'; 

// Authentication (NEW)
import { initAuthUI } from '../ui/auth-dom.js';

// Arrow trail (NEW)
import { initArrowTrail } from "../ui/ui-arrow-trail.js";

// --- VISUALS: Typewriter Effect --- 
let typewriterTimeout; 

function startTypewriter() {
  const input = document.getElementById('referenceText');
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
    "Speech closer: “In short, here’s why...”"
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

    input.setAttribute('placeholder', currentPhrase);

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

  // 2. Setup Passages
  wirePassageSelect();     
  wireNextBtn();           

  // 3. Setup Dropdown Logic
  const passageSelect = document.getElementById('passageSelect');
  const textInput = document.getElementById('referenceText');
  
  // --- NEW: Wire up the Language Selector for Auto-Updates ---
  const langSelect = document.getElementById('l1Select');
  if (langSelect) {
      langSelect.addEventListener('change', (e) => {
          // Tell the AI logic that language changed immediately
          onLanguageChanged(e.target.value);
      });
  }
  // ----------------------------------------------------------

  if (passageSelect && textInput) {
      passageSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val === 'write-own') {
              textInput.value = "";
              textInput.focus(); 
          } else if (val === 'clear') {
              textInput.value = "";
              passageSelect.value = ""; 
              textInput.blur(); 
              startTypewriter(); 
          }
      });

      textInput.addEventListener('focus', () => {
          if(typewriterTimeout) clearTimeout(typewriterTimeout);
          textInput.setAttribute('placeholder', "Type whatever you like here...");
      });
      
      textInput.addEventListener('blur', () => {
          if (textInput.value.trim() === "") {
              startTypewriter();
          }
      });
  }

  // 4. Setup Recorder
  await initLuxRecorder(); 
  wireRecordingButtons();

  // 5. Setup Summary Button
  const summaryBtn = document.getElementById('showSummaryBtn');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', () => {
      showSummary({ 
        allPartsResults: allPartsResults, 
        currentParts: currentParts 
      });
    });
  }

  // 6. Start Visuals
  startTypewriter();

  // 6.5 Arrow trail (NEW)
  initArrowTrail({
    targetSelector: "aside.lux-tts-panel > button.lux-tts-tab",
    autoRunMs: 7000,
    autoRunOnce: true
    // debug: true, // optional for 30 seconds
  });

  setTimeout(() => {
    const banner = document.getElementById("lux-top-banner");
    const msg = document.getElementById("userMsg");

    if (banner) banner.classList.add("is-revealed");
    if (msg) msg.classList.add("show");

    requestAnimationFrame(() => {
      updateTopBannerOffset();
      setTimeout(updateTopBannerOffset, 460);
    });
  }, 2500);

  // 7. Boot Dashboard
  await initDashboard();
  
  // 8. Boot Authentication
  initAuthUI();
  
  console.log("[Lux] App fully initialized.");
}

// Add functionality to toggle the visibility of the banner using the collapse and tab buttons.
function updateTopBannerOffset() {
  const banner = document.getElementById("lux-top-banner");
  if (!banner) return;

  const panel = banner.querySelector(".lux-top-banner-panel");
  const tab = banner.querySelector(".lux-banner-tab");
  if (!panel || !tab) return;

  const collapsed = banner.classList.contains("is-collapsed");
  const revealed = banner.classList.contains("is-revealed");

  // If not revealed yet and not collapsed, don't push content down.
  if (!revealed && !collapsed) {
    document.documentElement.style.setProperty("--lux-top-banner-offset", "0px");
    return;
  }

  const target = collapsed ? tab : panel;
  const rect = target.getBoundingClientRect();
  const offset = Math.max(0, Math.ceil(rect.bottom));
  document.documentElement.style.setProperty("--lux-top-banner-offset", offset + "px");
}

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("lux-top-banner");
  if (!banner) return;

  const collapseButton = banner.querySelector(".lux-banner-collapse");
  const tabButton = banner.querySelector(".lux-banner-tab");
  if (!collapseButton || !tabButton) return;

  // Load state (safe)
  let collapsed = false;
  try { collapsed = localStorage.getItem("bannerCollapsed") === "true"; } catch {}
  banner.classList.toggle("is-collapsed", collapsed);

  const setCollapsed = (next) => {
    banner.classList.toggle("is-collapsed", !!next);
    try { localStorage.setItem("bannerCollapsed", next ? "true" : "false"); } catch {}

    // Update offsets immediately + after transition settles
    requestAnimationFrame(() => {
      updateTopBannerOffset();
      setTimeout(updateTopBannerOffset, 460);
    });
  };

  collapseButton.addEventListener("click", (e) => {
    e.preventDefault();
    setCollapsed(true);
  });

  tabButton.addEventListener("click", (e) => {
    e.preventDefault();
    setCollapsed(false);
  });

  window.addEventListener("resize", () => {
    updateTopBannerOffset();
  }, { passive: true });

  updateTopBannerOffset();
});

// Run Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
