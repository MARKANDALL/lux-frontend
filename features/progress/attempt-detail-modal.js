// features/progress/attempt-detail-modal.js
// Restored "Attempt Details" modal (from old dashboard), used by new progress History.

function getColorConfig(s) {
  const n = Number(s) || 0;
  if (n >= 80) return { color: "#2563eb", bg: "#dbeafe" }; // Blue
  if (n >= 60) return { color: "#d97706", bg: "#fef3c7" }; // Yellow
  return { color: "#dc2626", bg: "#fee2e2" }; // Red
}

function mdToHtml(md = "") {
  if (!md) return "";
  return String(md)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split("\n")
    .join("<br>");
}

export function openDetailsModal(attempt, overallScore, dateStr) {
  const existing = document.getElementById("lux-detail-modal");
  if (existing) existing.remove();

  const sum = attempt?.summary || {};
  const acc = sum.acc ?? "?";
  const flu = sum.flu ?? "?";
  const comp = sum.comp ?? "?";
  const pron = sum.pron ?? Math.round(Number(overallScore) || 0);

  // Focus Words
  let troubleWordsHtml = `<p style="color:#94a3b8; font-style:italic;">No word details available.</p>`;
  if (Array.isArray(sum.words) && sum.words.length > 0) {
    const items = sum.words.slice(0, 5).map((w) => {
      const text = Array.isArray(w) ? w[0] : w?.w;
      const s = Array.isArray(w) ? w[1] : w?.s;
      const wordColor = getColorConfig(s).color;
      return `<li style="margin-bottom:4px;"><strong style="color:${wordColor};">${text}</strong> (${Math.round(Number(s)||0)}%)</li>`;
    }).join("");
    troubleWordsHtml = `<ul style="padding-left:20px; color:#475569;">${items}</ul>`;
  }

  // Modal shell
  const modal = document.createElement("div");
  modal.id = "lux-detail-modal";
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px);
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    background: white; width: 92%; max-width: 520px;
    border-radius: 16px; padding: 24px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.18);
    position: relative; max-height: 90vh; overflow-y: auto;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.cssText = `
    position: absolute; top: 16px; right: 16px;
    background: none; border: none; font-size: 1.6rem;
    cursor: pointer; color: #94a3b8;
  `;
  closeBtn.onclick = () => modal.remove();
  card.appendChild(closeBtn);

  const bigScoreColor = getColorConfig(pron).color;

  const header = document.createElement("div");
  header.innerHTML = `
    <div style="text-align:center; margin-bottom: 18px;">
      <h3 style="margin:0; color:#1e293b; font-size:1.25rem;">Attempt Details</h3>
      <p style="margin:4px 0 0; color:#64748b; font-size:0.9rem;">${dateStr || ""}</p>
    </div>

    <div style="display:flex; justify-content:center; margin-bottom: 18px;">
      <div style="
        width: 80px; height: 80px; border-radius: 50%;
        border: 4px solid ${bigScoreColor};
        display:flex; align-items:center; justify-content:center;
        font-size: 1.5rem; font-weight: 800; color:#334155;
      ">${Math.round(Number(pron)||0)}%</div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 18px; text-align:center;">
      <div style="background:#f8fafc; padding:8px; border-radius:8px;">
        <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Acc</div>
        <div style="font-weight:700; color:#334155;">${acc}%</div>
      </div>
      <div style="background:#f8fafc; padding:8px; border-radius:8px;">
        <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Flu</div>
        <div style="font-weight:700; color:#334155;">${flu}%</div>
      </div>
      <div style="background:#f8fafc; padding:8px; border-radius:8px;">
        <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">Comp</div>
        <div style="font-weight:700; color:#334155;">${comp}%</div>
      </div>
    </div>

    <div style="border-top:1px solid #e2e8f0; padding-top: 14px;">
      <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">Focus Words</h4>
      ${troubleWordsHtml}
    </div>
  `;
  card.appendChild(header);

  // AI Coach Memory (saved)
  const sections = sum?.ai_feedback?.sections;
  if (Array.isArray(sections) && sections.length) {
    const aiContainer = document.createElement("div");
    aiContainer.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;";

    aiContainer.innerHTML = `
      <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">🧠 AI Coach Memory</h4>
      <div style="max-height: 260px; overflow-y:auto;"></div>
    `;

    const listDiv = aiContainer.querySelector("div");
    sections.forEach((sec) => {
      const item = document.createElement("div");
      item.style.cssText = "background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:12px; margin-bottom:10px;";

      const titleEn = sec?.title || "Coach Tip";
      const contentL1 = sec?.l1;
      const contentEn = sec?.en || sec?.content || "";
      const hasL1 = !!contentL1;
      let isShowingL1 = hasL1;

      const header = document.createElement("div");
      header.style.cssText = "font-weight:800; color:#0369a1; font-size:0.9em; margin-bottom:6px;";
      header.textContent = `${sec?.emoji || "🤖"} ${titleEn}`;
      item.appendChild(header);

      const contentDiv = document.createElement("div");
      contentDiv.style.cssText = "color:#334155; font-size:0.9em; line-height:1.5;";
      contentDiv.innerHTML = mdToHtml(hasL1 ? contentL1 : contentEn);
      item.appendChild(contentDiv);

      if (hasL1) {
        const btn = document.createElement("button");
        btn.textContent = "Show English 🇺🇸";
        btn.style.cssText = "margin-top:8px; font-size:0.8em; padding:4px 8px; cursor:pointer; background:#fff; border:1px solid #bae6fd; border-radius:6px; color:#0284c7; font-weight:800;";
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

    card.appendChild(aiContainer);
  }

  modal.appendChild(card);
  document.body.appendChild(modal);

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}
