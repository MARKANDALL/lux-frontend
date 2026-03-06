// features/convo/picker-deck/cefr-hint-badge.js
// ONE-LINE: CEFR hint badge that peeks/bobs on states 0–1, flies to the level chip on state 2 (max 2 flights per session), then subtle nudge only.

import { getKnobs } from "../knobs-drawer.js";

// ── Color map (mirrors knobs-drawer.js LEVEL_COLORS) ──

const LEVEL_COLORS = {
  A1: { bg: "rgba(248, 113, 113, 0.78)", text: "#fff" },
  A2: { bg: "rgba(220, 38, 38, 0.78)",   text: "#fff" },
  B1: { bg: "rgba(251, 191, 36, 0.78)",   text: "#78350f" },
  B2: { bg: "rgba(217, 119, 6, 0.78)",    text: "#fff" },
  C1: { bg: "rgba(96, 165, 250, 0.78)",   text: "#fff" },
  C2: { bg: "rgba(37, 99, 235, 0.78)",    text: "#fff" },
};

function getLevelStyle(lvl) {
  return LEVEL_COLORS[(lvl || "B1").toUpperCase()] || LEVEL_COLORS.B1;
}

// ── Helpers ──

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

const REDUCED = typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ── Session-scoped flight counter (resets on page reload) ──
// Shared across all card instances so the total is per-session, not per-card.
const MAX_FLIGHTS = 2;
let _sessionFlightCount = 0;

// ── Public API ──

/**
 * Mount the CEFR hint badge into a deck card's textWrap.
 * Returns a controller with { update(expandState), destroy() }.
 *
 * @param {HTMLElement} textWrap  — the .lux-deckText element
 * @param {HTMLElement} host      — the .lux-deck-card element
 */
