// features/convo/scene-atmo.js

export function initSceneAtmo({ root, atmo, state }) {
  // --- Edge-style scene tiles (scatter + depth + independent drift) ---
  const sceneHost = atmo.querySelector(".lux-scene-cards");

  const SCENE_SPECS = [
    { cls: "c1", w: 420, h: 270, rot: -10, parX: 24, parY: 16, depth: 0.92 },
    { cls: "c2", w: 460, h: 290, rot: 9, parX: -26, parY: 18, depth: 0.86 },
    { cls: "c3", w: 520, h: 320, rot: 6, parX: 30, parY: -22, depth: 0.8 },
    { cls: "c4", w: 480, h: 300, rot: -6, parX: -24, parY: -18, depth: 0.74 },
    { cls: "c5", w: 380, h: 240, rot: -4, parX: 16, parY: -14, depth: 0.64 },
    { cls: "c6", w: 400, h: 250, rot: 5, parX: -18, parY: -14, depth: 0.58 },
    { cls: "c7", w: 360, h: 230, rot: 3, parX: 14, parY: 12, depth: 0.5 },
    { cls: "c8", w: 440, h: 280, rot: 7, parX: 22, parY: 16, depth: 0.70 },
  ];

  const sRand = (a, b) => a + Math.random() * (b - a);
  const sClamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sShuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  function mkRect(x, y, w, h) {
    return { x, y, w, h, x2: x + w, y2: y + h };
  }
  function rectIntersects(a, b, pad = 0) {
    return !(
      a.x2 + pad < b.x ||
      a.x - pad > b.x2 ||
      a.y2 + pad < b.y ||
      a.y - pad > b.y2
    );
  }
  function rectAreaIntersect(a, b) {
    const x = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x, b.x));
    const y = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y, b.y));
    return x * y;
  }

  function layoutSceneCards(force = false) {
    if (!sceneHost) return;
    if (state.mode !== "intro") return;

    // Don’t re-run constantly unless forced (resize / re-enter intro)
    if (!force && sceneHost.dataset.seeded === "1") return;
    sceneHost.dataset.seeded = "1";

    const hostRect = sceneHost.getBoundingClientRect();
    const W = hostRect.width;
    const H = hostRect.height;

    // Soft keep-out around the center hero card (Edge keeps background “around” it)
    const hero = root.querySelector(".lux-heroCard");
    const heroRect = hero?.getBoundingClientRect();
    const KEEP_PAD = 70;

    const keep = heroRect
      ? mkRect(
          heroRect.left - hostRect.left - KEEP_PAD,
          heroRect.top - hostRect.top - KEEP_PAD,
          heroRect.width + KEEP_PAD * 2,
          heroRect.height + KEEP_PAD * 2
        )
      : null;

    // Zones to avoid left/right poles and populate the center band
    const ZONES = sShuffle([
      { x0: 0.05, x1: 0.33, y0: 0.08, y1: 0.38 },
      { x0: 0.33, x1: 0.67, y0: 0.02, y1: 0.30 },
      { x0: 0.67, x1: 0.95, y0: 0.08, y1: 0.38 },

      { x0: 0.05, x1: 0.35, y0: 0.58, y1: 0.96 },
      { x0: 0.30, x1: 0.70, y0: 0.46, y1: 0.94 },
      { x0: 0.65, x1: 0.95, y0: 0.58, y1: 0.96 },
    ]);

    // Build placement list (big cards first)
    const items = [];

    for (const s of SCENE_SPECS) {
      const node = sceneHost.querySelector(`.lux-scene-card.${s.cls}`);
      if (!node) continue;
      items.push({ node, spec: s, kind: "main" });
    }

    const placed = [];
    const GAP = 120; // bigger gap => fewer crossings/overlaps

    // Place each item with rejection sampling, scoring collisions/keep-out
    items.forEach((it) => {
      const d = it.spec.depth;

      // depth mapping: keep depth via size + z + shadow only
      const scale = 0.78 + d * 0.3; // ~0.83..1.07
      const shadowA = 0.10 + d * 0.16; // ~0.13..0.26
      const z = Math.round(d * 100);

      const w = Math.round(it.spec.w * scale);
      const h = Math.round(it.spec.h * scale);

      // Parallax: far moves less, near moves more (but keep calm)
      const parScale = 0.6 + d * 0.55;
      const parX = Math.round(it.spec.parX * parScale);
      const parY = Math.round(it.spec.parY * parScale);

      // Drift: desynced
      const driftMag = sRand(16, 38);
      const driftX = Math.round(driftMag * sRand(0.7, 1.2));
      const driftY = Math.round(driftMag * sRand(0.6, 1.15));
      const driftR = sRand(1.4, 3.8).toFixed(2);

      const dur = sRand(12, 24).toFixed(2);
      const delay = (-sRand(0, 10)).toFixed(2); // negative = random phase immediately

      // Try to find a good placement
      let best = null;
      for (let t = 0; t < 220; t++) {
        const zc = ZONES[t % ZONES.length];
        const cx = sRand(W * zc.x0, W * zc.x1);
        const cy = sRand(H * zc.y0, H * zc.y1);

        const x = Math.round(cx - w / 2);
        const y = Math.round(cy - h / 2);

        const r = mkRect(x, y, w, h);

        let collisions = 0;
        let minDist = Infinity;

        for (const p of placed) {
          if (rectIntersects(r, p, GAP)) collisions++;
          const dx = r.x + r.w / 2 - (p.x + p.w / 2);
          const dy = r.y + r.h / 2 - (p.y + p.h / 2);
          const dist = Math.hypot(dx, dy);
          if (dist < minDist) minDist = dist;
        }

        const keepArea = keep ? rectAreaIntersect(r, keep) : 0;

        // Score: collisions are catastrophic, keep-out is heavy penalty, distance is a tiebreaker
        const score = collisions * 1e6 + keepArea * 40 - minDist;

        if (!best || score < best.score) best = { r, score };
        if (collisions === 0 && keepArea < 300) break; // good enough
      }

      const finalR = best ? best.r : mkRect(0, 0, w, h);
      placed.push(finalR);

      // Allow a little offscreen, but prevent the “only 2 visible” extreme.
      const OFF_X = 44;
      const OFF_Y = 34;

      finalR.x = sClamp(finalR.x, -OFF_X, W - w + OFF_X);
      finalR.y = sClamp(finalR.y, -OFF_Y, H - h + OFF_Y);

      // Commit CSS variables
      it.node.style.setProperty("--ax", `${finalR.x}px`);
      it.node.style.setProperty("--ay", `${finalR.y}px`);
      it.node.style.setProperty("--w", `${w}px`);
      it.node.style.setProperty("--h", `${h}px`);

      it.node.style.setProperty("--baseRot", `${it.spec.rot}deg`);
      it.node.style.setProperty("--parX", `${parX}px`);
      it.node.style.setProperty("--parY", `${parY}px`);

      it.node.style.setProperty("--driftX", `${driftX}px`);
      it.node.style.setProperty("--driftY", `${driftY}px`);
      it.node.style.setProperty("--driftR", `${driftR}deg`);
      it.node.style.setProperty("--driftDur", `${dur}s`);
      it.node.style.setProperty("--driftDelay", `${delay}s`);

      // keep shadow depth if you want:
      it.node.style.setProperty("--shadowA", shadowA.toFixed(3));

      // force these, even if old CSS still references them:
      it.node.style.setProperty("--alpha", "1");
      it.node.style.setProperty("--blur", "0px");

      it.node.style.setProperty("--s", "1"); // width/height already include scale
      it.node.style.setProperty("--z", String(z));
    });
  }

  // Resize: re-layout (intro only)
  let sceneResizeTimer = 0;
  window.addEventListener(
    "resize",
    () => {
      if (state.mode !== "intro") return;
      clearTimeout(sceneResizeTimer);
      sceneResizeTimer = setTimeout(() => layoutSceneCards(true), 120);
    },
    { passive: true }
  );

  // --- Scene visuals / parallax ---
  function applySceneVisuals() {
    const hue = (185 + state.scenarioIdx * 34) % 360;
    root.style.setProperty("--lux-hue", String(hue));
    root.dataset.side = state.scenarioIdx % 2 === 0 ? "left" : "right";
  }

  // --- Parallax driver (Edge-like: stage-relative + eased + recenters on leave) ---
  const par = { tx: 0, ty: 0, x: 0, y: 0, raf: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function parTick() {
    // Ease gives that “float / inertia” feel
    par.x += (par.tx - par.x) * 0.18;
    par.y += (par.ty - par.y) * 0.18;

    root.style.setProperty("--lux-mx", par.x.toFixed(4));
    root.style.setProperty("--lux-my", par.y.toFixed(4));

    const done = Math.abs(par.tx - par.x) < 0.001 && Math.abs(par.ty - par.y) < 0.001;
    if (done) {
      par.raf = 0;
      return;
    }
    par.raf = requestAnimationFrame(parTick);
  }
  function parKick() {
    if (!par.raf) par.raf = requestAnimationFrame(parTick);
  }

  function parSetFromEvent(e) {
    if (state.mode !== "intro" || root.dataset.parallax !== "on") return;

    const BOOST = 1.55; // more lively than the “restricted” version
    const MAX = 1.25; // still far from the old ±2 insanity

    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;

    par.tx = clamp(nx * BOOST, -MAX, MAX);
    par.ty = clamp(ny * BOOST, -MAX, MAX);

    parKick();
  }

  window.addEventListener("pointermove", parSetFromEvent, { passive: true });
  window.addEventListener("pointerdown", parSetFromEvent, { passive: true });

  window.addEventListener("blur", () => {
    par.tx = 0;
    par.ty = 0;
    parKick();
  });

  // When the pointer leaves the browser window, re-center
  window.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget && !e.toElement) {
      par.tx = 0;
      par.ty = 0;
      parKick();
    }
  });

  // ensure neutral at boot
  root.style.setProperty("--lux-mx", "0");
  root.style.setProperty("--lux-my", "0");

  function setParallaxEnabled(on) {
    root.dataset.parallax = on ? "on" : "off";

    if (!on) {
      par.tx = 0;
      par.ty = 0;
      par.x = 0;
      par.y = 0;
      par.raf = 0;
      root.style.setProperty("--lux-mx", "0");
      root.style.setProperty("--lux-my", "0");
    } else {
      layoutSceneCards(true); // <-- ADD THIS
    }
  }

  return { applySceneVisuals, setParallaxEnabled };
}
