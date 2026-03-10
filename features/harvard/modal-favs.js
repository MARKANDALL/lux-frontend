// features/harvard/modal-favs.js
import { K_HARVARD_FAVS, K_PASSAGES_FAVS } from '../../app-core/lux-storage.js';

export function loadFavs() {
  let favs = new Set();
  let favKeys = new Set();

  try {
    const raw = localStorage.getItem(K_HARVARD_FAVS);
    const arr = raw ? JSON.parse(raw) : [];
    favs = new Set(
      (Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter(Boolean)
    );
  } catch {
    favs = new Set();
  }

  try {
    const raw = localStorage.getItem(K_PASSAGES_FAVS);
    const arr = raw ? JSON.parse(raw) : [];
    favKeys = new Set(
      (Array.isArray(arr) ? arr : []).map((x) => String(x)).filter(Boolean)
    );
  } catch {
    favKeys = new Set();
  }

  return { favs, favKeys };
}

export function saveFavs(favs, favKeys) {
  try {
    localStorage.setItem(K_HARVARD_FAVS, JSON.stringify(Array.from(favs || [])));
} catch (err) { globalThis.warnSwallow("features/harvard/modal-favs.js", err, "important"); }
  try {
    localStorage.setItem(K_PASSAGES_FAVS,
      JSON.stringify(Array.from(favKeys || []))
    );
} catch (err) { globalThis.warnSwallow("features/harvard/modal-favs.js", err, "important"); }
}


