// src/stream.js
import { ensureUID } from "../api/identity.js";
import { initAuthUI } from "../ui/auth-dom.js";
import { bootRippleButtons } from "../ui/ui-ripple-filter.js";

import { mountStreamingApp } from "../features/streaming/app.js";

// 0) UID is still the single source of truth (guest or authed)
ensureUID();

// 1) Auth UI (top-right Save Progress)
initAuthUI();

// 2) Mount the streaming feature into its isolated root
mountStreamingApp({ rootId: "lux-stream-root" });

// 3) Optional: ripple polish for buttons marked with data-lux-ripple
bootRippleButtons();
