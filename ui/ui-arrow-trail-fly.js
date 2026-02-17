// ui/ui-arrow-trail-fly.js
// Flight controller: target-finding, trajectory physics, and animation.
// Called by ui-arrow-trail.js — no direct DOM setup here.

export function createFlightController({
  host,
  arrows,
  n,
  flyMsBase,
  flyMsPerPx,
  flyMsMin,
  flyMsMax,
  landHoldMs,
  targetSelector,
  closedSel,
  openSel,
  offsetX,
  offsetY,
  debug,
}) {
  let inFlight = false;
  let flyEl = null;
  let flyAnim = null;
  let lastLaunchedEl = null;
  let debugDot = null;

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function parseRGB(rgbStr) {
    const m = rgbStr && rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  }

  function isVisible(el) {
    if (!el) return false;
    const rects = el.getClientRects();
    if (!rects || rects.length === 0) return false;
    const cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    return true;
  }

  function pickVisible(sel) {
    if (!sel) return null;
    const el = document.querySelector(sel);
    return isVisible(el) ? el : null;
  }

  // ─── Target scoring & finding ─────────────────────────────────────────────

  function scoreCandidate(el, startX, startY) {
    if (!isVisible(el)) return -Infinity;

    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return -Infinity;

    const cs = window.getComputedStyle(el);
    let score = 0;

    if (cs.position === "fixed") score += 40;
    if (cs.position === "sticky") score += 20;

    const distRight = Math.abs(window.innerWidth - r.right);
    score += Math.max(0, 60 - distRight);

    const midY = r.top + r.height / 2;
    score += Math.max(0, 30 - Math.abs(midY - startY) * 0.08);

    const tag = `${el.id || ""} ${(el.className && String(el.className)) || ""}`.toLowerCase();
    if (tag.includes("tts")) score += 30;
    if (tag.includes("tab") || tag.includes("peek") || tag.includes("handle") || tag.includes("drawer")) score += 18;

    const bg = cs.backgroundColor;
    const rgb = parseRGB(bg);
    if (rgb && rgb.b > 140 && rgb.b > rgb.r + 20 && rgb.b > rgb.g + 20) score += 22;

    const area = r.width * r.height;
    if (area > 1200 && area < 60000) score += 10;

    return score;
  }

  function findBestTarget(startX, startY) {
    // 1) Explicit selector wins
    const explicit = pickVisible(targetSelector);
    if (explicit) return explicit;

    // 2) open/closed selectors (if provided)
    const openEl = pickVisible(openSel);
    if (openEl) return openEl;

    const closedEl = pickVisible(closedSel);
    if (closedEl) return closedEl;

    // 3) Heuristic scan
    const candidates = new Set();

    const root = document.querySelector("#tts-controls");
    if (root) root.querySelectorAll("*").forEach((el) => candidates.add(el));

    document.querySelectorAll(
      '[id*="tts"], [class*="tts"], [data-tts], [aria-label*="TTS"], [aria-label*="text"], [title*="TTS"], [class*="peek"], [class*="tab"], [class*="handle"]'
    ).forEach((el) => candidates.add(el));

    let best = null;
    let bestScore = -Infinity;
    for (const el of candidates) {
      const s = scoreCandidate(el, startX, startY);
      if (s > bestScore) { bestScore = s; best = el; }
    }
    return best;
  }

  function getTipPoint(el) {
    const r = el.getBoundingClientRect();

    if (el.matches && el.matches("button.lux-tts-tab")) {
      return {
        x: r.left + 1 + offsetX,
        y: r.top + r.height / 2 + offsetY,
      };
    }

    const edgePad = 70;
    const distRight = Math.abs(window.innerWidth - r.right);
    const distLeft  = Math.abs(r.left);

    let x, y;
    if (distRight < edgePad) {
      x = r.left + Math.min(8, r.width * 0.12);
      y = r.top + r.height / 2;
    } else if (distLeft < edgePad) {
      x = r.right - Math.min(8, r.width * 0.12);
      y = r.top + r.height / 2;
    } else {
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }

    x += offsetX;
    y += offsetY;

    const margin = 8;
    x = clamp(x, margin, window.innerWidth - margin);
    y = clamp(y, margin, window.innerHeight - margin);

    return { x, y };
  }

  // ─── Debug ────────────────────────────────────────────────────────────────

  function showDebugDot(x, y) {
    if (!debug) return;
    if (debugDot && debugDot.parentNode) debugDot.parentNode.removeChild(debugDot);

    debugDot = document.createElement("div");
    Object.assign(debugDot.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      width: "8px",
      height: "8px",
      borderRadius: "999px",
      transform: "translate(-50%, -50%)",
      background: "rgba(255, 0, 0, 0.55)",
      zIndex: "9999",
      pointerEvents: "none",
    });
    document.body.appendChild(debugDot);
  }

  // ─── Flight lifecycle ─────────────────────────────────────────────────────

  function cleanupFlight() {
    inFlight = false;

    if (flyAnim) { try { flyAnim.cancel(); } catch {} flyAnim = null; }
    if (flyEl && flyEl.parentNode) { flyEl.parentNode.removeChild(flyEl); flyEl = null; }
    if (lastLaunchedEl) { lastLaunchedEl.classList.remove("is-launched"); lastLaunchedEl = null; }
    if (debugDot && debugDot.parentNode) { debugDot.parentNode.removeChild(debugDot); debugDot = null; }
  }

  // ─── Launch ───────────────────────────────────────────────────────────────

  function launchLastArrow(lastArrowEl) {
    if (inFlight) return;

    const glyph = lastArrowEl.querySelector(".lux-arrow-glyph") || lastArrowEl;
    const startRect = glyph.getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;

    const targetEl = findBestTarget(startX, startY);
    if (!targetEl) return;

    const { x: endX, y: endY } = getTipPoint(targetEl);
    showDebugDot(endX, endY);

    lastArrowEl.classList.add("is-launched");
    lastLaunchedEl = lastArrowEl;

    flyEl = document.createElement("span");
    flyEl.className = "lux-arrow-fly";
    flyEl.textContent = "→";
    flyEl.style.left = `${startX}px`;
    flyEl.style.top = `${startY}px`;
    document.body.appendChild(flyEl);

    inFlight = true;

    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.max(1, Math.hypot(dx, dy));
    const px = -dy / len;
    const py = dx / len;

    const amp = clamp(len * 0.14, 22, 64);
    const finalDeg = Math.atan2(dy, dx) * 180 / Math.PI;

    // Per-launch randomness
    const rand = (min, max) => min + Math.random() * (max - min);
    const freq   = 2.1;
    const freqJ  = freq + rand(-0.35, 0.35);
    const ampJ   = amp * rand(0.85, 1.15);
    const phase  = rand(0, Math.PI * 2);
    const floatJ = rand(6, 14);
    const gust   = rand(0.85, 1.15);

    const flyMs = clamp((flyMsBase + len * flyMsPerPx) * gust, flyMsMin, flyMsMax);

    const steps = 16;
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const decay = 1 - t;

      const wobble = Math.sin(t * Math.PI * 2 * freqJ + phase) * ampJ * decay;
      const float  = Math.cos(t * Math.PI * 2 * freqJ * 0.8 + phase * 0.6) * floatJ * decay;

      const x = dx * t + px * wobble;
      const y = dy * t + py * wobble + float;

      frames.push({
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${finalDeg * t}deg) scale(${1 + 0.06 * decay})`,
        opacity: 0.95 - 0.10 * t,
      });
    }

    flyAnim = flyEl.animate(frames, { duration: flyMs, easing: "ease-in-out", fill: "forwards" });

    flyAnim.onfinish = () => {
      window.setTimeout(() => {
        if (!flyEl) return;

        const pop = document.createElement("div");
        pop.className = "lux-arrow-pop";
        pop.style.left = `${endX}px`;
        pop.style.top = `${endY}px`;
        document.body.appendChild(pop);

        flyEl.animate(
          [{ opacity: 0.85 }, { opacity: 0.0 }],
          { duration: 280, easing: "ease-out", fill: "forwards" }
        );

        window.setTimeout(() => {
          if (pop.parentNode) pop.parentNode.removeChild(pop);
          cleanupFlight();
        }, 560);
      }, landHoldMs);
    };
  }

  return {
    launchLastArrow,
    cleanupFlight,
    get inFlight() { return inFlight; },
  };
}