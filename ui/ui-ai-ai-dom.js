// ui/ui-ai-ai-dom.js
// Handles DOM updates for the AI feedback panel.
// UPDATED: Fixes "Stuck Loading" and adds "Show Less".

function getSectionAndBox() {
  const section = document.getElementById("aiFeedbackSection");
  const box = document.getElementById("aiFeedback");
  return { section, box };
}

/**
 * Helper: Ensures the Footer Button Container exists
 */
function getFooterContainer() {
  const { section } = getSectionAndBox();
  if (!section) return null;

  let footer = document.getElementById("aiFeedbackFooter");
  if (!footer) {
    footer = document.createElement("div");
    footer.id = "aiFeedbackFooter";
    footer.style.cssText = "display: flex; justify-content: center; gap: 12px; margin: 20px auto 10px auto;";
    section.appendChild(footer);
  }
  return footer;
}

/* ========================================================================
   Public API
   ======================================================================== */

export function hideAI() {
  const { section } = getSectionAndBox();
  if (section) section.style.display = "none";
}

/**
 * Renders the "Quick vs Deep" entry buttons
 */
export function renderEntryButtons({ onQuick, onDeep }) {
  const { section, box } = getSectionAndBox();
  if (section) section.style.display = "";
  
  // Hide footer while making choice
  const footer = document.getElementById("aiFeedbackFooter");
  if (footer) footer.style.display = "none";

  if (!box) return;

  // Clear previous content
  box.innerHTML = "";
  box.style.display = "block";

  // Create container
  const wrap = document.createElement("div");
  wrap.style.cssText = "text-align:center; padding:10px 0;";

  const title = document.createElement("h3");
  title.textContent = "AI Coach (Optional)";
  title.style.cssText = "margin: 0 0 12px 0; color: #334155; font-size: 1.1rem;";
  wrap.appendChild(title);

  // Buttons Container
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex; justify-content:center; gap:12px; flex-wrap:wrap;";

  // Quick Button
  const btnQuick = document.createElement("button");
  btnQuick.innerHTML = "⚡ Quick Tips";
  btnQuick.style.cssText = `
    background: #fff; border: 1px solid #cbd5e1; color: #0f172a;
    padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: all 0.2s;
  `;
  btnQuick.onmouseover = () => btnQuick.style.borderColor = "#94a3b8";
  btnQuick.onmouseout = () => btnQuick.style.borderColor = "#cbd5e1";
  btnQuick.onclick = onQuick;

  // Deep Button
  const btnDeep = document.createElement("button");
  btnDeep.innerHTML = "🎓 Deep Dive";
  btnDeep.style.cssText = `
    background: #0078d7; border: 1px solid #0078d7; color: #fff;
    padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,120,215,0.2); transition: all 0.2s;
  `;
  btnDeep.onmouseover = () => btnDeep.style.background = "#006bbd";
  btnDeep.onmouseout = () => btnDeep.style.background = "#0078d7";
  btnDeep.onclick = onDeep;

  btnRow.appendChild(btnQuick);
  btnRow.appendChild(btnDeep);
  wrap.appendChild(btnRow);
  box.appendChild(wrap);
}

export function showLoading() {
  const { section, box } = getSectionAndBox();
  if (section) section.style.display = "";
  if (box) {
    box.style.display = "";
    box.innerHTML = `
      <div style="text-align:center; padding: 15px;">
         <div class="ai-spinner" style="font-size: 2.5rem; display:inline-block; margin-bottom:12px;">🤖</div>
         <div style="font-weight:600; color:#475569; margin-bottom:10px;">AI Coach is analyzing...</div>
         <div class="ai-progress"></div>
      </div>
    `;
  }
}

