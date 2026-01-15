// features/interactions/ph-hover/tooltip-carousel.js
// Tooltip panel carousel: Plain / Technical / Common mix-ups

export function initTooltipTextCarousel(globalTooltipEl, panels) {
  const title = globalTooltipEl?.querySelector("#lux-ph-modeTitle");
  const prev = globalTooltipEl?.querySelector("#lux-ph-panel-prev");
  const next = globalTooltipEl?.querySelector("#lux-ph-panel-next");
  const panelText = globalTooltipEl?.querySelector("#lux-ph-panelText");

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
