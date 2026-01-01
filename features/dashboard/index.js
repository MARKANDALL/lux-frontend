// features/dashboard/index.js
import * as UI from "./ui.js";
import { fetchHistory, ensureUID } from "../../api/index.js";

export async function initDashboard() {
  const rootId = "dashboard-root";
  const root = document.getElementById(rootId);
  if (!root) return;

  UI.renderDashboard(rootId);

  try {
    const uid = ensureUID();
    const attempts = await fetchHistory(uid);
    UI.renderHistoryRows(attempts);
  } catch (err) {
    console.error("Dashboard Load Error:", err);
    if (String(err).includes("404")) UI.renderHistoryRows([]);
    else UI.renderError("History unavailable.");
  }
}
