// src/progress.js
import { ensureUID } from "../api/identity.js";
import { initDashboard } from "../features/dashboard/index.js";
import { bootRippleButtons } from "../ui/ui-ripple-filter.js";

import { initMyWordsGlobal } from "../features/my-words/index.js";

const uid = ensureUID();
initMyWordsGlobal({ uid, inputEl: null });

initDashboard();

// Enable ripple effect for any element with [data-lux-ripple] on this page
bootRippleButtons();
