// C:\dev\LUX_GEMINI\features\harvard\index.js
// Wires the Harvard picker UI and lazy-loads Harvard list data + (on demand) the Harvard Library modal chunk.

import { setPassage, updatePartsInfoTip } from "../passages/index.js";
import { ensureHarvardPassages } from "../../src/data/index.js";

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

  let randBag = [];

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
    try {
      localStorage.setItem("LUX_HARVARD_LAST", String(n));
    } catch {}

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
              } catch {}
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
