// features/progress/attempt-detail/derive.js
// Derived logic/text builders for Attempt Details modal (no DOM nodes here).

import { esc, getColorConfig } from "../progress-utils.js";
import { pickTS } from "../attempt-pickers.js";

export function computeConfidence(list, sid) {
  const attemptsCount = Array.isArray(list) ? list.length : 0;

  const isNoSess = String(sid || "").startsWith("nosess:");

  const uniqueDays = new Set(
    (list || [])
      .map((a) => {
        const ts = +new Date(pickTS(a) || 0);
        if (!ts) return "";
        const d = new Date(ts);

        // Use en-CA if available (YYYY-MM-DD), otherwise manual.
        try {
          return d.toLocaleDateString("en-CA");
        } catch (_) {}

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      })
      .filter(Boolean)
  ).size;

  let label = "Early signal";
  let hint = "Based on a small sample — keep practicing for stronger patterns.";
  if (attemptsCount >= 3 || uniqueDays >= 2) {
    label = "High confidence";
    hint = "Patterns are consistent across attempts/days.";
  } else if (attemptsCount === 2) {
    label = "Medium confidence";
    hint = "Good start — one more attempt will sharpen priorities.";
  }

  return { attemptsCount, uniqueDays, label, hint, isNoSess };
}

export function buildNextActions(trouble, title) {
  const nextActions = [];

  const topPh = (trouble?.phonemesAll || [])[0] || null;
  const topWd = (trouble?.wordsAll || [])[0] || null;

  if (topPh) {
    const ex =
      Array.isArray(topPh.examples) && topPh.examples.length
        ? ` (e.g., ${topPh.examples.join(", ")})`
        : "";
    nextActions.push(
      `Top priority sound: <strong>${esc(topPh.ipa)}</strong> — seen ${topPh.count}× across ${
        topPh.days || 1
      } day(s).${ex}`
    );
  }

  if (topWd) {
    nextActions.push(
      `Top priority word: <strong>${esc(topWd.word)}</strong> — avg ${Math.round(topWd.avg)}% over ${topWd.count}×.`
    );
  }

  if (nextActions.length) {
    nextActions.push(`Repeat <strong>${esc(title)}</strong> once more focusing on the top items above.`);
  } else {
    nextActions.push(`Keep practicing — priorities become more reliable after a few repeats.`);
  }

  return nextActions;
}

export function buildFocusWordsFallbackHtml(latestSum) {
  let html = `<p style="color:#94a3b8; font-style:italic;">No word details available.</p>`;

  if (Array.isArray(latestSum?.words) && latestSum.words.length > 0) {
    const items = latestSum.words
      .slice(0, 6)
      .map((w) => {
        const text = Array.isArray(w) ? w[0] : w?.w;
        const s = Array.isArray(w) ? w[1] : w?.s;
        const wordColor = getColorConfig(s).color;
        return `<li style="margin-bottom:4px;"><strong style="color:${wordColor};">${esc(
          text
        )}</strong> (${Math.round(Number(s) || 0)}%)</li>`;
      })
      .join("");

    html = `<ul style="padding-left:20px; color:#475569;">${items}</ul>`;
  }

  return html;
}
