// features/progress/attempt-detail/ai-coach-section.js
// Builds the "AI Coach Memory" section for the Attempt Details modal.

import { pickTS, pickSummary } from "../attempt-pickers.js";
import { mdToHtml } from "../progress-utils.js";
import { fmtDateTime } from "./format.js";

export function buildAiCoachMemorySection(list) {
  // AI Coach Memory (across session)
  const aiAttemptGroups = (list || [])
    .map((a) => {
      const sum = pickSummary(a) || {};
      const secs = sum?.ai_feedback?.sections;
      if (!Array.isArray(secs) || !secs.length) return null;
      return { ts: pickTS(a), sections: secs };
    })
    .filter(Boolean);

  if (!aiAttemptGroups.length) return null;

  const totalSecs = aiAttemptGroups.reduce((n, g) => n + (g.sections?.length || 0), 0);

  const aiContainer = document.createElement("div");
  aiContainer.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";

  aiContainer.innerHTML = `
    <details>
      <summary style="cursor:pointer; font-weight:900; color:#334155;">🧠 AI Coach Memory (${totalSecs})</summary>
      <div style="margin-top:10px; max-height: 320px; overflow-y:auto;"></div>
    </details>
  `;

  const listDiv = aiContainer.querySelector("details > div");

  aiAttemptGroups.forEach((g) => {
    const groupHead = document.createElement("div");
    groupHead.style.cssText = "margin:12px 0 8px; font-weight:900; color:#64748b;";
    groupHead.textContent = fmtDateTime(g.ts);
    listDiv.appendChild(groupHead);

    g.sections.forEach((sec) => {
      const item = document.createElement("div");
      item.style.cssText =
        "background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:12px; margin-bottom:10px;";

      const titleEn = sec?.title || "Coach Tip";
      const contentL1 = sec?.l1;
      const contentEn = sec?.en || sec?.content || "";
      const hasL1 = !!contentL1;
      let isShowingL1 = hasL1;

      const h = document.createElement("div");
      h.style.cssText = "font-weight:900; color:#0369a1; font-size:0.9em; margin-bottom:6px;";
      h.textContent = `${sec?.emoji || "🤖"} ${titleEn}`;
      item.appendChild(h);

      const contentDiv = document.createElement("div");
      contentDiv.style.cssText = "color:#334155; font-size:0.9em; line-height:1.5;";
      contentDiv.innerHTML = mdToHtml(hasL1 ? contentL1 : contentEn);
      item.appendChild(contentDiv);

      if (hasL1) {
        const btn = document.createElement("button");
        btn.textContent = "Show English 🇺🇸";
        btn.style.cssText =
          "margin-top:8px; font-size:0.8em; padding:4px 8px; cursor:pointer; background:#fff; border:1px solid #bae6fd; border-radius:6px; color:#0284c7; font-weight:900;";
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
  });

  return aiContainer;
}
