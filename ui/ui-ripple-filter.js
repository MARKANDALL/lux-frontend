// ui/ui-ripple-filter.js
// SVG displacement ripple for any element with [data-lux-ripple]
// No external images. No GSAP.

const SVG_NS = "http://www.w3.org/2000/svg";

function ensureHiddenSvgHost() {
  let host = document.getElementById("luxRippleSvgHost");
  if (host) return host;

  host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("id", "luxRippleSvgHost");
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("focusable", "false");
  host.style.position = "absolute";
  host.style.width = "0";
  host.style.height = "0";
  host.style.overflow = "hidden";

  const defs = document.createElementNS(SVG_NS, "defs");
  host.appendChild(defs);

  document.body.prepend(host);
  return host;
}

function makeFilter(defs, id) {
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", id);
  filter.setAttribute("x", "-20%");
  filter.setAttribute("y", "-20%");
  filter.setAttribute("width", "140%");
  filter.setAttribute("height", "140%");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  // Built-in noise source (replaces feImage)
  const turb = document.createElementNS(SVG_NS, "feTurbulence");
  turb.setAttribute("type", "fractalNoise");
  turb.setAttribute("baseFrequency", "0.012 0.02");
  turb.setAttribute("numOctaves", "1");
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

  return { filter, turb, disp };
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function attachRipple(el) {
  const host = ensureHiddenSvgHost();
  const defs = host.querySelector("defs");

  const id = `luxRipple_${Math.random().toString(16).slice(2)}`;
  const { turb, disp } = makeFilter(defs, id);

  // Apply SVG filter to this element only
  el.style.filter = `url(#${id})`;

  let raf = 0;
  let animating = false;
  let start = 0;

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    animating = false;
    disp.setAttribute("scale", "0");
  }

  function play() {
    if (animating) return;
    animating = true;
    start = performance.now();

    const DURATION = 520;      // ms
    const PEAK = 18;           // max displacement scale
    const BF0 = 0.010;         // base frequency low
    const BF1 = 0.030;         // base frequency high

    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      const e = easeOutCubic(t);

      // Make a "pulse": up then down
      // sin(pi*t) gives 0->1->0
      const pulse = Math.sin(Math.PI * e);

      const scale = PEAK * pulse;
      disp.setAttribute("scale", scale.toFixed(2));

      // Slightly vary turbulence for a livelier ripple
      const bf = lerp(BF0, BF1, pulse);
      turb.setAttribute("baseFrequency", `${bf.toFixed(3)} ${(bf * 1.6).toFixed(3)}`);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        stop();
      }
    };

    raf = requestAnimationFrame(tick);
  }

  // Hover/focus triggers
  el.addEventListener("pointerenter", play);
  el.addEventListener("focus", play);

  // If you want it to stop immediately on leave/blur:
  el.addEventListener("pointerleave", () => {
    // let it finish naturally, or uncomment to snap off:
    // stop();
  });
  el.addEventListener("blur", () => {
    // stop();
  });
}

export function bootRippleButtons(root = document) {
  const els = Array.from(root.querySelectorAll("[data-lux-ripple]"));
  els.forEach(attachRipple);
}