export function mountCefrHintBadge(textWrap, host) {
  if (!textWrap || REDUCED) return { update() {}, destroy() {} };

  // ── Create the badge element ──
  const badge = document.createElement("span");
  badge.className = "lux-cefrBadge";
  badge.setAttribute("aria-hidden", "true");

  // Ensure textWrap can anchor absolutely-positioned children
  const twPos = getComputedStyle(textWrap).position;
  if (twPos === "static") textWrap.style.position = "relative";

  textWrap.appendChild(badge);

  // ── State tracking ──
  let peekTimer = null;
  let flyEl = null;
  let flyAnim = null;
  let destroyed = false;

  function currentLevel() {
    try { return (getKnobs().level || "B1").toUpperCase(); }
    catch { return "B1"; }
  }

  function paintBadge() {
    const lvl = currentLevel();
    const s = getLevelStyle(lvl);
    badge.textContent = lvl;
    badge.style.setProperty("--lux-cefrBadge-bg", s.bg);
    badge.style.setProperty("--lux-cefrBadge-text", s.text);
  }

  // ── Peek / bob / retract (states 0 and 1) ──

  function clearPeek() {
    if (peekTimer) { clearTimeout(peekTimer); peekTimer = null; }
    badge.classList.remove("is-peeking-s0", "is-peeking-s1", "is-nudge-s2");
  }

  function startPeek(expandState) {
    clearPeek();
    cleanupFlight();
    paintBadge();

    const cls = expandState === 0 ? "is-peeking-s0" : "is-peeking-s1";
    const delayMs = expandState === 0 ? 1800 : 1200;

    peekTimer = setTimeout(() => {
      if (destroyed) return;
      badge.classList.remove("is-peeking-s0", "is-peeking-s1", "is-nudge-s2");
      void badge.offsetWidth;
      badge.classList.add(cls);
    }, delayMs);
  }

  // ── Subtle nudge (state 2 after flight limit reached) ──

  function startNudge() {
    clearPeek();
    cleanupFlight();
    paintBadge();

    peekTimer = setTimeout(() => {
      if (destroyed) return;
      badge.classList.remove("is-peeking-s0", "is-peeking-s1", "is-nudge-s2");
      void badge.offsetWidth;
      badge.classList.add("is-nudge-s2");
    }, 600);
  }

  // ── Flight to knobs drawer (state 2) ──

  function cleanupFlight() {
    if (flyAnim) { try { flyAnim.cancel(); } catch (_) {} flyAnim = null; }
    if (flyEl && flyEl.parentNode) { flyEl.parentNode.removeChild(flyEl); flyEl = null; }
  }

  /**
   * Visibility check that also rejects elements pushed offscreen by transforms.
   * The knobs drawer when closed has transform: translateX(100%) which puts it
   * entirely off the right edge — getClientRects still returns entries for fixed
   * elements but the coordinates are beyond the viewport.
   */
  function isOnScreen(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return false;
    const cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    // Reject elements whose center is offscreen (drawer closed = translateX(100%))
    const cx = r.left + r.width / 2;
    if (cx > window.innerWidth + 20 || cx < -20) return false;
    return true;
  }

  /**
   * Find the best flight target. Cascade:
   *  1) Active level chip in the open knobs drawer
   *  2) Level group container in the open knobs drawer
   *  3) The knobs drawer element itself (only if actually on-screen / open)
   *  4) The "Scene Settings" button in the picker nav row
   *
   * BUG FIX: The old fallback #4 used selectors ".lux-pickerKnobs" and
   * "[data-picker-knobs]" but the actual button has classes
   * "btn ghost lux-pickerNavSide" with NO unique class or data attribute.
   * We now find it by scanning .lux-pickerNavRow buttons for text content.
   */
  function findLevelTarget() {
    const lvl = currentLevel();

    // 1) Try the chip-pill in the open knobs drawer
    const chip = document.querySelector(
      `#luxKnobsDrawer .lux-levelChip.is-on, ` +
      `#luxKnobsDrawer .lux-levelChip[data-value="${lvl}"]`
    );
    if (chip && isOnScreen(chip)) return chip;

    // 2) Try the level group header
    const group = document.querySelector('#luxKnobsDrawer .lux-knobsGroup[data-key="level"]');
    if (group && isOnScreen(group)) return group;

    // 3) Try the drawer itself — only if on-screen (open state)
    const drawer = document.getElementById("luxKnobsDrawer");
    if (drawer && isOnScreen(drawer)) return drawer;

    // 4) Scene Settings button — text-content scan (the reliable fallback)
    const navBtns = document.querySelectorAll(".lux-pickerNavRow button");
    for (const btn of navBtns) {
      if (btn.textContent.includes("Scene Settings") && isOnScreen(btn)) return btn;
    }

    // 5) Broader sweep: any .lux-pickerNavSide whose text mentions "Setting"
    const sides = document.querySelectorAll(".lux-pickerNavSide");
    for (const s of sides) {
      if (s.textContent.includes("Setting") && isOnScreen(s)) return s;
    }

    return null;
  }

  /**
   * Launch the flight with retry logic.
   * Uses rAF + short delay for layout to settle, then retries up to 2 more
   * times if no target is found (button may still be rendering/settling).
   */
  function launchFlightWithRetry() {
    clearPeek();
    cleanupFlight();
    paintBadge();

    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY = 250;

    function tryFlight() {
      if (destroyed) return;
      attempts++;

      requestAnimationFrame(() => {
        if (destroyed) return;
        const target = findLevelTarget();
        if (target) {
          _doFlight(target);
        } else if (attempts < MAX_ATTEMPTS) {
          setTimeout(tryFlight, RETRY_DELAY);
        }
        // All attempts exhausted → silently skip
      });
    }

    // Initial delay: let the card's state-2 expansion start
    setTimeout(tryFlight, 60);
  }

  function _doFlight(target) {
    // ── Start point: badge's current position ──
    const badgeRect = badge.getBoundingClientRect();
    if (badgeRect.width === 0) return;

    const startX = badgeRect.left + badgeRect.width / 2;
    const startY = badgeRect.top + badgeRect.height / 2;

    // ── End point: target element ──
    const tRect = target.getBoundingClientRect();
    const endX = tRect.left + tRect.width / 2;
    const endY = tRect.top + tRect.height / 2;

    // Sanity: skip if start and end are nearly the same spot
    if (Math.hypot(endX - startX, endY - startY) < 20) return;

    // Hide the static badge while the clone flies
    badge.style.opacity = "0";

    // ── Create flying clone ──
    flyEl = document.createElement("span");
    flyEl.className = "lux-cefrBadge-fly";
    flyEl.textContent = currentLevel();
    flyEl.style.setProperty("--lux-cefrBadge-bg", badge.style.getPropertyValue("--lux-cefrBadge-bg"));
    flyEl.style.setProperty("--lux-cefrBadge-text", badge.style.getPropertyValue("--lux-cefrBadge-text"));
    flyEl.style.left = `${startX}px`;
    flyEl.style.top = `${startY}px`;
    document.body.appendChild(flyEl);

    // ── Trajectory math (ported from ui-arrow-trail-fly.js) ──
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.max(1, Math.hypot(dx, dy));

    // Perpendicular unit vector for wobble
    const px = -dy / len;
    const py = dx / len;

    const amp = clamp(len * 0.10, 14, 48);

    // Per-launch randomness
    const rand = (min, max) => min + Math.random() * (max - min);
    const freq   = 1.8;
    const freqJ  = freq + rand(-0.3, 0.3);
    const ampJ   = amp * rand(0.85, 1.15);
    const phase  = rand(0, Math.PI * 2);
    const floatJ = rand(4, 10);
    const gust   = rand(0.9, 1.1);

    // Duration scales with distance, clamped
    const flyMs = clamp((800 + len * 0.9) * gust, 900, 2400);

    // Build keyframes (16 steps — same pattern as arrow-trail-fly)
    const steps = 16;
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const decay = 1 - t;

      const wobble = Math.sin(t * Math.PI * 2 * freqJ + phase) * ampJ * decay;
      const float  = Math.cos(t * Math.PI * 2 * freqJ * 0.8 + phase * 0.6) * floatJ * decay;

      const x = dx * t + px * wobble;
      const y = dy * t + py * wobble + float;

      const sc = 1.0 - 0.25 * t;

      frames.push({
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${sc})`,
        opacity: String(0.85 - 0.15 * t),
      });
    }

    flyAnim = flyEl.animate(frames, {
      duration: flyMs,
      easing: "ease-in-out",
      fill: "forwards",
    });

    flyAnim.onfinish = () => {
      if (!flyEl) return;

      // Landing pop
      const pop = document.createElement("div");
      pop.className = "lux-cefrBadge-pop";
      pop.style.left = `${endX}px`;
      pop.style.top = `${endY}px`;
      document.body.appendChild(pop);

      // Fade out the flying badge
      flyEl.animate(
        [{ opacity: "0.80" }, { opacity: "0" }],
        { duration: 240, easing: "ease-out", fill: "forwards" }
      );

      setTimeout(() => {
        if (pop.parentNode) pop.parentNode.removeChild(pop);
        cleanupFlight();
      }, 500);
    };

    // ── Increment session counter ──
    _sessionFlightCount++;
  }

  // ── Public: call on every expand-state change ──

  function update(expandState) {
    if (destroyed) return;

    if (expandState === 0 || expandState === 1) {
      startPeek(expandState);
    } else if (expandState === 2) {
      if (_sessionFlightCount < MAX_FLIGHTS) {
        launchFlightWithRetry();
      } else {
        startNudge();
      }
    }
  }

  function destroy() {
    destroyed = true;
    clearPeek();
    cleanupFlight();
    if (badge.parentNode) badge.parentNode.removeChild(badge);
  }

  // ── Listen for knobs changes (level might change while badge is mounted) ──
  function onKnobsEvt() { paintBadge(); }
  window.addEventListener("lux:knobs", onKnobsEvt);

  const origDestroy = destroy;
  const wrappedDestroy = () => {
    window.removeEventListener("lux:knobs", onKnobsEvt);
    origDestroy();
  };

  // ── Initial paint ──
  paintBadge();

  // ── Kick off initial peek after mount (state 0) ──
  startPeek(0);

  return { update, destroy: wrappedDestroy };
}