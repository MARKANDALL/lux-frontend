// features/harvard/index.js
import { setPassage, updatePartsInfoTip } from "../passages/index.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function harvardKey(n) {
  return `harvard${pad2(n)}`;
}

export function wireHarvardPicker() {
  const num = document.getElementById("harvardNum");
  const prev = document.getElementById("harvardPrev");
  const next = document.getElementById("harvardNext");
  const load = document.getElementById("harvardLoad");
  const rnd = document.getElementById("harvardRandom");
  const out = document.getElementById("harvardLoaded");

  if (!num || !prev || !next || !load || !rnd) return;

  const apply = (raw) => {
    const n = clamp(parseInt(raw, 10) || 1, 1, 72);
    num.value = String(n);

    const key = harvardKey(n);
    setPassage(key);
    updatePartsInfoTip();

    if (out) out.textContent = `Loaded: Harvard List ${pad2(n)}`;
    try { localStorage.setItem("LUX_HARVARD_LAST", String(n)); } catch {}
  };

  // restore last used
  try {
    const last = localStorage.getItem("LUX_HARVARD_LAST");
    if (last) num.value = String(clamp(parseInt(last, 10) || 1, 1, 72));
  } catch {}

  load.addEventListener("click", () => apply(num.value));
  num.addEventListener("keydown", (e) => { if (e.key === "Enter") apply(num.value); });

  prev.addEventListener("click", () => apply((parseInt(num.value, 10) || 1) - 1));
  next.addEventListener("click", () => apply((parseInt(num.value, 10) || 1) + 1));

  rnd.addEventListener("click", () => {
    const n = Math.floor(Math.random() * 72) + 1;
    apply(n);
  });
}
