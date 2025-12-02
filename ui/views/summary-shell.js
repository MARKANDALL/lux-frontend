/* ============================================================================
   CANONICAL SUMMARY SHELL — ACTIVE FRONT DOOR
   ----------------------------------------------------------------------------
   - Delegates the main summary rendering to ui/views/summary.js
     (detailed phoneme / error summary).
   - Adds a small database-tracking footer that surfaces the Lux UID, so
     "database tracking" in the UI matches what the backend is storing.
   - No network calls here; purely presentation + UID surfacing.
   - Does NOT attach any window.* globals.
   - Called only by ui/views/index.js via showSummaryWithTracking(..).
============================================================================ */

import { showSummary as renderCoreSummary } from "./summary.js";

// Best-effort UID helper (keeps us aligned with index.html + lux-popover.js)
function getLuxUID() {
  const fromWindow = (window && window.LUX_USER_ID) || "";
  const fromAttr =
    document.documentElement.getAttribute("data-uid") || "";
  return (fromWindow || fromAttr || "—").toString();
}

function ensureFooterHost() {
  const host = document.getElementById("prettyResult");
  if (!host) return null;

  let footer = document.getElementById("lux-db-summary");
  if (!footer) {
    footer = document.createElement("div");
    footer.id = "lux-db-summary";
    footer.style.cssText = [
      "margin-top:18px",
      "padding:12px 10px",
      "border-top:1px solid #dde6f3",
      "font-size:0.9rem",
      "color:#334155",
      "background:#f8fbff",
      "border-radius:0 0 10px 10px",
    ].join(";");
    host.appendChild(footer);
  }
  return footer;
}

/**
 * showSummaryWithTracking
 * - Renders the canonical summary (ui/views/summary.js).
 * - Appends a compact note that this attempt is part of database tracking,
 *   keyed by the Lux UID.
 */
export function showSummaryWithTracking({
  allPartsResults,
  currentParts,
} = {}) {
  // 1) Let the core summary renderer do its job.
  renderCoreSummary({
    allPartsResults,
    currentParts,
  });

  // 2) Attach the tracking footer to the summary area.
  const footer = ensureFooterHost();
  if (!footer) return;

  const uid = getLuxUID();
  footer.innerHTML = `
    <div style="font-weight:600;margin-bottom:4px;">
      Database tracking
    </div>
    <div style="margin-bottom:4px;">
      This summary is tied to your practice history under UID
      <code style="font-family:monospace;font-size:0.88em;">${uid}</code>.
    </div>
    <div style="font-size:0.85rem;color:#64748b;">
      Admin tools can use this UID to explore attempts, progress, and cohorts.
    </div>
  `;
}
