// FILE: features/convo/picker-deck/thumb-scroller.js
// ONE-LINE: Adds a wrapper + left/right arrows around the thumbs strip and provides smooth infinite-loop stepping.

export function ensureThumbScroller(thumbs) {
  if (!thumbs) return;
  if (thumbs.closest(".lux-thumbsWrap")) return;

  const wrap = document.createElement("div");
  wrap.className = "lux-thumbsWrap";

  // Insert wrapper where thumbs currently sits
  const parent = thumbs.parentNode;
  if (!parent) return;
  parent.insertBefore(wrap, thumbs);
  wrap.appendChild(thumbs);

  // Arrows (overlay, not part of flex flow)
  const left = document.createElement("button");
  left.type = "button";
  left.className = "lux-thumbsArrow left";
  left.setAttribute("aria-label", "Scroll thumbnails left");
  left.textContent = "‹";

  const right = document.createElement("button");
  right.type = "button";
  right.className = "lux-thumbsArrow right";
  right.setAttribute("aria-label", "Scroll thumbnails right");
  right.textContent = "›";

  wrap.append(left, right);

  // Track intended scroll target so rapid clicks don't get confused
  // by in-flight smooth scroll animations.
  let _targetLeft = null;

  function stepPx(count = 1) {
    const first = thumbs.querySelector(".lux-thumb");
    const w = first ? first.getBoundingClientRect().width : 42;

    // try to read actual gap from CSS; fall back to 8
    const cs = window.getComputedStyle(thumbs);
    const gap =
      parseFloat(cs.columnGap) ||
      parseFloat(cs.gap) ||
      8;

    const one = Math.max(48, Math.round(w + gap));
    return one * Math.max(1, count);
  }

  function maxScroll() {
    return Math.max(0, thumbs.scrollWidth - thumbs.clientWidth);
  }

  function updateArrows() {
    const max = maxScroll();
    const scrollable = max > 2;
    left.style.display = scrollable ? "" : "none";
    right.style.display = scrollable ? "" : "none";
    // Arrows stay always enabled for infinite loop
    left.disabled = false;
    right.disabled = false;
  }

  function scrollLoop(dir, steps = 1) {
    const max = maxScroll();
    if (max <= 2) return;

    const delta = stepPx(steps);
    // Use the tracked target when a smooth scroll is still in-flight
    const cur = (_targetLeft != null) ? _targetLeft : thumbs.scrollLeft;

    let next;
    if (dir < 0) {
      next = cur - delta;
      if (next < 0) next = max; // wrap to end
    } else {
      next = cur + delta;
      if (next > max) next = 0; // wrap to start
    }

    _targetLeft = next;
    thumbs.scrollTo({ left: next, behavior: "smooth" });

    // Clear tracked target once the scroll settles
    clearTimeout(scrollLoop._tid);
    scrollLoop._tid = setTimeout(() => { _targetLeft = null; }, 400);
  }

  left.addEventListener("click", (e) => {
    e.preventDefault();
    const n = e.shiftKey ? 6 : 1;     // hold Shift to jump faster
    scrollLoop(-1, n);
  });

  right.addEventListener("click", (e) => {
    e.preventDefault();
    const n = e.shiftKey ? 6 : 1;
    scrollLoop(1, n);
  });

  thumbs.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();
  setTimeout(updateArrows, 0);
}
