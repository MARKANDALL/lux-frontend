// features/life/storage.js
// One-line: Loads, saves, and clears the active Life run via centralized Lux storage helpers.

import { K_LIFE_RUN, getJSON, setJSON, remove } from '../../app-core/lux-storage.js';

export function loadLifeRun() {
  try {
    const run = getJSON(K_LIFE_RUN, null);
    return run && typeof run === "object" ? run : null;
  } catch (_) {
    return null;
  }
}

export function saveLifeRun(run) {
  try {
    setJSON(K_LIFE_RUN, run);
  } catch (err) { globalThis.warnSwallow("features/life/storage.js", err, "important"); }
}

export function clearLifeRun() {
  try {
    remove(K_LIFE_RUN);
  } catch (err) { globalThis.warnSwallow("features/life/storage.js", err, "important"); }
}