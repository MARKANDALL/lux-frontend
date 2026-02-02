// features/harvard/index.js
import { setPassage, updatePartsInfoTip } from "../passages/index.js";
import { ensureHarvardPassages } from "../../src/data/index.js";
import { HARVARD_PHONEME_META } from "../../src/data/harvard-phoneme-meta.js";
import { createHarvardLibraryModal } from "./modal.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function harvardKey(n) {
  return `harvard${pad2(n)}`;
}

function getHarvardMeta(n) {
  return (
    HARVARD_PHONEME_META?.[n] ??
    HARVARD_PHONEME_META?.[String(n)] ??
    HARVARD_PHONEME_META?.[String(n).padStart(2, "0")]
  );
}

export function wireHarvardPicker() {
  const num = document.getElementById("harvardNum");
  const prev = document.getElementById("harvardPrev");
  const next = document.getElementById("harvardNext");
  const load = document.getElementById("harvardLoad");
  const rnd = document.getElementById("harvardRandom");
  const out = document.getElementById("harvardLoaded");
  const browse = document.getElementById("harvardBrowse");

  if (!num || !prev || !next || !load || !rnd) return;

  if (out) {
    out.textContent = "";
    out.style.display = "none";
  }

  let topPhEl = document.getElementById("harvardTopPh");
  if (!topPhEl) {
    topPhEl = document.createElement("span");
    topPhEl.id = "harvardTopPh";
    topPhEl.className = "lux-harvard-topph";
    topPhEl.textContent = "";
    num?.insertAdjacentElement?.("afterend", topPhEl);
  }

  function getFocusPhoneme(n) {
    const top = getHarvardMeta(n)?.top3?.[0];
    return top?.ph || "";
  }

  function updateTopPhChip(n) {
    if (!topPhEl) return;
    const ph = getFocusPhoneme(n);
    topPhEl.textContent = ph ? `Top: ${ph}` : "";
  }

  let randBag = [];

  function cryptoUint32() {
    if (globalThis.crypto?.getRandomValues) {
      const a = new Uint32Array(1);
      globalThis.crypto.getRandomValues(a);
      return a[0];
    }
    // fallback
    return Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
  }

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const r = cryptoUint32();
      const j = r % (i + 1);
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
  }

  function nextRandomList() {
    if (randBag.length === 0) {
      randBag = Array.from({ length: 72 }, (_, i) => i + 1);
      shuffleInPlace(randBag);
    }
    return randBag.pop();
  }

  const loadLabel = load?.textContent || "Load";

  async function apply(raw) {
    const n = clamp(parseInt(raw, 10) || 1, 1, 72);

    if (num) num.value = String(n);
    updateTopPhChip(n);
    try {
      localStorage.setItem("LUX_HARVARD_LAST", String(n));
    } catch {}

    // ✅ Lazy-load the big dataset ONLY when Harvard is actually requested
    try {
      if (load) {
        load.disabled = true;
        load.textContent = "Loading…";
      }
      await ensureHarvardPassages();
    } catch (e) {
      console.error("[Harvard] Failed to lazy-load Harvard lists", e);
      return;
    } finally {
      if (load) {
        load.disabled = false;
        load.textContent = loadLabel;
      }
    }

    setPassage(harvardKey(n));
    updatePartsInfoTip();
  }

  // Modal: browse all 72 lists (first sentence), hover preview, click select, practice -> apply()
  let modal = null;
  if (browse) {
    modal = createHarvardLibraryModal({
      onPractice: async (n) => {
        await apply(n);
        try { document.getElementById("referenceText")?.focus(); } catch {}
      },
    });

    const openBrowse = () => modal?.open?.();
    browse.addEventListener("click", openBrowse);
    browse.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openBrowse();
      }
    });
  }

  // restore last used
  try {
    const last = localStorage.getItem("LUX_HARVARD_LAST");
    if (last) num.value = String(clamp(parseInt(last, 10) || 1, 1, 72));
  } catch {}

  load.addEventListener("click", () => apply(num.value));
  num.addEventListener("keydown", (e) => {
    if (e.key === "Enter") apply(num.value);
  });

  prev.addEventListener("click", () =>
    apply((parseInt(num.value, 10) || 1) - 1)
  );
  next.addEventListener("click", () =>
    apply((parseInt(num.value, 10) || 1) + 1)
  );

  rnd.addEventListener("click", async () => {
    const n = nextRandomList();
    await apply(n);
  });
}
