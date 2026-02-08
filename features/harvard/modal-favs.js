// features/harvard/modal-favs.js

export function loadFavs() {
  let favs = new Set();
  let favKeys = new Set();

  try {
    const raw = localStorage.getItem("LUX_HARVARD_FAVS");
    const arr = raw ? JSON.parse(raw) : [];
    favs = new Set(
      (Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter(Boolean)
    );
  } catch {
    favs = new Set();
  }

  try {
    const raw = localStorage.getItem("LUX_PASSAGES_FAVS");
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
    localStorage.setItem("LUX_HARVARD_FAVS", JSON.stringify(Array.from(favs || [])));
  } catch {}
  try {
    localStorage.setItem(
      "LUX_PASSAGES_FAVS",
      JSON.stringify(Array.from(favKeys || []))
    );
  } catch {}
}
