// features/convo/convo-mode-system.js

import { createConvoModeController } from "./convo-modes.js";

export function initConvoModeSystem({
  root,
  state,
  setParallaxEnabled,
  setKnobs,
  render,
  warpSwap,
}) {
  // Mode controller (extracted)
  const modeCtl = createConvoModeController({
    root,
    state,
    setParallaxEnabled,
    setKnobs,
    render,
  });

  const { normalizeMode, setMode } = modeCtl;
  modeCtl.wirePopstate({ warpSwap });

  return { normalizeMode, setMode };
}

export function applyInitialConvoMode({ normalizeMode, setMode }) {
  // Initial mode: hash (if present) wins, otherwise intro.
  const initialMode =
    normalizeMode(history.state?.luxConvo ? history.state.mode : location.hash) || "intro";

  setMode(initialMode, { replace: true, push: false });

  return initialMode;
}
