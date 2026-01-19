// features/progress/render.js
// NOTE: This file used to be a pure re-export barrel.
// We keep that behavior, but we ALSO add a tiny helper that:
// 1) ensures the "My Words" button exists in the actions area (if possible)
// 2) wires it to open the global My Words Library modal

export * from "./render/index.js";

/**
 * Ensures + wires the "My Words" Library gateway button on the Progress page.
 *
 * Expected markup target:
 *  - actions area container (we try a few common selectors)
 *  - button id: #luxMyWordsLibraryBtn
 *
 * Call this right after the dashboard/progress UI renders.
 */
export function wireMyWordsLibraryGateway(root) {
  if (!root) return;

  // 1) Ensure the button exists (if template didn't include it yet)
  let mwBtn = root.querySelector("#luxMyWordsLibraryBtn");

  if (!mwBtn) {
    // Try to locate an actions container
    const actionsHost =
      root.querySelector("#luxProgressActions") ||
      root.querySelector(".lux-actions") ||
      root.querySelector(".lux-dashboard-actions") ||
      root.querySelector("[data-lux-actions]");

    if (actionsHost) {
      mwBtn = document.createElement("button");
      mwBtn.className = "lux-btn";
      mwBtn.id = "luxMyWordsLibraryBtn";
      mwBtn.type = "button";
      mwBtn.textContent = "My Words";

      actionsHost.appendChild(mwBtn);
    }
  }

  // 2) Wire click → open library (global hook set by initMyWordsGlobal)
  if (mwBtn) {
    mwBtn.addEventListener("click", () => {
      window.LuxMyWords?.openLibrary?.();
    });
  }
}
