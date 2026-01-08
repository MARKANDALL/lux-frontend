// src/progress.js
import { ensureUID } from "../api/identity.js";
import { initDashboard } from "../features/dashboard/index.js";

ensureUID();
initDashboard();
