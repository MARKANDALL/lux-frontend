// features/features/tts/boot-tts.js
// Peekaboo drawer initialization (TTS)
// ✅ Uses EXISTING tts-peekaboo.css animation (text slides + arrow flips)
// ✅ Loads ONLY the heavy player UI + inner TTS styling on first open

const GUARD_ID = "lux-tts-guard-style";

// Heavy inner styling (controls UI)
const CSS_CORE = "/features/features/tts.css";

function ensureCSS(href, contains = "") {
  const needle = contains || href;
  const has = [...document.styleSheets].some((ss) => (ss.href || "").includes(needle));
  if (has) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

let _playerBooted = false;

function ensurePanel() {
  const host = document.getElementById("tts-controls");
  if (!host) return false;

  // ✅ Always start CLOSED (so closed-state CSS applies immediately)
  document.documentElement.classList.remove("lux-tts-open");

  // Panel container
  let panel = document.querySelector(".lux-tts-panel");
  if (!panel) {
    panel = document.createElement("aside");
    panel.className = "lux-tts-panel";
    document.body.appendChild(panel);
  }

  // Shell (blank white card behind the tab)
  let shell = panel.querySelector(".lux-tts-shell");
  if (!shell) {
    shell = document.createElement("div");
    shell.className = "lux-tts-shell";
    panel.appendChild(shell);
  }

  // Tab button (driven by tts-peekaboo.css)
  let tab = panel.querySelector(".lux-tts-tab");
  if (!tab) {
    tab = document.createElement("button");
    tab.className = "lux-tts-tab";
    tab.type = "button";
    tab.setAttribute("aria-expanded", "false");
    tab.setAttribute("aria-controls", "tts-controls");

    tab.innerHTML = `
      <span class="lux-tts-tab-inner">
        <span class="lux-tts-tab-label">Text-to-Speech</span>
        <span class="lux-tts-tab-icon">◀</span>
      </span>
    `;

    // Put tab BEFORE shell
    panel.insertBefore(tab, shell);

    async function lazyBootPlayer() {
      // ✅ Lazy boot ONLY on first open
      if (_playerBooted) return;
      _playerBooted = true;

      // Load inner control styling (NOT overlay positioning CSS)
      ensureCSS(CSS_CORE, "tts.css");

      try {
        const mod = await import("./player-ui.js");
        const mountHost = document.getElementById("tts-controls");
        if (mod?.mountTTSPlayer) {
          mod.mountTTSPlayer(mountHost);
          console.info("[Lux] TTS Player mounted (lazy).");
          document.documentElement.classList.add("lux-tts-booted");
        }
      } catch (e) {
        console.warn("[Lux] TTS lazy mount failed:", e);
        _playerBooted = false; // allow retry
      }
    }

    tab.addEventListener("click", async () => {
      const willOpen = !document.documentElement.classList.contains("lux-tts-open");
      document.documentElement.classList.toggle("lux-tts-open", willOpen);
      tab.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) await lazyBootPlayer();
    });

    // Allow clicking the CLOSED white “stub/card” to open (but never close).
    if (shell && !shell.dataset.luxStubClickBound) {
      shell.dataset.luxStubClickBound = "1";
      shell.addEventListener("click", async () => {
        if (document.documentElement.classList.contains("lux-tts-open")) return;
        document.documentElement.classList.add("lux-tts-open");
        tab.setAttribute("aria-expanded", "true");
        await lazyBootPlayer();
      });
    }
  }

  // Ensure host lives inside the shell (this gives you the blank card when closed)
  if (!shell.contains(host)) shell.appendChild(host);

  // Remove guard that hides it
  document.getElementById(GUARD_ID)?.remove();
  host.dataset.luxHidden = "0";

  console.info("[Lux] TTS Peekaboo panel initialized (lazy).");
  return true;
}

function lateMount() {
  if (!ensurePanel()) setTimeout(lateMount, 120);
}

export function bootTTS() {
  lateMount();
}
