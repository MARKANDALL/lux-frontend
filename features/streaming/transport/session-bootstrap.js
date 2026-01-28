// features/streaming/transport/session-bootstrap.js
// IMPORTANT: No API secrets in the browser.
// This module is the ONLY place that should talk to your server to mint ephemeral creds.

import { API_BASE, jsonOrThrow } from "../../../api/util.js";

/**
 * Expected server contract (you'll implement later):
 * POST /api/realtime-session -> returns ephemeral creds for realtime connection
 */
export async function bootstrapRealtimeSession({ transport }) {
  const url = `${API_BASE}/api/realtime-session`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transport }),
  });

  return jsonOrThrow(resp);
}
