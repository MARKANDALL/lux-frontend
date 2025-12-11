// features/passages/dom.js
// Pure DOM manipulation for passage navigation and inputs.
// UPDATED: Added "Balloon" UI logic.

import { qs, setText, setVisible } from "../../app-core/lux-utils.js";

const ui = {
  get select() { return qs("#passageSelect"); },
  get input() { return qs("#referenceText"); },
  get suggested() { return qs("#suggestedSentence"); },
  get progress() { return qs("#partProgress"); },
  get label() { return qs("#passageLabel"); },
  get nextBtn() { return qs("#nextPartBtn"); },
  get nextMsg() { return qs("#nextPartMsg"); },
  get summaryBtn() { return qs("#showSummaryBtn"); },
  get tip() { return qs("#partsInfoTip"); },
  get tipText() { return qs("#partsInfoTip .tooltiptext"); },
  get pretty() { return qs("#prettyResult"); },
  get status() { return qs("#status"); },
  get aiBox() { return qs("#aiFeedback"); },
  get showMore() { return qs("#showMoreBtn"); },
  // New Balloon Getter
  get ghostControls() { return qs("#ghostControls"); }
};

/* --- Read --- */

export function getSelectValue() {
  return ui.select?.value || "";
}

export function getInputValue() {
  return ui.input?.value || "";
}

export function isSelectCustom() {
  const val = ui.select?.value || "";
  const label = ui.select?.selectedOptions?.[0]?.textContent || "";
  return val === "custom" || /write.*own/i.test(label);
}

/* --- Write --- */

export function ensureCustomOptionInDOM() {
  const sel = ui.select;
  if (!sel) return;
  
  if (!sel.querySelector('option[value="custom"]')) {
    const opt = document.createElement("option");
    opt.value = "custom";
    opt.textContent = "✍️ Write your own…";
    sel.insertBefore(opt, sel.firstChild);
  }
}

export function forceSelectCustom() {
  if (ui.select) ui.select.value = "custom";
}

export function renderInfoTip({ visible, textHTML }) {
  const t = ui.tip;
  if (!t) return;
  
  if (!visible) {
    t.classList.add("hidden");
  } else {
    t.classList.remove("hidden");
    if (ui.tipText) ui.tipText.innerHTML = textHTML;
  }
}

export function renderPartState({ 
  text, 
  progressText, 
  labelText, 
  showLabel, 
  preserveInput 
}) {
  if (ui.suggested) ui.suggested.textContent = text; 
  if (ui.input && !preserveInput) ui.input.value = text;
  if (ui.progress) ui.progress.textContent = progressText;
  
  if (ui.label) {
    setVisible(ui.label, showLabel);
    setText(ui.label, labelText);
  }
}

// --- UPDATED: Handle Custom Labels ---
export function updateNavVisibility({ showNext, enableNext, nextMsgText, nextMsgColor, showSummary, customMode }) {
  if (ui.nextBtn) {
    setVisible(ui.nextBtn, showNext);
    ui.nextBtn.disabled = !enableNext;
    
    if (customMode) {
        ui.nextBtn.textContent = "➕ Add Another Section";
        ui.nextBtn.style.backgroundColor = "#0f766e"; // Teal
    } else {
        ui.nextBtn.textContent = "Next Part"; 
        ui.nextBtn.style.backgroundColor = ""; 
    }
  }

  if (ui.nextMsg) {
    setText(ui.nextMsg, nextMsgText);
    setVisible(ui.nextMsg, !!nextMsgText);
    if (nextMsgColor) ui.nextMsg.style.color = nextMsgColor;
    if (nextMsgText) {
        ui.nextMsg.style.display = "inline-block";
        ui.nextMsg.style.marginLeft = "10px";
    }
  }

  if (ui.summaryBtn) {
    if (showSummary !== undefined) {
        setVisible(ui.summaryBtn, showSummary);
        ui.summaryBtn.disabled = !showSummary;
        
        if (customMode) {
            ui.summaryBtn.textContent = "Finish & View Summary";
        } else {
            ui.summaryBtn.textContent = "Show Summary";
        }
    }
  }
}

// --- NEW: Balloon Logic ---
export function updateBalloonUI(count, max) {
    let wrap = document.getElementById("lux-balloon-container");
    
    // 1. Create if missing
    if (!wrap && ui.ghostControls) {
        wrap = document.createElement("div");
        wrap.id = "lux-balloon-container";
        wrap.innerHTML = `<div id="lux-balloon"></div>`;
        // Insert after the Next button
        if (ui.nextBtn) {
            ui.nextBtn.parentNode.insertBefore(wrap, ui.nextBtn.nextSibling);
        } else {
            ui.ghostControls.appendChild(wrap);
        }
    }
    
    if (!wrap) return;

    // 2. Hide if count is 0 or 1 (not really a session yet)
    if (count <= 1) {
        wrap.style.display = "none";
        return;
    }
    wrap.style.display = "inline-flex";

    // 3. Calculate Swell
    const ball = wrap.querySelector("#lux-balloon");
    const ratio = count / max;
    
    // Scale from 1.0 to 2.5 based on fullness
    const scale = 1.0 + (ratio * 1.5); 
    ball.style.transform = `scale(${scale})`;

    // 4. Color & Tip
    wrap.setAttribute("data-tip", `${count} / ${max} memory used`);
    
    ball.classList.remove("is-warning", "is-full");
    if (ratio >= 1) {
        ball.classList.add("is-full");
        wrap.setAttribute("data-tip", "Memory Full!");
    } else if (ratio > 0.7) {
        ball.classList.add("is-warning");
    }
}

export function clearResultsUI() {
  if (ui.pretty) ui.pretty.innerHTML = "";
  if (ui.status) ui.status.textContent = "Not recording";
  if (ui.aiBox) {
    ui.aiBox.style.display = "none";
    ui.aiBox.innerHTML = "";
  }
  setVisible(ui.showMore, false);
}

/* --- Events --- */

export function wireSelectEvents({ onChange, onClick }) {
  if (ui.select) {
    ui.select.addEventListener("change", (e) => onChange(e.target.value));
    ui.select.addEventListener("click", onClick);
  }
}

export function wireInputEvents({ onInput }) {
  if (ui.input) {
    ui.input.addEventListener("input", (e) => onInput(e.target.value));
  }
}

export function wireNextBtnEvent(onNext) {
  if (ui.nextBtn) {
    ui.nextBtn.addEventListener("click", onNext);
  }
}