// features/progress/wordcloud/side-drawers.js
// ✅ Drawer wiring (safe localStorage + NO redraw/reload on toggle)

const KEY = "lux_wc_drawers_v1";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    if (!v || typeof v !== "object") return fallback;
    return v;
  } catch {
    return fallback;
  }
}

function updateTabIcon(el, side, open) {
  const tab = el.querySelector("[data-wc-drawer-toggle]");
  if (!tab) return;

  // Arrow shows the direction it will MOVE when clicked
  // left open → will move right (collapse) → ▶
  // left closed → will move left (expand) → ◀
  if (side === "left") tab.textContent = open ? "▶" : "◀";
  else tab.textContent = open ? "◀" : "▶";
}

export function wireWordcloudSideDrawers(root, { onLayoutChange } = {}) {
  const left = root.querySelector('[data-wc-drawer="left"]');
  const right = root.querySelector('[data-wc-drawer="right"]');

  if (!left || !right) {
    console.warn("[wc] missing drawers", { left: !!left, right: !!right });
    return;
  }

  const fallbackState = { leftOpen: true, rightOpen: true };
  const saved = safeParse(localStorage.getItem(KEY), fallbackState);

  let state = {
    leftOpen: !!saved.leftOpen,
    rightOpen: !!saved.rightOpen,
  };

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function setOpen(side, open, { silent = false } = {}) {
    const el = side === "left" ? left : right;

    el.classList.toggle("is-closed", !open);

    const tab = el.querySelector("[data-wc-drawer-toggle]");
    if (tab) tab.setAttribute("aria-expanded", open ? "true" : "false");

    updateTabIcon(el, side, open);

    if (side === "left") state.leftOpen = open;
    else state.rightOpen = open;

    persist();

    // ✅ CRITICAL FIX:
    // Drawer toggles are purely visual.
    // DO NOT call onLayoutChange() here.
    if (!silent) {
      try {
        root.dispatchEvent(
          new CustomEvent("wc:drawer-toggle", {
            detail: { side, open },
          })
        );
      } catch (_) {}
    }
  }

  // ✅ Init drawers (no spam, no double-redraw)
  setOpen("left", state.leftOpen, { silent: true });
  setOpen("right", state.rightOpen, { silent: true });

  // ✅ OPTIONAL: one layout call on init (safe)
  requestAnimationFrame(() => onLayoutChange?.());

  // Toggle clicks (NO redraw)
  root.querySelectorAll("[data-wc-drawer-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const side = btn.getAttribute("data-wc-drawer-toggle");
      if (!side) return;

      const el = side === "left" ? left : right;
      const openNow = !el.classList.contains("is-closed");

      setOpen(side, !openNow); // ✅ purely visual toggle
    });
  });
}
