// src/main.js
// The Main Entry Point: Boots the app, handles the Typewriter, and wires the Dropdown.

// --- UPDATED IMPORTS: Using Absolute Paths (starts with /) ---
import { 
  wirePassageSelect, 
  wireNextBtn
} from '/features/passages/index.js';

import { 
  initLuxRecorder, 
  wireRecordingButtons 
} from '/features/recorder/index.js';

import { 
  showSummary 
} from '/features/results/index.js';

// --- VISUALS: Typewriter Effect ---
let typewriterTimeout; 


function startTypewriter() {
  const input = document.getElementById('referenceText');
  if (!input) return;

  const phrases = [
    "Paste or type everything you’ll read here...",
    "Try the Rainbow Passage to test all phonemes...",
    "Focus on difficult words you struggle with...",
    "Select a passage from the menu above...",
    "Practice your elevator pitch...",
    "Rehearse your upcoming presentation script...",
    "Read an email draft out loud to check the tone...",
    "Prepare for a job interview answer...",
    "Practice your Zoom meeting introduction...",
    "Read your favorite poem aloud...",
    "Practice a movie monologue...",
    "Try a difficult tongue twister...",
    "Read a recipe instruction clearly...",
    "Tell a short story...",
    "Practice ordering coffee clearly...",
    "Read a news headline...",
    "Practice explaining a complex idea simple...",
    "Work on your 'R' and 'L' sounds...",
    "Slow down and enunciate every syllable..."
  ];
  
  let i = 0;
  let charIndex = 0;
  let isDeleting = false;
  let currentPhrase = "";

  function type() {
    // If user clicked or typed, STOP completely.
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

    // --- SPEED SETTINGS ---
    let speed = 40; // Fast typing
    if (isDeleting) speed = 20; // Super fast deleting

    if (!isDeleting && charIndex === fullPhrase.length) {
      speed = 2000; // Pause at end of sentence
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

  // 1. Setup Passages
  wirePassageSelect();     
  wireNextBtn();           

  // 2. Setup Dropdown Logic ("Write Your Own" / "Clear")
  const passageSelect = document.getElementById('passageSelect');
  const textInput = document.getElementById('referenceText');
  
  if (passageSelect && textInput) {
      passageSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          
          if (val === 'write-own') {
              textInput.value = "";
              textInput.focus(); 
          } 
          else if (val === 'clear') {
              textInput.value = "";
              passageSelect.value = ""; // Reset dropdown
              textInput.blur(); 
              startTypewriter(); // Restart animation
          }
      });

      // 3. Stop animation on click/focus
      textInput.addEventListener('focus', () => {
          if(typewriterTimeout) clearTimeout(typewriterTimeout);
          textInput.setAttribute('placeholder', "Type whatever you like here...");
      });
      
      // 4. Restart animation if they leave it empty
      textInput.addEventListener('blur', () => {
          if (textInput.value.trim() === "") {
              startTypewriter();
          }
      });
  }

  // 5. Setup Recorder
  await initLuxRecorder(); 
  wireRecordingButtons();

  // 6. Setup Summary Button
  const summaryBtn = document.getElementById('showSummaryBtn');
  if (summaryBtn) {
    summaryBtn.addEventListener('click', showSummary);
  }

  // 7. Start Visuals
  startTypewriter();
  
  console.log("[Lux] App fully initialized.");
}

// Run Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}