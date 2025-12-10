// LEGACY ENTRYPOINT — UNUSED SINCE VITE MIGRATION
// ------------------------------------------------
// This file was the old LuxGold startup path, using bootApp().
// The real app now boots exclusively from src/main.js.
// New code MUST NOT import or modify this.
// Kept only for historical reference and for comparison with old builds.
// app-core/index.js
import { bootApp } from "./boot.js";
bootApp();
// (legacy alias is exported from boot.js too; if your current index imports { boot }, it will still work.)
