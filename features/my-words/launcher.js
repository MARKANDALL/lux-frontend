// features/my-words/launcher.js
// Corner launcher + lazy boot entrypoint

function shouldHideOnThisPage() {
  // ✅ Only hide on admin pages (avoid clutter in admin tools)
  const p = location.pathname.toLowerCase();
  if (p.includes("/admin") || p.includes("admin/")) return true;
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

  // ✅ Convo-only behavior: show launcher ONLY when convo is in "working" mode.
  // (We detect via #convoApp[data-mode]. buildConvoLayout sets data-mode="intro" initially.)
  const convoRoot = document.getElementById("convoApp");
  if (convoRoot) {
    const isWorking = () => {
      // ✅ Primary signal: convo uses hash routing (#chat, etc.)
      const h = (location.hash || "").toLowerCase();
      if (h.includes("chat")) return true;

      // ✅ Secondary (optional): if a data-mode ever exists, honor it
      const mode = (convoRoot.dataset.mode || "").toLowerCase().trim();
      if (mode) return !["intro", "picker", "landing"].includes(mode);

      // ✅ Default: not working
      return false;
    };

    const applyVisibility = () => {
      const on = isWorking();
      btn.style.display = on ? "" : "none";
      btn.setAttribute("aria-hidden", on ? "false" : "true");
    };

    // Apply once now
    applyVisibility();

    // ✅ React to hash routing changes (landing/picker ⇄ chat)
    if (!btn.__luxMwHashListener) {
      const onHash = () => applyVisibility();
      window.addEventListener("hashchange", onHash);
      btn.__luxMwHashListener = onHash;
    }

    // Observe changes in convo mode so the button appears when user enters the convo.
    if (!btn.__luxMwConvoObserver) {
      const obs = new MutationObserver(() => applyVisibility());
      obs.observe(convoRoot, {
        attributes: true,
        attributeFilter: ["data-mode"],
      });
      btn.__luxMwConvoObserver = obs;
    }
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
