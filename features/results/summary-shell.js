/* ============================================================================
   CANONICAL SUMMARY SHELL — ACTIVE FRONT DOOR
   ----------------------------------------------------------------------------
   - Delegates the main summary rendering to ui/views/summary.js.
   - Adds the "Database Tracking" footer.
   - REPLICATES the interactive "Blue Pill" popover from the main page
     so users can jump straight to admin tools from the summary.
   - STYLE UPDATE: Matches the main page "Blue Box" (#e7f2fb) for visual consistency.
============================================================================ */

import { showSummary as renderCoreSummary } from "./summary.js";

// Best-effort UID helper
function getLuxUID() {
  const fromWindow = (window && window.LUX_USER_ID) || "";
  const fromAttr = document.documentElement.getAttribute("data-uid") || "";
  return (fromWindow || fromAttr || "—").toString();
}

function ensureFooterHost() {
  const host = document.getElementById("prettyResult");
  if (!host) return null;

  let footer = document.getElementById("lux-db-summary");
  if (!footer) {
    footer = document.createElement("div");
    footer.id = "lux-db-summary";
    // We style this to match the main page #userMsg blue box exactly
    footer.style.cssText = [
      "margin-top: 24px",
      "padding: 20px",
      "border-top: 1px solid #cce3f5", 
      "font-size: 1rem",
      "color: #134e6f",        // Darker blue text (matches main page)
      "background: #e7f2fb",   // The specific 'Blue Box' background color
      "border-radius: 0 0 12px 12px",
      "text-align: center",
      "line-height: 1.6"
    ].join(";");
    host.appendChild(footer);
  }
  return footer;
}

/**
 * Generates the Admin URLs (logic mirrored from lux-popover.js)
 */
function getAdminLinks(uid) {
  const base = "https://luxury-language-api.vercel.app/admin";
  const passages = "grandfather,rainbow,sentences,wordList";
  const fmt = (d) => d.toISOString().slice(0, 10);
  
  const now = new Date();
  const to = fmt(now);
  const from = fmt(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)); // last 14 days

  const q = `uid=${encodeURIComponent(uid)}`;
  const dateQ = `&from=${from}&to=${to}`;

  return {
    progress: `${base}/?${q}${dateQ}&smooth=7&passages=${encodeURIComponent(passages)}&limit=500`,
    attempts: `${base}/user.html?${q}${dateQ}&passages=${encodeURIComponent(passages)}&limit=500`,
    cohort: `${base}/overview.html?from=${from}&to=${to}&sort=last&limit=10000&passages=${encodeURIComponent(passages)}&quick=14`
  };
}

/**
 * showSummaryWithTracking
 * - Renders the summary.
 * - Injects the interactive "Database tracking" pill into the footer.
 */
export function showSummaryWithTracking({
  allPartsResults,
  currentParts,
} = {}) {
  // 1) Render Core Summary
  renderCoreSummary({
    allPartsResults,
    currentParts,
  });

  // 2) Prepare Footer
  const footer = ensureFooterHost();
  if (!footer) return;

  const uid = getLuxUID();
  const links = getAdminLinks(uid);

  // 3) Inject the HTML (Structure matches the main page popover exactly)
  footer.innerHTML = `
    <h3 style="margin: 0 0 12px 0; color: #0078d7; font-size: 1.3rem; font-weight: 800;">
      Long Term Analysis
    </h3>
    
    <div>
      The more recordings you make, the better the feedback will be 🤔 💭 💡 😮:
      
      <span class="lux-cta" tabindex="0" aria-haspopup="dialog" aria-expanded="false" style="margin-left: 4px;">
        database tracking
        
        <span class="lux-pop" role="dialog" aria-label="Database tracking details" style="text-align: left;">
          <strong style="display: block; margin-bottom: 6px">Your Practice History</strong>
          <p style="margin: 0 0 8px; color: #444; font-size: 13px">
            Jump to your long-term stats to see progress over time.
          </p>

          <div class="lux-uidrow">
            <span>UID:</span>
            <code style="font-family:monospace; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${uid.slice(0, 8)}...</code>
            <button id="lux-copy-footer" class="lux-btn" type="button">Copy</button>
            <small id="lux-copied-footer" class="lux-copied" aria-live="polite"></small>
          </div>

          <div class="lux-links">
            <a href="${links.attempts}" target="_blank" rel="noopener">Attempts (admin)</a>
            <a href="${links.progress}" target="_blank" rel="noopener">User Progress (admin)</a>
            <a href="${links.cohort}" target="_blank" rel="noopener">Cohort (admin)</a>
          </div>

          <small class="lux-note">Admin token required for these dashboards.</small>
        </span>
      </span>
    </div>
  `;

  // 4) Wire up the "Copy" button for this specific footer instance
  const copyBtn = document.getElementById("lux-copy-footer");
  const copyMsg = document.getElementById("lux-copied-footer");
  
  if (copyBtn) {
    copyBtn.onclick = async (e) => {
      e.stopPropagation(); // prevent closing popover immediately
      try {
        await navigator.clipboard.writeText(uid);
        if (copyMsg) {
          copyMsg.textContent = "Copied!";
          setTimeout(() => (copyMsg.textContent = ""), 1500);
        }
      } catch (err) {
        console.warn("Copy failed", err);
      }
    };
  }

  // 5) Wire up ARIA attributes for the footer interaction (Mouse/Keyboard)
  const cta = footer.querySelector(".lux-cta");
  if (cta) {
    const setEx = (v) => cta.setAttribute("aria-expanded", v);
    cta.addEventListener("mouseenter", () => setEx("true"));
    cta.addEventListener("mouseleave", () => setEx("false"));
    cta.addEventListener("focusin", () => setEx("true"));
    cta.addEventListener("focusout", () => setEx("false"));
  }
}