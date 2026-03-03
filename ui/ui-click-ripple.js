// ui/ui-click-ripple.js  (v2)
// Click-origin liquid ripple that OVERFLOWS beyond the button edges.
// The ripple circle lives in a portal container positioned over the button
// so it isn't clipped by the button's own box.
//
// Also incorporates:
//  - mousedown trigger (fires before click, so the animation is visible
//    even if navigation/overlay happens fast)
//  - keyboard fallback (Enter/Space → ripple from center)
//  - rapid-click cleanup (max 3 concurrent circles)
//
// Usage:  import { attachClickRipple } from "../ui/ui-click-ripple.js";
//         attachClickRipple(myButton);

const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_CIRCLES = 3;

/* ── Shared hidden SVG host (one per page) ── */
function ensureSvgHost() {
  let host = document.getElementById("luxClickRippleSvgHost");
  if (host) return host;

  host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("id", "luxClickRippleSvgHost");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("focusable", "false");
  Object.assign(host.style, {
    position: "absolute",
    width: "0",
    height: "0",
    overflow: "hidden",
  });

  const defs = document.createElementNS(SVG_NS, "defs");
  host.appendChild(defs);
  document.body.prepend(host);
  return host;
}

/* ── Shared ripple portal (fixed overlay that holds all ripple circles) ── */
function ensureRipplePortal() {
  let portal = document.getElementById("luxRipplePortal");
  if (portal) return portal;

  portal = document.createElement("div");
  portal.id = "luxRipplePortal";
  Object.assign(portal.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "9998",
    overflow: "visible",
  });
  document.body.appendChild(portal);
  return portal;
}

/* ── Build one SVG displacement filter per element ── */
function makeFilter(defs, id) {
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("x", "-20%");
  filter.setAttribute("y", "-20%");
  filter.setAttribute("width", "140%");
  filter.setAttribute("height", "140%");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const turb = document.createElementNS(SVG_NS, "feTurbulence");
  turb.setAttribute("type", "fractalNoise");
  turb.setAttribute("baseFrequency", "0.015 0.025");
  turb.setAttribute("numOctaves", "2");
  turb.setAttribute("seed", String(Math.floor(Math.random() * 9999)));
  turb.setAttribute("result", "noise");

  const disp = document.createElementNS(SVG_NS, "feDisplacementMap");
  disp.setAttribute("in", "SourceGraphic");
  disp.setAttribute("in2", "noise");
  disp.setAttribute("scale", "0");
  disp.setAttribute("xChannelSelector", "R");
  disp.setAttribute("yChannelSelector", "G");
  disp.setAttribute("result", "displaced");

  filter.appendChild(turb);
  filter.appendChild(disp);
  defs.appendChild(filter);

  return { turb, disp };
}

/* ── Easing helpers ── */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ── Core: attach click-origin ripple to one element ── */
export function attachClickRipple(el) {
  // Do NOT set overflow:hidden — the ripple intentionally escapes the button.
  // We only need relative positioning for the SVG filter to anchor correctly.
  const pos = getComputedStyle(el).position;
  if (pos === "static" || pos === "") {
    el.style.position = "relative";
  }

  // SVG displacement filter (stays on the button itself for the wobble)
  const host = ensureSvgHost();
  const defs = host.querySelector("defs");
  const filterId = `luxClickRipple_${Math.random().toString(16).slice(2)}`;
  const { turb, disp } = makeFilter(defs, filterId);

  let raf = 0;
  const liveCircles = [];

  function spawnRipple(clientX, clientY) {
    const portal = ensureRipplePortal();
    const rect = el.getBoundingClientRect();

    // ── Determine origin (keyboard fallback → center of button) ──
    const hasCoords =
      typeof clientX === "number" &&
      typeof clientY === "number" &&
      (clientX !== 0 || clientY !== 0);

    const originX = hasCoords ? clientX : rect.left + rect.width / 2;
    const originY = hasCoords ? clientY : rect.top + rect.height / 2;

    // ── Size: big enough to visibly spill past the button edges ──
    // Ripple extends ~60px beyond the furthest button corner from click point
    const OVERSHOOT = 60;
    const maxCornerDist = Math.sqrt(
      Math.max(originX - rect.left, rect.right - originX) ** 2 +
      Math.max(originY - rect.top, rect.bottom - originY) ** 2
    );
    const radius = maxCornerDist + OVERSHOOT;
    const size = radius * 2;

    // ── Create the circle in the portal (fixed positioning, page coords) ──
    const circle = document.createElement("span");
    circle.className = "lux-click-ripple-circle";
    Object.assign(circle.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${originX - radius}px`,
      top: `${originY - radius}px`,
    });
    portal.appendChild(circle);

    // Track for rapid-click cleanup
    liveCircles.push(circle);
    if (liveCircles.length > MAX_CIRCLES) {
      const old = liveCircles.shift();
      old.remove();
    }

    circle.addEventListener("animationend", () => {
      circle.remove();
      const idx = liveCircles.indexOf(circle);
      if (idx !== -1) liveCircles.splice(idx, 1);
    });

    // ── SVG displacement pulse (liquid wobble on the button itself) ──
    if (raf) cancelAnimationFrame(raf);
    el.style.filter = `url(#${filterId})`;

    const start = performance.now();
    const DURATION = 620;
    const PEAK = 16;
    const BF0 = 0.012;
    const BF1 = 0.032;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      const e = easeOutCubic(t);
      const pulse = Math.sin(Math.PI * e);

      disp.setAttribute("scale", (PEAK * pulse).toFixed(2));
      const bf = lerp(BF0, BF1, pulse);
      turb.setAttribute("baseFrequency", `${bf.toFixed(4)} ${(bf * 1.6).toFixed(4)}`);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        disp.setAttribute("scale", "0");
        el.style.filter = "";
        raf = 0;
      }
    };

    raf = requestAnimationFrame(tick);
  }

  // ── Trigger on mousedown (fires before click → animation starts sooner) ──
  el.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    spawnRipple(e.clientX, e.clientY);
  });

  // ── Touch support ──
  el.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (t) spawnRipple(t.clientX, t.clientY);
  }, { passive: true });

  // ── Keyboard: Enter/Space fires click → ripple from center ──
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      spawnRipple(0, 0);
    }
  });
}