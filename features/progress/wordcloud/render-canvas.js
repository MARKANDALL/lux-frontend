// features/progress/wordcloud/render-canvas.js
import { getColorConfig } from "../progress-utils.js";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function lower(s) {
  return String(s || "").trim().toLowerCase();
}

function idOfWord(d) {
  const meta = d?.meta || {};
  return String(meta.word ?? meta.ipa ?? d?.text ?? "").trim().toLowerCase();
}

function hexToRgba(hex = "#000000", a = 0.2) {
  const h = String(hex).replace("#", "").trim();
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * renderWordCloudCanvas(canvas, items, opts?)
 * opts:
 *  - focusTest(idLower) => boolean
 *  - onSelect(hit)
 *  - clusterMode: boolean
 *  - pinnedSet: Set<string lower>
 *  - onRenderEnd({ reason })
 *  - reuseLayoutOnly: boolean (✅ reflow-only repaint using cached layout)
 */
export function renderWordCloudCanvas(canvas, items = [], opts = {}) {
  if (!canvas) return;

  // ✅ Controller callback (overlay off signal)
  let _endFired = false;

  // If layout is slow, keep the overlay ON (no blank-screen confusion).
  // We'll just log once after ~2.5s instead of ending the render early.
  let slowTimer = 0;
  const clearSlowTimer = () => {
    if (slowTimer) {
      clearTimeout(slowTimer);
      slowTimer = 0;
    }
  };

  const fireEnd = (reason = "ok") => {
    if (_endFired) return;
    _endFired = true;
    clearSlowTimer();
    if (typeof opts?.onRenderEnd === "function") {
      try {
        opts.onRenderEnd({ reason });
      } catch (_) {}
    }
  };

  const wrap = canvas.parentElement;
  const w = Math.max(320, wrap?.clientWidth || 800);
  const h = Math.max(280, wrap?.clientHeight || 460);

  // HiDPI
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, w, h);
  if (!items.length) {
    fireEnd("empty");
    return;
  }

  const pinnedSet = opts?.pinnedSet instanceof Set ? opts.pinnedSet : new Set();

  const counts = items.map((x) => Number(x.count || 0));
  const maxC = Math.max(1, ...counts);
  const minC = Math.min(...counts);

  // ✅ Stronger contrast curve for font sizing
  const MIN_FONT = 16; // ✅ bigger tiny words
  const MAX_FONT = 118; // ✅ bigger big words
  const SPREAD_EXP = 1.35;

  const sizeForCount = (c) => {
    const t = (Number(c || 0) - minC) / Math.max(1, maxC - minC);
    const eased = Math.pow(clamp(t, 0, 1), SPREAD_EXP);
    const s = MIN_FONT + (MAX_FONT - MIN_FONT) * eased;
    return clamp(s, MIN_FONT, MAX_FONT);
  };

  const PIN_BOOST = 1.16; // pinned appear bigger
  const PIN_CENTER = 0.86; // pinned float toward center (cloud-like)

  const words = items.map((x) => {
    const text = String(x.word ?? x.ipa ?? x.text ?? "").trim();
    const id = lower(String(x.word ?? x.ipa ?? x.text ?? ""));
    const baseSize = sizeForCount(x.count);

    return {
      text,
      count: Number(x.count || 0),
      avg: Number.isFinite(Number(x.avg)) ? Number(x.avg) : 0,
      size: baseSize,
      meta: x,
      _id: id,
      _pinned: pinnedSet.has(id),
    };
  });

  // ✅ stable layout signature (prevents shuffle-reset on drawer reflow)
  const layoutSig = items.map((it) => it.id).join("\u001f");

  const d3 = window.d3;
  const cloudFactory = d3?.layout?.cloud || window.cloud;
  if (!cloudFactory) {
    ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "#334155";
    ctx.fillText("Word cloud library missing.", 20, 40);
    fireEnd("libs-missing");
    return;
  }

  // ✅ GLOBAL sizing boost (you want BIG + readable)
  const SIZE_MULT = 1.35;

  // Phase C state
  let placed = null;
  let boxes = [];
  let hoverIdx = -1;
  let mouse = { x: 0, y: 0 };
  let ripple = null;
  let rafId = 0;

  let fadeStart = performance.now();
  const FADE_MS = 220;

  function stopRAF() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function paint() {
    if (!placed?.length) return;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // search focus
    const focusFn = typeof opts?.focusTest === "function" ? opts.focusTest : null;
    let focusActive = false;
    if (focusFn) {
      for (const d of placed) {
        const id = idOfWord(d);
        if (id && focusFn(id)) {
          focusActive = true;
          break;
        }
      }
    }

    // fade thaw
    const tNow = performance.now();
    const fadeAlpha = clamp((tNow - fadeStart) / FADE_MS, 0, 1);

    // ripple progress
    let rippleP = 0;
    if (ripple) {
      rippleP = clamp((tNow - ripple.t0) / ripple.dur, 0, 1);
      if (rippleP >= 1) ripple = null;
    }

    boxes = [];

    for (let i = 0; i < placed.length; i++) {
      const d = placed[i];

      const col = getColorConfig(d.avg).color;
      const glow = hexToRgba(col, 0.22);

      const id = idOfWord(d);
      const isMatch = focusActive && focusFn ? !!focusFn(id) : true;

      const isHover = i === hoverIdx;
      const isPinned = !!d._pinned;

      let alpha = 1;
      if (focusActive) alpha = isMatch || isHover ? 1 : 0.16;
      alpha *= fadeAlpha;

      // magnetic pull
      let pullX = 0;
      let pullY = 0;
      if (isHover) {
        const wx = cx + d.x;
        const wy = cy + d.y;
        const vx = mouse.x - wx;
        const vy = mouse.y - wy;
        const dist = Math.max(1, Math.hypot(vx, vy));
        const strength = 10 * (1 - clamp(dist / 180, 0, 1));
        pullX = (vx / dist) * strength;
        pullY = (vy / dist) * strength;
      }

      // Phase D cluster drift (optional)
      let driftX = 0;
      let driftY = 0;

      if (opts?.clusterMode) {
        const avg = Number(d.avg || 0);
        const dx = w * 0.17;
        const dy = h * 0.06;

        if (avg >= 80) {
          driftX = -dx;
          driftY = -dy;
        } else if (avg >= 60) {
          driftX = 0;
          driftY = dy * 1.2;
        } else {
          driftX = dx;
          driftY = -dy;
        }

        driftX *= 0.65;
        driftY *= 0.65;
      }

      // Phase E pinned dominance: closer to center
      const pinMul = isPinned ? PIN_CENTER : 1;

      ctx.save();
      ctx.translate(
        cx + d.x * pinMul + pullX + driftX,
        cy + d.y * pinMul + pullY + driftY
      );

      const baseSize = d.size;
      const size =
        ((isPinned ? baseSize * PIN_BOOST : baseSize) * SIZE_MULT) *
        (isHover ? 1.08 : 1);

      ctx.font = `900 ${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // pinned halo ring behind text (subtle)
      if (isPinned) {
        ctx.globalAlpha = 0.22 * fadeAlpha;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(col, 0.10);
        ctx.fill();
      }

      ctx.shadowColor = isHover ? glow : hexToRgba(col, 0.14);
      ctx.shadowBlur = isHover ? 18 : 10;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.fillText(d.text, 0, 0);

      if (isHover) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = Math.max(alpha, 0.55);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.strokeText(d.text, 0, 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = col;
        ctx.fillText(d.text, 0, 0);
      }

      // bbox
      ctx.shadowBlur = 0;
      const tw = ctx.measureText(d.text).width;
      const th = size * 1.05;

      boxes.push({
        text: d.text,
        avg: d.avg,
        count: d.count,
        meta: d.meta,
        x: cx + d.x * pinMul + pullX + driftX - tw / 2,
        y: cy + d.y * pinMul + pullY + driftY - th / 2,
        w: tw,
        h: th,
        cx: cx + d.x * pinMul + pullX + driftX,
        cy: cy + d.y * pinMul + pullY + driftY,
        col,
      });

      ctx.restore();
    }

    // ripple ring
    if (ripple && ripple.idx != null && boxes[ripple.idx]) {
      const b = boxes[ripple.idx];
      const ease = 1 - Math.pow(1 - rippleP, 2);
      const rr = 10 + (44 - 10) * ease;
      const a = 0.32 * (1 - rippleP);

      ctx.save();
      ctx.beginPath();
      ctx.arc(b.cx, b.cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(b.col || "#ffffff", a);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          paint();
        });
      }
    }
  }

  function hitTest(mx, my) {
    return boxes.findIndex(
      (b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h
    );
  }

  function startRipple(idx) {
    ripple = { idx, t0: performance.now(), dur: 520 };
    stopRAF();
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      paint();
    });
  }

  function layoutAndDraw(layoutWords) {
    placed = layoutWords;

    // ✅ cache last layout so drawer reflow doesn't reshuffle
    canvas.__lux_wc_layout = {
      sig: layoutSig,
      w,
      h,
      placed: layoutWords.map((d) => ({ ...d })),
    };

    fadeStart = performance.now() - FADE_MS; // ✅ show immediately (no invisible first frame)
    hoverIdx = -1;
    ripple = null;
    paint();
    fireEnd("ok"); // ✅ IMPORTANT
  }

  // ✅ Cloud should occupy more space: reduce padding
  const pad = 1;

  // ✅ Drawer slide reflow: reuse existing placed words (no recompute)
  if (opts.reuseLayoutOnly) {
    const prev = canvas.__lux_wc_layout;
    if (prev && prev.placed && prev.sig === layoutSig) {
      const s = Math.min(w / prev.w, h / prev.h) || 1;

      const scaled = prev.placed.map((d) => ({
        ...d,
        x: d.x * s,
        y: d.y * s,
        size: d.size * s,
      }));

      layoutAndDraw(scaled);
      return;
    }
  }

  // If layout is slow, log once (but DO NOT hide overlay early).
  slowTimer = setTimeout(() => {
    console.log("[wc] layout still running…");
  }, 2500);

  try {
    cloudFactory()
      .size([w, h])
      .words(words)
      .padding(pad)
      .rotate(() => 0)
      .font("system-ui")
      .fontSize((d) =>
        (d._pinned ? d.size * PIN_BOOST : d.size) * SIZE_MULT
      )
      .on("end", layoutAndDraw)
      .start();
  } catch (err) {
    console.error("[wc] cloud start failed:", err);
    fireEnd("error");
  }

  canvas.onmousemove = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;

    const idx = hitTest(mouse.x, mouse.y);
    const hit = idx >= 0 ? boxes[idx] : null;

    canvas.style.cursor = hit ? "pointer" : "default";
    canvas.title = hit
      ? `${hit.text} · ${Math.round(hit.avg)}% · seen ${hit.count}×`
      : "";

    if (idx !== hoverIdx) {
      hoverIdx = idx;
      stopRAF();
      paint();
    } else if (hoverIdx >= 0) {
      stopRAF();
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        paint();
      });
    }
  };

  canvas.onmouseleave = () => {
    hoverIdx = -1;
    canvas.style.cursor = "default";
    canvas.title = "";
    stopRAF();
    paint();
  };

  canvas.onclick = (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    const idx = hitTest(mx, my);
    if (idx < 0) return;

    startRipple(idx);

    const hit = boxes[idx];
    if (!hit) return;

    if (typeof opts?.onSelect === "function") {
      opts.onSelect(hit);
    }
  };
}
