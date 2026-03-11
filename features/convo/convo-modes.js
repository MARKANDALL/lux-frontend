// features/convo/convo-modes.js
// ONE-LINE: Controls convo screen mode transitions (intro/picker/chat), history syncing, and popstate wiring.

import { closeCharsDrawer } from "./characters-drawer.js";
import { getKnobsDrawerInstance } from "./knobs-drawer.js";

import { luxBus } from '../../app-core/lux-bus.js';

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
    } catch (err) { globalThis.warnSwallow("features/convo/convo-modes.js", err, "important"); }
  }

  function setMode(mode, opts = {}) {
    const changed = state.mode !== mode;

    state.mode = mode;
    root.dataset.mode = mode;

    // Used by lux-convo.css to gate drawers (TTS + SelfPB) until chat mode.
    document.documentElement.dataset.luxConvoMode = mode;

    // Close both picker drawers anytime we are not in picker mode.
    // Keep this unconditional so chat/picker transitions cannot leave
    // stale drawer shells visible due to timing or repeated mode sets.
    if (mode !== "picker") {
      try { closeCharsDrawer(); } catch (err) {
        globalThis.warnSwallow("features/convo/convo-modes.js", err, "important");
      }

      try {
        const knobs = getKnobsDrawerInstance();
        knobs?.close?.();
      } catch (err) {
        globalThis.warnSwallow("features/convo/convo-modes.js", err, "important");
      }
    }

    // Broadcast mode transitions (picker uses this to randomize the default card on entry).
    try { luxBus.set('convoMode', { mode, changed }); } catch (err) { globalThis.warnSwallow("features/convo/convo-modes.js", err, "important"); }

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
