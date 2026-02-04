// file: /api/convo-report.js
import { API_BASE, jsonOrThrow, getAdminToken } from "./util.js";

const REPORT_URL = `${API_BASE}/api/convo-report`;

export async function convoReport({ uid, sessionId, passageKey }) {
  const token = getAdminToken({
    promptIfMissing: true,
    promptLabel: "Admin Token required for AI Conversation (Report)",
  });

  const resp = await fetch(REPORT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
    },
    body: JSON.stringify({ uid, sessionId, passageKey }),
  });

  return jsonOrThrow(resp);
}
