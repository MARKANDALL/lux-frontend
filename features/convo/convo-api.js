// features/convo/convo-api.js
import { convoTurn } from "../../api/convo.js";

// Convo turn with a UI-friendly fallback message (never throw).
export async function convoTurnWithUi(payload, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 25000;
  const attempts = opts.attempts ?? 2;

  try {
    return await convoTurn(payload, { timeoutMs, attempts });
  } catch (err) {
    return {
      assistant:
        "⚠️ I couldn’t get the next AI turn. " +
        (err?.message ? `(${err.message}) ` : "") +
        "Press Record again to retry.",
      suggested_replies: ["Press Record again", "Try again", "Back to scenarios"],
    };
  }
}
