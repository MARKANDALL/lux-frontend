// features/progress/attempt-detail/trouble-sections.js
// Builds the "Trouble Sounds" and "Trouble Words" sections for Attempt Details modal.

import { chipRowPhonemes, chipRowWords } from "./chips.js";

export function buildTroubleSoundsSection(phItems) {
  const sounds = document.createElement("div");
  sounds.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";
  sounds.innerHTML = `
    <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">⚠️ Trouble Sounds</h4>
    ${chipRowPhonemes(phItems)}
    <div id="luxExplainSounds" style="margin-top:10px;" hidden></div>
  `;
  return sounds;
}

export function buildTroubleWordsSection(wdItems, focusWordsFallbackHtml) {
  const words = document.createElement("div");
  words.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";
  words.innerHTML = `
    <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">⚠️ Trouble Words</h4>
    ${chipRowWords(wdItems)}
    <div id="luxExplainWords" style="margin-top:10px;" hidden></div>
    ${
      (wdItems || []).length
        ? ""
        : `<details style="margin-top:10px;">
            <summary style="cursor:pointer; font-weight:900; color:#334155;">(Fallback) Focus words from latest attempt</summary>
            <div style="margin-top:10px;">${focusWordsFallbackHtml}</div>
          </details>`
    }
  `;
  return words;
}
