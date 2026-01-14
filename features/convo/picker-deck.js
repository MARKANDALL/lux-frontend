// features/convo/picker-deck.js
import { mountKnobsDrawer, getKnobs, onKnobsChange, formatKnobsSummary } from "./knobs-drawer.js";

const knobsDrawer = mountKnobsDrawer();

export function wirePickerDeck({
  scenarios,
  state,
  thumbs,
  deckActive,
  deckPreview,
  backBtn,
  nextBtn,

  // helpers / deps
  el,
  applyMediaSizingVars,
  applySceneVisuals,

  // callback
  onBeginScenario,
}) {
  const list = Array.isArray(scenarios) ? scenarios : [];

  function safeBeginScenario() {
    try {
      const p = onBeginScenario?.();
      if (p && typeof p.catch === "function") p.catch(console.error);
    } catch (e) {
      console.error(e);
    }
  }

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
    const u = btn.dataset.thumb;
    if (!u || btn.dataset.thumbLoaded === "1") return;

    btn.style.backgroundImage = `url("${u}")`;
    btn.dataset.thumbLoaded = "1";
  }

  function hydrateThumbs(thumbsEl){
    if (!thumbsEl) return;

    if (_thumbIO) {
      _thumbIO.disconnect();
      _thumbIO = null;
    }

    const buttons = Array.from(thumbsEl.querySelectorAll(".lux-thumb[data-thumb]"));
    const FIRST = 8;

    // Fast initial fill (keeps UI feeling complete immediately)
    buttons.slice(0, FIRST).forEach(applyThumb);

    // Progressive fill for the rest (avoids competing with critical loads)
    const rest = buttons.slice(FIRST);

    const pump = () => {
      let i = 0;
      const tick = () => {
        // a couple at a time so we don't stampede the network
        for (let k = 0; k < 2 && i < rest.length; k++, i++) applyThumb(rest[i]);
        if (i < rest.length) setTimeout(tick, 120);
      };
      tick();
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(pump, { timeout: 800 });
    } else {
      setTimeout(pump, 250);
    }

    // Also load on demand if the strip is scrollable
    _thumbIO = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          applyThumb(e.target);
          _thumbIO.unobserve(e.target);
        }
      }
    }, { root: thumbsEl, rootMargin: "120px 0px", threshold: 0.01 });

    rest.forEach((b) => _thumbIO.observe(b));
  }

  function renderThumbs({ thumbs, list, selectedId, onPick }){
    if (!thumbs) return;

    thumbs.innerHTML = "";

    list.forEach((s, i) => {
      const isActive = i === state.scenarioIdx;
      const b = el("button", "lux-thumb" + (isActive ? " is-active" : ""));
      b.type = "button";
      b.title = s?.title || `Scenario ${i + 1}`;

      // accessibility + "active" marker
      b.setAttribute("aria-label", b.title);
      b.setAttribute("aria-current", isActive ? "true" : "false");

      const thumb = scenarioThumbUrl(s);
      if (thumb) {
        b.dataset.thumb = thumb;     // store only
        b.classList.add("has-img");
        b.textContent = "";
        // DO NOT set backgroundImage here
      } else {
        // fallback (keeps your “color dots” behavior if a scenario has no image)
        const hue = (i * 37) % 360;
        b.style.backgroundImage = `linear-gradient(135deg, hsl(${hue} 55% 70%), hsl(${(hue+18)%360} 55% 62%))`;
        b.textContent = (s?.title || "?").trim().slice(0, 1).toUpperCase();
      }

      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.scenarioIdx = i;
        renderDeck();
      });

      thumbs.append(b);
    });

    requestAnimationFrame(() => hydrateThumbs(thumbs));
  }

  function fillDeckCard(host, scenario, isActive) {
    if (!host) return;

    // Hard reset (prevents duplicate media / handlers across re-renders)
    host.replaceChildren();
    host.onpointerenter = null;
    host.onpointerleave = null;

    // Always collapse when re-rendering a card
    host.classList.remove("isExpanded");

    // image background (existing behavior)
    host.classList.toggle("has-img", !!scenario.img);
    if (scenario.img) host.style.setProperty("--lux-card-img", `url("${scenario.img}")`);
    else host.style.removeProperty("--lux-card-img");

    applyMediaSizingVars?.(host, scenario.img);

    // --- media layer (sits behind text) ---
    const media = el("div", "lux-cardMedia");
    host.append(media);

    // --- VIDEO RESOLUTION (zero-touch fallback) ---
    // If you later add scenario.video explicitly, it will win.
    const resolveVideoSrc = (s) => {
      if (s?.video) return s.video;
      const img = String(s?.img || "");
      const m = img.match(/\/convo-img\/([^\/?#]+)\.(webp|png|jpe?g)(?:[?#].*)?$/i);
      if (!m) return "";
      return `/convo-vid/${m[1].toLowerCase()}.mp4`;
    };

    // reset any prior video state
    host.classList.toggle("has-video", false);
    delete host.dataset.vstate;
    delete host.dataset.vtoken;

    // --- active-card video (optional) ---
    // Inactive/preview: NEVER mounts video.
    if (isActive) {
      const vsrc = resolveVideoSrc(scenario);

      if (vsrc) {
        host.classList.add("has-video");
        host.dataset.vstate = "idle";

        const v = document.createElement("video");
        v.className = "lux-cardVideo";
        v.src = vsrc;
        v.preload = "metadata";

        // autoplay-friendly + iOS/Safari friendliness
        v.muted = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.setAttribute("webkit-playsinline", "");

        media.append(v);

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Token prevents stale timeouts from starting an old card’s video
        const token = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        host.dataset.vtoken = token;

        if (!reduced) {
          // Start AFTER the deck transition settles (tune if needed)
          const SETTLE_MS = 560;

          setTimeout(() => {
            if (host.dataset.vtoken !== token) return;
            if (!document.body.contains(host)) return;

            host.dataset.vstate = "playing";
            try {
              v.currentTime = 0;
            } catch (_) {}

            const p = v.play();
            if (p && typeof p.catch === "function") {
              p.catch(() => {
                // autoplay/codec/path failure => fall back to still image
                if (host.dataset.vtoken !== token) return;
                host.dataset.vstate = "error";
              });
            }
          }, SETTLE_MS);

          v.addEventListener("error", () => {
            if (host.dataset.vtoken !== token) return;
            host.dataset.vstate = "error";
          });

          // When finished, fade video away (reveals still background)
          v.addEventListener("ended", () => {
            if (host.dataset.vtoken !== token) return;
            host.dataset.vstate = "ended";

            // Optional replay on hover (only after it ended)
            host.onpointerenter = () => {
              if (host.dataset.vtoken !== token) return;
              host.dataset.vstate = "playing";
              try {
                v.currentTime = 0;
              } catch (_) {}
              v.play().catch(() => {
                if (host.dataset.vtoken !== token) return;
                host.dataset.vstate = "error";
              });
            };
          });

          // If you EVER want looping instead of “play once then still”:
          // v.loop = true;
        }
      }
    }

    // --- your existing text content (now wrapped so we can style readability) ---
    const textWrap = el("div", "lux-deckText");

    textWrap.append(
      el("div", "lux-pill", "DIALOGUE"),
      el("div", "lux-deckTitle", scenario.title),
      el("div", "lux-deckDesc", scenario.desc || "")
    );

    // “more” content node (shown when expanded via CSS)
    const moreText =
      scenario.more ||
      "More details coming next: goals, moves, and what to listen for.";

    textWrap.append(el("div", "lux-deckMore", moreText));

    // CTA only on active card (keeps preview calm / non-interactive)
    if (isActive) {
      const cta = el("button", "lux-deckCta", "Practice this dialogue");
      cta.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        safeBeginScenario();
      });
      textWrap.append(cta);

      // NEW: Knobs row in picker card (active card only)
      const knobsRow = el("div", "lux-deckKnobsRow");

      const knobsBtn = el("button", "lux-deckKnobsBtn", "Knobs");
      knobsBtn.type = "button";
      knobsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();       // IMPORTANT: don't advance deck
        knobsDrawer.open();
      });

      const summary = el("div", "lux-deckKnobsSummary", formatKnobsSummary(getKnobs()));
      const unsub = onKnobsChange((k) => { summary.textContent = formatKnobsSummary(k); });

      // If you ever destroy/rebuild cards aggressively, you can call unsub() then.
      knobsRow.append(knobsBtn, summary);
      host.append(knobsRow);

      // Active card: click toggles expanded description (never advances, never begins)
      host.onclick = () => {
        host.classList.toggle("isExpanded");
      };
    } else {
      // Preview card: don't set onclick here (wirePickerDeck already has a click listener on deckPreview)
      host.onclick = null;
    }

    host.append(textWrap);
  }

  function renderDeck() {
    applySceneVisuals?.();

    if (!list.length) {
      renderThumbs({ thumbs, list, selectedId: null, onPick: () => {} });
      return;
    }

    const idx = state.scenarioIdx;
    const next = (idx + 1) % list.length;

    fillDeckCard(deckActive, list[idx], true);
    fillDeckCard(deckPreview, list[next], false);

    renderThumbs({
      thumbs,
      list,
      selectedId: list[idx]?.id,
      onPick: (id) => {
        const i = list.findIndex((s) => s?.id === id);
        if (i >= 0) {
          state.scenarioIdx = i;
          renderDeck();
        }
      }
    });
  }

  // --- wire controls (once) ---
  backBtn?.addEventListener("click", () => {
    if (!list.length) return;
    state.scenarioIdx = (state.scenarioIdx - 1 + list.length) % list.length;
    renderDeck();
  });

  nextBtn?.addEventListener("click", () => {
    if (!list.length) return;
    state.scenarioIdx = (state.scenarioIdx + 1) % list.length;
    renderDeck();
  });

  // Preview click behaves like Next (Edge feel)
  deckPreview?.addEventListener("click", () => {
    if (!list.length) return;
    state.scenarioIdx = (state.scenarioIdx + 1) % list.length;
    renderDeck();
  });

  return { renderDeck };
}
