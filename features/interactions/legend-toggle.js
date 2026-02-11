/* =============================================================================
   FILE: features/interactions/legend-toggle.js
   ONE-LINE: Wires the “Key” button behavior (toggle prosody legend open/closed).
============================================================================= */

// ui/interactions/legend-toggle.js
// CLEANED: Removed dynamic CSS injection (now handled by lux-results.css)

export function initProsodyLegendToggle() {
  // Removed: installLegendCueStyles();

  const tip = document.getElementById("prosodyLegendToggle");
  const legend = document.getElementById("prosodyLegend");
  const wrap =
    (legend && legend.closest(".results-flex")) ||
    document.querySelector(".results-flex");

  if (!tip || !legend || !wrap) return;

  if (!legend._legendReady) {
    legend.classList.remove("hidden");
    legend.setAttribute("aria-hidden", "true");
    wrap.classList.remove("legend-open");

    // Keep accessibility state in sync even if markup changes.
    try {
      tip.setAttribute("aria-controls", "prosodyLegend");
      tip.setAttribute("aria-expanded", "false");
    } catch (_) {}

    legend._legendReady = 1;
  }

  let peek = document.getElementById("legendPeek");
  if (!peek) {
    peek = document.createElement("div");
    peek.id = "legendPeek";
    wrap.appendChild(peek);
  }

  function positionPeek() {
    if (!peek) return;
    const wrapRect = wrap.getBoundingClientRect();
    const table =
      wrap.querySelector("table.score-table") || wrap.querySelector("table");
    if (!table) return;

    const tableRect = table.getBoundingClientRect();
    const wordTh = table.querySelector("#wordHeader");
    let top = 44;
    if (wordTh) {
      const wh = wordTh.getBoundingClientRect();
      top = Math.max(0, wh.top - wrapRect.top + wh.height / 2 - 20);
    }
    const left = Math.max(
      0,
      tableRect.left - wrapRect.left - (peek.offsetWidth || 12) + 2
    );
    peek.style.left = left + "px";
    peek.style.top = top + "px";
  }

  const showPeek = () => {
    positionPeek();
    wrap.classList.add("show-peek");
  };
  const hidePeek = () => wrap.classList.remove("show-peek");

  if (!tip._legendBound) {
    const toggle = (e) => {
      try { e?.preventDefault?.(); e?.stopPropagation?.(); } catch (_) {}
      const open = !wrap.classList.contains("legend-open");
      wrap.classList.toggle("legend-open", open);
      legend.setAttribute("aria-hidden", String(!open));
      try { tip.setAttribute("aria-expanded", String(open)); } catch (_) {}
      if (open) {
        tip.classList.remove("cue-legend");
        try {
          localStorage.setItem("seenProsodyLegendCue", "1");
        } catch (_) {}
        hidePeek();
      } else {
        positionPeek();
        showPeek();
        setTimeout(hidePeek, 800);
      }
    };

    tip.addEventListener("pointerenter", showPeek);
    tip.addEventListener("mouseenter", showPeek);
    tip.addEventListener("focusin", showPeek);

    tip.addEventListener("pointerleave", hidePeek);
    tip.addEventListener("mouseleave", hidePeek);
    tip.addEventListener("focusout", hidePeek);

    tip.addEventListener("click", toggle);
    tip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") toggle(e);
    });

    tip._legendBound = 1;
  }

  if (!peek._legendBound) {
    peek.addEventListener("click", () => tip.click());
    peek._legendBound = 1;
  }

  try {
    if (!localStorage.getItem("seenProsodyLegendCue"))
      tip.classList.add("cue-legend");
  } catch (_) {}

  positionPeek();
  window.addEventListener("resize", positionPeek, { passive: true });
}
