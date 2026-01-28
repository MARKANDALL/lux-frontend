// features/convo/scene-atmo.js

export function initSceneAtmo({ root, atmo, state, scenarios = [] }) {
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
    { cls: "c8", w: 440, h: 280, rot: 7, parX: 22, parY: 16, depth: 0.7 },
    { cls: "c9", w: 360, h: 230, rot: -8, parX: -20, parY: 14, depth: 0.68 },
    { cls: "c10", w: 420, h: 260, rot: 10, parX: 18, parY: -12, depth: 0.54 },
    { cls: "c11", w: 340, h: 220, rot: -2, parX: -14, parY: -10, depth: 0.46 },
  ];

  // --- Scene image assignment (11 visible, rotate through full scenarios list) ---
  const sceneCards = SCENE_SPECS
    .map((spec) => sceneHost?.querySelector(`.lux-scene-card.${spec.cls}`))
    .filter(Boolean);

  const used = new Set(); // scenario indices currently shown
  let queue = [];
  let qi = 0;
  let rotTimer = 0;

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function refillQueue() {
    queue = Array.from({ length: scenarios.length }, (_, i) => i);
    shuffleInPlace(queue);
    qi = 0;
  }

  function nextScenarioIdx() {
    if (!scenarios?.length) return -1;
    if (!queue.length || qi >= queue.length) refillQueue();

    // pick the next index not currently used (avoid duplicates on screen)
    let safety = 0;
    while (safety++ < scenarios.length * 2) {
      if (qi >= queue.length) refillQueue();
      const idx = queue[qi++];
      if (!used.has(idx)) return idx;
    }
    // fallback (should be rare)
    return Math.floor(Math.random() * scenarios.length);
  }

  function setCardScenario(cardEl, scenarioIdx) {
    const s = scenarios?.[scenarioIdx];
    if (!s) return;

    // Prefer full-size image for crisp tiles
    const img = s.img || s.thumb;
    if (!img) return;

    cardEl.dataset.sceneIdx = String(scenarioIdx);
    cardEl.dataset.sceneId = s.id || "";
    cardEl.style.setProperty("--img", `url("${img}")`);
  }

  function seedSceneImagesOnce() {
    if (!sceneHost || !sceneCards.length || !scenarios?.length) return;
    if (sceneHost.dataset.imgSeeded === "1") return;

    sceneHost.dataset.imgSeeded = "1";
    used.clear();
    refillQueue();

    for (const card of sceneCards) {
      const idx = nextScenarioIdx();
      used.add(idx);
      setCardScenario(card, idx);
    }

    ensureRotation();
  }

  function ensureRotation() {
    if (rotTimer) return;
    if (!scenarios?.length || scenarios.length <= sceneCards.length) return;

    const ROTATE_MS = 3500;
    const FADE_MS = 500;

    rotTimer = window.setInterval(() => {
      if (state.mode !== "intro") return;

      // make sure we’ve seeded (intro can be entered after a hash route)
      seedSceneImagesOnce();

      const card = sceneCards[Math.floor(Math.random() * sceneCards.length)];
      if (!card) return;

      const oldIdx = parseInt(card.dataset.sceneIdx || "-1", 10);
      if (oldIdx >= 0) used.delete(oldIdx);

      const nextIdx = nextScenarioIdx();
      used.add(nextIdx);

      // fade out → swap → fade in
      card.classList.add("is-swap");
      window.setTimeout(() => setCardScenario(card, nextIdx), Math.floor(FADE_MS * 0.55));
      window.setTimeout(() => card.classList.remove("is-swap"), FADE_MS);
    }, ROTATE_MS);
  }

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
    seedSceneImagesOnce();

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
      { x0: 0.33, x1: 0.67, y0: 0.02, y1: 0.3 },
      { x0: 0.67, x1: 0.95, y0: 0.08, y1: 0.38 },

      { x0: 0.05, x1: 0.35, y0: 0.58, y1: 0.96 },
      { x0: 0.3, x1: 0.7, y0: 0.46, y1: 0.94 },
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
      const shadowA = 0.1 + d * 0.16; // ~0.13..0.26
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
