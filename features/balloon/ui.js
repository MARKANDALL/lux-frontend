// features/balloon/ui.js
// Handles DOM creation, visual updates (3D/Lift), and the "Confetti Pop".

let wrapper = null;
let balloon = null;
let tip = null;

function ensureDOM() {
  if (wrapper) return;
  
  // 1. CSS
  if (!document.querySelector('link[href*="balloon.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./features/balloon/balloon.css";
    document.head.appendChild(link);
  }

  // 2. Elements
  wrapper = document.createElement("div");
  wrapper.id = "lux-balloon-wrapper";
  
  balloon = document.createElement("div");
  balloon.id = "lux-balloon";
  // --- CLICK TO POP ---
  balloon.title = "Click to Pop!";
  balloon.addEventListener("click", popAnimation);
  
  tip = document.createElement("div");
  tip.id = "lux-balloon-tip";
  
  wrapper.appendChild(balloon);
  wrapper.appendChild(tip); // Sibling for CSS hover
  document.body.appendChild(wrapper);
}

export function updateVisuals(count, max) {
  ensureDOM();
  
  // Hide if no data yet (0 or empty session)
  // For Curated, we want it visible at 0 (start), so we check >= 0
  wrapper.style.display = "block";

  // 1. Calculate Ratio (0.0 to 1.0)
  const safeMax = max || 1; 
  const ratio = Math.min(Math.max(count, 0) / safeMax, 1.0);

  // 2. Scale Logic: 
  // Start: 1.0 (Base)
  // End: 2.2 (Max swell)
  const scale = 1.0 + (ratio * 1.2);
  balloon.style.transform = `scale(${scale})`;

  // 3. Lift Logic (Keep string visible)
  // As it scales, we lift the wrapper so the bottom of the string stays on screen.
  // Base bottom: 40px. Lift up to 60px more.
  const lift = 40 + (ratio * 60);
  wrapper.style.bottom = `${lift}px`;

  // 4. Color Logic:
  // Dark Crimson (L=25%) -> Bright Red (L=60%)
  // We apply this to backgroundColor, the gradient overlay handles the 3D look.
  const lightness = 25 + (ratio * 35);
  balloon.style.backgroundColor = `hsl(0, 90%, ${lightness}%)`;

  // 5. Tooltip Text
  if (ratio >= 1) {
    tip.textContent = "Full! Click to Pop 📌";
  } else {
    // Determine context (Curated vs Custom) based on max
    const isCustom = max === 15; // Heuristic
    tip.textContent = isCustom 
      ? `${count}/${max} parts` 
      : `Part ${count + 1} of ${max}`;
  }
}

export function popAnimation() {
  if (!balloon || !wrapper) return;

  // 1. Vanish Balloon
  balloon.style.transition = "transform 0.1s";
  balloon.style.transform = "scale(1.4)"; // Puff
  setTimeout(() => {
    balloon.style.opacity = "0";
    if(tip) tip.style.opacity = "0";
  }, 50);

  // 2. Spawn Confetti
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  
  for (let i = 0; i < 50; i++) {
    const p = document.createElement("div");
    p.className = "lux-confetti";
    
    // X distance: Explode left/right
    const x = (Math.random() - 0.5) * 400 + "px";
    
    // Y-Up: Explode UP initially (-50px to -150px)
    const yUp = -(50 + Math.random() * 100) + "px";
    
    p.style.setProperty('--x', x);
    p.style.setProperty('--y-up', yUp);
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Random fall speed
    const dur = 1.2 + Math.random() * 0.8;
    p.style.animation = `confettiFall ${dur}s ease-out forwards`;
    
    wrapper.appendChild(p);
  }

  // 3. Remove DOM
  setTimeout(() => {
    if(wrapper) wrapper.remove();
    wrapper = null;
    balloon = null;
    tip = null;
  }, 2500);
}