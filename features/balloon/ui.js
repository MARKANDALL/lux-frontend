// features/balloon/ui.js
// Handles DOM creation, visual updates, and the "Confetti Pop" physics.

import "./balloon.css";

let wrapper = null;
let balloon = null;
let core = null;
let tip = null;

function ensureDOM() {
  if (wrapper) return;

  wrapper = document.createElement("div");
  wrapper.id = "lux-balloon-wrapper";
  
  balloon = document.createElement("div");
  balloon.id = "lux-balloon";
  balloon.title = "Click to Pop!";
  balloon.addEventListener("click", popAnimation);

  core = document.createElement("div");
  core.id = "lux-balloon-core";
  balloon.appendChild(core);
  
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
  const nextScale = 1.0 + (ratio * 1.2);

  // Compute delta so bigger jumps inflate slower
  const curScale = parseFloat(getComputedStyle(balloon).getPropertyValue("--scale")) || 1.0;
  const delta = Math.abs(nextScale - curScale);
  const durBase = Math.min(1.4, Math.max(0.65, 0.55 + delta * 0.9));
  const dur = Math.min(1.8, durBase * 1.3); // slower, capped
  const durStr = `${dur.toFixed(2)}s`;

  // Set previous + next scale for the inflate keyframes
  balloon.style.setProperty("--inflateDur", durStr);
  balloon.style.setProperty("--scale-prev", curScale.toFixed(3));
  balloon.style.setProperty("--scale", nextScale.toFixed(3));

  // Retrigger the one-shot inflate animation each step
  balloon.classList.remove("lux-balloon-inflating");
  void balloon.offsetWidth; // force reflow
  balloon.classList.add("lux-balloon-inflating");

  // Lift: keep string visible (match duration)
  wrapper.style.transitionDuration = durStr;
  const lift = 40 + (ratio * 60);
  wrapper.style.bottom = `${lift}px`;

  // Color: Crimson -> Bright Red (apply to the CORE; match duration)
  if (core) core.style.transitionDuration = durStr;
  const lightness = 25 + (ratio * 35);
  if (core) core.style.backgroundColor = `hsl(0, 90%, ${lightness}%)`;

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

  balloon.classList.remove("lux-balloon-inflating");

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
    core = null;
    tip = null;
  }, 2500);
}
