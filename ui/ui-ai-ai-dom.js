// ui/ui-ai-ai-dom.js
// Handles DOM updates for the AI feedback panel.
// STATE: GOLD STANDARD FINAL (Teal Headers, No Default Emojis, Bold L1) + Toggle Button Logic

function getSectionAndBox() {
  const section = document.getElementById("aiFeedbackSection");
  const box = document.getElementById("aiFeedback");
  return { section, box };
}

/* ========================================================================
   Public API
   ======================================================================== */

export function hideAI() {
  const { section } = getSectionAndBox();
  if (section) section.style.display = "none";
}

export function showLoading() {
  const { section, box } = getSectionAndBox();
  if (section) section.style.display = "";
  if (box) {
    box.style.display = "";
    // Robot Spinner + Blue Line (Restored)
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
      // 1. Data Prep
      const titleEn = sec.title || sec.emoji || ""; 
      const textEn = sec.en || sec.content || "";   
      const titleL1 = sec.titleL1 || "";       
      const textL1 = sec.l1;                        
      
      const hasL1 = !!textL1;

      // 2. Build Header
      // Logic: Only show emoji if provided. Use Teal color (#009688) for Gold look.
      const icon = sec.emoji ? `<span style="margin-right:6px;">${sec.emoji}</span>` : "";
      
      let headerHTML = `${icon} ${titleEn}`;
      
      if (titleL1 && titleL1 !== titleEn) {
        headerHTML += ` — ${titleL1}`;
      }

      // 3. Content Logic: L1 is King
      const primaryText = hasL1 ? textL1 : textEn;

      // 4. Build the English "Reveal" Block
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

      // 5. Render Card
      // Font-weight 700 for Primary Text to match "Gold" visibility
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

// UPDATED: Now accepts 'text' to change the button label dynamically
export function setShowMoreState({ visible, text }) {
  const btn = document.getElementById("showMoreBtn");
  if (btn) {
    btn.style.display = visible ? "block" : "none";
    if (text) btn.textContent = text;
  }
}

export function onShowMore(callback) {
  const btn = document.getElementById("showMoreBtn");
  if (btn) {
    // Clone to remove old listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", callback);
  }
}

// Backward compatibility exports (Safe to keep for now)
export function showAIFeedbackPlaceholder() { showLoading(); }
export function showAIFeedbackError(msg) {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = `<div style="color:#c00; padding:10px;">Error: ${msg}</div>`;
}
export function clearAIFeedback() {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = "";
}
export function renderAIFeedbackMarkdown(md) {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = mdToHtml(md);
}

/* ========================================================================
   Internal Helpers
   ======================================================================== */

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