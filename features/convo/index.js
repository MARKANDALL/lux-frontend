// features/convo/index.js
import { SCENARIOS } from "./scenarios.js";
import { convoTurn } from "../../api/convo.js";
import { assessPronunciation } from "../../api/assess.js";
import { convoReport } from "../../api/convo-report.js";
import { saveAttempt, ensureUID } from "../../api/index.js";
import { warpSwap } from "../../ui/warp-core.js";

// --- Deck card sizing: make the CARD match the media's natural aspect ratio ---
const _luxMediaMeta = new Map();

function applyMediaSizingVars(host, imgSrc) {
  if (!host || !imgSrc) return;

  const cached = _luxMediaMeta.get(imgSrc);
  if (cached) {
    host.style.setProperty("--lux-media-ar", cached.ar);
    host.style.setProperty("--lux-media-h", cached.h);
    return;
  }

  const im = new Image();
  im.onload = () => {
    const ar = `${im.naturalWidth} / ${im.naturalHeight}`;
    const h  = `${im.naturalHeight}px`;
    _luxMediaMeta.set(imgSrc, { ar, h });

    host.style.setProperty("--lux-media-ar", ar);
    host.style.setProperty("--lux-media-h", h);
  };
  im.src = imgSrc;
}

function uid() {
  return ensureUID();
}

