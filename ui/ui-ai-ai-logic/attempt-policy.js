// ui/ui-ai-ai-logic/attempt-policy.js
// Practice Skills: attempt-based AI Coach auto-open policy + persistence helpers.
// Extracted from ui/ui-ai-ai-logic.js (cut/paste only).

import { openAICoachDrawer, collapseAICoachDrawer } from "../ui-ai-ai-dom.js";

const LUX_PRACTICE_ATTEMPT_KEY = "lux:practiceAttemptCount";
const LUX_AICOACH_EARLY_CLOSE_KEY = "lux:aicoachEarlyCloseCount";
const LUX_AICOACH_EARLY_CLOSED_A1_KEY = "lux:aicoachEarlyClosedAttempt1";
const LUX_AICOACH_EARLY_CLOSED_A2_KEY = "lux:aicoachEarlyClosedAttempt2";
const LUX_AICOACH_PREF_KEY = "lux:aicoachDrawerPref";

function getLuxSessionInt(key) {
  try {
    const v = Number(sessionStorage.getItem(key) || 0);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function setLuxSessionInt(key, n) {
  try {
    sessionStorage.setItem(key, String(n));
  } catch {}
}

function bumpPracticeAttemptCount() {
  const cur = getLuxSessionInt(LUX_PRACTICE_ATTEMPT_KEY);
  const next = cur + 1;
  setLuxSessionInt(LUX_PRACTICE_ATTEMPT_KEY, next);
  return next;
}

function getPracticeAICoachDrawerEl() {
  // Scope: Practice Skills only (index.html). Require the results container too.
  const d = document.getElementById("aiCoachDrawer");
  const pretty = document.getElementById("prettyResult");
  if (!d || !pretty) return null;
  return d;
}

export function ensureAICoachAttemptPolicyBound() {
  const d = getPracticeAICoachDrawerEl();
  if (!d) return;

  if (d.dataset.luxAICoachAttemptBound === "1") return;
  d.dataset.luxAICoachAttemptBound = "1";

  d.addEventListener("toggle", () => {
    const attempt = getLuxSessionInt(LUX_PRACTICE_ATTEMPT_KEY);

    // Attempts 1–2: track "closed" once per attempt, but don't persist long-term pref yet.
    if (attempt <= 2) {
      if (d.open) return;

      const flagKey =
        attempt === 1
          ? LUX_AICOACH_EARLY_CLOSED_A1_KEY
          : LUX_AICOACH_EARLY_CLOSED_A2_KEY;

      try {
        if (sessionStorage.getItem(flagKey) === "1") return;
        sessionStorage.setItem(flagKey, "1");
      } catch {}

      const cur = getLuxSessionInt(LUX_AICOACH_EARLY_CLOSE_KEY);
      const next = cur + 1;
      setLuxSessionInt(LUX_AICOACH_EARLY_CLOSE_KEY, next);

      // If they closed in both early attempts, lock default to closed for attempt 3+
      if (next >= 2) {
        try {
          localStorage.setItem(LUX_AICOACH_PREF_KEY, "0");
        } catch {}
      }
      return;
    }

    // Attempt 3+: persist user preference.
    try {
      localStorage.setItem(LUX_AICOACH_PREF_KEY, d.open ? "1" : "0");
    } catch {}
  });
}

export function bumpAndApplyAICoachAttemptOpenPolicy() {
  const attempt = bumpPracticeAttemptCount();
  applyAICoachAttemptOpenPolicy(attempt);
  return attempt;
}

function applyAICoachAttemptOpenPolicy(attempt) {
  const d = getPracticeAICoachDrawerEl();
  if (!d) return;

  // Attempt 1–2: always open (discoverability)
  if (attempt <= 2) {
    openAICoachDrawer();
    return;
  }

  // Attempt 3+: prefer saved preference (if any)
  let pref = null;
  try {
    pref = localStorage.getItem(LUX_AICOACH_PREF_KEY);
  } catch {}

  if (pref === "1") {
    openAICoachDrawer();
    return;
  }
  if (pref === "0") {
    collapseAICoachDrawer();
    return;
  }

  // No pref stored: default open unless they closed in both early attempts.
  const earlyClosed = getLuxSessionInt(LUX_AICOACH_EARLY_CLOSE_KEY);
  if (earlyClosed >= 2) collapseAICoachDrawer();
  else openAICoachDrawer();
}
