// features/progress/wordcloud/render-canvas.js
import { getColorConfig } from "../progress-utils.js";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function idOfWord(d) {
  const meta = d?.meta || {};
  return String(meta.word ?? meta.ipa ?? d?.text ?? "").trim().toLowerCase();
}

/**
 * renderWordCloudCanvas(canvas, items, opts?)
 * opts:
 *  - focusTest(idLower) => boolean  (search highlighting)
 *  - onSelect(hit)      => click handler override
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

  // Track hitboxes for simple hover (rotation = 0 keeps it easy)
  const boxes = [];

  function draw(layoutWords) {
    boxes.length = 0;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Determine whether focus is active (search)
    const focusFn = typeof opts?.focusTest === "function" ? opts.focusTest : null;
    let focusActive = false;
    if (focusFn) {
      for (const d of layoutWords) {
        const id = idOfWord(d);
        if (id && focusFn(id)) {
          focusActive = true;
          break;
        }
      }
    }

    for (const d of layoutWords) {
      const col = getColorConfig(d.avg).color;

      const id = idOfWord(d);
      const isMatch = focusActive && focusFn ? !!focusFn(id) : true;

      ctx.save();
      ctx.translate(cx + d.x, cy + d.y);
      ctx.rotate(0);

      ctx.font = `900 ${d.size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Search focus: dim non-matches gently
      ctx.globalAlpha = focusActive ? (isMatch ? 1 : 0.16) : 1;

      // Soft shadow for readability
      ctx.shadowColor = "rgba(0,0,0,0.12)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = col;
      ctx.fillText(d.text, 0, 0);

      // If match, add a subtle crisp “pop”
      if (focusActive && isMatch) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.strokeText(d.text, 0, 0);
        ctx.fillStyle = col;
        ctx.fillText(d.text, 0, 0);
      }

      // bbox (rough, but works well with rotate=0)
      ctx.shadowBlur = 0;
      const tw = ctx.measureText(d.text).width;
      const th = d.size * 1.05;

      boxes.push({
        text: d.text,
        avg: d.avg,
        count: d.count,
        meta: d.meta,
        x: cx + d.x - tw / 2,
        y: cy + d.y - th / 2,
        w: tw,
        h: th,
      });

      ctx.restore();
    }
  }

  cloudFactory()
    .size([w, h])
    .words(words)
    .padding(2)
    .rotate(() => 0)
    .font("system-ui")
    .fontSize((d) => d.size)
    .on("end", draw)
    .start();

  canvas.onmousemove = (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    const hit = boxes.find(
      (b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h
    );

    canvas.style.cursor = hit ? "pointer" : "default";
    canvas.title = hit
      ? `${hit.text} · ${Math.round(hit.avg)}% · seen ${hit.count}×`
      : "";
  };

  canvas.onclick = (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    const hit = boxes.find(
      (b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h
    );

    if (!hit) return;

    // ✅ Phase B: allow page to override click handling
    if (typeof opts?.onSelect === "function") {
      opts.onSelect(hit);
      return;
    }

    // fallback: keep old behavior if not overridden
    alert(`${hit.text}\nAvg: ${Math.round(hit.avg)}%\nSeen: ${hit.count}×`);
  };
}
