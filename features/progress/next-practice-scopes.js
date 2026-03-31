// features/progress/next-practice-scopes.js
// ONE-LINE: Helpers for building latest-attempt, current-session, and aggregate next-practice scopes.

import { computeRollups } from "./rollups.js";
import { pickTS, pickSessionId } from "./attempt-pickers.js";

export function pickLatestAttempt(attempts) {
  if (!Array.isArray(attempts) || !attempts.length) return null;

  let latest = null;
  let bestTS = -1;

  for (const attempt of attempts) {
    const ts = Date.parse(pickTS(attempt) || "") || 0;
    if (ts > bestTS) {
      bestTS = ts;
      latest = attempt;
    }
  }

  return latest;
}

export function pickAttemptsForLatestSession(attempts) {
  const latest = pickLatestAttempt(attempts);
  if (!latest) return [];

  const sid = String(pickSessionId(latest) || "").trim();
  if (!sid) return [latest];

  return (attempts || []).filter(
    (attempt) => String(pickSessionId(attempt) || "").trim() === sid
  );
}

export function computeImmediateScopeRollups(attempts) {
  return computeRollups(attempts || [], {
    windowDays: 30,
    minWordCount: 1,
    minPhonCount: 1,
  });
}