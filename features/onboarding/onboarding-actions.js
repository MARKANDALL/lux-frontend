// features/onboarding/onboarding-actions.js

import { requestMic } from "./onboarding-mic.js";
import { STEPS } from "./onboarding-steps.js";

export async function runAction(action, { state, card, render, close }) {
  switch (action) {
    case "requestMic":
      await requestMic(state, card);
      // Re-render so the primary button becomes "Next" when mic is ready
      render();
      break;

    case "samplePhrase":
      trySamplePhrase();
      // After doing the action, advance
      state.i = Math.min(STEPS.length - 1, state.i + 1);
      render();
      break;

    case "browseLessons":
      close(true);
      tryBrowseLessons();
      break;

    case "startPracticing":
      close(true);
      tryStartPracticing();
      break;

    default:
      // no-op
      break;
  }
}

export function trySamplePhrase() {
  const sample = "The quick brown fox jumps over the lazy dog.";

  // Try: textarea with your placeholder text
  const ta = Array.from(document.querySelectorAll("textarea"))
    .find((t) => (t.getAttribute("placeholder") || "").toLowerCase().includes("paste or type"));

  if (ta) {
    ta.focus();
    ta.value = sample;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // Fallback: copy to clipboard
  try { navigator.clipboard.writeText(sample); } catch (_) {}
}

export function tryBrowseLessons() {
  // If you have a "Browse" button/link, click it.
  // Add a data attribute on your real button (recommended): data-lux-browse-lessons
  document.querySelector("[data-lux-browse-lessons]")?.click();
}

export function tryStartPracticing() {
  // Focus your Record button if present
  const btn =
    document.querySelector("[data-lux-record]") ||
    Array.from(document.querySelectorAll("button")).find((b) =>
      (b.textContent || "").trim().toLowerCase() === "record"
    );

  btn?.focus?.();
}