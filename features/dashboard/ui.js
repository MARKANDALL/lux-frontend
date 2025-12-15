// features/dashboard/ui.js
// Handles the DOM for the User History / Dashboard.
// STATUS: LOCKED to Universal Blue/Yellow/Red Schema (80/60).
// UPDATED: Added sticky header, max-height container, and custom scrollbar.

export function renderDashboard(targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-shell" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f1f5f9;">
      <h2 style="color: #334155; font-size: 1.5rem; margin-bottom: 20px;">
        📊 My Progress
      </h2>
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

  // 1. Build the Scrollable Container
  // We wrap the table in this div to enforce height limits
  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "custom-scrollbar";
  scrollWrapper.style.cssText = "max-height: 400px; overflow-y: auto; position: relative;";

  // 2. Build Table
  const table = document.createElement("table");
  table.style.cssText = "width: 100%; border-collapse: collapse; text-align: left;";
  
  // Sticky Header Style
  // We apply sticky to the th elements to ensure they stay put
  const stickyHeaderStyle = "position: sticky; top: 0; z-index: 10; background: #f8fafc; color: #475569; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";

  table.innerHTML = `
    <thead>
      <tr>
        <th style="${stickyHeaderStyle} padding: 12px 16px;">Date</th>
        <th style="${stickyHeaderStyle} padding: 12px 16px;">Passage</th>
        <th style="${stickyHeaderStyle} padding: 12px 16px;">Score</th>
        <th style="${stickyHeaderStyle} padding: 12px 16px;">Details</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  // 3. Generate Rows
  attempts.forEach(attempt => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #e2e8f0";
    tr.style.fontSize = "0.95rem";

    const dateObj = new Date(attempt.ts || attempt.created_at || Date.now());
    const dateStr = dateObj.toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
    });

    // Score Logic
    let score = 0;
    const sum = attempt.summary || {};
    if (sum.pron !== undefined) score = sum.pron;
    else if (attempt.azureResult?.NBest?.[0]?.PronScore) score = attempt.azureResult.NBest[0].PronScore;
    
    const hasAI = sum.ai_feedback && sum.ai_feedback.sections && sum.ai_feedback.sections.length > 0;
    const aiIcon = hasAI ? `<span title="Has AI Coaching" style="font-size:0.8em; margin-left:4px;">🤖</span>` : "";

    // Color Logic (Universal Schema)
    const { color, bg } = getColorConfig(score);

    const fullText = attempt.text || attempt.passage_key || "No text";
    const shortText = fullText.length > 35 ? fullText.substring(0, 35) + "..." : fullText;

    tr.innerHTML = `
      <td style="padding: 12px 16px; color: #64748b;">${dateStr}</td>
      <td style="padding: 12px 16px; font-weight: 500; color: #334155;">${shortText}</td>
      <td style="padding: 12px 16px;">
        <span style="background: ${bg}; color: ${color}; padding: 4px 8px; border-radius: 999px; font-weight: 700; font-size: 0.85rem;">
          ${Math.round(score)}%
        </span>
        ${aiIcon}
      </td>
      <td style="padding: 12px 16px;">
         <button class="detail-btn" style="background:none; border:none; font-size: 1.2rem; cursor: pointer; opacity: 0.7;">👉</button>
      </td>
    `;

    const btn = tr.querySelector(".detail-btn");
    btn.onclick = () => openDetailsModal(attempt, score, dateStr);

    tbody.appendChild(tr);
  });

  scrollWrapper.appendChild(table);
  listEl.innerHTML = "";
  listEl.appendChild(scrollWrapper);
}

export function renderError(msg) {
  const listEl = document.getElementById("history-list");
  if (listEl) listEl.innerHTML = `<div style="padding:20px; color:#ef4444; text-align:center;">${msg}</div>`;
}

// --- Internal Modal Logic ---

function openDetailsModal(attempt, overallScore, dateStr) {
  const existing = document.getElementById("lux-detail-modal");
  if (existing) existing.remove();

  const sum = attempt.summary || {};
  const acc = sum.acc ?? "?";
  const flu = sum.flu ?? "?";
  const comp = sum.comp ?? "?";
  const pron = sum.pron ?? Math.round(overallScore);
  
  // 1. Trouble Words HTML (Color Coded via Universal Schema)
  let troubleWordsHtml = `<p style="color:#94a3b8; font-style:italic;">No word details available.</p>`;
  if (Array.isArray(sum.words) && sum.words.length > 0) {
    const listItems = sum.words.slice(0, 5).map(w => {
        const text = Array.isArray(w) ? w[0] : w.w;
        const s = Array.isArray(w) ? w[1] : w.s;
        const wordColor = getColorConfig(s).color; 
        return `<li style="margin-bottom:4px;"><strong style="color:${wordColor};">${text}</strong> (${s}%)</li>`;
    }).join("");
    troubleWordsHtml = `<ul style="padding-left:20px; color:#475569;">${listItems}</ul>`;
  }

  // 2. Build Modal
  const modal = document.createElement("div");
  modal.id = "lux-detail-modal";
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px);
  `;

  // Inner Card
  const card = document.createElement("div");
  card.style.cssText = "background: white; width: 90%; max-width: 450px; border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position: relative; max-height:90vh; overflow-y:auto;";
  
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = "position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;";
  closeBtn.onclick = () => modal.remove();
  card.appendChild(closeBtn);

  // Big Score Color
  const bigScoreColor = getColorConfig(pron).color;

  // Header
  const staticContent = document.createElement("div");
  staticContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #1e293b; font-size: 1.25rem;">Attempt Details</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 0.9rem;">${dateStr}</p>
      </div>

      <div style="display: flex; justify-content: center; margin-bottom: 24px;">
        <div style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid ${bigScoreColor}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: #334155;">
          ${pron}%
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 24px; text-align: center;">
        <div style="background: #f8fafc; padding: 8px; border-radius: 8px;">
          <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Acc</div>
          <div style="font-weight:600; color:#334155;">${acc}%</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 8px;">
          <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Flu</div>
          <div style="font-weight:600; color:#334155;">${flu}%</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 8px;">
          <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Comp</div>
          <div style="font-weight:600; color:#334155;">${comp}%</div>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <h4 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #334155;">Focus Words</h4>
        ${troubleWordsHtml}
      </div>
  `;
  card.appendChild(staticContent);

  // 3. Saved AI Sections
  if (sum.ai_feedback && sum.ai_feedback.sections && sum.ai_feedback.sections.length > 0) {
    const sections = sum.ai_feedback.sections;
    
    const aiContainer = document.createElement("div");
    aiContainer.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;";
    
    const aiTitle = document.createElement("h4");
    aiTitle.textContent = "🧠 AI Coach Memory";
    aiTitle.style.cssText = "margin: 0 0 10px 0; font-size: 0.95rem; color: #334155;";
    aiContainer.appendChild(aiTitle);

    const listDiv = document.createElement("div");
    listDiv.style.cssText = "max-height: 250px; overflow-y: auto;";

    sections.forEach(sec => {
        const item = document.createElement("div");
        item.style.cssText = "background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:12px; margin-bottom:10px;";

        const titleL1 = sec.titleL1 || "";
        const titleEn = sec.title || "Coach Tip";
        const contentL1 = sec.l1;
        const contentEn = sec.en || sec.content;
        
        const hasL1 = !!contentL1;
        let isShowingL1 = hasL1;

        const header = document.createElement("div");
        header.style.cssText = "font-weight:700; color:#0369a1; font-size:0.9em; margin-bottom:6px;";
        header.textContent = `${sec.emoji || "🤖"} ${titleEn}`; 
        item.appendChild(header);

        const contentDiv = document.createElement("div");
        contentDiv.style.cssText = "color:#334155; font-size:0.9em; line-height:1.5;";
        contentDiv.innerHTML = mdToHtml(hasL1 ? contentL1 : contentEn);
        item.appendChild(contentDiv);

        if (hasL1) {
            const btn = document.createElement("button");
            btn.textContent = "Show English 🇺🇸";
            btn.style.cssText = "margin-top:8px; font-size:0.8em; padding:4px 8px; cursor:pointer; background:#fff; border:1px solid #bae6fd; border-radius:4px; color:#0284c7;";
            
            btn.onclick = () => {
                if (isShowingL1) {
                    contentDiv.innerHTML = mdToHtml(contentEn);
                    btn.textContent = "Show Original ↩️";
                    isShowingL1 = false;
                } else {
                    contentDiv.innerHTML = mdToHtml(contentL1);
                    btn.textContent = "Show English 🇺🇸";
                    isShowingL1 = true;
                }
            };
            item.appendChild(btn);
        }

        listDiv.appendChild(item);
    });

    aiContainer.appendChild(listDiv);
    card.appendChild(aiContainer);
  }

  modal.appendChild(card);
  document.body.appendChild(modal);
  modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
}

// --- Helpers ---

// UNIVERSAL COLOR SCHEMA: 80/60
function getColorConfig(s) {
  if (s >= 80) return { color: "#2563eb", bg: "#dbeafe" }; // Blue
  if (s >= 60) return { color: "#d97706", bg: "#fef3c7" }; // Yellow
  return { color: "#dc2626", bg: "#fee2e2" }; // Red
}

function mdToHtml(md = "") {
  if (!md) return "";
  let html = md
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  return html.split("\n").join("<br>");
}