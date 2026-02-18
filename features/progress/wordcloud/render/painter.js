// features/progress/wordcloud/render/painter.js
// One-line: Wordcloud canvas paint engine (state + paint + hit test + ripple + RAF), extracted from render-canvas.js.

import { clamp, idOfWord, hexToRgba } from "./helpers.js";
import { scoreClass as scoreClassCore } from "../../../../core/scoring/index.js";

export function createWordCloudPainter({
  canvas,
  ctx,
  w,
  h,
  opts,
  getColorConfig,
  SIZE_MULT,
  PIN_BOOST,
  PIN_CENTER,
}) {
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

  function requestPaint() {
    stopRAF();
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      paint();
    });
  }

  function paint() {
    if (!placed?.length) return;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    const isDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

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

        const cls = scoreClassCore(avg);
        if (cls === "score-good") {
          driftX = -dx;
          driftY = -dy;
        } else if (cls === "score-warn") {
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

      const centerX = cx + d.x * pinMul + pullX + driftX;
      const centerY = cy + d.y * pinMul + pullY + driftY;

      ctx.translate(centerX, centerY);

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

      // ✅ stronger, more visible halo on hover
      ctx.shadowColor = isHover
        ? hexToRgba(col, isDark ? 0.42 : 0.34)
        : hexToRgba(col, isDark ? 0.18 : 0.14);

      ctx.shadowBlur = isHover ? (isDark ? 28 : 22) : 10;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.fillText(d.text, 0, 0);

      if (isHover) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = Math.max(alpha, 0.55);
        ctx.lineWidth = 3;

        ctx.strokeStyle = isDark
          ? "rgba(255,255,255,0.65)"
          : "rgba(15,23,42,0.70)";

        ctx.strokeText(d.text, 0, 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = col;
        ctx.fillText(d.text, 0, 0);
      }

      // bbox (tight) ✅ drastically reduces the “invisible halo” blocking clicks
      ctx.shadowBlur = 0;

      const m = ctx.measureText(d.text);
      const left = m.actualBoundingBoxLeft ?? m.width / 2;
      const right = m.actualBoundingBoxRight ?? m.width / 2;
      const ascent = m.actualBoundingBoxAscent ?? size * 0.55;
      const descent = m.actualBoundingBoxDescent ?? size * 0.45;

      const bw = left + right;
      const bh = ascent + descent;

      // tiny padding so it’s still easy to click (but not huge)
      const padPx = Math.max(1, Math.round(size * 0.045));

      boxes.push({
        text: d.text,
        avg: d.avg,
        count: d.count,
        meta: d.meta,

        x: centerX - left - padPx,
        y: centerY - ascent - padPx,
        w: bw + padPx * 2,
        h: bh + padPx * 2,

        cx: centerX,
        cy: centerY,
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
    // ✅ scan from topmost (last drawn) to bottom
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return i;
    }
    return -1;
  }

  function startRipple(idx) {
    ripple = { idx, t0: performance.now(), dur: 520 };
    requestPaint();
  }

  return {
    // state setters/getters used by orchestrator
    setPlaced(nextPlaced) {
      placed = nextPlaced;
    },
    getBoxes() {
      return boxes;
    },
    setHoverIdx(nextIdx) {
      hoverIdx = nextIdx;
    },
    getHoverIdx() {
      return hoverIdx;
    },
    setMouse(x, y) {
      mouse.x = x;
      mouse.y = y;
    },
    setFadeStart(t) {
      fadeStart = t;
    },
    clearRipple() {
      ripple = null;
    },
    stopRAF,
    paint,
    requestPaint,
    hitTest,
    startRipple,
  };
}
