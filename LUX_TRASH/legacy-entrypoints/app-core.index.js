// LEGACY MODULE — NOT USED BY VITE BUILD
// --------------------------------------
// Kept only for historical reference.
// The live app boots from src/main.js and uses features/* slices.
// New code MUST NOT import or modify this file.
// app-core/index.js
import { bootApp } from "./boot.js";
bootApp();
// (legacy alias is exported from boot.js too; if your current index imports { boot }, it will still work.)
