// src/stream-setup.js
import { ensureUID } from "../api/identity.js";
import { initAuthUI } from "../ui/auth-dom.js";
import { bootRippleButtons } from "../ui/ui-ripple-filter.js";

import { mountStreamingSetupApp } from "../features/streaming/setup/app.js";

// 0) UID
ensureUID();

// 1) Auth UI
initAuthUI();

// 2) Mount setup
mountStreamingSetupApp({ rootId: "lux-stream-setup-root" });

// 3) Ripple polish
bootRippleButtons();
