// ui/interactions/boot.js
// Central, safe boot for UI interactions.
// - Idempotent
// - Uses dynamic imports with fallbacks so CSB path quirks don't break the app.
// NOTE: We only boot interactions that actually exist in the modern trunk.
//       Phantom imports (word-click, phoneme-chips) were removed to stop MIME warnings.
//       Phase-E polish: re-boot header hover/audio modules (yg-hover, ph-audio).

let interactionsBooted = false;

async function loadFirst(paths, label) {
  for (const p of paths) {
    try {
      const mod = await import(p);
      console.log(`[LUX] interactions: loaded ${label} (${p})`);
      return mod;
    } catch (e) {
      // swallow and try next
    }
  }
  console.warn(`[LUX] interactions: failed to load ${label}`, paths);
  return null;
}

function callFirstFunction(mod, names, label) {
  if (!mod) return;
  for (const name of names) {
    const fn = mod?.[name];
    if (typeof fn === "function") {
      try {
        fn();
        console.log(`[LUX] ${label} booted via ${name}()`);
      } catch (e) {
        console.warn(`[LUX] ${label} failed in ${name}()`, e);
      }
      return;
    }
  }
  console.log(`[LUX] ${label}: no known init export found`, names);
}

export function bootInteractions() {
  if (interactionsBooted) return;
  interactionsBooted = true;

  // fire-and-forget async boot so callers don't need await
  (async () => {
    // Core hover + chips
    const PhHover = await loadFirst(
      ["./ph-hover.js", "./ph-hover/index.js"],
      "ph-hover"
    );

    // Only load the real phoneme chips module (phantom fallbacks removed)
    const PhChips = await loadFirst(["./ph-chips.js"], "ph-chips");

    // Header interactions (were missing from boot)
    const YgHover = await loadFirst(["./yg-hover.js"], "yg-hover");
    const PhAudio = await loadFirst(["./ph-audio.js"], "ph-audio");

    // Hover boot (stable)
    callFirstFunction(
      PhHover,
      ["setupPhonemeHover", "bootPhonemeHover", "initPhonemeHover", "default"],
      "phoneme-hover"
    );

    // Chips hydration + click/tooltip wiring
    callFirstFunction(
      PhChips,
      [
        "initPhonemeChipBehavior", // ✅ canonical init
        "setupPhonemeChips",
        "hydratePhonemeChips",
        "initPhonemeChips",
        "bootPhonemeChips",
        "wirePhonemeChips",
        "default",
      ],
      "phoneme-chips"
    );

    // Word header pill hover / YouGlish explainer
    callFirstFunction(
      YgHover,
      [
        "setupYgHover",
        "bootYgHover",
        "initYgHover",
        "wireYgHover",
        "default",
      ],
      "yg-hover"
    );

    // Phoneme header pill hover/click audio/video explainer
    callFirstFunction(
      PhAudio,
      [
        "setupPhonemeHeaderAudio",
        "initPhonemeHeaderAudio",
        "bootPhonemeHeaderAudio",
        "wirePhonemeHeaderAudio",
        "initPhAudio",
        "default",
      ],
      "ph-audio"
    );

    console.log("[LUX] interactions booted");
  })();
}

// Legacy global (harmless)
globalThis.bootInteractions = globalThis.bootInteractions || bootInteractions;
