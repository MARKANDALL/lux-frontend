// src/life.js
import { ensureUID } from "../api/identity.js";
import { initAuthUI } from "../ui/auth-dom.js";
import { bootRippleButtons } from "../ui/ui-ripple-filter.js";

import { mountLifeApp } from "../features/life/app.js";

ensureUID();
initAuthUI();

mountLifeApp({ rootId: "lux-life-root" });

bootRippleButtons();
