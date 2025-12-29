// file: /api/convo-report.js
import { API_BASE, jsonOrThrow } from "./util.js";

const REPORT_URL = `${API_BASE}/api/convo-report`;

export async function convoReport({ uid, sessionId, passageKey }) {
  const resp = await fetch(REPORT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, sessionId, passageKey }),
  });

  return jsonOrThrow(resp);
}
