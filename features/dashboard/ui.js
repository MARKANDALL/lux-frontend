// features/dashboard/ui.js
// Handles the DOM for the User History / Dashboard.

export function renderDashboard(targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-shell" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f1f5f9;">
      <h2 style="color: #334155; font-size: 1.5rem; margin-bottom: 20px;">
        📊 My Progress
      </h2>
      <div id="dashboard-stats" style="display:flex; gap:15px; margin-bottom:20px;">
        </div>
      <div id="history-list" style="background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="padding: 20px; text-align: center; color: #94a3b8;">Loading history...</div>
      </div>
    </div>
  `;
}

export function renderHistoryRows(attempts) {
  const listEl = document.getElementById("history-list");
  if (!listEl) return;

  if (!attempts || attempts.length === 0) {
    listEl.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #64748b;">
        <p>No recordings yet.</p>
        <p style="font-size: 0.9em;">Practice a passage to see your progress here!</p>
      </div>
    `;
    return;
  }

  // Header
  let html = `
    <table style="width: 100%; border-collapse: collapse; text-align: left;">
      <thead style="background: #f8fafc; color: #475569; font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">
        <tr>
          <th style="padding: 12px 16px;">Date</th>
          <th style="padding: 12px 16px;">Passage</th>
          <th style="padding: 12px 16px;">Score</th>
          <th style="padding: 12px 16px;">Details</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Rows
  html += attempts.map(attempt => {
    // 1. Format Date
    const dateObj = new Date(attempt.created_at || attempt.localTime || Date.now());
    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

    // 2. Parse Score (Handle complexity of Azure object)
    let score = 0;
    if (attempt.azureResult) {
        // If it's the raw Azure JSON
        score = attempt.azureResult.NBest?.[0]?.PronScore || 0;
    } else if (attempt.score) {
        // If your backend flattened it
        score = attempt.score;
    }

    // 3. Color Logic
    const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
    const badgeBg = score >= 80 ? "#d1fae5" : score >= 60 ? "#fef3c7" : "#fee2e2";

    // 4. Truncate Text
    const fullText = attempt.text || "No text";
    const shortText = fullText.length > 30 ? fullText.substring(0, 30) + "..." : fullText;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 0.95rem;">
        <td style="padding: 12px 16px; color: #64748b;">${dateStr}</td>
        <td style="padding: 12px 16px; font-weight: 500; color: #334155;">
          ${shortText}
        </td>
        <td style="padding: 12px 16px;">
          <span style="background: ${badgeBg}; color: ${color}; padding: 4px 8px; border-radius: 99px; font-weight: 700; font-size: 0.85rem;">
            ${Math.round(score)}%
          </span>
        </td>
        <td style="padding: 12px 16px;">
           <span style="font-size: 1.2rem; cursor: pointer; opacity: 0.5;">👉</span>
        </td>
      </tr>
    `;
  }).join("");

  html += `</tbody></table>`;
  listEl.innerHTML = html;
}

export function renderError(msg) {
  const listEl = document.getElementById("history-list");
  if (listEl) {
    listEl.innerHTML = `<div style="padding:20px; color:#ef4444; text-align:center;">${msg}</div>`;
  }
}