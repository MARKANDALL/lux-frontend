// features/features/tts/boot-tts.js
// Handles the "Peekaboo" drawer initialization.
// v2: Idempotent - Ensures the TAB exists even if the panel was cached.

const GUARD_ID = "lux-tts-guard-style";

function ensurePanel() {
  const host = document.getElementById("tts-controls");
  if (!host) return false;

  let panel = document.querySelector(".lux-tts-panel");
  
  // 1. Create Panel Shell if missing
  if (!panel) {
    panel = document.createElement("aside");
    panel.className = "lux-tts-panel";
    document.body.appendChild(panel);
  }

  // 2. CRITICAL FIX: Ensure Tab Exists (Even if panel was already there)
  let tab = document.querySelector(".lux-tts-tab"); // IMPORTANT: NOT panel.querySelector
  if (!tab) {
    tab = document.createElement("button");
    tab.className = "lux-tts-tab";
    // UPDATED: HTML structure to match Self Playback (Icon + Text)
    // Icon matches the "pull" direction (Left for a right-side panel)
    tab.innerHTML = `
      <span class="lux-tts-tab-inner">
        <span class="lux-tts-tab-icon">◀</span>
        <span class="lux-tts-tab-label">Text-to-Speech</span>
      </span>
    `;
    tab.setAttribute("aria-expanded", "false");
    tab.setAttribute("aria-controls", "tts-controls");
    
    // ✅ KEY: tab must be OUTSIDE the transformed panel
    panel.parentNode.insertBefore(tab, panel);
    
    // Wire Toggle Logic
    tab.addEventListener("click", () => {
      const willOpen = !document.documentElement.classList.contains("lux-tts-open");
      document.documentElement.classList.toggle("lux-tts-open", willOpen);
      tab.setAttribute("aria-expanded", String(willOpen));
    });
  }

  // 3. Move host into panel if not already there
  if (!panel.contains(host)) {
    panel.appendChild(host);
  }

  // 4. Cleanup Guard & Show Loading
  document.getElementById(GUARD_ID)?.remove();
  host.setAttribute("data-luxHidden", "0");
  
  if (!host.firstElementChild) {
    const ph = document.createElement("div");
    ph.className = "lux-tts-loading";
    ph.textContent = "Loading Text-to-Speech…";
    host.appendChild(ph);
  }
  
  window.__ttsHost = host;

  // 5. Expose Nudge API
  window.luxTTS = Object.assign(window.luxTTS || {}, {
    nudge() {
      if (tab) {
        tab.classList.remove("lux-tts-nudge");
        void tab.offsetWidth; 
        tab.classList.add("lux-tts-nudge");
        setTimeout(() => tab.classList.remove("lux-tts-nudge"), 1400);
      }
    },
  });

  console.info("[Lux] TTS Peekaboo panel initialized.");
  return true;
}

async function lateMount() {
  if (!ensurePanel()) return setTimeout(lateMount, 120);

  try {
    const mod = await import("./player-ui.js");
    const host = window.__ttsHost || document.getElementById("tts-controls");
    
    if (mod?.mountTTSPlayer) {
      mod.mountTTSPlayer(host);
      console.info("[Lux] TTS Player logic mounted.");
    }
  } catch (e) {
    console.warn("[Lux] TTS late mount failed:", e);
  }
}

export function bootTTS() {
  lateMount();
}
