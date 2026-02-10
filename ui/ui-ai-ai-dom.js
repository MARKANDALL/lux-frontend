// ui/ui-ai-ai-dom.js
// Handles DOM updates for the AI feedback panel.
// UPDATED: Implements persistent Sidebar and SCROLLABLE content area.

function getSectionAndBox() {
  const section = document.getElementById("aiFeedbackSection");
  const box = document.getElementById("aiFeedback");
  return { section, box };
}

function getCoachDrawerEl() {
  const { section } = getSectionAndBox();
  return section ? section.closest("details") : null;
}

export function openAICoachDrawer() {
  const d = getCoachDrawerEl();
  if (d) d.open = true;
}

export function collapseAICoachDrawer() {
  const d = getCoachDrawerEl();
  if (d) d.open = false;
}

// --- Layout Builder (The Sidebar + Scrollable Content) ---
function ensureShell(box, onPersonaChange) {
  // If the shell exists, just return the content area
  const existingContent = box.querySelector(".ai-content");
  if (existingContent) {
    // If we provided a callback, ensure the buttons are wired up to it
    if (onPersonaChange) wireSidebarButtons(box, onPersonaChange);
    return existingContent;
  }

  // Otherwise, build the Grid Layout
  box.innerHTML = "";
  box.classList.add("ai-grid-container");

  // 1. Sidebar (Persistent)
  const sidebar = document.createElement("div");
  sidebar.className = "ai-sidebar";

  const label = document.createElement("div");
  label.className = "ai-sidebar-label";
  label.textContent = "Coach Style";
  sidebar.appendChild(label);

  // The Buttons (Drill / Tutor / Expert)
  const modes = [
    { id: "tutor", icon: "🧑‍🏫", label: "Tutor" },
    { id: "drill", icon: "🫡", label: "Sgt." },
    { id: "linguist", icon: "🧐", label: "Expert" },
  ];

  modes.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = `ai-voice-btn ${m.id === "tutor" ? "active" : ""}`; // Default to tutor
    btn.dataset.value = m.id;
    btn.innerHTML = `<span>${m.icon}</span> <span>${m.label}</span>`;
    sidebar.appendChild(btn);
  });

  // 2. Main Content Area (Dynamic & Scrollable)
  const content = document.createElement("div");
  content.className = "ai-content custom-scrollbar";

  // THE FIX: Constrain height and allow scrolling
  content.style.cssText = `
    max-height: 450px; 
    overflow-y: auto; 
    padding: 20px; 
    background: #fff; 
    display: flex; 
    flex-direction: column;
  `;

  box.appendChild(sidebar);
  box.appendChild(content);

  // Wire events
  if (onPersonaChange) wireSidebarButtons(box, onPersonaChange);

  return content;
}

function wireSidebarButtons(box, callback) {
  const sidebar = box.querySelector(".ai-sidebar");
  if (!sidebar) return;

  const buttons = sidebar.querySelectorAll(".ai-voice-btn");
  buttons.forEach((btn) => {
    // Remove old listeners to prevent duplicates (simple cloning trick)
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
      // Visual toggle
      sidebar.querySelectorAll(".ai-voice-btn").forEach((b) => b.classList.remove("active"));
      newBtn.classList.add("active");
      // Trigger logic
      callback(newBtn.dataset.value);
    };
  });
}

// Helper to get current persona from the DOM state
export function getCurrentPersona() {
  const activeBtn = document.querySelector(".ai-voice-btn.active");
  return activeBtn ? activeBtn.dataset.value : "tutor";
}

// ---------------------------

export function hideAI() {
  const { section } = getSectionAndBox();
  if (section) section.style.display = ""; // keep summary visible
  collapseAICoachDrawer();
}

// UPDATED: Now uses Sidebar instead of Dropdown
export function renderEntryButtons({ onQuick, onDeep, onPersonaChange }) {
  const { section, box } = getSectionAndBox();
  if (section) section.style.display = "";
  if (!box) return;

  // Build/Get the Shell
  const contentArea = ensureShell(box, onPersonaChange);

  // Clear only the content area
  contentArea.innerHTML = "";
  box.style.display = "grid"; // Activate CSS Grid if hidden

  const wrap = document.createElement("div");
  wrap.style.cssText = "text-align:center; padding:10px 0;";

  const title = document.createElement("h3");
  title.textContent = "AI Analysis";
  title.style.cssText = "margin: 0 0 16px 0; color: #334155; font-size: 1.2rem;";
  wrap.appendChild(title);

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex; justify-content:center; gap:12px; flex-wrap:wrap;";

  // Quick Button
  const btnQuick = document.createElement("button");
  btnQuick.innerHTML = "⚡ Quick Tips";
  btnQuick.className = "ai-action-btn secondary";
  btnQuick.onclick = () => {
    const p = getCurrentPersona();
    if (onQuick) onQuick(p);
  };

  // Deep Button
  const btnDeep = document.createElement("button");
  btnDeep.innerHTML = "🎓 Deep Dive";
  btnDeep.className = "ai-action-btn primary";
  btnDeep.onclick = () => {
    const p = getCurrentPersona();
    if (onDeep) onDeep(p);
  };

  btnRow.appendChild(btnQuick);
  btnRow.appendChild(btnDeep);
  wrap.appendChild(btnRow);
  contentArea.appendChild(wrap);
}

