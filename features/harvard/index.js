// C:\dev\LUX_GEMINI\features\harvard\index.js
// Wires the Harvard picker UI and lazy-loads Harvard list data + (on demand) the Harvard Library modal chunk.

import { setPassage, updatePartsInfoTip } from "../passages/index.js";
import { ensureHarvardPassages } from "../../src/data/index.js";

import { K_HARVARD_LAST, K_HARVARD_RANDOM_BAG } from '../../app-core/lux-storage.js';

const HARVARD_COUNT = 72;

function safeParseJson(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function readRandomBag() {
  try {
    let bag = safeParseJson(localStorage.getItem(K_HARVARD_RANDOM_BAG) || "[]", []);
    if (!Array.isArray(bag)) bag = [];

    const seen = new Set();
    return bag.filter((x) =>
      Number.isInteger(x) &&
      x >= 1 &&
      x <= HARVARD_COUNT &&
      !seen.has(x) &&
      seen.add(x)
    );
  } catch {
    return [];
  }
}

function writeRandomBag(bag) {
  try {
    localStorage.setItem(K_HARVARD_RANDOM_BAG, JSON.stringify(bag));
  } catch (err) {
    globalThis.warnSwallow("features/harvard/index.js", err, "important");
  }
}

function removeFromRandomBag(n) {
  const bag = readRandomBag().filter((x) => x !== n);
  writeRandomBag(bag);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function harvardKey(n) {
  return `harvard${pad2(n)}`;
}

export async function loadHarvardList(raw) {
  const n = clamp(parseInt(raw, 10) || 1, 1, 72);

  // ✅ Lazy-load only when needed
  try {
    await ensureHarvardPassages();
  } catch (e) {
    console.error("[Harvard] Failed to lazy-load Harvard lists", e);
    return;
  }

  setPassage(harvardKey(n));
  updatePartsInfoTip();
  return n;
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

  function cryptoUint32() {
    if (globalThis.crypto?.getRandomValues) {
      const a = new Uint32Array(1);
      globalThis.crypto.getRandomValues(a);
      return a[0];
    }
    // fallback
    return Math.floor(Math.random() * 0xffffffff) >>> 0;
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
    let bag = readRandomBag();

    if (!bag.length) {
      bag = Array.from({ length: HARVARD_COUNT }, (_, i) => i + 1);
      shuffleInPlace(bag);
    }

    const current = clamp(
      parseInt(num?.value, 10) ||
      parseInt(localStorage.getItem(K_HARVARD_LAST), 10) ||
      1,
      1,
      HARVARD_COUNT
    );

    let n = bag.pop();

    // avoid immediate repeat at cycle boundary
    if (n === current && HARVARD_COUNT > 1) {
      if (bag.length) {
        const alt = bag.pop();
        bag.unshift(n); // keep current list available later in the cycle
        n = alt;
      } else {
        n = (n % HARVARD_COUNT) + 1;
      }
    }

    writeRandomBag(bag);
    return n;
  }

  const loadLabel = load?.textContent || "Load";

  async function apply(raw) {
    const n = clamp(parseInt(raw, 10) || 1, 1, 72);

    if (num) num.value = String(n);
    removeFromRandomBag(n);
    try {
localStorage.setItem(K_HARVARD_LAST, String(n));
} catch (err) { globalThis.warnSwallow("features/harvard/index.js", err, "important"); }

    // ✅ Delegate actual loading to exported helper (keeps behavior consistent)
    try {
      if (load) {
        load.disabled = true;
        load.textContent = "Loading…";
      }
      await loadHarvardList(n);
    } finally {
      if (load) {
        load.disabled = false;
        load.textContent = loadLabel;
      }
    }
  }

  // Modal: browse all 72 lists (first sentence), hover preview, click select, practice -> apply()
  let modal = null;
  let modalLoading = null;

  function showBrowseError(msg) {
    if (!out) return;
    out.textContent = msg;
    out.style.display = "";
  }

  function clearBrowseError() {
    if (!out) return;
    out.textContent = "";
    out.style.display = "none";
  }

  async function ensureModal() {
    if (modal) return modal;

    if (!modalLoading) {
      modalLoading = (async () => {
        try {
          clearBrowseError();

          const { createHarvardLibraryModal } = await import("./modal.js");

          modal = createHarvardLibraryModal({
            onPractice: async (sel) => {
              if (sel?.kind === "harvard") {
                await apply(sel.n);
              } else if (sel?.kind === "passage") {
                setPassage(sel.key);
                updatePartsInfoTip();
              } else {
                return;
              }

              try {
                document.getElementById("referenceText")?.focus();
} catch (err) { globalThis.warnSwallow("features/harvard/index.js", err, "important"); }
            },
          });

          return modal;
        } catch (e) {
          console.error(
            "[Harvard] Failed to load Harvard Library modal chunk",
            e
          );

          // allow retry on next click
          modalLoading = null;

          // user-facing message (non-blocking)
          showBrowseError(
            "Could not open Harvard Library right now. Please try again. (See console for details.)"
          );

          return null;
        }
      })();
    }

    return modalLoading;
  }

  if (browse) {
    const openBrowse = async () => {
      const m = await ensureModal();
      m?.open?.();
    };

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
const last = localStorage.getItem(K_HARVARD_LAST);
    if (last) num.value = String(clamp(parseInt(last, 10) || 1, 1, 72));
} catch (err) { globalThis.warnSwallow("features/harvard/index.js", err, "important"); }

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