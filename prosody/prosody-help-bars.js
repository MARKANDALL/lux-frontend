// prosody/prosody-help-bars.js
// Helpers for prosody ribbons + a body-level tooltip. Classic (non-module).

(function () {
  "use strict";

  // ---- Tempo classification ----------------------------------------------
  if (!window.classifyTempo) {
    window.classifyTempo = function classifyTempo(durationSec, medianDur) {
      if (!Number.isFinite(durationSec)) return "ok";
      if (Number.isFinite(medianDur) && medianDur > 0) {
        if (durationSec >= medianDur * 1.45) return "slow";
        if (durationSec <= medianDur * 0.6) return "fast";
        return "ok";
      }
      // Fallback thresholds if no median is supplied
      if (durationSec > 0.65) return "slow";
      if (durationSec < 0.3) return "fast";
      return "ok";
    };
  }

  // ---- Gap classification -------------------------------------------------
  if (!window.classifyGap) {
    window.classifyGap = function classifyGap(prevEnd, currStart) {
      if (!Number.isFinite(prevEnd) || !Number.isFinite(currStart)) return "ok";
      const gap = currStart - prevEnd;
      if (!Number.isFinite(gap) || gap < 0) return "ok";
      if (gap > 0.6) return "unexpected";
      if (gap >= 0.35) return "missing";
      return "ok";
    };
  }

  // ---- Body-level tooltip (prevents clipping in table cells) --------------
  (function installLuxTooltip() {
    if (window.__luxTipInstalled) return;
    window.__luxTipInstalled = true;

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
  })();
})();
