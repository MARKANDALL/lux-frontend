// features/my-words/boot.js
// PURPOSE: Wiring module — owns the lazy boot sequence for My Words.
// Neither index.js nor launcher.js imports the other.
// This file imports both and connects them.
//
// External callers (main.js, convo.js, stream.js) should import from HERE,
// not from launcher.js directly.

import { mountMyWordsCornerLauncher } from "./launcher.js";

/**
 * Mounts the corner launcher button and lazy-boots the full My Words
 * system on first click. Call this once per page.
 */
export function bootMyWordsLauncher() {
  let booted = false;
  let api = null; // holds { store, sidecar, modal, launcher }

  mountMyWordsCornerLauncher({
    onClick: async () => {
      if (!booted) {
        booted = true;
        // Dynamic import here — index.js does NOT import this file,
        // so there is no circular dependency.
        const mod = await import("./index.js");
        api = await mod.initMyWordsEverywhere?.();
      }

      // Toggle via returned store (most reliable)
      if (api?.store?.toggleOpen) {
        api.store.toggleOpen();
        return;
      }

      // Fallback if global exists
      window.LuxMyWords?.toggle?.();
    },
  });
}