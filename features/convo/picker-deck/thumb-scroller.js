// features/convo/picker-deck/thumb-scroller.js
// ONE-LINE: Adds a wrapper + left/right arrows around the thumbs strip and provides smooth 1-thumb stepping with infinite modulo wrap.

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
    left.disabled = false;
    right.disabled = false;
  }

  function scrollWrapped(delta) {
    const max = maxScroll();
    if (max <= 2) return;

    const cur = thumbs.scrollLeft;

    // Use a modulo wrap so it NEVER "sticks" even if delta > max
    const period = max + 1; // scrollLeft is effectively in [0..max]
    let target = cur + delta;

    target = ((target % period) + period) % period;

    thumbs.scrollTo({ left: target, behavior: "smooth" });
  }

  left.addEventListener("click", (e) => {
    e.preventDefault();
    const n = e.shiftKey ? 6 : 1;     // hold Shift to jump faster
    scrollWrapped(-stepPx(n));
  });

  right.addEventListener("click", (e) => {
    e.preventDefault();
    const n = e.shiftKey ? 6 : 1;
    scrollWrapped(stepPx(n));
  });

  thumbs.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();
  setTimeout(updateArrows, 0);
}