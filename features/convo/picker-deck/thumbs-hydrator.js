// features/convo/picker-deck/thumbs-hydrator.js
// ONE-LINE: Provides per-instance thumb URL normalization + lazy/progressive thumbnail hydration (IntersectionObserver + idle pumping).

export function makeThumbHydrator() {
  // --- thumbs: lazy/progressive background-image hydration (prevents 24 immediate loads) ---
  let _thumbIO = null;

  function toThumbUrl(url){
    const s = String(url || "");
    if (!s) return "";
    if (s.includes("/convo-img/thumbs/")) return s;

    // Turn /convo-img/foo.(webp|png|jpg|jpeg) into /convo-img/thumbs/foo.webp
    const m = s.match(/\/convo-img\/([^\/?#]+)\.(webp|png|jpe?g)(?:[?#].*)?$/i);
    if (!m) return s;

    return `/convo-img/thumbs/${m[1]}.webp`;
  }

  function scenarioThumbUrl(s){
    const t =
      (s && (
        s.thumb ||
        s.thumbnail ||
        s.preview ||
        s.img ||
        s.image ||
        (s.media && (s.media.poster || s.media.thumb))
      )) || "";

    const raw =
      (typeof t === "string") ? t :
      (t && typeof t === "object") ? (t.url || t.src || "") :
      "";

    return toThumbUrl(raw);
  }

  function applyThumb(btn){
    if (!btn) return;
    const u = btn.dataset.thumbSrc;
    if (!u || btn.dataset.hydrated === "1") return;

    btn.style.backgroundImage = `url("${u}")`;
    btn.dataset.hydrated = "1";
  }

  function hydrateThumbButtons(container, { immediate = 8 } = {}) {
    if (!container) return () => {};

    // Kill any previous IO watcher to avoid leaks across re-renders
    if (_thumbIO) {
      _thumbIO.disconnect();
      _thumbIO = null;
    }

    const btns = Array.from(container.querySelectorAll(".lux-thumb[data-thumb-src]"));

    // Load the first N immediately (what you expected to see: ~8)
    btns.slice(0, immediate).forEach(applyThumb);

    // Then hydrate the rest gradually (doesn't dogpile the network)
    const rest = btns.slice(immediate);
    let i = 0;

    const pump = () => {
      const tick = () => {
        // a couple at a time so we don't stampede the network
        for (let k = 0; k < 2 && i < rest.length; k++, i++) applyThumb(rest[i]);
        if (i < rest.length) setTimeout(tick, 120);
      };
      tick();
    };

    // Prefer idle time if available
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(pump, { timeout: 800 });
    } else {
      setTimeout(pump, 250);
    }

    // Also load on demand if the strip is scrollable / off-screen thumbs
    _thumbIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          applyThumb(e.target);
          _thumbIO.unobserve(e.target);
        }
      }
    }, { root: container, rootMargin: "120px 0px", threshold: 0.01 });

    rest.forEach((b) => _thumbIO.observe(b));

    return () => {
      if (_thumbIO) {
        _thumbIO.disconnect();
        _thumbIO = null;
      }
    };
  }

  return { hydrateThumbButtons, scenarioThumbUrl };
}