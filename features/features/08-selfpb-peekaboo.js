// features/features/08-selfpb-peekaboo.js
// LAZY LOADER: Creates the tab immediately, but loads the heavy UI/WaveSurfer only on click.

(() => {
  const OPEN_CLASS = "lux-sp-open";
  const PANEL_SEL = ".lux-sp-panel";
  const BODY_SEL = ".lux-sp-body";
  const HOST_ID = "selfpb-lite";
  const CSS_HREF = "./features/features/selfpb-peekaboo.css";

  let isLoaded = false;
  let isLoading = false;

  // 1) Ensure Panel CSS (Lightweight)
  (function ensureCSS() {
    const has = [...document.styleSheets].some((ss) =>
      (ss.href || "").includes("selfpb-peekaboo.css")
    );
    if (!has) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_HREF;
      document.head.appendChild(link);
    }
  })();

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

    // Wire the click to the Lazy Loader
    const tab = panel.querySelector(".lux-sp-tab");
    tab.addEventListener("click", handleToggle);
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
          const href = "/features/features/self-playback.css";
          const has = [...document.styleSheets].some((ss) =>
            (ss.href || "").includes("self-playback.css")
          );
          if (!has) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
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
  }

  function close() {
    document.documentElement.classList.remove(OPEN_CLASS);
    const tab = document.querySelector(".lux-sp-tab");
    if (tab) tab.setAttribute("aria-expanded", "false");
  }

  // Expose control API
  window.luxSP = Object.assign(window.luxSP || {}, {
    open,
    close,
    toggle: handleToggle,
  });

  // 5) Boot the Shell
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildShell);
  } else {
    buildShell();
  }
})();