function newSessionId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showConvoReportOverlay(report) {
  let host = document.getElementById("luxConvoReportOverlay");
  const pretty = escapeHtml(JSON.stringify(report, null, 2));

  if (!host) {
    host = document.createElement("div");
    host.id = "luxConvoReportOverlay";
    host.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.45);
      display:flex; align-items:center; justify-content:center;
      padding: 18px;
    `;

    host.innerHTML = `
      <div style="
        width: min(980px, 96vw);
        max-height: min(80vh, 720px);
        overflow: auto;
        border-radius: 18px;
        background: rgba(20,20,30,0.92);
        border: 1px solid rgba(255,255,255,0.10);
        padding: 14px;
        backdrop-filter: blur(12px);
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 10px;">
          <div style="font-weight: 650;">
            Convo Report (pron: ${escapeHtml(String(report?.scores?.pron ?? "?"))})
          </div>
          <button id="luxConvoReportClose" style="
            background:#111827; color:#e5e7eb; border:1px solid rgba(255,255,255,0.10);
            border-radius:10px; padding:8px 10px; cursor:pointer;
          ">Close</button>
        </div>
        <pre id="luxConvoReportPre" style="
          white-space: pre-wrap;
          margin: 0;
          font-size: 12px;
          line-height: 1.35;
          color: rgba(255,255,255,0.88);
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px;
        ">${pretty}</pre>
      </div>
    `;

    host.querySelector("#luxConvoReportClose")?.addEventListener("click", () => host.remove());
  } else {
    host.querySelector("#luxConvoReportPre").textContent = JSON.stringify(report, null, 2);
  }

  document.body.appendChild(host);
}

export function bootConvo() {
  const root = document.getElementById("convoApp");
  if (!root) return;

  // Prevent duplicate listeners on hot reload
  if (root.dataset.luxBooted === "1") return;
  root.dataset.luxBooted = "1";

  const state = {
    sessionId: newSessionId(),
    scenarioIdx: 0,
    mode: "intro", // intro | picker | chat
    knobsOpen: false,
    knobs: { tone: "friendly", stress: "low", pace: "normal" },

    messages: [], // {role:"user"|"assistant", content:string}
    turns: [], // {turn, userText, azureResult, attemptId?}

    isRecording: false,
    stream: null,
    recorder: null,
    chunks: [],

    busy: false,
  };

  // --- Layout (single stage) ---
  root.innerHTML = "";
  root.dataset.mode = state.mode;
  root.dataset.side = "left";

  const atmo = el("div", "lux-atmo");
  atmo.innerHTML = `
    <div class="lux-atmo-layer a"></div>
    <div class="lux-atmo-layer b"></div>

    <div class="lux-scene-cards" aria-hidden="true">
      <div class="lux-scene-card c1"></div>
      <div class="lux-scene-card c2"></div>
      <div class="lux-scene-card c3"></div>
      <div class="lux-scene-card c4"></div>
      <div class="lux-scene-card c5"></div>
      <div class="lux-scene-card c6"></div>
      <div class="lux-scene-card c7"></div>
      <div class="lux-scene-card c8"></div>
    </div>

    <div class="lux-atmo-fog"></div>
  `;

  const ui = el("div", "lux-ui");

  // Intro overlay
  const intro = el("div", "lux-intro");
  const hero = el("div", "lux-heroCard");
  hero.append(
    el("div", "lux-heroBrand", "Lux"),
    el("div", "lux-heroTitle", "AI Conversations"),
    el(
      "div",
      "lux-heroSub",
      "Pick a dialogue. Record your reply. We assess each turn silently and give you a session report at the end."
    )
  );
  const heroNext = el("button", "lux-heroNext", "Next");
  hero.append(heroNext);
  intro.append(hero);

  // Picker overlay (Edge deck)
  const picker = el("div", "lux-picker");
  const deck = el("div", "lux-deck");
  const deckActive = el("div", "lux-deck-card is-active");
  const deckPreview = el("div", "lux-deck-card is-preview");
  deck.append(deckActive, deckPreview);

  const thumbs = el("div", "lux-thumbs");
  const nav = el("div", "lux-deckNav");
  const backBtn = el("button", "lux-navArrow", "← Back");
  const nextBtn = el("button", "lux-navNext", "Next →");
  nav.append(backBtn, nextBtn);
  picker.append(deck, thumbs, nav);

  // Chat panel (single centered)
  const chatWrap = el("div", "lux-chatwrap");
  const mid = el("div", "lux-panel lux-chat");

  const midHd = el("div", "lux-hd");
  const titleWrap = el("div");
  const title = el("div", "lux-title", "AI Conversation");
  const sub = el("div", "lux-sub", `Session: ${state.sessionId}`);
  titleWrap.append(title, sub);

  const actions = el("div", "lux-actions");
  const scenBtn = el("button", "btn ghost", "Scenarios");
  const knobsBtn = el("button", "btn ghost", "Knobs");
  const endBtn = el("button", "btn danger", "End Session");
  actions.append(scenBtn, knobsBtn, endBtn);

  midHd.append(titleWrap, actions);

  const msgs = el("div", "lux-msgs");
  const sugs = el("div", "lux-sugs");

  const compose = el("div", "lux-compose");
  const input = document.createElement("textarea");
  input.className = "lux-in";
  input.placeholder = "Type or click a suggestion, then record your reply…";

  const talkBtn = el("button", "btn primary", "🎙 Record");
  compose.append(input, talkBtn);

  mid.append(midHd, msgs, sugs, compose);
  chatWrap.append(mid);

  // Knobs drawer
  const drawer = el("div", "lux-drawer");
  const drawerHd = el("div", "lux-drawerHd");
  drawerHd.append(el("div", "lux-title", "Scene knobs"));
  const closeDrawer = el("button", "btn ghost", "Close");
  drawerHd.append(closeDrawer);

  const drawerBody = el("div", "lux-body k");
  const toneSel = mkSelect("Tone", ["friendly", "neutral", "playful", "formal", "flirty"]);
  const stressSel = mkSelect("Stress", ["low", "medium", "high"]);
  const paceSel = mkSelect("Pace", ["slow", "normal", "fast"]);
  drawerBody.append(toneSel.wrap, stressSel.wrap, paceSel.wrap);
  drawerBody.append(
    el(
      "div",
      "lux-sub",
      "Feedback stays hidden during the conversation. We log each spoken turn silently, then summarize at the end."
    )
  );

  drawer.append(drawerHd, drawerBody);

  const scrim = el("div", "lux-scrim");

  // Progress panel host (ONLY visible in chat mode via CSS)
  const convoProgress = el("div", "lux-convo-progress");
  convoProgress.id = "convoProgress";

  // IMPORTANT: append it *after* chatWrap, so it renders UNDER the chat box
  ui.append(intro, picker, chatWrap, convoProgress, drawer, scrim);
  root.append(atmo, ui);

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

  const VALID_MODES = new Set(["intro", "picker", "chat"]);

  function normalizeMode(m) {
    const s = (m ?? "").toString().replace(/^#/, "");
    return VALID_MODES.has(s) ? s : null;
  }

  function syncHistory(mode, push) {
    try {
      const url = `${location.pathname}${location.search}#${mode}`;
      const st = { luxConvo: 1, mode };
      if (push) history.pushState(st, "", url);
      else history.replaceState(st, "", url);
    } catch (_) {}
  }

  function render() {}

  function setMode(mode, opts = {}) {
    const changed = state.mode !== mode;

    state.mode = mode;
    root.dataset.mode = mode;

    // Used by lux-convo.css to gate drawers (TTS + SelfPB) until chat mode.
    document.documentElement.dataset.luxConvoMode = mode;

    // Parallax ONLY on intro screen.
    setParallaxEnabled(mode === "intro");

    // Keep knobs overlay from bleeding into intro/picker.
    if (mode !== "chat") setKnobs(false);

    // Browser back/forward steps: intro -> picker -> chat
    if (opts.replace) {
      syncHistory(mode, false);
    } else if (opts.push !== false && changed) {
      syncHistory(mode, true);
    }

    render();
  }

  function setKnobs(open) {
    state.knobsOpen = !!open;
    root.classList.toggle("knobs-open", state.knobsOpen);
  }

  function warpToPicker() {
    // intro -> picker gets the warp treatment
    if (state.mode !== "intro") return setMode("picker");
    warpSwap(() => setMode("picker"), { outMs: 200, inMs: 240 });
  }

  // Intro click => picker (Edge-like “push”)
  intro.addEventListener("click", warpToPicker);
  heroNext.addEventListener("click", (e) => {
    e.stopPropagation();
    warpToPicker();
  });

  // Chat header buttons
  scenBtn.addEventListener("click", () =>
    warpSwap(() => setMode("picker"), { outMs: 170, inMs: 220 })
  );
  knobsBtn.addEventListener("click", () => setKnobs(true));
  closeDrawer.addEventListener("click", () => setKnobs(false));
  scrim.addEventListener("click", () => setKnobs(false));

  // Knob wiring
  toneSel.sel.value = state.knobs.tone;
  stressSel.sel.value = state.knobs.stress;
  paceSel.sel.value = state.knobs.pace;

  toneSel.sel.addEventListener("change", () => (state.knobs.tone = toneSel.sel.value));
  stressSel.sel.addEventListener("change", () => (state.knobs.stress = stressSel.sel.value));
  paceSel.sel.addEventListener("change", () => (state.knobs.pace = paceSel.sel.value));

  // --- Picker deck ---
  function renderThumbs() {
    thumbs.innerHTML = "";
    SCENARIOS.forEach((s, i) => {
      const b = el("button", "lux-thumb" + (i === state.scenarioIdx ? " is-active" : ""));
      b.title = s.title;
      if (s.thumb) {
        b.classList.add("has-img");
        b.style.backgroundImage = `url("${s.thumb}")`;
        b.textContent = "";
      } else {
        b.textContent = (s.title || "?").trim().slice(0, 1).toUpperCase();
      }
      b.addEventListener("click", () => {
        state.scenarioIdx = i;
        renderDeck();
      });
      thumbs.append(b);
    });
  }

