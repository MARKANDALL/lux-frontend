// ui/ui-arrow-trail.js
export function initArrowTrail(opts = {}) {
  const host = document.querySelector('[data-arrow-trail="tts"]');
  if (!host) return;
  if (host.dataset.init === "yes") return;
  host.dataset.init = "yes";

  // --- Tunables ---
  const count = Number.isFinite(opts.count) ? opts.count : 14;
  const durationSec = Number.isFinite(opts.durationSec) ? opts.durationSec : 2.8;
  const waveDurationSec = Number.isFinite(opts.waveDurationSec) ? opts.waveDurationSec : 1.4;

  // "Leaf drift" timing: duration depends on distance
  const flyMsBase = Number.isFinite(opts.flyMsBase) ? opts.flyMsBase : 1400;
  const flyMsPerPx = Number.isFinite(opts.flyMsPerPx) ? opts.flyMsPerPx : 1.1;
  const flyMsMin = Number.isFinite(opts.flyMsMin) ? opts.flyMsMin : 1800;
  const flyMsMax = Number.isFinite(opts.flyMsMax) ? opts.flyMsMax : 3600;

  const landHoldMs = Number.isFinite(opts.landHoldMs) ? opts.landHoldMs : 900;

  // Strongest option: provide a single selector that points to the TTS handle/tab
  // (works if it's the SAME element in open/closed and just moves)
  const targetSelector = opts.targetSelector || null;

  // If you DO have separate handles for open/closed:
  const closedSel = opts.ttsClosedSelector || null;
  const openSel = opts.ttsOpenSelector || null;

  // Optional small adjustment once target is correct
  const offsetX = Number.isFinite(opts.targetOffsetX) ? opts.targetOffsetX : 0;
  const offsetY = Number.isFinite(opts.targetOffsetY) ? opts.targetOffsetY : 0;

  const debug = !!opts.debug;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  host.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const outer = document.createElement("span");
    outer.className = "lux-arrow";

    const inner = document.createElement("span");
    inner.className = "lux-arrow-glyph";
    inner.textContent = "→";

    outer.appendChild(inner);
    host.appendChild(outer);
  }

  const arrows = Array.from(host.querySelectorAll(".lux-arrow"));
  const n = arrows.length || 1;

  // Phase-lock sweep
  host.style.setProperty("--luxTrailDur", `${durationSec}s`);
  const step = durationSec / n;

  // Phase-lock hover wave
  host.style.setProperty("--luxWaveDur", `${waveDurationSec}s`);
  const waveStep = waveDurationSec / n;

  arrows.forEach((outer, i) => {
    outer.style.setProperty("--luxDelay", `${i * step}s`);

    const inner = outer.querySelector(".lux-arrow-glyph");
    if (inner) inner.style.setProperty("--luxWaveDelay", `${i * waveStep}s`);

    const base = 0.22 + (i / Math.max(1, n - 1)) * 0.16;
    outer.style.opacity = String(base);
  });

  const last = arrows[arrows.length - 1];
  if (last) last.classList.add("is-last");
  host.classList.add("is-animating");

  // --- Hover-triggered launch ---
  let hoverTimer = null;
  let launchedThisHover = false;
  let inFlight = false;

  // NEW: auto-run once on page load / init
  let autoTimer = null;
  let autoHasRun = false;

  let flyEl = null;
  let flyAnim = null;
  let lastLaunchedEl = null;

  let debugDot = null;

  host.addEventListener("mouseenter", () => {
    if (prefersReducedMotion) return;
    if (inFlight) return;

    launchedThisHover = false;
    clearTimeout(hoverTimer);

    const lastArrow = host.querySelector(".lux-arrow.is-last");
    if (!lastArrow) return;

    // When the wave reaches the last arrow (approx peak)
    const peakSec = ((n - 1) * waveStep) + (waveDurationSec * 0.5);
    hoverTimer = window.setTimeout(() => {
      if (!host.matches(":hover")) return;
      if (launchedThisHover) return;
      launchedThisHover = true;
      launchLastArrow(lastArrow);
    }, Math.max(0, peakSec * 1000));
  });

  host.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimer);
    hoverTimer = null;
    launchedThisHover = false;

    // NEW: optional tidy cleanup for the one-shot timer
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }

    cleanupFlight();
  });

  // NEW: Auto-run once after init, even without hover
  if (!prefersReducedMotion) {
    const autoRunMs = Number.isFinite(opts.autoRunMs) ? opts.autoRunMs : 7000;
    const autoRunOnce = opts.autoRunOnce !== false; // default true

    if (autoRunOnce && !autoHasRun) {
      autoTimer = window.setTimeout(() => {
        if (inFlight) return;

        const lastArrow = host.querySelector(".lux-arrow.is-last");
        if (!lastArrow) return;

        autoHasRun = true;
        launchLastArrow(lastArrow);
      }, autoRunMs);
    }
  }

  function cleanupFlight() {
    inFlight = false;

    // NEW: tidy cleanup for the one-shot timer
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }

    if (flyAnim) {
      try { flyAnim.cancel(); } catch {}
      flyAnim = null;
    }
    if (flyEl && flyEl.parentNode) {
      flyEl.parentNode.removeChild(flyEl);
      flyEl = null;
    }
    if (lastLaunchedEl) {
      lastLaunchedEl.classList.remove("is-launched");
      lastLaunchedEl = null;
    }
    if (debugDot && debugDot.parentNode) {
      debugDot.parentNode.removeChild(debugDot);
      debugDot = null;
    }
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

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function parseRGB(rgbStr) {
    // "rgb(r, g, b)" or "rgba(r, g, b, a)"
    const m = rgbStr && rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  }

  function scoreCandidate(el, startX, startY) {
    if (!isVisible(el)) return -Infinity;

    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return -Infinity;

    const cs = window.getComputedStyle(el);
    let score = 0;

    // Prefer fixed/sticky UI handles
    if (cs.position === "fixed") score += 40;
    if (cs.position === "sticky") score += 20;

    // Prefer near the right edge (tabs on the right)
    const distRight = Math.abs(window.innerWidth - r.right);
    score += Math.max(0, 60 - distRight);

    // Prefer roughly aligned vertically with the arrow trail
    const midY = r.top + r.height / 2;
    score += Math.max(0, 30 - Math.abs(midY - startY) * 0.08);

    // Prefer ids/classes suggesting tab/peek/tts
    const tag = `${el.id || ""} ${(el.className && String(el.className)) || ""}`.toLowerCase();
    if (tag.includes("tts")) score += 30;
    if (tag.includes("tab") || tag.includes("peek") || tag.includes("handle") || tag.includes("drawer")) score += 18;

    // Prefer bluish background (your tab/handle is blue)
    const bg = cs.backgroundColor;
    const rgb = parseRGB(bg);
    if (rgb && rgb.b > 140 && (rgb.b > rgb.r + 20) && (rgb.b > rgb.g + 20)) score += 22;

    // Slight preference for “pill-like” sizes
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

    // 3) Heuristic scan: look for TTS-ish, tab-ish, and fixed elements
    const candidates = new Set();

    const root = document.querySelector("#tts-controls");
    if (root) {
      root.querySelectorAll("*").forEach((el) => candidates.add(el));
    }

    // Broad scan of likely suspects (cheap enough, UI is small)
    document.querySelectorAll(
      '[id*="tts"], [class*="tts"], [data-tts], [aria-label*="TTS"], [aria-label*="text"], [title*="TTS"], [class*="peek"], [class*="tab"], [class*="handle"]'
    ).forEach((el) => candidates.add(el));

    let best = null;
    let bestScore = -Infinity;
    for (const el of candidates) {
      const s = scoreCandidate(el, startX, startY);
      if (s > bestScore) {
        bestScore = s;
        best = el;
      }
    }
    return best;
  }

  function getTipPoint(el) {
    const r = el.getBoundingClientRect();

    // If we're targeting the TTS handle pill, always land on its INNER rounded tip.
    // For a right-side pill, the "tip" is its LEFT edge.
    if (el.matches && el.matches("button.lux-tts-tab")) {
      let x = r.left + 1 + offsetX;              // leftmost pixel-ish
      let y = r.top + r.height / 2 + offsetY;    // vertical center
      return { x, y };
    }

    // We want the "point" / rounded end of the tab.
    // Your TTS handle is a pill near the RIGHT edge, with the rounded end on the LEFT (inner) side.
    // The previous edgePad=10 was too strict, so it fell back to center.
    const edgePad = 70; // <-- bigger threshold so we treat "near right edge" as right-edge UI

    let x = r.left + (r.width / 2);
    let y = r.top + (r.height / 2);

    const distRight = Math.abs(window.innerWidth - r.right);
    const distLeft  = Math.abs(r.left);

    if (distRight < edgePad) {
      // Right-edge handle: target the INNER rounded tip (left edge)
      x = r.left + Math.min(8, r.width * 0.12);
      y = r.top + r.height / 2;
    } else if (distLeft < edgePad) {
      // Left-edge handle: target its inner tip (right edge)
      x = r.right - Math.min(8, r.width * 0.12);
      y = r.top + r.height / 2;
    } else {
      // Fallback center
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }

    // Optional fine-tune from initArrowTrail({...})
    x += offsetX;
    y += offsetY;

    const margin = 8;
    x = clamp(x, margin, window.innerWidth - margin);
    y = clamp(y, margin, window.innerHeight - margin);

    return { x, y };
  }

  function showDebugDot(x, y) {
    if (!debug) return;
    if (debugDot && debugDot.parentNode) debugDot.parentNode.removeChild(debugDot);

    debugDot = document.createElement("div");
    debugDot.style.position = "fixed";
    debugDot.style.left = `${x}px`;
    debugDot.style.top = `${y}px`;
    debugDot.style.width = "8px";
    debugDot.style.height = "8px";
    debugDot.style.borderRadius = "999px";
    debugDot.style.transform = "translate(-50%, -50%)";
    debugDot.style.background = "rgba(255, 0, 0, 0.55)";
    debugDot.style.zIndex = "9999";
    debugDot.style.pointerEvents = "none";
    document.body.appendChild(debugDot);
  }

  function launchLastArrow(lastArrowEl) {
    if (inFlight) return;

    const glyph = lastArrowEl.querySelector(".lux-arrow-glyph") || lastArrowEl;
    const startRect = glyph.getBoundingClientRect();

    const startX = startRect.left + (startRect.width / 2);
    const startY = startRect.top + (startRect.height / 2);

    const targetEl = findBestTarget(startX, startY);
    if (!targetEl) return;

    const { x: endX, y: endY } = getTipPoint(targetEl);

    showDebugDot(endX, endY);

    // Hide in-trail copy
    lastArrowEl.classList.add("is-launched");
    lastLaunchedEl = lastArrowEl;

    // Create flying arrow clone
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

    // Perpendicular unit vector for swirly drift
    const px = (-dy / len);
    const py = (dx / len);

    // Gentle swirl amplitude
    const amp = clamp(len * 0.14, 22, 64);

    // Final rotation aims at target
    const finalDeg = Math.atan2(dy, dx) * 180 / Math.PI;

    // Build a multi-keyframe “leaf drift” path.
    // Two oscillations that decay as it approaches the destination.
    const frames = [];
    const steps = 16; // more steps => smoother drift
    const freq = 2.1;

    // --- NEW: per-launch randomness (subtle) ---
    const rand = (min, max) => min + Math.random() * (max - min);

    // Slightly vary the path each time
    const freqJ = freq + rand(-0.35, 0.35);          // frequency jitter
    const ampJ  = amp * rand(0.85, 1.15);            // amplitude jitter
    const phase = rand(0, Math.PI * 2);              // phase offset
    const floatJ = rand(6, 14);                      // float intensity
    const gust = rand(0.85, 1.15);                   // duration wobble feel

    // Distance-based duration => "leaf drift" (slow)
    const flyMs = clamp((flyMsBase + len * flyMsPerPx) * gust, flyMsMin, flyMsMax);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Decay toward end (0..1)
      const decay = (1 - t);

      // Side-to-side drift (perpendicular)
      const wobble = Math.sin((t * Math.PI * 2) * freqJ + phase) * ampJ * decay;

      // A tiny vertical float (feels like wind)
      const float = Math.cos((t * Math.PI * 2) * (freqJ * 0.8) + phase * 0.6) * floatJ * decay;

      const x = dx * t + px * wobble;
      const y = dy * t + py * wobble + float;

      const rot = finalDeg * t;
      const sc = 1 + (0.06 * decay);

      const op = 0.95 - (0.10 * t);

      frames.push({
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc})`,
        opacity: op
      });
    }

    flyAnim = flyEl.animate(frames, {
      duration: flyMs,
      easing: "ease-in-out",
      fill: "forwards"
    });

    flyAnim.onfinish = () => {
      window.setTimeout(() => {
        if (!flyEl) return;

        // Pop ring
        const pop = document.createElement("div");
        pop.className = "lux-arrow-pop";
        pop.style.left = `${endX}px`;
        pop.style.top = `${endY}px`;
        document.body.appendChild(pop);

        // Fade out arrow
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
}
