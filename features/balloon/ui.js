// features/balloon/ui.js
// Handles DOM creation, visual updates, and the "Confetti Pop" physics.

let wrapper = null;
let balloon = null;
let tip = null;

function ensureDOM() {
  if (wrapper) return;
  
  if (!document.querySelector('link[href*="balloon.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./features/balloon/balloon.css";
    document.head.appendChild(link);
  }

  wrapper = document.createElement("div");
  wrapper.id = "lux-balloon-wrapper";
  
  balloon = document.createElement("div");
  balloon.id = "lux-balloon";
  balloon.title = "Click to Pop!";
  balloon.addEventListener("click", popAnimation);
  
  tip = document.createElement("div");
  tip.id = "lux-balloon-tip";
  
  wrapper.appendChild(balloon);
  wrapper.appendChild(tip); 
  document.body.appendChild(wrapper);
}

export function updateVisuals(count, max) {
  ensureDOM();
  
  wrapper.style.display = "block";

  const safeMax = max || 1; 
  const ratio = Math.min(Math.max(count, 0) / safeMax, 1.0);

  // Swell: 1.0 -> 2.2
  const scale = 1.0 + (ratio * 1.2);
  
  // FIX: Set CSS Variable so animation preserves it
  balloon.style.setProperty('--scale', scale);

  // Lift: Keep string visible
  const lift = 40 + (ratio * 60);
  wrapper.style.bottom = `${lift}px`;

  // Color: Crimson -> Bright Red
  const lightness = 25 + (ratio * 35);
  balloon.style.backgroundColor = `hsl(0, 90%, ${lightness}%)`;

  // Tooltip
  if (ratio >= 1) {
    tip.textContent = "Full! Click to Pop 📌";
  } else {
    const isCustom = max === 15; 
    tip.textContent = isCustom 
      ? `${count}/${max} parts` 
      : `Part ${count + 1} of ${max}`;
  }
}

export function popAnimation() {
  if (!balloon || !wrapper) return;

  // 1. Vanish Balloon
  balloon.style.transition = "transform 0.05s";
  balloon.style.transform = "scale(1.5)"; 
  setTimeout(() => {
    balloon.style.opacity = "0";
    if(tip) tip.style.opacity = "0";
  }, 50);

  // 2. Spawn Confetti with "Arc" variables
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  
  for (let i = 0; i < 50; i++) {
    const p = document.createElement("div");
    p.className = "lux-confetti";
    
    // Random spread
    const spread = (Math.random() - 0.5) * 300; 
    
    // Set 3 points for the arc
    p.style.setProperty('--x-mid', (spread * 0.5) + "px");
    p.style.setProperty('--x-end', spread + "px");
    
    // Upward force
    const yUp = -(80 + Math.random() * 150) + "px";
    p.style.setProperty('--y-up', yUp);
    
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    const dur = 1.0 + Math.random() * 0.8;
    p.style.animation = `confettiFall ${dur}s forwards`;
    
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