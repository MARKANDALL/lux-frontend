// features/interactions/ph-hover/tooltip-carousel.js
// Tooltip panel carousel: Plain / Technical / Common mix-ups

export function initTooltipTextCarousel(rootEl, panels, { prefix = "lux-ph-" } = {}) {
  const title = rootEl?.querySelector(`#${prefix}modeTitle`);
  const prev = rootEl?.querySelector(`#${prefix}panel-prev`);
  const next = rootEl?.querySelector(`#${prefix}panel-next`);
  const panelText = rootEl?.querySelector(`#${prefix}panelText`);

  if (!title || !prev || !next || !panelText) return;

  const max = panels.length;
  let idx = 0;

  function render() {
    title.textContent = panels[idx]?.title || "";

    const has = (panels[idx]?.text || "").trim().length > 0;
    const t = has ? panels[idx].text : panels[idx].empty;

    panelText.textContent = t;
    panelText.classList.toggle("is-empty", !has);

    const disabled = max <= 1;
    prev.disabled = disabled;
    next.disabled = disabled;
  }

  function step(delta) {
    if (max <= 1) return;
    idx = (idx + delta + max) % max;
    render();
  }

  prev.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    step(-1);
  };

  next.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    step(1);
  };

  render();
}
