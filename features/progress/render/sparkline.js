// features/progress/render/sparkline.js
// Sparkline rendering + trend computation lives here.
// features/progress/render/sparkline.js

export function sparklineSvg(points = []) {
  const vals = points
    .map((p) => (p && p.avg != null ? p.avg : null))
    .filter((v) => v != null);

  if (!vals.length)
    return `<svg class="lux-spark" viewBox="0 0 120 34" preserveAspectRatio="none"></svg>`;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(1, max - min);

  const W = 120,
    H = 34;
  const step = W / Math.max(1, points.length - 1);

  const pts = points.map((p, i) => {
    const v = p.avg == null ? null : p.avg;
    const x = i * step;
    const y = v == null ? null : H - 4 - ((v - min) / span) * (H - 8);
    return { x, y };
  });

  // compress gaps by carrying last known y (keeps it readable)
  let lastY = H / 2;
  const path = pts
    .map((p) => {
      const y = p.y == null ? lastY : p.y;
      lastY = y;
      return `${p.x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return `
    <svg class="lux-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <polyline points="${path}" fill="none" stroke="rgba(15,23,42,0.55)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}