export function showLoading() {
  const { section, box } = getSectionAndBox();
  if (section) section.style.display = "";
  openAICoachDrawer();

  // Ensure shell exists (in case we jump straight here)
  const contentArea = ensureShell(box, null);

  contentArea.innerHTML = `
      <div style="text-align:center; padding: 40px 15px;">
         <div class="ai-spinner" style="font-size: 2.5rem; display:inline-block; margin-bottom:12px;">🤖</div>
         <div style="font-weight:600; color:#475569; margin-bottom:10px;">Analyzing...</div>
         <div class="ai-progress"></div>
      </div>
  `;
}

export function renderSections(sections, count) {
  const { section, box } = getSectionAndBox();
  if (section) section.style.display = "";

  const contentArea = ensureShell(box, null);

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

      let englishBlock = "";
      if (hasL1) {
        englishBlock = `
          <button class="toggle-en-btn" style="margin-top:10px;" onclick="
            const el = document.getElementById('en-block-${idx}');
            el.classList.toggle('hidden');
          ">Show/Hide English</button>
          <div id="en-block-${idx}" class="en-text hidden" style="margin-top:10px; padding:10px; background:#f1f5f9; border-radius:6px; font-size:0.9em;">
            <div style="font-weight:700; margin-bottom:4px; color:#334155; font-style:normal;">${titleEn}</div>
            ${mdToHtml(textEn)}
          </div>
        `;
      }

      return `
      <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #e2e8f0;">
        <div style="font-weight:800; color:#0f766e; margin-bottom:8px; font-size:1.15em;">
           ${headerHTML}
        </div>
        <div style="color:#334155; line-height:1.6;">
           ${mdToHtml(hasL1 ? textL1 : textEn)}
        </div>
        ${englishBlock}
      </div>
    `;
    })
    .join("");

  contentArea.innerHTML = html;

  // Create a Footer specifically for this content area
  const footer = document.createElement("div");
  footer.id = "ai-internal-footer";
  footer.style.marginTop = "20px";
  footer.style.textAlign = "center";
  contentArea.appendChild(footer);

  return { shown: toShow.length };
}

export function updateFooterButtons({
  onShowMore,
  onShowLess,
  canShowMore,
  canShowLess,
  isLoading,
  lessLabel = "Back ⬆",
}) {
  const footer = document.getElementById("ai-internal-footer");
  if (!footer) return;

  footer.innerHTML = "";
  footer.style.display = "flex";
  footer.style.justifyContent = "center";
  footer.style.gap = "10px";

  if (canShowMore) {
    const btn = document.createElement("button");
    btn.textContent = isLoading ? "Loading..." : "More ⬇";
    btn.className = "toggle-en-btn"; // Reuse existing style
    if (!isLoading) btn.onclick = onShowMore;
    footer.appendChild(btn);
  }

  if (canShowLess) {
    const btn = document.createElement("button");
    btn.textContent = lessLabel;
    btn.className = "toggle-en-btn";
    btn.onclick = onShowLess;
    footer.appendChild(btn);
  }
}

export function showAIFeedbackError(msg) {
  const { box } = getSectionAndBox();
  const contentArea = ensureShell(box, null);
  const safeMsg = escapeHtml(msg);
  contentArea.innerHTML = `<div style="color:#c00; padding:20px;">Error: ${safeMsg}</div>`;
}

export function clearAIFeedback() {
  const { box } = getSectionAndBox();
  const contentArea = ensureShell(box, null);
  contentArea.innerHTML = "";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// RESTORED FUNCTION
export function renderAIFeedbackMarkdown(md) {
  const { box } = getSectionAndBox();
  // Ensure we render inside the content area, not destroying the sidebar
  const contentArea = ensureShell(box, null);
  contentArea.innerHTML = mdToHtml(md);
}

// RESTORED HELPER
function mdToHtml(md = "") {
  if (!md || !md.trim()) return "";
  let html = escapeHtml(md)
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