export function renderSections(sections, count) {
  const { section, box } = getSectionAndBox();
  if (section) section.style.display = "";
  if (!box) return { shown: 0, moreAvailable: false };

  const toShow = sections.slice(0, count);

  const html = toShow
    .map((sec, idx) => {
      const titleEn = sec.title || sec.emoji || ""; 
      const textEn = sec.en || sec.content || "";   
      const titleL1 = sec.titleL1 || "";       
      const textL1 = sec.l1;                        
      const hasL1 = !!textL1;

      const icon = sec.emoji ? `<span style="margin-right:6px;">${sec.emoji}</span>` : "";
      let headerHTML = `${icon} ${titleEn}`;
      
      if (titleL1 && titleL1 !== titleEn) {
        headerHTML += ` — ${titleL1}`;
      }

      const primaryText = hasL1 ? textL1 : textEn;

      let englishBlock = "";
      if (hasL1) {
        englishBlock = `
          <button class="toggle-en-btn" style="margin-top:10px;" onclick="
            const el = document.getElementById('en-block-${idx}');
            const isHidden = el.classList.contains('hidden');
            el.classList.toggle('hidden');
            this.textContent = isHidden ? 'Hide English translation' : 'See English translation';
          ">See English translation</button>
          
          <div id="en-block-${idx}" class="en-text hidden" style="
            margin-top:10px; 
            padding:12px; 
            background:#f8fafc; 
            border-radius:8px; 
            border:1px solid #e2e8f0; 
            color:#475569;
            font-style: italic;
            font-size: 0.95em;
          ">
            <div style="font-weight:700; margin-bottom:4px; color:#334155; font-style:normal;">${titleEn}</div>
            ${mdToHtml(textEn)}
          </div>
        `;
      }

      return `
      <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:800; color:#009688; margin-bottom:10px; font-size:1.2em; line-height:1.4;">
           ${headerHTML}
        </div>
        <div style="color:#0f172a; line-height:1.6; font-size:1.15em; font-weight:700;">
           ${mdToHtml(primaryText)}
        </div>
        ${englishBlock}
      </div>
    `;
    })
    .join("");

  box.innerHTML = html;

  return {
    shown: toShow.length,
    moreAvailable: count < sections.length,
  };
}

/**
 * UPDATED: Centralized Footer Button Management
 */
export function updateFooterButtons({ 
  onShowMore, 
  onShowLess, 
  canShowMore, 
  canShowLess, 
  isLoading 
}) {
  const footer = getFooterContainer();
  if (!footer) return;
  
  footer.innerHTML = "";
  footer.style.display = "flex";

  // --- Show More Button ---
  if (canShowMore) {
    const btnMore = document.createElement("button");
    btnMore.textContent = isLoading ? "Loading..." : "Show Next Chunk ⬇";
    btnMore.disabled = isLoading;
    
    btnMore.style.cssText = `
      padding: 8px 20px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      color: #475569;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    `;
    btnMore.onmouseover = () => { if(!btnMore.disabled) btnMore.style.background = "#e2e8f0"; };
    btnMore.onmouseout = () => { if(!btnMore.disabled) btnMore.style.background = "#f1f5f9"; };
    
    if (onShowMore) btnMore.onclick = onShowMore;
    footer.appendChild(btnMore);
  }

  // --- Show Less Button ---
  if (canShowLess && !isLoading) { // Don't allow collapse while loading
    const btnLess = document.createElement("button");
    btnLess.textContent = "Show Less ⬆";
    
    btnLess.style.cssText = `
      padding: 8px 20px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      color: #64748b;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    `;
    btnLess.onmouseover = () => { btnLess.style.color = "#ef4444"; btnLess.style.borderColor = "#fca5a5"; };
    btnLess.onmouseout = () => { btnLess.style.color = "#64748b"; btnLess.style.borderColor = "#e2e8f0"; };
    
    if (onShowLess) btnLess.onclick = onShowLess;
    footer.appendChild(btnLess);
  }
}

export function showAIFeedbackPlaceholder() { showLoading(); }

export function showAIFeedbackError(msg) {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = `<div style="color:#c00; padding:10px;">Error: ${msg}</div>`;
}

export function clearAIFeedback() {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = "";
  const footer = document.getElementById("aiFeedbackFooter");
  if (footer) footer.innerHTML = "";
}

export function renderAIFeedbackMarkdown(md) {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = mdToHtml(md);
}

function mdToHtml(md = "") {
  if (!md || !md.trim()) return "";
  let html = md
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  if (html.includes("- ")) {
    html = html
      .split("\n")
      .map((line) => {
        return line.trim().startsWith("- ")
          ? `<li>${line.trim().substring(2)}</li>`
          : line;
      })
      .join("<br>");
  }
  return html;
}