// features/convo/picker-deck.js
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

  function renderThumbs() {
    if (!thumbs) return;
    thumbs.innerHTML = "";
    list.forEach((s, i) => {
      const b = el("button", "lux-thumb" + (i === state.scenarioIdx ? " is-active" : ""));
      b.title = s.title;
      if (s.thumb) {
        b.classList.add("has-img");
        b.style.backgroundImage = `url("${s.thumb}")`;
        b.textContent = "";
      } else {
        b.textContent = (s.title || "?").trim().slice(0, 1).toUpperCase();
      }
      b.addEventListener("click", () => {
        state.scenarioIdx = i;
        renderDeck();
      });
      thumbs.append(b);
    });
  }

  function fillDeckCard(host, scenario, isActive) {
    if (!host) return;

    // Hard reset (prevents duplicate media / handlers across re-renders)
    host.replaceChildren();
    host.onpointerenter = null;
    host.onpointerleave = null;

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

    // --- your existing text content ---
    host.append(
      el("div", "lux-pill", "DIALOGUE"),
      el("div", "lux-deckTitle", scenario.title),
      el("div", "lux-deckDesc", scenario.desc || "")
    );

    // CTA only on active card (keeps preview calm / non-interactive)
    if (isActive) {
      const cta = el("button", "lux-deckCta", "Practice this dialogue");
      cta.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        safeBeginScenario();
      });
      host.append(cta);

      host.onclick = () => safeBeginScenario();
    } else {
      host.onclick = null;
    }
  }

  function renderDeck() {
    applySceneVisuals?.();

    if (!list.length) {
      renderThumbs();
      return;
    }

    const idx = state.scenarioIdx;
    const next = (idx + 1) % list.length;

    fillDeckCard(deckActive, list[idx], true);
    fillDeckCard(deckPreview, list[next], false);

    renderThumbs();
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
