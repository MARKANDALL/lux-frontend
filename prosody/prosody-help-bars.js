// prosody/prosody-help-bars.js
// Helpers for prosody ribbons + a body-level tooltip.

let isInstalled = false;

export function initProsodyTooltips() {
  if (isInstalled) return;
  isInstalled = true;

  if (typeof document === "undefined") return;

  const tip = document.createElement("div");
  tip.className = "lux-tip"; // styled in lux-popover.css
  tip.style.display = "none";
  document.body.appendChild(tip);

  let currentEl = null;
  const PAD = 8;

  function coerceElement(n) {
    if (!n) return null;
    if (n.nodeType === 1) return n;
    return n.parentElement || null;
  }

  function getBarFromEventTarget(target) {
    const el = coerceElement(target);
    if (!el || typeof el.closest !== "function") return null;
    return el.closest(".prosody-bar");
  }

  function showFor(el, clientX, clientY) {
    if (!el) return;
    const txt =
      el.dataset.tip ||
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      "";
    if (!txt) return;

    tip.textContent = txt;
    tip.style.display = "block";

    requestAnimationFrame(() => {
      const r = tip.getBoundingClientRect();
      let x = Math.max(
        PAD,
        Math.min(clientX + 12, window.innerWidth - r.width - PAD)
      );
      let y = clientY - r.height - 14;
      if (y < PAD) y = clientY + 16;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    });
  }

  function hide() {
    tip.style.display = "none";
    currentEl = null;
  }

  document.addEventListener(
    "mouseover",
    (e) => {
      const el = getBarFromEventTarget(e.target);
      if (!el) return;
      currentEl = el;
      showFor(el, e.clientX, e.clientY);
    },
    true
  );

  document.addEventListener(
    "mousemove",
    (e) => {
      if (!currentEl) return;
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const stillOnBar = over && getBarFromEventTarget(over);
      if (!stillOnBar) {
        hide();
        return;
      }
      showFor(currentEl, e.clientX, e.clientY);
    },
    true
  );

  document.addEventListener(
    "mouseout",
    (e) => {
      const from = getBarFromEventTarget(e.target);
      const to = getBarFromEventTarget(e.relatedTarget);
      if (from && !to) hide();
    },
    true
  );

  window.addEventListener("scroll", hide, { passive: true });
  window.addEventListener("blur", hide);
  
  console.log("[LUX] Prosody tooltips initialized");
}