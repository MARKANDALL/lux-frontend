// ui/ui-ai-ai-dom.js
// DOM-only helpers for the AI feedback panel. No network/state here.
// - Targets #aiFeedbackSection > #aiFeedback (see index.html).
// - Knows how to show: placeholder, loading, error, and markdown-ish content.
// - Pure browser DOM; no window globals exported.

/* ------------ internal helpers ------------ */

function getSectionAndBox() {
  const section = document.getElementById("aiFeedbackSection");
  const box = document.getElementById("aiFeedback");
  if (!box) return { section: null, box: null };

  if (section) {
    // Make sure the wrapper is visible any time we touch the box.
    section.style.display = "";
  }
  return { section, box };
}

// Very small MD → HTML tailored for our AI feedback responses.
// Supports:
// - blank-line separated paragraphs
// - lines starting with "- " or "* " as bullet lists
// - **bold** and *italic* spans
function mdToHtml(md = "") {
  if (!md.trim()) return "";

  const lines = md.split(/\r?\n/);
  const blocks = [];
  let currentList = null;

  function flushList() {
    if (currentList && currentList.length) {
      const items = currentList
        .map((li) => `<li>${inlineFormat(li)}</li>`)
        .join("");
      blocks.push(`<ul>${items}</ul>`);
    }
    currentList = null;
  }

  function inlineFormat(text) {
    if (!text) return "";
    let html = text;

    // **bold**
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // *italic*
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    return html;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      // paragraph break / end of list
      flushList();
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      if (!currentList) currentList = [];
      currentList.push(listMatch[1]);
      continue;
    }

    // Normal paragraph
    flushList();
    blocks.push(`<p>${inlineFormat(line.trim())}</p>`);
  }

  flushList();
  return blocks.join("\n");
}

/* ------------ exported DOM helpers ------------ */

export function showAIFeedbackPlaceholder() {
  const { box } = getSectionAndBox();
  if (!box) return;

  box.innerHTML =
    "<div style='color:#6b7280;font-size:0.9rem;font-style:italic;'>AI feedback will appear here after your recording is analyzed.</div>";
}

export function showAIFeedbackLoading() {
  const { box } = getSectionAndBox();
  if (!box) return;

  box.innerHTML = `
    <div style="display:flex;align-items:center;font-size:0.9rem;color:#334155;">
      <div style="
        width:16px;
        height:16px;
        border-radius:999px;
        border:2px solid #93c5fd;
        border-top-color:#1d4ed8;
        margin-right:8px;
        animation:lux-ai-spin 0.8s linear infinite;
      "></div>
      <span>AI feedback loading…</span>
    </div>
  `;
}

export function renderAIFeedbackMarkdown(markdown) {
  const { box } = getSectionAndBox();
  if (!box) return;

  const html = mdToHtml(markdown || "");
  if (!html) {
    showAIFeedbackPlaceholder();
    return;
  }

  box.innerHTML = html;
}

export function showAIFeedbackError(message = "AI feedback is temporarily unavailable.") {
  const { box } = getSectionAndBox();
  if (!box) return;

  box.innerHTML = `
    <div style="color:#b91c1c;font-size:0.9rem;">
      <strong>AI feedback error</strong><br/>
      <span style="font-size:0.86rem;">${message}</span>
    </div>
  `;
}

export function clearAIFeedback() {
  const { box } = getSectionAndBox();
  if (!box) return;
  box.innerHTML = "";
}
