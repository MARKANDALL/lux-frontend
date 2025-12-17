/* ==========================================================================
   LUX MAIN ENTRY POINT
   Single Source of Truth for App Boot
   ========================================================================== */

// 1. Core Logic & Feature Imports
import { wirePassageSelect } from './features/passages/index.js';
import './features/interactions/boot.js'; // Boots generic interaction handlers

// 2. Side-Effect Imports (Self-contained features that self-boot)
import './features/features/08-selfpb-peekaboo.js'; 

document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 Lux: Main boot sequence initiated.");

  // 3. Initialize Passage Logic (Single Source of Truth)
  // We delegate all passage/input handling to the passages module.
  // This prevents the "Double-Firing Event" bug.
  if (typeof wirePassageSelect === 'function') {
    await wirePassageSelect();
  } else {
    console.error("❌ Lux Critical: wirePassageSelect is not a function.");
  }

  console.log("✅ Lux: Boot sequence complete.");
});
