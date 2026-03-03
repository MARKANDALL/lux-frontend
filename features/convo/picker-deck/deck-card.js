// features/convo/picker-deck/deck-card.js
// ONE-LINE: Builds and renders the active/preview deck card DOM (media layer, optional video lifecycle, text blocks, CTA wiring).

export function makeFillDeckCard({ el, applyMediaSizingVars, safeBeginScenario }) {
  return function fillDeckCard(host, scenario, isActive) {
    if (!host) return;

    // Hard reset (prevents duplicate media / handlers across re-renders)
    host.replaceChildren();
    host.onpointerenter = null;
    host.onpointerleave = null;

    // Always collapse when re-rendering a card
    host.dataset.expand = "0";

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
            } catch (err) { globalThis.warnSwallow("./features/convo/picker-deck/deck-card.js", err); }

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
              } catch (err) { globalThis.warnSwallow("./features/convo/picker-deck/deck-card.js", err); }
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
      el("div", "lux-deckTitle", scenario.title),
      el("div", "lux-deckDesc", scenario.desc || "")
    );

    // "more" content — break into bullet-style items for ESL readability
    const moreRaw =
      scenario.more ||
      "More details coming next: goals, moves, and what to listen for.";

    const moreWrap = el("div", "lux-deckMore");

    // Split on sentence boundaries (period + space, or end of string)
    const sentences = moreRaw
      .split(/(?<=\.)\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Group into chunks of ~2 sentences for readable bullet items
    const chunks = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join(" ");
      if (chunk) chunks.push(chunk);
    }

    chunks.forEach(chunk => {
      const item = el("div", "lux-deckMore-item");
      const bullet = el("div", "lux-deckMore-bullet");
      const text = el("div", "lux-deckMore-text", chunk);
      item.append(bullet, text);
      moreWrap.append(item);
    });

    textWrap.append(moreWrap);

    // CTA only on active card (keeps preview calm / non-interactive)
    if (isActive) {
      const ctaRow = el("div", "lux-deckCtaRow");

      // Guided CTA (existing behavior)
      const cta = el("button", "lux-deckCta", "Start Conversation");
      cta.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        safeBeginScenario();
      });

      ctaRow.append(cta);
      textWrap.append(ctaRow);

      host.dataset.expand = "0";
      host.onclick = () => {
        const cur = parseInt(host.dataset.expand || "0", 10);
        const next = (cur + 1) % 3;
        host.dataset.expand = String(next);

        // On reset to title-only, pulse the CTA after the collapse finishes
        if (next === 0) {
          cta.classList.remove("lux-cta-attn");
          void cta.offsetWidth; // force reflow so re-trigger works
          setTimeout(() => cta.classList.add("lux-cta-attn"), 1100);
        } else {
          cta.classList.remove("lux-cta-attn");
        }
      };
    } else {
      host.onclick = null;
    }

    host.append(textWrap);
  };
}