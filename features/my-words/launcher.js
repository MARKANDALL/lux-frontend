// features/my-words/launcher.js
// Corner launcher + lazy boot entrypoint

function shouldHideOnThisPage() {
  // ✅ hide on AI landing page (keep BOTH checks for safety)
  if (location.pathname.toLowerCase().includes("ai")) return true;
  if (document.querySelector(".lux-ai-landing")) return true;
  return false;
}

/**
 * OLD NAME (your code still imports this)
 * ✅ Keep it for compatibility.
 */
export function mountMyWordsCornerLauncher({ onClick } = {}) {
  if (shouldHideOnThisPage()) return null;

  let btn = document.querySelector(".lux-mw-corner");
  if (!btn) {
    btn = document.createElement("button");
    btn.className = "lux-mw-corner";
    btn.type = "button";
    btn.innerHTML = `<span class="lux-mw-corner-ink">📝</span>`;
    document.body.appendChild(btn);
  }

  // ✅ Remove any previous handler (prevents duplicate listeners)
  if (btn.__luxMwHandler) {
    btn.removeEventListener("click", btn.__luxMwHandler);
  }

  const handler = (e) => {
    e.preventDefault();
    try {
      onClick?.(e);
    } catch (_) {}
  };

  btn.__luxMwHandler = handler;
  btn.addEventListener("click", handler);

  return btn;
}

/**
 * NEW NAME (what we want main.js to call)
 * ✅ Boots My Words ONLY when clicked (lazy import)
 */
export function bootMyWordsLauncher() {
  let booted = false;

  mountMyWordsCornerLauncher({
    onClick: async () => {
      // Lazy-load the heavy panel code only the first time
      if (!booted) {
        booted = true;
        const mod = await import("./index.js");
        mod.initMyWordsEverywhere?.();
      }

      // Toggle open/close after boot
window.LuxMyWords?.toggle?.();
    },
  });
}
