// features/progress/wordcloud/render/runner.js
// One-line: Wordcloud layout runner (fit-to-canvas, cache reuse, d3-cloud start, slow timer, libs-missing), extracted from render-canvas.js.

export function runWordCloudLayoutRunner({
  canvas,
  ctx,
  w,
  h,
  opts,
  words,
  layoutSig,
  PIN_BOOST,
  SIZE_MULT,
  painter,
  fireEnd,
  setSlowTimer,
}) {
  const d3 = window.d3;
  const cloudFactory = d3?.layout?.cloud || window.cloud;
  if (!cloudFactory) {
    ctx.font = "800 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "#334155";
    ctx.fillText("Word cloud library missing.", 20, 40);
    fireEnd("libs-missing");
    return;
  }

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
  setSlowTimer(
    setTimeout(() => {
      console.log("[wc] layout still running…");
    }, 2500)
  );

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
}
