// app-core/passages-dom.js
// Pure DOM manipulation for passage navigation and inputs.

import { qs, setText, setVisible } from "./lux-utils.js";

// Helper to get common elements
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
  if (ui.suggested) ui.suggested.textContent = text; // Hidden "ghost" text
  if (ui.input && !preserveInput) ui.input.value = text;
  if (ui.progress) ui.progress.textContent = progressText;
  
  if (ui.label) {
    setVisible(ui.label, showLabel);
    setText(ui.label, labelText);
  }
}

export function updateNavVisibility({ showNext, enableNext, nextMsgText, nextMsgColor, showSummary }) {
  if (ui.nextBtn) {
    setVisible(ui.nextBtn, showNext);
    ui.nextBtn.disabled = !enableNext;
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
    // Summary button visibility is often managed by CSS/Globals, 
    // but we support explicit toggling here.
    if (showSummary !== undefined) {
        setVisible(ui.summaryBtn, showSummary);
        ui.summaryBtn.disabled = !showSummary;
    }
  }
  
  // Toggle tip visibility based on "multi-part" context passed implicitly?
  // Actually, let's keep tip logic separate in renderInfoTip.
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