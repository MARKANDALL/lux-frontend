// features/progress/wordcloud/render-canvas.js
import { getColorConfig } from "../progress-utils.js";
import { clamp, lower } from "./render/helpers.js";
import { createWordCloudPainter } from "./render/painter.js";

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

  // ✅ Fit-to-canvas helper (fill the square more)
  function fitToCanvas(layoutWords) {
    if (!layoutWords?.length) return layoutWords;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const d of layoutWords) {
      const base = (d._pinned ? d.size * PIN_BOOST : d.size) * SIZE_MULT;
      ctx.font = `${Math.max(8, Math.round(base))}px system-ui`;

      const m = ctx.measureText(d.text);
      const left = m.actualBoundingBoxLeft ?? m.width / 2;
      const right = m.actualBoundingBoxRight ?? m.width / 2;
      const ascent = m.actualBoundingBoxAscent ?? base * 0.55;
      const descent = m.actualBoundingBoxDescent ?? base * 0.45;

      minX = Math.min(minX, d.x - left);
      maxX = Math.max(maxX, d.x + right);
      minY = Math.min(minY, d.y - ascent);
      maxY = Math.max(maxY, d.y + descent);
    }

    const bw = maxX - minX;
    const bh = maxY - minY;
    if (!Number.isFinite(bw) || !Number.isFinite(bh) || bw < 20 || bh < 20)
      return layoutWords;

    const s = Math.min((w * 0.92) / bw, (h * 0.92) / bh);
    const cx0 = (minX + maxX) / 2;
    const cy0 = (minY + maxY) / 2;

    return layoutWords.map((d) => ({
      ...d,
      x: (d.x - cx0) * s,
      y: (d.y - cy0) * s,
      size: d.size * s,
    }));
  }

  const painter = createWordCloudPainter({
    canvas,
    ctx,
    w,
    h,
    opts,
    getColorConfig,
    SIZE_MULT,
    PIN_BOOST,
    PIN_CENTER,
  });

  function layoutAndDraw(layoutWords) {
    painter.setPlaced(fitToCanvas(layoutWords));

    // ✅ cache last layout so drawer reflow doesn't reshuffle
    canvas.__lux_wc_layout = {
      sig: layoutSig,
      w,
      h,
      placed: layoutWords.map((d) => ({ ...d })),
    };

    painter.setFadeStart(performance.now() - 220); // ✅ show immediately (no invisible first frame)
    painter.setHoverIdx(-1);
    painter.clearRipple();
    painter.paint();
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
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    painter.setMouse(mx, my);

    const idx = painter.hitTest(mx, my);
    const boxes = painter.getBoxes();
    const hit = idx >= 0 ? boxes[idx] : null;

    canvas.style.cursor = hit ? "pointer" : "default";
    canvas.title = hit
      ? `${hit.text} · ${Math.round(hit.avg)}% · seen ${hit.count}×`
      : "";

    if (idx !== painter.getHoverIdx()) {
      painter.setHoverIdx(idx);
      painter.stopRAF();
      painter.paint();
    } else if (painter.getHoverIdx() >= 0) {
      painter.stopRAF();
      painter.requestPaint();
    }
  };

  canvas.onmouseleave = () => {
    painter.setHoverIdx(-1);
    canvas.style.cursor = "default";
    canvas.title = "";
    painter.stopRAF();
    painter.paint();
  };

  canvas.onclick = (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    const idx = painter.hitTest(mx, my);
    if (idx < 0) return;

    painter.startRipple(idx);

    const boxes = painter.getBoxes();
    const hit = boxes[idx];
    if (!hit) return;

    if (typeof opts?.onSelect === "function") {
      opts.onSelect(hit);
    }
  };
}
