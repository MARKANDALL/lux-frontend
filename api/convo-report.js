// file: /api/convo-report.js
// One-line: Calls the end-session conversation report API using the shared API base and admin-token-aware fetch helper.

import { API_BASE, apiFetch } from "./util.js";

const REPORT_URL = `${API_BASE}/api/convo-report`;

export async function convoReport({ uid, sessionId, passageKey }) {
  return apiFetch(REPORT_URL, {
    method: "POST",
    promptIfMissing: true,
    promptLabel: "Admin Token required for session report",
    body: JSON.stringify({ uid, sessionId, passageKey }),
  });
}