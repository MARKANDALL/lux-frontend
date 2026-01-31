// features/life/storage.js
const KEY = "lux.life.run.v1";

export function loadLifeRun() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw);
    return run && typeof run === "object" ? run : null;
  } catch (_) {
    return null;
  }
}

export function saveLifeRun(run) {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
  } catch (_) {}
}

export function clearLifeRun() {
  try {
    localStorage.removeItem(KEY);
  } catch (_) {}
}