function fillDeckCard(host, scenario, isActive) {
  // Hard reset (prevents duplicate media / handlers across re-renders)
  host.replaceChildren();
  host.onpointerenter = null;
  host.onpointerleave = null;

  // image background (existing behavior)
  host.classList.toggle("has-img", !!scenario.img);
  if (scenario.img) host.style.setProperty("--lux-card-img", `url("${scenario.img}")`);
  else host.style.removeProperty("--lux-card-img");

  applyMediaSizingVars(host, scenario.img);

  // --- media layer (sits behind text) ---
  const media = el("div", "lux-cardMedia");
  host.append(media);

  // --- VIDEO RESOLUTION (zero-touch fallback) ---
  // If you later add scenario.video explicitly, it will win.
  const resolveVideoSrc = (s) => {
    if (s?.video) return s.video;
    const img = String(s?.img || "");
    const m = img.match(/\/convo-img\/([^\/?#]+)\.(webp|png|jpe?g)(?:[?#].*)?$/i);
    if (!m) return "";
    return `/convo-vid/${m[1].toLowerCase()}.mp4`;
  };

  // reset any prior video state
  host.classList.toggle("has-video", false);
  delete host.dataset.vstate;
  delete host.dataset.vtoken;

  // --- active-card video (optional) ---
  // Inactive/preview: NEVER mounts video.
  if (isActive) {
    const vsrc = resolveVideoSrc(scenario);

    if (vsrc) {
      host.classList.add("has-video");
      host.dataset.vstate = "idle";

      const v = document.createElement("video");
      v.className = "lux-cardVideo";
      v.src = vsrc;
      v.preload = "metadata";

      // autoplay-friendly + iOS/Safari friendliness
      v.muted = true;
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");

      media.append(v);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Token prevents stale timeouts from starting an old card’s video
      const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      host.dataset.vtoken = token;

      if (!reduced) {
        // Start AFTER the deck transition settles (tune if needed)
        const SETTLE_MS = 560;

        setTimeout(() => {
          if (host.dataset.vtoken !== token) return;
          if (!document.body.contains(host)) return;

          host.dataset.vstate = "playing";
          try { v.currentTime = 0; } catch (_) {}

          const p = v.play();
          if (p && typeof p.catch === "function") {
            p.catch(() => {
              // autoplay/codec/path failure => fall back to still image
              if (host.dataset.vtoken !== token) return;
              host.dataset.vstate = "error";
            });
          }
        }, SETTLE_MS);

        v.addEventListener("error", () => {
          if (host.dataset.vtoken !== token) return;
          host.dataset.vstate = "error";
        });

        // When finished, fade video away (reveals still background)
        v.addEventListener("ended", () => {
          if (host.dataset.vtoken !== token) return;
          host.dataset.vstate = "ended";

          // Optional replay on hover (only after it ended)
          host.onpointerenter = () => {
            if (host.dataset.vtoken !== token) return;
            host.dataset.vstate = "playing";
            try { v.currentTime = 0; } catch (_) {}
            v.play().catch(() => {
              if (host.dataset.vtoken !== token) return;
              host.dataset.vstate = "error";
            });
          };
        });

        // If you EVER want looping instead of “play once then still”:
        // v.loop = true;
      }
    }
  }

  // --- your existing text content ---
  host.append(
    el("div", "lux-pill", "DIALOGUE"),
    el("div", "lux-deckTitle", scenario.title),
    el("div", "lux-deckDesc", scenario.desc || "")
  );

  // CTA only on active card (keeps preview calm / non-interactive)
  if (isActive) {
    const cta = el("button", "lux-deckCta", "Practice this dialogue");
    cta.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await beginScenario();
    });
    host.append(cta);

    host.onclick = () => beginScenario().catch(console.error);
  } else {
    host.onclick = null;
  }
}


  async function beginScenario() {
    await warpSwap(() => setMode("chat"), { outMs: 200, inMs: 240 });
    await startScenario(); // fetch opening line + suggested replies
  }

  function renderDeck() {
    applySceneVisuals();
    const idx = state.scenarioIdx;
    const next = (idx + 1) % SCENARIOS.length;

    fillDeckCard(deckActive, SCENARIOS[idx], true);
    fillDeckCard(deckPreview, SCENARIOS[next], false);

    renderThumbs();
  }

  backBtn.addEventListener("click", () => {
    state.scenarioIdx = (state.scenarioIdx - 1 + SCENARIOS.length) % SCENARIOS.length;
    renderDeck();
  });

  nextBtn.addEventListener("click", () => {
    state.scenarioIdx = (state.scenarioIdx + 1) % SCENARIOS.length;
    renderDeck();
  });

  // Preview click behaves like Next (Edge feel)
  deckPreview.addEventListener("click", () => {
    state.scenarioIdx = (state.scenarioIdx + 1) % SCENARIOS.length;
    renderDeck();
  });

  // --- Chat rendering ---
  function renderMessages() {
    msgs.innerHTML = "";
    for (const m of state.messages) {
      const bubble = el("div", "msg " + (m.role === "user" ? "user" : "assistant"));
      bubble.textContent = m.content;
      msgs.append(bubble);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderSuggestions(list) {
    sugs.innerHTML = "";
    (list || []).forEach((t) => {
      const b = el("button", "sug", t);
      b.addEventListener("click", () => {
        input.value = t;
        input.focus();
      });
      sugs.append(b);
    });
  }

  async function startScenario() {
    // reset convo
    state.messages = [];
    state.turns = [];
    renderMessages();
    renderSuggestions([]);

    const s = SCENARIOS[state.scenarioIdx];

    // ask backend for opening line + suggestions
    const rsp = await convoTurn({
      scenario: { id: s.id, title: s.title, desc: s.desc },
      knobs: state.knobs,
      messages: [],
    });

    if (rsp?.assistant) state.messages.push({ role: "assistant", content: rsp.assistant });
    renderMessages();
    renderSuggestions(rsp?.suggested_replies || []);
  }

  // --- Recording helpers ---
  async function startRecording() {
    state.chunks = [];
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recorder = new MediaRecorder(state.stream);

    state.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.chunks.push(e.data);
    };

    state.recorder.start();
  }

  async function stopRecordingAndGetBlob() {
    return new Promise((resolve) => {
      if (!state.recorder) return resolve(null);

      const rec = state.recorder;
      rec.onstop = () => {
        try {
          state.stream?.getTracks()?.forEach((t) => t.stop());
        } catch (_) {}
        state.stream = null;

        const blob = new Blob(state.chunks, { type: rec.mimeType || "audio/webm" });
        state.chunks = [];
        state.recorder = null;
        resolve(blob);
      };

      rec.stop();
    });
  }

  // --- Turn send (assess -> attempt -> convoTurn) ---
  async function sendTurn({ audioBlob }) {
    const s = SCENARIOS[state.scenarioIdx];
    const userText = (input.value || "").trim();
    if (!userText) return;

    // Hand the finished learner audio to the Self Playback drawer (if present)
    if (audioBlob) {
      if (window.__attachLearnerBlob) window.__attachLearnerBlob(audioBlob);
    }

    // show user msg in chat immediately (natural flow)
    state.messages.push({ role: "user", content: userText });
    renderMessages();
    input.value = "";

    // Azure assessment (silent) - only if we actually have audio
    let azureResult = null;
    try {
      if (audioBlob && audioBlob.size > 0) {
        azureResult = await assessPronunciation({ audioBlob, text: userText });
      }
    } catch (e) {
      console.error("[Convo] assess failed", e);
    }

    // save attempt (always)
    try {
      const saved = await saveAttempt({
        uid: uid(),
        passageKey: `convo:${s.id}`,
        partIndex: state.turns.length,
        text: userText,
        azureResult,
        sessionId: state.sessionId,
        localTime: new Date().toISOString(),
      });
      state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: saved?.id });
    } catch (e) {
      console.error("[Convo] saveAttempt failed", e);
      state.turns.push({ turn: state.turns.length, userText, azureResult, attemptId: null });
    }

    // next AI response + suggestions
    const rsp = await convoTurn({
      scenario: { id: s.id, title: s.title, desc: s.desc },
      knobs: state.knobs,
      messages: state.messages.slice(-24),
    });

    if (rsp?.assistant) state.messages.push({ role: "assistant", content: rsp.assistant });
    renderMessages();
    renderSuggestions(rsp?.suggested_replies || []);
  }

  // --- Buttons ---
  talkBtn.addEventListener("click", async () => {
    if (state.busy) return;

    // If we're currently recording, STOP and SEND
    if (state.isRecording) {
      state.busy = true;
      talkBtn.disabled = true;
      try {
        const blob = await stopRecordingAndGetBlob();
        state.isRecording = false;
        root.classList.remove("is-recording");
        talkBtn.textContent = "🎙 Record";
        if (blob) await sendTurn({ audioBlob: blob });
      } finally {
        state.busy = false;
        talkBtn.disabled = false;
      }
      return;
    }

    // Not recording yet => start (only if input has text)
    const userText = (input.value || "").trim();
    if (!userText) return;

    state.busy = true;
    talkBtn.disabled = true;
    try {
      await startRecording();
      state.isRecording = true;
      root.classList.add("is-recording");
      talkBtn.textContent = "■ Stop & Send";
    } catch (e) {
      console.error("[Convo] start recording failed", e);
      alert(`Recording failed: ${e?.message || e}`);
    } finally {
      state.busy = false;
      talkBtn.disabled = false;
    }
  });

  endBtn.addEventListener("click", async () => {
    try {
      const s = SCENARIOS[state.scenarioIdx];
      const report = await convoReport({
        uid: uid(),
        sessionId: state.sessionId,
        passageKey: `convo:${s.id}`,
      });

      console.log("[Convo] convo-report result", report);
      showConvoReportOverlay(report);

      // Keep the old debug dump too (harmless + useful)
      let pre = document.getElementById("luxConvoReportDump");
      if (!pre) {
        pre = document.createElement("pre");
        pre.id = "luxConvoReportDump";
        pre.style.cssText = `
          position: fixed; left: 12px; bottom: 12px; z-index: 99998;
          max-width: min(520px, 92vw);
          max-height: min(320px, 38vh);
          overflow: auto;
          white-space: pre-wrap;
          background: rgba(0,0,0,0.55);
          color: #e5e7eb;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 10px;
          font-size: 11px;
        `;
        (document.getElementById("convoApp") || document.body).appendChild(pre);
      }
      pre.textContent = JSON.stringify(report, null, 2);
    } catch (e) {
      console.error("[Convo] convo-report failed", e);
      alert(`End Session report failed: ${e?.message || e}`);
    }
  });

  function mkSelect(label, options) {
    const wrap = el("div");
    const lab = el("label", null, label);
    const sel = document.createElement("select");
    options.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      sel.append(opt);
    });
    wrap.append(lab, sel);
    return { wrap, sel };
  }

  // boot
  applySceneVisuals();
  renderDeck();

  // Initial mode: hash (if present) wins, otherwise intro.
  const initialMode =
    normalizeMode(history.state?.luxConvo ? history.state.mode : location.hash) || "intro";

  setMode(initialMode, { replace: true, push: false });

  window.addEventListener("popstate", (e) => {
    const m = normalizeMode(e.state?.luxConvo ? e.state.mode : location.hash);
    if (!m) return;
    warpSwap(() => setMode(m, { push: false }), { outMs: 140, inMs: 200 });
  });
}
