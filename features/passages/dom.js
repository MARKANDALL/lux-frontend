// features/passages/dom.js
// Pure DOM manipulation for passage navigation and inputs.
// CLEANED: Balloon logic moved to features/balloon/

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
};

// Internal "wire once" flags (prevents duplicate listeners)
const wired = {
  select: false,
  input: false,
  next: false,
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
  preserveInput,
}) {
  if (ui.suggested) ui.suggested.textContent = text;
  if (ui.input && !preserveInput) ui.input.value = text;
  if (ui.progress) ui.progress.textContent = progressText;

  if (ui.label) {
    setVisible(ui.label, showLabel);
    setText(ui.label, labelText);
  }
}

export function updateNavVisibility({
  showNext,
  enableNext,
  nextMsgText,
  nextMsgColor,
  showSummary,
  customMode,
}) {
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

export function wireSelectEvents({ onChange, onClick } = {}) {
  const sel = ui.select;
  if (!sel || wired.select) return;
  wired.select = true;

  if (typeof onChange === "function") {
    sel.addEventListener("change", (e) => onChange(e.target.value));
  }

  // onClick is optional
  if (typeof onClick === "function") {
    sel.addEventListener("click", onClick);
  }
}

export function wireInputEvents({ onInput } = {}) {
  const input = ui.input;
  if (!input || wired.input) return;
  wired.input = true;

  if (typeof onInput === "function") {
    input.addEventListener("input", (e) => onInput(e.target.value));
  }
}

export function wireNextBtnEvent(onNext) {
  const btn = ui.nextBtn;
  if (!btn || wired.next) return;
  wired.next = true;

  if (typeof onNext === "function") {
    btn.addEventListener("click", onNext);
  }
}
