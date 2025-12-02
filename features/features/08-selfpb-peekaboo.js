// Self-Playback “Peekaboo” — top-left drawer mirroring TTS
(() => {
  const OPEN_CLASS = "lux-sp-open"; // toggled on <html>
  const PANEL_SEL = ".lux-sp-panel";
  const BODY_SEL = ".lux-sp-body";
  const HOST_ID = "selfpb-lite"; // created by self-playback-lite.js
  const CSS_HREF = "./features/features/selfpb-peekaboo.css";
  const GUARD_ID = "lux-sp-guard-style"; // hides #selfpb-lite until adopted

  // 0) Guard: keep the raw host hidden until we adopt it
  if (!document.getElementById(GUARD_ID)) {
    const s = document.createElement("style");
    s.id = GUARD_ID;
    s.textContent = `#${HOST_ID}{display:none !important;visibility:hidden !important;}`;
    document.head.appendChild(s);
  }

  // 1) Ensure CSS (once)
  (function ensureCSS() {
    const has = [...document.styleSheets].some((ss) =>
      (ss.href || "").includes("selfpb-peekaboo.css")
    );
    if (!has) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_HREF;
      link.addEventListener("error", () => link.remove(), { once: true });
      document.head.appendChild(link);
    }
  })();

  // 2) Build panel + tab (once)
  function buildOnce() {
    let panel = document.querySelector(PANEL_SEL);
    if (panel) return panel;

    panel = document.createElement("aside");
    panel.className = "lux-sp-panel";
    panel.setAttribute("role", "complementary");
    panel.setAttribute("aria-label", "Self Playback");

    // The “full-width” top tab. It can extend beyond the panel’s right edge.
    const tab = document.createElement("button");
    tab.className = "lux-sp-tab";
    tab.type = "button";
    tab.setAttribute("aria-controls", HOST_ID);
    tab.setAttribute("aria-expanded", "true");
    tab.innerHTML = `
      <span class="lux-sp-tab-label">Self Playback</span>
      <span class="lux-sp-tab-icon" aria-hidden="true">◀</span>
    `;
    tab.addEventListener("click", () => toggle());

    // Body wrapper: reserves space under the tab so controls never overlap it
    const body = document.createElement("div");
    body.className = "lux-sp-body";

    panel.append(tab, body);
    document.body.appendChild(panel);
    return panel;
  }

  // 3) Adopt the #selfpb-lite host into our panel body
  function adoptHost() {
    const host = document.getElementById(HOST_ID);
    if (!host) return false;

    const panel = buildOnce();
    const body = panel.querySelector(BODY_SEL);

    // Let the panel control geometry (strip fixed/inline positioning from the lite module)
    host.removeAttribute("style");
    host.dataset.luxHidden = "0";

    if (!body.contains(host)) body.appendChild(host);

    // Remove the guard so it becomes visible
    document.getElementById(GUARD_ID)?.remove();
    return true;
  }

  // 4) API helpers so you can control it from console if needed
  function open() {
    document.documentElement.classList.add(OPEN_CLASS);
    setAria(true);
  }
  function close() {
    document.documentElement.classList.remove(OPEN_CLASS);
    setAria(false);
  }
  function toggle() {
    const willOpen = !document.documentElement.classList.contains(OPEN_CLASS);
    document.documentElement.classList.toggle(OPEN_CLASS, willOpen);
    setAria(willOpen);
  }
  function setAria(openState) {
    const tab = document.querySelector(".lux-sp-tab");
    if (tab) tab.setAttribute("aria-expanded", String(openState));
  }

  // Expose a tiny control object for debugging
  window.luxSP = Object.assign(window.luxSP || {}, { open, close, toggle });

  // Start CLOSED by default
  close();

  // 5) Try to adopt now, otherwise wait for the lite module to create the host
  if (!adoptHost()) {
    const mo = new MutationObserver(() => {
      if (adoptHost()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
