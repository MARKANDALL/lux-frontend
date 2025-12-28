// api/convo.js
import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const CONVO_URL = `${API_BASE}/api/convo-turn`;

export async function convoTurn({ scenario, knobs, messages }) {
  const payload = { scenario, knobs, messages };
  dbg("POST", CONVO_URL, { scenario: scenario?.id, knobs });

  const resp = await fetch(CONVO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return jsonOrThrow(resp);
}
