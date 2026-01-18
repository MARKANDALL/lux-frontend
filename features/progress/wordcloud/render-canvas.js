// features/progress/wordcloud/render-canvas.js
import { getColorConfig } from "../progress-utils.js";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
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
 *  - focusTest(idLower) => boolean  (search highlighting)
 *  - onSelect(hit)      => click handler override
 *  - clusterMode        => boolean  (optional clustering drift by score bands)
 */
export function renderWordCloudCanvas(canvas, items = [], opts = {}) {
  if (!canvas) return;

  const wrap = canvas.parentElement;
  const w = Math.max(320, wrap?.clientWidth || 800);
  const h = Math.max(280, wrap?.clientHeight || 460);

  // HiDPI crispness
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Clear
  ctx.clearRect(0, 0, w, h);
  if (!items.length) return;

  // Size scale based on frequency
  const counts = items.map((x) => Number(x.count || 0));
  const maxC = Math.max(1, ...counts);
  const minC = Math.min(...counts);

  const sizeForCount = (c) => {
    const t = (Number(c || 0) - minC) / Math.max(1, maxC - minC);
    const s = 16 + 44 * Math.sqrt(clamp(t, 0, 1));
    return clamp(s, 16, 62);
  };

  const words = items.map((x) => ({
    text: String(x.word ?? x.ipa ?? x.text ?? "").trim(),
    count: Number(x.count || 0),
    avg: Number.isFinite(Number(x.avg)) ? Number(x.avg) : 0,
    size: sizeForCount(x.count),
    meta: x,
  }));

  // d3-cloud attaches either to d3.layout.cloud or window.cloud depending on build
  const d3 = window.d3;
  const cloudFactory = d3?.layout?.cloud || window.cloud;
  if (!cloudFactory) {
    ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "#334155";
    ctx.fillText("Word cloud library missing.", 20, 40);
    return;
  }

  // Phase C state
  let placed = null; // layout words after cloud finishes
  let boxes = [];
  let hoverIdx = -1;
  let mouse = { x: 0, y: 0 };
  let ripple = null;
  let rafId = 0;

  // Fade-in thaw after redraw
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

    // Focus (search)
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

    // Fade alpha
    const tNow = performance.now();
    const fadeAlpha = clamp((tNow - fadeStart) / FADE_MS, 0, 1);

    // Ripple progress
    let rippleP = 0;
    let rippleAlive = false;
    if (ripple) {
      rippleP = clamp((tNow - ripple.t0) / ripple.dur, 0, 1);
      rippleAlive = rippleP < 1;
      if (!rippleAlive) ripple = null;
    }

    // draw words
    boxes = [];

    for (let i = 0; i < placed.length; i++) {
      const d = placed[i];
      const col = getColorConfig(d.avg).color;
      const glow = hexToRgba(col, 0.22);

      const id = idOfWord(d);
      const isMatch = focusActive && focusFn ? !!focusFn(id) : true;
      const isHover = i === hoverIdx;

      // Base opacity rule:
      // - If searching: non-matches dim (but hovered always pops)
      // - Otherwise: full
      let alpha = 1;
      if (focusActive) alpha = isMatch || isHover ? 1 : 0.16;

      // Fade-in thaw multiplier
      alpha *= fadeAlpha;

      // Magnetic pull (hover only)
      let pullX = 0;
      let pullY = 0;

      if (isHover) {
        const wx = cx + d.x;
        const wy = cy + d.y;
        const vx = mouse.x - wx;
        const vy = mouse.y - wy;
        const dist = Math.max(1, Math.hypot(vx, vy));

        // pull strength tapers with distance (max ~10px)
        const strength = 10 * (1 - clamp(dist / 180, 0, 1));
        pullX = (vx / dist) * strength;
        pullY = (vy / dist) * strength;
      }

      ctx.save();

      // Cluster drift (Phase D) — OFF by default
      let driftX = 0;
      let driftY = 0;

      if (opts?.clusterMode) {
        const avg = Number(d.avg || 0);
        const dx = w * 0.17; // cluster spread
        const dy = h * 0.06;

        if (avg >= 80) {
          // good (blue)
          driftX = -dx;
          driftY = -dy;
        } else if (avg >= 60) {
          // warn (orange)
          driftX = 0;
          driftY = dy * 1.2;
        } else {
          // needs work (red)
          driftX = dx;
          driftY = -dy;
        }

        // soften it so it stays cloud-like, not rigid
        driftX *= 0.65;
        driftY *= 0.65;
      }

      ctx.translate(cx + d.x + pullX + driftX, cy + d.y + pullY + driftY);
      ctx.rotate(0);

      const size = isHover ? d.size * 1.08 : d.size;

      ctx.font = `900 ${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Halo (subtle for all, stronger on hover)
      ctx.shadowColor = isHover ? glow : hexToRgba(col, 0.14);
      ctx.shadowBlur = isHover ? 18 : 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.fillText(d.text, 0, 0);

      // Hover pop stroke (premium crispness)
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

      // bbox (rough, but good enough with rotate=0)
      ctx.shadowBlur = 0;
      const tw = ctx.measureText(d.text).width;
      const th = size * 1.05;

      boxes.push({
        text: d.text,
        avg: d.avg,
        count: d.count,
        meta: d.meta,
        x: cx + d.x + pullX + driftX - tw / 2,
        y: cy + d.y + pullY + driftY - th / 2,
        w: tw,
        h: th,
        cx: cx + d.x + pullX + driftX,
        cy: cy + d.y + pullY + driftY,
        col,
      });

      ctx.restore();
    }

    // Ripple ring (click delight)
    if (ripple && ripple.idx != null && boxes[ripple.idx]) {
      const b = boxes[ripple.idx];
      const ease = 1 - Math.pow(1 - rippleP, 2);
      const r0 = 10;
      const r1 = 44;

      const rr = r0 + (r1 - r0) * ease;
      const a = 0.32 * (1 - rippleP);

      ctx.save();
      ctx.beginPath();
      ctx.arc(b.cx, b.cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(b.col || "#ffffff", a);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Keep animating until finished
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
    ripple = {
      idx,
      t0: performance.now(),
      dur: 520,
    };
    stopRAF();
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      paint();
    });
  }

  function layoutAndDraw(layoutWords) {
    placed = layoutWords;
    fadeStart = performance.now();
    hoverIdx = -1;
    ripple = null;
    paint();
  }

  cloudFactory()
    .size([w, h])
    .words(words)
    .padding(2)
    .rotate(() => 0)
    .font("system-ui")
    .fontSize((d) => d.size)
    .on("end", layoutAndDraw)
    .start();

  // Mouse interactions
  canvas.onmousemove = (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    mouse.x = mx;
    mouse.y = my;

    const idx = hitTest(mx, my);
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
      // magnetic pull updates as you move
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

    // ✅ call into page controller
    if (typeof opts?.onSelect === "function") {
      opts.onSelect(hit);
      return;
    }
  };
}
