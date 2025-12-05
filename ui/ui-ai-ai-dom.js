// ui/ui-ai-ai-dom.js
// Handles DOM updates for the AI feedback panel.
// RESTORED: Robot Spinner + Blue Progress Line

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
    // RESTORED VISUALS:
    // 1. .ai-spinner class triggers the CSS rotation.
    // 2. .ai-progress class triggers the blue sliding line animation.
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

  // Render the requested number of sections
  const toShow = sections.slice(0, count);

  const html = toShow
    .map((sec) => {
      // Handle both new schema (sections) and fallback schema
      const title = sec.title || sec.emoji || "";
      const text = sec.en || sec.content || "";
      
      // L1 Translation Block
      const l1 = sec.l1
        ? `<div style="margin-top:6px; padding-top:6px; border-top:1px dashed #cbd5e1; color:#4b5563; font-size:0.95em">
             <em>${sec.l1}</em>
           </div>`
        : "";

      return `
      <div style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">${title}</div>
        <div style="color:#334155; line-height:1.5;">${mdToHtml(text)}</div>
        ${l1}
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

export function setShowMoreState({ visible }) {
  const btn = document.getElementById("showMoreBtn");
  if (btn) {
    btn.style.display = visible ? "block" : "none";
  }
}

export function onShowMore(callback) {
  const btn = document.getElementById("showMoreBtn");
  // Remove old listeners by cloning (simple reset trick)
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", callback);
  }
}

// Kept for backward compatibility
export function showAIFeedbackPlaceholder() {
  const { box } = getSectionAndBox();
  if (box) showLoading();
}

export function showAIFeedbackError(msg) {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = `<div style="color:#c00; padding:10px;">Error: ${msg}</div>`;
}

export function clearAIFeedback() {
  const { box } = getSectionAndBox();
  if (box) box.innerHTML = "";
}

/* ========================================================================
   Internal Helpers
   ======================================================================== */

export function renderAIFeedbackMarkdown(markdown) {
  const { box } = getSectionAndBox();
  if (!box) return;
  box.innerHTML = mdToHtml(markdown);
}

function mdToHtml(md = "") {
  if (!md.trim()) return "";
  let html = md
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Basic list handling
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