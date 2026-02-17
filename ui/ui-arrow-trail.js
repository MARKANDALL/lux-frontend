// ui/ui-arrow-trail.js
// Init, DOM building, CSS vars, and event wiring.
// All flight/targeting/animation logic lives in ui-arrow-trail-fly.js.

import { createFlightController } from "./ui-arrow-trail-fly.js";

export function initArrowTrail(opts = {}) {
  const host = document.querySelector('[data-arrow-trail="tts"]');
  if (!host) return;
  if (host.dataset.init === "yes") return;
  host.dataset.init = "yes";

  // ─── Config / tunables ────────────────────────────────────────────────────

  const count           = Number.isFinite(opts.count)           ? opts.count           : 14;
  const durationSec     = Number.isFinite(opts.durationSec)     ? opts.durationSec     : 2.8;
  const waveDurationSec = Number.isFinite(opts.waveDurationSec) ? opts.waveDurationSec : 1.4;
  const flyMsBase       = Number.isFinite(opts.flyMsBase)       ? opts.flyMsBase       : 1400;
  const flyMsPerPx      = Number.isFinite(opts.flyMsPerPx)      ? opts.flyMsPerPx      : 1.1;
  const flyMsMin        = Number.isFinite(opts.flyMsMin)        ? opts.flyMsMin        : 1800;
  const flyMsMax        = Number.isFinite(opts.flyMsMax)        ? opts.flyMsMax        : 3600;
  const landHoldMs      = Number.isFinite(opts.landHoldMs)      ? opts.landHoldMs      : 900;
  const offsetX         = Number.isFinite(opts.targetOffsetX)   ? opts.targetOffsetX   : 0;
  const offsetY         = Number.isFinite(opts.targetOffsetY)   ? opts.targetOffsetY   : 0;
  const debug           = !!opts.debug;

  const targetSelector = opts.targetSelector    || null;
  const closedSel      = opts.ttsClosedSelector || null;
  const openSel        = opts.ttsOpenSelector   || null;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // ─── Build arrow DOM ──────────────────────────────────────────────────────

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

  // ─── CSS timing vars & per-arrow delays ───────────────────────────────────

  host.style.setProperty("--luxTrailDur", `${durationSec}s`);
  host.style.setProperty("--luxWaveDur",  `${waveDurationSec}s`);

  const step     = durationSec     / n;
  const waveStep = waveDurationSec / n;

  arrows.forEach((outer, i) => {
    outer.style.setProperty("--luxDelay", `${i * step}s`);

    const inner = outer.querySelector(".lux-arrow-glyph");
    if (inner) inner.style.setProperty("--luxWaveDelay", `${i * waveStep}s`);

    outer.style.opacity = String(0.22 + (i / Math.max(1, n - 1)) * 0.16);
  });

  arrows[arrows.length - 1]?.classList.add("is-last");
  host.classList.add("is-animating");

  // ─── Flight controller ────────────────────────────────────────────────────

  const flight = createFlightController({
    host, arrows, n,
    flyMsBase, flyMsPerPx, flyMsMin, flyMsMax, landHoldMs,
    targetSelector, closedSel, openSel,
    offsetX, offsetY, debug,
  });

  // ─── Event wiring ─────────────────────────────────────────────────────────

  let hoverTimer        = null;
  let launchedThisHover = false;
  let autoTimer         = null;
  let autoHasRun        = false;

  function getLastArrow() {
    return host.querySelector(".lux-arrow.is-last");
  }

  host.addEventListener("mouseenter", () => {
    if (prefersReducedMotion || flight.inFlight) return;
    launchedThisHover = false;
    clearTimeout(hoverTimer);

    const lastArrow = getLastArrow();
    if (!lastArrow) return;

    // Fire when the wave animation peaks on the last arrow
    const peakSec = (n - 1) * waveStep + waveDurationSec * 0.5;
    hoverTimer = window.setTimeout(() => {
      if (!host.matches(":hover") || launchedThisHover) return;
      launchedThisHover = true;
      flight.launchLastArrow(lastArrow);
    }, Math.max(0, peakSec * 1000));
  });

  host.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimer);
    hoverTimer = null;
    launchedThisHover = false;
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    flight.cleanupFlight();
  });

  host.addEventListener("click", (e) => {
    if (prefersReducedMotion || flight.inFlight) return;

    const hit = e.target?.closest?.(".lux-arrow");
    if (!hit) return;

    e.preventDefault();
    e.stopPropagation();

    clearTimeout(hoverTimer); hoverTimer = null;
    launchedThisHover = true;
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    autoHasRun = true;

    const lastArrow = getLastArrow();
    if (lastArrow) flight.launchLastArrow(lastArrow);
  });

  // ─── Auto-run once on init ────────────────────────────────────────────────

  if (!prefersReducedMotion && opts.autoRunOnce !== false && !autoHasRun) {
    const autoRunMs = Number.isFinite(opts.autoRunMs) ? opts.autoRunMs : 7000;

    autoTimer = window.setTimeout(() => {
      if (flight.inFlight) return;
      const lastArrow = getLastArrow();
      if (!lastArrow) return;
      autoHasRun = true;
      flight.launchLastArrow(lastArrow);
    }, autoRunMs);
  }
}