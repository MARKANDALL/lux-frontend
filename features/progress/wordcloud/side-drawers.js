// features/progress/wordcloud/side-drawers.js

const KEY = "lux_wc_drawers_v1";

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

export function wireWordcloudSideDrawers(root, { onLayoutChange } = {}) {
  const dock = root.querySelector("[data-wc-dock]");
  const left = root.querySelector('[data-wc-drawer="left"]');
  const right = root.querySelector('[data-wc-drawer="right"]');

  if (!dock || !left || !right) {
    console.warn("[wc] drawers: missing dock/left/right nodes");
    return;
  }

  const saved = safeParse(localStorage.getItem(KEY), { leftOpen: true, rightOpen: true });

  function applyCols() {
    const leftOpen = !left.classList.contains("is-closed");
    const rightOpen = !right.classList.contains("is-closed");

    dock.style.setProperty("--wc-left-col", leftOpen ? "260px" : "40px");
    dock.style.setProperty("--wc-right-col", rightOpen ? "260px" : "40px");
  }

  function persist() {
    const state = {
      leftOpen: !left.classList.contains("is-closed"),
      rightOpen: !right.classList.contains("is-closed"),
    };
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function setOpen(side, open) {
    const el = side === "left" ? left : right;
    el.classList.toggle("is-closed", !open);

    const tab = el.querySelector(".wcDrawerTab");
    if (tab) tab.setAttribute("aria-expanded", String(open));

    applyCols();
    persist();

    if (onLayoutChange) {
      requestAnimationFrame(() => onLayoutChange());
    }
  }

  // init
  setOpen("left", !!saved.leftOpen);
  setOpen("right", !!saved.rightOpen);

  // tab click wiring
  root.querySelectorAll("[data-wc-drawer-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const side = btn.getAttribute("data-wc-drawer-toggle");
      const el = side === "left" ? left : right;
      const openNow = !el.classList.contains("is-closed");
      setOpen(side, !openNow);
    });
  });

  // redraw after transitions end (smooth canvas resizing)
  root.addEventListener("transitionend", (e) => {
    if (e.target?.classList?.contains("wcDrawerPanel")) {
      onLayoutChange?.();
    }
  });
}
