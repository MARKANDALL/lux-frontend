// api/convo.js
import { API_BASE, dbg, jsonOrThrow, getAdminToken } from "./util.js";

const CONVO_URL = `${API_BASE}/api/convo-turn`;

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
  const token = getAdminToken({
    promptIfMissing: true,
    promptLabel: "Admin Token required for AI Conversation",
  });

  const resp = await fetch(CONVO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
    },
    body: JSON.stringify(payload),
    signal,
  });

  return jsonOrThrow(resp);
}

/**
 * POST /api/convo-turn
 *
 * payload.knobs shape (v3):
 *   level  : "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
 *   tone   : "neutral" | "formal" | "friendly" | "enthusiastic" | "encouraging"
 *            | "playful" | "flirty" | "sarcastic" | "tired" | "distracted"
 *            | "cold" | "blunt" | "impatient" | "irritable" | "angry" | "emotional"
 *   length : "terse" | "short" | "medium" | "long" | "extended"
 *
 * Backend contract — inject these into the ChatGPT system prompt:
 *   1. level  → CEFR band the AI partner should target (vocab + grammar complexity)
 *   2. tone   → conversational tone / emotional register the AI partner should adopt
 *   3. length → response length:
 *        terse    = 1-2 sentences, curt/snippet-like
 *        short    = 2-3 sentences
 *        medium   = 3-5 sentences (default)
 *        long     = 5-8 sentences, fuller responses
 *        extended = no artificial limit, genuinely full responses
 *
 * NOTE: field was renamed from "mood" to "tone" in knobs v3.
 */
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