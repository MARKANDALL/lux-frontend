// file: /api/convo-report.js
import { apiFetch } from "./util.js";

const REPORT_URL = `/api/convo-report`;

export async function convoReport({ uid, sessionId, passageKey }) {
  return apiFetch(REPORT_URL, {
    method: "POST",
    body: JSON.stringify({ uid, sessionId, passageKey }),
  });
}