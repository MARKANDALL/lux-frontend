// features/dashboard/index.js
import * as UI from "./ui.js";
import { fetchHistory, getUID } from "../../api/index.js";
import { debug } from "../../app-core/lux-utils.js";

const DASHBOARD_CONTAINER_ID = "dashboard-root"; 

export async function initDashboard() {
  debug("Initializing Dashboard...");
  
  let root = document.getElementById(DASHBOARD_CONTAINER_ID);
  if (!root) {
    root = document.createElement("section");
    root.id = DASHBOARD_CONTAINER_ID;
    
    // ⬇️ LAYOUT FIX: Append to #container, not body
    const mainContainer = document.getElementById("container");
    if (mainContainer) {
        mainContainer.appendChild(root);
    } else {
        document.body.appendChild(root);
    }
  }

  UI.renderDashboard(DASHBOARD_CONTAINER_ID);
  await refreshHistory();
}

export async function refreshHistory() {
  try {
    const uid = getUID();
    if (!uid) {
      UI.renderError("User ID missing.");
      return;
    }

    const attempts = await fetchHistory(uid);
    debug("History loaded:", attempts.length);

    UI.renderHistoryRows(attempts);

  } catch (err) {
    console.error("Dashboard Load Error:", err);
    // Ignore 404s (just means empty history)
    if (String(err).includes("404")) {
         UI.renderHistoryRows([]); 
    } else {
         UI.renderError("History unavailable.");
    }
  }
}