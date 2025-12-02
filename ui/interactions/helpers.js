// ui/interactions/helpers.js
export function showClickHint(targetEl, msg) {
  if (!targetEl) return;
  const r = targetEl.getBoundingClientRect();
  const hint = document.createElement("div");
  hint.className = "hint-bubble";
  hint.textContent = msg || "Click";
  hint.style.left = r.left + r.width / 2 + "px";
  hint.style.top = r.top - 34 + "px";
  document.body.appendChild(hint);
  setTimeout(() => hint.remove(), 1400);
}

// placeholder kept for compatibility (no-op)
export function keepTooltipInView() {
  /* noop placeholder */
}
