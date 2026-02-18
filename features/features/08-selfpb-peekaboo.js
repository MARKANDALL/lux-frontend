// C:\dev\LUX_GEMINI\features\features\08-selfpb-peekaboo.js
// LAZY LOADER: Creates the tab immediately, but loads the heavy UI/WaveSurfer only on click.
import "./selfpb-peekaboo.css";

(() => {
  const OPEN_CLASS = "lux-sp-open";
  const PANEL_SEL = ".lux-sp-panel";
  const BODY_SEL = ".lux-sp-body";
  const HOST_ID = "selfpb-lite";
  const INNER_CSS_HREF = new URL("./self-playback.css", import.meta.url).href;
  const INNER_CSS_ID = "lux-selfpb-inner-css";

  let isLoaded = false;
  let isLoading = false;

  // 1) Panel CSS is imported above (no runtime injection needed).

  // 2) Build Panel Shell + Tab (Runs immediately)
  function buildShell() {
    if (document.querySelector(PANEL_SEL)) return;

    const panel = document.createElement("aside");
    panel.className = "lux-sp-panel";
    panel.setAttribute("role", "complementary");
    panel.setAttribute("aria-label", "Self Playback");

    panel.innerHTML = `
      <button class="lux-sp-tab" type="button" aria-expanded="false" aria-controls="${HOST_ID}">
        <span class="lux-sp-tab-inner">
          <span class="lux-sp-tab-label">Self Playback</span>
          <span class="lux-sp-tab-icon">◀</span>
        </span>
      </button>
      <div class="lux-sp-body">
        <div id="sp-loading-placeholder" style="padding:20px; text-align:center; color:#666; display:none;">
           Loading Waveforms... 🌊
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // FAILSAFE DOCK: If CSS fails (or is overridden by device emulation / viewport rules),
    // keep the SelfPB tab reachable and positioned like a LEFT-edge peekaboo.
    // (CSS can still override these if it loads and applies.)
    try {
      panel.style.position = panel.style.position || "fixed";
      panel.style.left = panel.style.left || "0";
      panel.style.right = panel.style.right || "auto";
      panel.style.top = panel.style.top || "10px";      
panel.style.zIndex = panel.style.zIndex || "900";
      panel.style.pointerEvents = panel.style.pointerEvents || "auto";
    } catch {}

    // Wire the click to the Lazy Loader
    const tab = panel.querySelector(".lux-sp-tab");
    tab.addEventListener("click", handleToggle);

    // If CSS didn't style the tab, it can look like a default HTML button.
    // Give it a tiny baseline so it still looks intentional.
    try {
      tab.style.cursor = tab.style.cursor || "pointer";
      tab.style.whiteSpace = tab.style.whiteSpace || "nowrap";
    } catch {}

    // Closed panel/card click opens (never closes).
    // NOTE: We ignore clicks on the tab here only to prevent a double-trigger
    // (panel click + tab click) which would instantly open then close.
    if (!panel.dataset.luxStubClickBound) {
      panel.dataset.luxStubClickBound = "1";
      panel.addEventListener("click", (e) => {
        if (document.documentElement.classList.contains(OPEN_CLASS)) return;
        if (e && e.target && e.target.closest && e.target.closest(".lux-sp-tab")) return;
        try { handleToggle(); } catch {}
      });
    }
  }

  // 3) The Lazy Load Handler
  async function handleToggle() {
    const panel = document.querySelector(PANEL_SEL);
    const tab = panel.querySelector(".lux-sp-tab");
    const loader = document.getElementById("sp-loading-placeholder");

    // If already open, just close it
    if (document.documentElement.classList.contains(OPEN_CLASS)) {
      close();
      return;
    }

    // If not loaded yet, load the heavy stuff
    if (!isLoaded) {
      if (isLoading) return; // Prevent double-clicks
      isLoading = true;

      // Show spinner
      if (loader) loader.style.display = "block";
      tab.style.opacity = "0.7";

      try {
        console.log("[Lux] Lazy-loading Self Playback...");

        // ✅ 1) Ensure inner controls CSS only when opened (FIXED PATH)
        (function ensureInnerCSS() {
          if (document.getElementById(INNER_CSS_ID)) return;
          const has = [...document.styleSheets].some((ss) => (ss.href || "").includes("self-playback"));
          if (!has) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = INNER_CSS_HREF;
            link.id = INNER_CSS_ID;
            document.head.appendChild(link);
          }
        })();

        // ✅ 2) Lazy-load WaveSurfer ONLY now (FIXED PATH)
        await (async function ensureWaveSurfer() {
          const has = [...document.scripts].some((s) =>
            (s.src || "").includes("wavesurfer-7.8.11.min.js")
          );
          if (has) return;

          const src = "/vendor/wavesurfer-7.8.11.min.js";

          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        })();

        // ✅ 3) Now import the heavy UI
const module = await import("./selfpb/ui.js");

        // Mount the heavy UI
        if (module && module.mountSelfPlaybackLite) {
          module.mountSelfPlaybackLite();
        }

        // Move the new host into our panel
        const host = document.getElementById(HOST_ID);
        const body = panel.querySelector(BODY_SEL);

        if (host && body) {
          host.removeAttribute("style"); // Remove fixed positioning from the lite module
          host.dataset.luxHidden = "0";

          // Ensure we don't duplicate if something weird happened
          if (!body.contains(host)) {
            body.appendChild(host);
          }
        }

        // Hydrate audio if recording already happened (nudge the waveform)
        const audioEl = document.getElementById("playbackAudio");
        if (audioEl && audioEl.src) {
          audioEl.dispatchEvent(new Event("loadedmetadata"));
        }

        isLoaded = true;
      } catch (e) {
        console.error("Failed to load Self Playback:", e);
        alert("Could not load audio tools. Please refresh.");
      } finally {
        isLoading = false;
        if (loader) loader.style.display = "none";
        tab.style.opacity = "1";
      }
    }

    open();
  }

  // 4) State Helpers
  function open() {
    document.documentElement.classList.add(OPEN_CLASS);
    const tab = document.querySelector(".lux-sp-tab");
    if (tab) tab.setAttribute("aria-expanded", "true");

    // If the heavy SelfPB host exists, ensure it's visible when opened.
    const host = document.getElementById(HOST_ID);
    if (host) host.style.display = "";
  }

  function close() {
    document.documentElement.classList.remove(OPEN_CLASS);
    const tab = document.querySelector(".lux-sp-tab");
    if (tab) tab.setAttribute("aria-expanded", "false");

    // Hard guarantee: close should actually hide the heavy host (even if CSS fails).
    const host = document.getElementById(HOST_ID);
    if (host) host.style.display = "none";
  }

  // Expose control API
  window.luxSP = Object.assign(window.luxSP || {}, {
    open,
    close,
    toggle: handleToggle,
  });


  // ✅ External request (used by TTS Expand): load SelfPB if needed, then open the shared expanded modal
  window.addEventListener("lux:requestSelfPBExpanded", async () => {
    try {
      const isOpen = document.documentElement.classList.contains(OPEN_CLASS);

      // If SelfPB is not loaded yet, force the load path (without accidentally closing)
      if (!isLoaded) {
        if (isOpen) document.documentElement.classList.remove(OPEN_CLASS);
        await handleToggle();
      }

      // Ask the heavy UI to open its expanded floating window / modal
      setTimeout(() => {
        try { window.dispatchEvent(new Event("lux:openSelfPBExpanded")); } catch (_) {}
      }, 0);
    } catch (e) {
      console.error("[Lux] requestSelfPBExpanded failed:", e);
    }
  });

  // 5) Boot the Shell
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildShell);
  } else {
    buildShell();
  }
})();
