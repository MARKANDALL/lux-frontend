// features/convo/convo-modes.js

export function createConvoModeController({ root, state, setParallaxEnabled, setKnobs, render }) {
  const VALID_MODES = new Set(["intro", "picker", "chat"]);

  function normalizeMode(m) {
    const s = (m ?? "").toString().replace(/^#/, "");
    return VALID_MODES.has(s) ? s : null;
  }

  function syncHistory(mode, push) {
    try {
      const url = `${location.pathname}${location.search}#${mode}`;
      const st = { luxConvo: 1, mode };
      if (push) history.pushState(st, "", url);
      else history.replaceState(st, "", url);
    } catch (_) {}
  }

  function setMode(mode, opts = {}) {
    const changed = state.mode !== mode;

    state.mode = mode;
    root.dataset.mode = mode;

    // Used by lux-convo.css to gate drawers (TTS + SelfPB) until chat mode.
    document.documentElement.dataset.luxConvoMode = mode;

    // Parallax ONLY on intro screen.
    setParallaxEnabled(mode === "intro");

    // Keep knobs overlay from bleeding into intro/picker.
    if (mode !== "chat") setKnobs(false);

    // honor push:false (and also tolerate legacy opts.opts if it ever existed)
    const allowPush = (opts.push ?? opts.opts) !== false;

    // Browser back/forward steps: intro -> picker -> chat
    if (opts.replace) {
      syncHistory(mode, false);
    } else if (allowPush && changed) {
      syncHistory(mode, true);
    }

    render();
  }

  function wirePopstate({ warpSwap }) {
    window.addEventListener("popstate", (e) => {
      const m = normalizeMode(e.state?.luxConvo ? e.state.mode : location.hash);
      if (!m) return;
      warpSwap(() => setMode(m, { push: false }), { outMs: 140, inMs: 200 });
    });
  }

  return { normalizeMode, setMode, wirePopstate };
}
