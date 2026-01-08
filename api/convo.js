// api/convo.js
import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const API_URL = import.meta.env.VITE_API_URL || "";
const CONVO_URL = `${API_URL}${API_BASE}/api/convo-turn`;

function isValidConvoTurn(x) {
  return (
    x &&
    typeof x.assistant === "string" &&
    x.assistant.trim().length > 0 &&
    Array.isArray(x.suggested_replies) &&
    x.suggested_replies.length === 3 &&
    x.suggested_replies.every((s) => typeof s === "string" && s.trim().length > 0)
  );
}

async function postConvoTurn(payload, { signal } = {}) {
  const resp = await fetch(CONVO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  return jsonOrThrow(resp);
}

export async function convoTurn({ scenario, knobs, messages }, opts = {}) {
  const payload = { scenario, knobs, messages };
  dbg("POST", CONVO_URL, { scenario: scenario?.id, knobs });

  const timeoutMs = Number(opts.timeoutMs ?? 25000);
  const attempts = Math.max(1, Number(opts.attempts ?? 2));

  let lastErr = null;

  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const data = await postConvoTurn(payload, { signal: ctrl.signal });

      if (isValidConvoTurn(data)) return data;

      lastErr = new Error(
        "Invalid convo-turn payload (empty assistant or bad suggested_replies)."
      );
    } catch (err) {
      lastErr =
        err && err.name === "AbortError" ? new Error("convo-turn timed out") : err;
    } finally {
      clearTimeout(t);
    }
  }

  throw lastErr || new Error("convo-turn failed");
}
