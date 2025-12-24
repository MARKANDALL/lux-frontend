// helpers/dom.js
export function bringInputToTop(elOrSelector = "#referenceText", offset = 0) {
  const el =
    typeof elOrSelector === "string"
      ? document.querySelector(elOrSelector)
      : elOrSelector;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export function initUnderlineObserver(root = document) {
  const targets = root.querySelectorAll("h2, h3, strong");
  if (!targets.length || typeof IntersectionObserver !== "function") return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("underline-start"), 300);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  targets.forEach((el) => io.observe(el));
}

export function showClickHint(targetEl, msg, { delay = 1000 } = {}) {
  if (!targetEl || localStorage.getItem("seenClickHints")) return;
  const visibleMs = 7500,
    fadeMs = 400;
  setTimeout(() => targetEl.classList.add("pulse-once"), delay);

  const hint = document.createElement("div");
  hint.className = "hint-bubble";
  hint.textContent = msg;
  hint.style.opacity = "0";
  hint.style.transition = `opacity ${fadeMs}ms ease`;
  document.body.appendChild(hint);

  requestAnimationFrame(() => {
    const rect = targetEl.getBoundingClientRect();
    hint.style.left = rect.left + window.scrollX + 10 + "px";
    hint.style.top = rect.top + window.scrollY - hint.offsetHeight - 6 + "px";
  });

  setTimeout(() => (hint.style.opacity = "1"), delay);
  setTimeout(() => {
    hint.style.opacity = "0";
    setTimeout(() => {
      hint.remove();
      targetEl.classList.remove("pulse-once");
      localStorage.setItem("seenClickHints", "yes");
    }, fadeMs);
  }, delay + visibleMs);
}

/** Placeholder to avoid errors if somebody calls it. */
export function keepTooltipInView(_el, _padding = 8) {
  console.warn("keepTooltipInView placeholder triggered");
}